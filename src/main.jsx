import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AnimatePresence, motion } from 'framer-motion';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { Howl } from 'howler';
import { ArrowLeft, Heart, Music, VolumeX } from 'lucide-react';
import './styles.css';

const rose = '#e8678a';
const purple = '#9b7fe8';
const warm = '#f5f0ff';
const spring = { type: 'spring', stiffness: 86, damping: 20, mass: 0.9 };
const softSpring = { type: 'spring', stiffness: 54, damping: 18, mass: 1.15 };
const ease = [0.16, 1, 0.3, 1];

function useSound(src, volume = 0.25) {
  const sound = useMemo(() => new Howl({ src, volume, html5: true }), [src, volume]);
  useEffect(() => () => sound.unload(), [sound]);
  return sound;
}

const Starfield = memo(function Starfield({ collapse = false }) {
  const ref = useRef(null);
  const pointer = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const collapseRef = useRef(collapse);
  useEffect(() => { collapseRef.current = collapse; }, [collapse]);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d', { alpha: true });
    let raf;
    let stars = [];
    let w = 0;
    let h = 0;
    let dpr = 1;
    let last = performance.now();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const seedStars = () => {
      const mobile = window.innerWidth < 600;
      const count = reduced ? 80 : Math.round(Math.min(260, Math.max(130, (window.innerWidth * window.innerHeight) / (mobile ? 6200 : 5200))));
      stars = Array.from({ length: count }, (_, i) => {
        const z = Math.random() ** 1.45;
        return {
          id: i,
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.18 + z * 1.65,
          z,
          vx: (Math.random() - 0.5) * (0.018 + z * 0.04),
          vy: 0.01 + z * 0.035,
          phase: Math.random() * Math.PI * 2,
          twinkle: 0.0012 + Math.random() * 0.0028,
          base: 0.22 + Math.random() * 0.52,
          hue: Math.random() > 0.72 ? '255,213,224' : '245,240,255',
        };
      });
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedStars();
    };

    const move = (event) => {
      pointer.current.tx = (event.clientX / w - 0.5) * 2;
      pointer.current.ty = (event.clientY / h - 0.5) * 2;
    };

    const draw = (now) => {
      const dt = Math.min(34, now - last);
      last = now;
      pointer.current.x += (pointer.current.tx - pointer.current.x) * 0.045;
      pointer.current.y += (pointer.current.ty - pointer.current.y) * 0.045;
      ctx.clearRect(0, 0, w, h);
      const nebula = ctx.createRadialGradient(w * 0.52, h * 0.16, 0, w * 0.5, h * 0.42, Math.max(w, h));
      nebula.addColorStop(0, 'rgba(155,127,232,.18)');
      nebula.addColorStop(0.42, 'rgba(232,103,138,.085)');
      nebula.addColorStop(1, 'rgba(10,10,15,0)');
      ctx.fillStyle = nebula;
      ctx.fillRect(0, 0, w, h);

      const collapseAmount = collapseRef.current ? 1 : 0;
      stars.forEach((s) => {
        const targetX = collapseAmount ? w / 2 : s.x;
        const targetY = collapseAmount ? h * 0.42 : s.y;
        if (!reduced && !collapseAmount) {
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          if (s.y > h + 10) s.y = -10;
          if (s.x < -10) s.x = w + 10;
          if (s.x > w + 10) s.x = -10;
        }
        const fade = collapseAmount ? Math.max(0, 1 - s.z * 1.8 - 0.18) : 1;
        const px = targetX + pointer.current.x * s.z * 18;
        const py = targetY + pointer.current.y * s.z * 12;
        const tw = s.base + Math.sin(now * s.twinkle + s.phase) * 0.22;
        const alpha = Math.max(0, Math.min(0.92, tw * fade));
        if (alpha <= 0.015) return;
        ctx.beginPath();
        ctx.arc(px, py, s.r * (collapseAmount ? 0.35 : 1), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${s.hue},${alpha})`;
        ctx.shadowBlur = 6 + s.z * 12;
        ctx.shadowColor = `rgba(${s.hue},${alpha})`;
        ctx.fill();
      });
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(draw);
    };
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', move, { passive: true });
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); window.removeEventListener('pointermove', move); };
  }, []);
  return <canvas ref={ref} className={`starfield ${collapse ? 'is-collapsing' : ''}`} aria-hidden="true" />;
});

const page = { initial: { opacity: 0, y: 28, filter: 'blur(10px)' }, animate: { opacity: 1, y: 0, filter: 'blur(0px)' }, exit: { opacity: 0, y: -22, filter: 'blur(10px)' }, transition: { ...spring, duration: 0.9 } };
const reveal = { hidden: { opacity: 0, y: 22, filter: 'blur(8px)' }, show: (i = 0) => ({ opacity: 1, y: 0, filter: 'blur(0px)', transition: { ...softSpring, delay: i * 0.08 } }) };

function Shell({ children, musicOn, toggleMusic, collapseStars }) {
  const nav = useNavigate(); const loc = useLocation(); const first = loc.pathname === '/';
  return <><Starfield collapse={collapseStars} /><div className="ambient-orb one"/><div className="ambient-orb two"/><div className="chrome">{!first && <button className="icon left" onClick={() => nav(-1)} aria-label="go back"><ArrowLeft size={19}/></button>}<button className="icon right" onClick={toggleMusic} aria-label="toggle music">{musicOn ? <Music size={18}/> : <VolumeX size={18}/>}</button></div>{children}</>;
}

function Button({ children, onClick, className = '' }) { return <motion.button whileHover={{ scale: 1.035, y: -2 }} whileTap={{ scale: 0.975 }} transition={spring} onClick={onClick} className={`btn ${className}`}>{children}</motion.button>; }
function Floating({ children, className = '', delay = 0 }) { return <motion.div className={className} animate={{ y: [0, -12, 0], rotate: [0, 1.5, -1, 0] }} transition={{ duration: 5.8, delay, repeat: Infinity, ease: 'easeInOut' }}>{children}</motion.div>; }
function TextReveal({ text, className, delay = 0 }) { return <motion.span className={className} initial="hidden" animate="show">{[...text].map((c, i) => <motion.span key={`${c}-${i}`} variants={reveal} custom={delay + i * 0.55}>{c}</motion.span>)}</motion.span>; }

function Universe(){const nav=useNavigate();return <motion.main {...page} className="screen"><Floating className="central-star-wrap"><div className="central-star"/></Floating><motion.p variants={reveal} initial="hidden" animate="show" custom={7} className="line">Out of 8 billion people...</motion.p><motion.p variants={reveal} initial="hidden" animate="show" custom={16} className="line small">somehow you became my favorite.</motion.p><motion.div variants={reveal} initial="hidden" animate="show" custom={26}><Button onClick={()=>nav('/landing')}>begin →</Button></motion.div></motion.main>}
function Landing(){const nav=useNavigate();return <motion.main {...page} className="screen"><h1 className="hero"><TextReveal text="Hi, Chiggi ❤️" /></h1><motion.p variants={reveal} initial="hidden" animate="show" custom={15} className="sub">There's something I've been meaning to tell you.</motion.p><Floating delay={0.4} className="heart"><Heart fill={rose}/></Floating><motion.div variants={reveal} initial="hidden" animate="show" custom={24}><Button onClick={()=>nav('/story/1')}>I'm listening →</Button></motion.div></motion.main>}
const chapters=[`I'm at one of the lowest points in my life right now, and somehow you came into it at exactly the right time. Maybe that's why every little conversation with you means so much to me. Honestly, I just want to tell you how much I appreciate you. Sometimes I wish you could see yourself through my eyes, because then you'd understand what I see in you and why talking to you makes me feel the way it does. At the same time, I'm scared. I'm scared that saying all this might ruin what we have, and that's the last thing I want. You've helped me more than you probably realize, and I genuinely don't want to lose you.`,`I don't just want someone to be with for a moment. I want someone who sees me grow over the next 10–12 years. Someone who knows the version of me that's confused today, and one day smiles because they watched me become the man I always wanted to be. I want to become someone reliable, dependable, and someone you can always count on — not because I have to, but because I'd genuinely want to be that person for you.`,`I know this might sound silly, but these words have been stuck in my head: 'I want you to want me. I need you to need me. I love you to love me. I'm begging you to beg me.' Maybe what I really mean is... I just want to matter to you the way you matter to me. And no matter where life takes us, I hope you know one thing: 'I can't promise to solve all your problems, but I promise you won't have to face them all alone.' Thank you for being here. You have no idea how much that has meant to me.`];
function Story(){const {id}=useParams(); const n=Math.min(Math.max(Number(id)||1,1),3); const nav=useNavigate(); const sentences=chapters[n-1].match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[];return <motion.main {...page} className="screen story"><div className="dots">{[1,2,3].map(i=><span key={i} className={i<=n?'done':''}/>)}</div><motion.div className="story-card" initial={{opacity:0,scale:.96,y:20}} animate={{opacity:1,scale:1,y:0}} transition={spring}>{sentences.map((s,i)=><motion.p key={i} variants={reveal} initial="hidden" animate="show" custom={i*2}>{s.trim()}</motion.p>)}</motion.div><motion.div variants={reveal} initial="hidden" animate="show" custom={sentences.length*2+5}><Button onClick={()=> n<3?nav(`/story/${n+1}`):nav('/stars')}>Next →</Button></motion.div></motion.main>}

const starItems=['your smile','your kindness','your laugh','your determination','your presence'];
function Stars({ musicOn }){const nav=useNavigate(); const [got,setGot]=useState([]); const pop=useSound(['https://cdn.pixabay.com/download/audio/2022/03/15/audio_2b4595b4e3.mp3?filename=pop-94319.mp3'],.18); const collect=useCallback((i)=>{setGot(v=>v.includes(i)?v:[...v,i]); if(musicOn) pop.play();},[musicOn,pop]); return <motion.main {...page} className="screen"><p className="instruction">collect the stars</p><div className="star-game">{starItems.map((t,i)=><motion.button key={t} className={`game-star s${i} ${got.includes(i)?'collected':''}`} animate={{ y:[0,-18,0,10,0], x:[0,8,-5,0], rotate:[0,5,-4,2,0] }} transition={{duration:5+i*.55,repeat:Infinity,ease:'easeInOut'}} onClick={()=>collect(i)}><motion.span className="star-glyph" animate={got.includes(i)?{scale:[1,1.9,1.1],filter:['drop-shadow(0 0 12px #ffd166)','drop-shadow(0 0 42px #e8678a)','drop-shadow(0 0 18px #ffd166)']}:undefined}>✦</motion.span>{got.includes(i)&&<i className="burst"/>}<span className="star-card">{t}</span></motion.button>)}</div>{got.length===5&&<motion.div initial={{opacity:0,y:24,filter:'blur(8px)'}} animate={{opacity:1,y:0,filter:'blur(0px)'}} transition={softSpring} className="final"><p>You've collected everything...</p><motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1.5,duration:1.1,ease}}>...except my courage.</motion.p><Button onClick={()=>nav('/chat')}>maybe I found it →</Button></motion.div>}</motion.main>}
function Typing(){return <span className="typing"><i/><i/><i/></span>}
function Chat(){const nav=useNavigate(); const end=useRef(null); const [messages,setMessages]=useState([{him:true,text:'Before I say what I need to say... you can ask me anything.'}]); const [asked,setAsked]=useState([]); const [typing,setTyping]=useState(false); const qs=[['Why did you make this?',`Because I've been carrying this for a while now. And I thought you deserved something real — not just a text at 2am.`],['What\'s your favorite memory with me?',`Every time you laugh at something only we'd find funny. Those moments feel like home.`],['Are you sure about this?',`More than I've been sure about most things lately, honestly.`],['What if I don\'t feel the same?',`Then I'll be okay. I just needed you to know. That part was never about changing anything — it was about being honest with you.`]]; useEffect(()=>end.current?.scrollIntoView({behavior:'smooth',block:'end'}),[messages,typing]);function ask(q,r,i){if(asked.includes(i))return; setMessages(m=>[...m,{text:q}]); setAsked(a=>[...a,i]); setTyping(true); setTimeout(()=>{setTyping(false); setMessages(m=>[...m,{him:true,text:r}]);},1100+Math.min(1800,r.length*14))}return <motion.main {...page} className="screen chat"><section className="phone"><header><span/>him</header><div className="msgs">{messages.map((m,i)=><motion.div key={`${m.text}-${i}`} initial={{opacity:0,y:14,scale:.96}} animate={{opacity:1,y:0,scale:1}} transition={spring} className={`bubble ${m.him?'him':'her'}`}>{m.text}</motion.div>)}{typing&&<motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="bubble him"><Typing/></motion.div>}<div ref={end}/></div><div className="questions">{qs.map(([q,r],i)=><button key={q} disabled={asked.includes(i)} onClick={()=>ask(q,r,i)}>{q}</button>)}</div>{asked.length>=2 && <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={spring} className="ready"><div className="bubble him">There's one more thing I want to say. Ready?</div><Button onClick={()=>nav('/confession')}>ready →</Button></motion.div>}</section></motion.main>}
function Confession(){const [answer,setAnswer]=useState(null); function yes(){setAnswer('yes'); confetti({particleCount:220,spread:120,origin:{y:.62},colors:[rose,purple,'#ffd166'],shapes:['star','circle']});} if(answer==='yes')return <motion.main {...page} className="screen"><h2 className="confetti-title">You just made me the happiest person. 🎉</h2><p className="sub">I promise I won't waste this.</p></motion.main>; if(answer==='no')return <motion.main {...page} className="screen"><No/></motion.main>; return <motion.main {...page} className="screen confession"><motion.div className="lone-star" initial={{opacity:0,scale:.35}} animate={{opacity:[0,1,1,0],scale:[.35,1,1.18,.82],borderRadius:['50%','50%','50%','34%']}} transition={{duration:7.4,times:[0,.22,.68,1],ease}}/><motion.div className="heart-bloom" initial={{opacity:0,scale:.3,rotate:-12}} animate={{opacity:[0,0,1,1],scale:[.3,.3,1.04,1],rotate:[-12,-12,0,0]}} transition={{duration:8.2,times:[0,.58,.82,1],ease}}>♥</motion.div><motion.p initial={{opacity:0,y:18,filter:'blur(10px)'}} animate={{opacity:1,y:0,filter:'blur(0px)'}} transition={{delay:8.2,duration:1.45,ease}} className="confess">In the most selfish way possible...</motion.p><motion.p initial={{opacity:0,y:18,filter:'blur(10px)'}} animate={{opacity:1,y:0,filter:'blur(0px)'}} transition={{delay:10.4,duration:1.45,ease}} className="confess">I hope no one admires you as much as I do.</motion.p><motion.p initial={{opacity:0,y:22,filter:'blur(10px)'}} animate={{opacity:1,y:0,filter:'blur(0px)'}} transition={{delay:12.8,duration:1.55,ease}} className="ask">Will you go on a date with me?</motion.p><motion.div initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{delay:14.2,duration:1,ease}} className="choice"><Button className="yes" onClick={yes}>yes ❤️</Button><button className="no" onClick={()=>setAnswer('no')}>no</button></motion.div></motion.main>}
function No(){return <motion.div initial={{opacity:0}} animate={{opacity:1}} className="no-msg">Thank you for being honest. I hope we can still smile whenever we meet. That meant everything — getting to tell you.</motion.div>}
function App(){const [musicOn,setMusicOn]=useState(false); const loc=useLocation(); const howl=useMemo(()=>new Howl({src:['https://cdn.pixabay.com/download/audio/2022/10/25/audio_946a77b8a5.mp3?filename=lofi-study-112191.mp3'],loop:true,volume:.22,html5:true}),[]); useEffect(()=>{musicOn?howl.play():howl.pause(); return()=>howl.stop()},[musicOn,howl]); const collapseStars=loc.pathname==='/confession'; return <Shell musicOn={musicOn} toggleMusic={()=>setMusicOn(v=>!v)} collapseStars={collapseStars}><AnimatePresence mode="wait"><Routes location={loc} key={loc.pathname}><Route path="/" element={<Universe/>}/><Route path="/landing" element={<Landing/>}/><Route path="/story/:id" element={<Story/>}/><Route path="/stars" element={<Stars musicOn={musicOn}/>}/><Route path="/chat" element={<Chat/>}/><Route path="/confession" element={<Confession/>}/><Route path="*" element={<Navigate to="/"/>}/></Routes></AnimatePresence></Shell>}
createRoot(document.getElementById('root')).render(<BrowserRouter><App/></BrowserRouter>);
