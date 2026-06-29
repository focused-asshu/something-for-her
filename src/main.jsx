import React, { useEffect, useMemo, useRef, useState } from 'react';
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

function Starfield() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    let raf;
    let stars = [];
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = Array.from({ length: 210 }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 1.35 + 0.25,
        vx: (Math.random() - 0.5) * 0.08,
        vy: Math.random() * 0.1 + 0.02,
        a: Math.random() * 0.7 + 0.2,
      }));
    };
    const draw = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      const g = ctx.createRadialGradient(window.innerWidth * 0.5, window.innerHeight * 0.15, 0, window.innerWidth * 0.5, window.innerHeight * 0.45, window.innerWidth);
      g.addColorStop(0, 'rgba(155,127,232,.13)'); g.addColorStop(.45, 'rgba(232,103,138,.05)'); g.addColorStop(1, 'rgba(10,10,15,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      stars.forEach((s) => {
        s.x += s.vx; s.y += s.vy;
        if (s.y > window.innerHeight + 8) s.y = -8;
        if (s.x < -8) s.x = window.innerWidth + 8;
        if (s.x > window.innerWidth + 8) s.x = -8;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245,240,255,${s.a})`; ctx.shadowBlur = 8; ctx.shadowColor = warm; ctx.fill(); ctx.shadowBlur = 0;
      });
      raf = requestAnimationFrame(draw);
    };
    resize(); draw(); window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} className="starfield" aria-hidden="true" />;
}

const page = { initial:{opacity:0,y:18}, animate:{opacity:1,y:0}, exit:{opacity:0,y:-18}, transition:{duration:.75,ease:[.22,1,.36,1]} };
function Shell({ children, musicOn, toggleMusic }) {
  const nav = useNavigate(); const loc = useLocation(); const first = loc.pathname === '/';
  return <><Starfield/><div className="chrome">{!first && <button className="icon left" onClick={()=>nav(-1)} aria-label="go back"><ArrowLeft size={19}/></button>}<button className="icon right" onClick={toggleMusic} aria-label="toggle music">{musicOn?<Music size={18}/>:<VolumeX size={18}/>}</button></div>{children}</>;
}
function Button({children,onClick,className=''}){return <motion.button whileHover={{scale:1.04}} whileTap={{scale:.98}} onClick={onClick} className={`btn ${className}`}>{children}</motion.button>}
function Universe(){const nav=useNavigate();return <motion.main {...page} className="screen"><motion.div className="central-star" animate={{scale:[1,1.18,1],opacity:[.75,1,.75]}} transition={{duration:2,repeat:Infinity}}/><motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:2,duration:1.4}} className="line">Out of 8 billion people...</motion.p><motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:4,duration:1.4}} className="line small">somehow you became my favorite.</motion.p><motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:6,duration:1}}><Button onClick={()=>nav('/landing')}>begin →</Button></motion.div></motion.main>}
function Landing(){const nav=useNavigate(); const text='Hi, Chiggi ❤️';return <motion.main {...page} className="screen"><h1 className="hero">{[...text].map((c,i)=><motion.span key={i} initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{delay:i*.07}}>{c}</motion.span>)}</h1><motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1.4,duration:1.2}} className="sub">There's something I've been meaning to tell you.</motion.p><motion.div animate={{scale:[1,1.16,1]}} transition={{duration:1.7,repeat:Infinity}} className="heart"><Heart fill={rose}/></motion.div><motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:2}}><Button onClick={()=>nav('/story/1')}>I'm listening →</Button></motion.div></motion.main>}
const chapters=[`I'm at one of the lowest points in my life right now, and somehow you came into it at exactly the right time. Maybe that's why every little conversation with you means so much to me. Honestly, I just want to tell you how much I appreciate you. Sometimes I wish you could see yourself through my eyes, because then you'd understand what I see in you and why talking to you makes me feel the way it does. At the same time, I'm scared. I'm scared that saying all this might ruin what we have, and that's the last thing I want. You've helped me more than you probably realize, and I genuinely don't want to lose you.`,`I don't just want someone to be with for a moment. I want someone who sees me grow over the next 10–12 years. Someone who knows the version of me that's confused today, and one day smiles because they watched me become the man I always wanted to be. I want to become someone reliable, dependable, and someone you can always count on — not because I have to, but because I'd genuinely want to be that person for you.`,`I know this might sound silly, but these words have been stuck in my head: 'I want you to want me. I need you to need me. I love you to love me. I'm begging you to beg me.' Maybe what I really mean is... I just want to matter to you the way you matter to me. And no matter where life takes us, I hope you know one thing: 'I can't promise to solve all your problems, but I promise you won't have to face them all alone.' Thank you for being here. You have no idea how much that has meant to me.`];
function Story(){const {id}=useParams(); const n=Math.min(Math.max(Number(id)||1,1),3); const nav=useNavigate(); const sentences=chapters[n-1].match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[];return <motion.main {...page} className="screen story"><div className="dots">{[1,2,3].map(i=><span key={i} className={i<=n?'done':''}/>)}</div><div className="story-card">{sentences.map((s,i)=><motion.p key={i} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*.3,duration:.7}}>{s.trim()}</motion.p>)}</div><motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:sentences.length*.3+.6}}><Button onClick={()=> n<3?nav(`/story/${n+1}`):nav('/stars')}>Next →</Button></motion.div></motion.main>}
function Stars(){const nav=useNavigate(); const [got,setGot]=useState([]); const items=['your smile','your kindness','your laugh','your determination','your presence'];return <motion.main {...page} className="screen"><p className="instruction">collect the stars</p><div className="star-game">{items.map((t,i)=><motion.button key={t} className={`game-star s${i} ${got.includes(i)?'collected':''}`} animate={{y:[0,-14,0],rotate:[0,6,-3,0]}} transition={{duration:3+i*.2,repeat:Infinity}} onClick={()=>setGot([...new Set([...got,i])])}>⭐<span>{t}</span></motion.button>)}</div>{got.length===5&&<motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} className="final"><p>You've collected everything...</p><motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1.5}}>...except my courage.</motion.p><Button onClick={()=>nav('/chat')}>maybe I found it →</Button></motion.div>}</motion.main>}
function Typing(){return <span className="typing"><i/><i/><i/></span>}
function Chat(){const nav=useNavigate(); const [messages,setMessages]=useState([{him:true,text:'Before I say what I need to say... you can ask me anything.'}]); const [asked,setAsked]=useState([]); const [typing,setTyping]=useState(false); const qs=[['Why did you make this?',`Because I've been carrying this for a while now. And I thought you deserved something real — not just a text at 2am.`],['What\'s your favorite memory with me?',`Every time you laugh at something only we'd find funny. Those moments feel like home.`],['Are you sure about this?',`More than I've been sure about most things lately, honestly.`],['What if I don\'t feel the same?',`Then I'll be okay. I just needed you to know. That part was never about changing anything — it was about being honest with you.`]];function ask(q,r,i){if(asked.includes(i))return; setMessages(m=>[...m,{text:q}]); setAsked(a=>[...a,i]); setTyping(true); setTimeout(()=>{setTyping(false); setMessages(m=>[...m,{him:true,text:r}]);},1500)}return <motion.main {...page} className="screen chat"><section className="phone"><header><span/>him</header><div className="msgs">{messages.map((m,i)=><motion.div key={i} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className={`bubble ${m.him?'him':'her'}`}>{m.text}</motion.div>)}{typing&&<div className="bubble him"><Typing/></div>}</div><div className="questions">{qs.map(([q,r],i)=><button key={q} disabled={asked.includes(i)} onClick={()=>ask(q,r,i)}>{q}</button>)}</div>{asked.length>=2 && <motion.div initial={{opacity:0}} animate={{opacity:1}} className="ready"><div className="bubble him">There's one more thing I want to say. Ready?</div><Button onClick={()=>nav('/confession')}>ready →</Button></motion.div>}</section></motion.main>}
function Confession({musicOn}){const [answer,setAnswer]=useState(null); function yes(){setAnswer('yes'); confetti({particleCount:220,spread:120,origin:{y:.62},colors:[rose,purple,'#ffd166'],shapes:['star','circle']});} if(answer==='yes')return <motion.main {...page} className="screen"><h2 className="confetti-title">You just made me the happiest person. 🎉</h2><p className="sub">I promise I won't waste this.</p></motion.main>; if(answer==='no')return <motion.main {...page} className="screen"><No/></motion.main>; return <motion.main {...page} className="screen confession"><motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{duration:1.2}} className="confess">In the most selfish way possible...</motion.p><motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:2,duration:1.2}} className="confess">I hope no one admires you as much as I do.</motion.p><motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:4,duration:1.2}} className="ask">Will you go on a date with me?</motion.p><motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:5}} className="choice"><Button className="yes" onClick={yes}>yes ❤️</Button><button className="no" onClick={()=>setAnswer('no')}>no</button></motion.div>{answer==='no'&&<No/>}</motion.main>}
function No(){return <motion.div initial={{opacity:0}} animate={{opacity:1}} className="no-msg">Thank you for being honest. I hope we can still smile whenever we meet. That meant everything — getting to tell you.</motion.div>}
function App(){const [musicOn,setMusicOn]=useState(false); const howl=useMemo(()=>new Howl({src:['https://cdn.pixabay.com/download/audio/2022/10/25/audio_946a77b8a5.mp3?filename=lofi-study-112191.mp3'],loop:true,volume:.22,html5:true}),[]); useEffect(()=>{musicOn?howl.play():howl.pause(); return()=>howl.stop()},[musicOn,howl]); const loc=useLocation();return <Shell musicOn={musicOn} toggleMusic={()=>setMusicOn(v=>!v)}><AnimatePresence mode="wait"><Routes location={loc} key={loc.pathname}><Route path="/" element={<Universe/>}/><Route path="/landing" element={<Landing/>}/><Route path="/story/:id" element={<Story/>}/><Route path="/stars" element={<Stars/>}/><Route path="/chat" element={<Chat/>}/><Route path="/confession" element={<Confession musicOn={musicOn}/>}/><Route path="*" element={<Navigate to="/"/>}/></Routes></AnimatePresence></Shell>}
createRoot(document.getElementById('root')).render(<BrowserRouter><App/></BrowserRouter>);
