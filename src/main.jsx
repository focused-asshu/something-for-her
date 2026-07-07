import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import { AnimatePresence, motion } from "framer-motion";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import confetti from "canvas-confetti";
import { Howl } from "howler";
import { ArrowLeft, Heart, Music, VolumeX } from "lucide-react";
import "./styles.css";

const rose = "#e8678a";
const purple = "#9b7fe8";
const warm = "#f5f0ff";
const spring = { type: "spring", stiffness: 110, damping: 24, mass: 0.8 };
const softSpring = { type: "spring", stiffness: 78, damping: 22, mass: 1 };
const ease = [0.16, 1, 0.3, 1];

function useSound(src, volume = 0.25) {
  const sound = useMemo(
    () => new Howl({ src, volume, html5: true }),
    [src, volume],
  );
  useEffect(() => () => sound.unload(), [sound]);
  return sound;
}

function useMotionSettings() {
  const [settings, setSettings] = useState(() => ({
    mobile: false,
    reduced: false,
  }));
  useEffect(() => {
    const small = window.matchMedia("(max-width: 767px)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () =>
      setSettings({ mobile: small.matches, reduced: reduced.matches });
    update();
    small.addEventListener("change", update);
    reduced.addEventListener("change", update);
    return () => {
      small.removeEventListener("change", update);
      reduced.removeEventListener("change", update);
    };
  }, []);
  return settings;
}

const Starfield = memo(function Starfield({ collapse = false }) {
  const ref = useRef(null);
  const pointer = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const collapseRef = useRef(collapse);
  useEffect(() => {
    collapseRef.current = collapse;
  }, [collapse]);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    let raf;
    let stars = [];
    let w = 0;
    let h = 0;
    let dpr = 1;
    let last = performance.now();
    let running = true;
    const mobileQuery = window.matchMedia("(max-width: 767px)");
    const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const isMobile = () => mobileQuery.matches;
    const isReduced = () => reducedQuery.matches;

    const seedStars = () => {
      const mobile = isMobile();
      const reduced = isReduced();
      const areaCount = Math.round((w * h) / (mobile ? 16000 : 5400));
      const count = mobile
        ? Math.min(60, Math.max(40, reduced ? 40 : areaCount))
        : reduced
          ? 80
          : Math.min(260, Math.max(130, areaCount));
      stars = Array.from({ length: count }, (_, i) => {
        const z = Math.random() ** 1.55;
        return {
          id: i,
          x: Math.random() * w,
          y: Math.random() * h,
          r: mobile ? 0.18 + z * 1.05 : 0.18 + z * 1.65,
          z,
          vx: (Math.random() - 0.5) * (mobile ? 0.014 : 0.018 + z * 0.04),
          vy: (mobile ? 0.006 : 0.01) + z * (mobile ? 0.014 : 0.035),
          phase: Math.random() * Math.PI * 2,
          twinkle:
            (mobile ? 0.0008 : 0.0012) +
            Math.random() * (mobile ? 0.0016 : 0.0028),
          base: 0.22 + Math.random() * 0.5,
          hue: Math.random() > 0.68 ? "255,231,236" : "248,244,255",
        };
      });
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, isMobile() ? 1.35 : 2);
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
      if (isMobile() || isReduced()) return;
      pointer.current.tx = (event.clientX / w - 0.5) * 2;
      pointer.current.ty = (event.clientY / h - 0.5) * 2;
    };

    const draw = (now) => {
      if (!running) return;
      const mobile = isMobile();
      const reduced = isReduced();
      const dt = Math.min(34, now - last);
      last = now;
      if (mobile || reduced) {
        pointer.current.x = 0;
        pointer.current.y = 0;
      } else {
        pointer.current.x += (pointer.current.tx - pointer.current.x) * 0.045;
        pointer.current.y += (pointer.current.ty - pointer.current.y) * 0.045;
      }
      ctx.clearRect(0, 0, w, h);
      const nebula = ctx.createRadialGradient(
        w * 0.52,
        h * 0.18,
        0,
        w * 0.5,
        h * 0.45,
        Math.max(w, h),
      );
      nebula.addColorStop(
        0,
        mobile ? "rgba(255,246,238,.09)" : "rgba(255,246,238,.12)",
      );
      nebula.addColorStop(
        0.28,
        mobile ? "rgba(155,127,232,.10)" : "rgba(155,127,232,.18)",
      );
      nebula.addColorStop(
        0.58,
        mobile ? "rgba(232,103,138,.045)" : "rgba(232,103,138,.085)",
      );
      nebula.addColorStop(1, "rgba(10,10,15,0)");
      ctx.fillStyle = nebula;
      ctx.fillRect(0, 0, w, h);

      const collapseAmount = collapseRef.current ? 1 : 0;
      for (const s of stars) {
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
        const px = targetX + pointer.current.x * s.z * (mobile ? 6 : 18);
        const py = targetY + pointer.current.y * s.z * (mobile ? 4 : 12);
        const tw = reduced
          ? s.base
          : s.base +
            Math.sin(now * s.twinkle + s.phase) * (mobile ? 0.14 : 0.22);
        const alpha = Math.max(0, Math.min(0.9, tw * fade));
        if (alpha <= 0.015) continue;
        ctx.beginPath();
        ctx.arc(px, py, s.r * (collapseAmount ? 0.35 : 1), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${s.hue},${alpha})`;
        if (!mobile) {
          ctx.shadowBlur = 6 + s.z * 12;
          ctx.shadowColor = `rgba(${s.hue},${alpha})`;
        }
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(draw);
    };

    const visibility = () => {
      running = !document.hidden;
      if (running) {
        last = performance.now();
        raf = requestAnimationFrame(draw);
      } else cancelAnimationFrame(raf);
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("visibilitychange", visibility);
    mobileQuery.addEventListener("change", resize);
    reducedQuery.addEventListener("change", resize);
    raf = requestAnimationFrame(draw);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", move);
      document.removeEventListener("visibilitychange", visibility);
      mobileQuery.removeEventListener("change", resize);
      reducedQuery.removeEventListener("change", resize);
    };
  }, []);
  return (
    <canvas
      ref={ref}
      className={`starfield ${collapse ? "is-collapsing" : ""}`}
      aria-hidden="true"
    />
  );
});

const gardenScenes = {
  "/": "origin",
  "/landing": "landing",
  "/stars": "stars",
  "/chat": "chat",
  "/confession": "confession",
};

const FloralSprig = memo(function FloralSprig({ variant = "sprig" }) {
  return (
    <svg
      viewBox="0 0 260 320"
      className={`floral-sprig floral-${variant}`}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`petal-${variant}`} cx="50%" cy="42%" r="62%">
          <stop offset="0" stopColor="#fff8ea" stopOpacity="0.9" />
          <stop offset="0.54" stopColor="#efe6ff" stopOpacity="0.62" />
          <stop offset="1" stopColor="#d8cff2" stopOpacity="0.08" />
        </radialGradient>
        <linearGradient id={`vine-${variant}`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#fff4dd" stopOpacity="0.08" />
          <stop offset="0.48" stopColor="#f6eefc" stopOpacity="0.34" />
          <stop offset="1" stopColor="#cdbced" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <path
        className="vine-line"
        d="M26 300C62 236 34 180 95 129C144 88 151 58 142 18"
        fill="none"
        stroke={`url(#vine-${variant})`}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        className="vine-line secondary"
        d="M72 228C102 214 125 188 135 154M98 128C78 118 58 100 46 78M132 88C170 82 196 66 219 35"
        fill="none"
        stroke={`url(#vine-${variant})`}
        strokeWidth="1.35"
        strokeLinecap="round"
      />
      {[
        [88, 136, 1.0],
        [138, 92, 0.82],
        [56, 78, 0.62],
        [184, 52, 0.72],
        [70, 224, 0.5],
      ].map(([x, y, scale], i) => (
        <g key={i} className="moon-flower" transform={`translate(${x} ${y}) scale(${scale})`}>
          <ellipse rx="8" ry="15" fill={`url(#petal-${variant})`} transform="rotate(0) translate(0 -10)" />
          <ellipse rx="8" ry="15" fill={`url(#petal-${variant})`} transform="rotate(72) translate(0 -10)" />
          <ellipse rx="8" ry="15" fill={`url(#petal-${variant})`} transform="rotate(144) translate(0 -10)" />
          <ellipse rx="8" ry="15" fill={`url(#petal-${variant})`} transform="rotate(216) translate(0 -10)" />
          <ellipse rx="8" ry="15" fill={`url(#petal-${variant})`} transform="rotate(288) translate(0 -10)" />
          <circle r="3" fill="#ffe9bd" opacity="0.58" />
        </g>
      ))}
      {[
        [116, 176],
        [154, 132],
        [42, 258],
        [204, 82],
        [31, 112],
        [178, 37],
      ].map(([x, y], i) => (
        <circle key={`d-${i}`} className="dew" cx={x} cy={y} r={i % 2 ? 1.7 : 2.25} />
      ))}
    </svg>
  );
});

const CelestialGarden = memo(function CelestialGarden({ scene, paused = false }) {
  return (
    <div
      className={`celestial-garden garden-${scene} ${paused ? "animations-paused" : ""}`}
      aria-hidden="true"
    >
      <div className="galaxy-drift g-one" />
      <div className="galaxy-drift g-two" />
      <div className="pollen-field" />
      <div className="petal petal-one" />
      <div className="petal petal-two" />
      <div className="floral-corner corner-a">
        <FloralSprig variant={`${scene}-a`} />
      </div>
      <div className="floral-corner corner-b">
        <FloralSprig variant={`${scene}-b`} />
      </div>
      <div className="floral-corner corner-c">
        <FloralSprig variant={`${scene}-c`} />
      </div>
    </div>
  );
});

const page = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -18 },
  transition: { ...spring, duration: 0.72 },
};
const reveal = {
  hidden: { opacity: 0, y: 18 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { ...softSpring, delay: i * 0.065 },
  }),
};

const Shell = memo(function Shell({
  children,
  musicOn,
  toggleMusic,
  collapseStars,
  transitioning,
}) {
  const nav = useNavigate();
  const loc = useLocation();
  const first = loc.pathname === "/";
  const scene = loc.pathname.startsWith("/story")
    ? `story-${loc.pathname.split("/").pop() || "1"}`
    : gardenScenes[loc.pathname] || "origin";
  return (
    <>
      <Starfield collapse={collapseStars} />
      <div className="ambient-orb one" />
      <div className="ambient-orb two" />
      <div className="moon-vignette" />
      <CelestialGarden scene={scene} paused={transitioning} />
      <div className="chrome">
        {!first && (
          <button
            className="icon left"
            onClick={() => nav(-1)}
            aria-label="go back"
          >
            <ArrowLeft size={19} />
          </button>
        )}
        <button
          className="icon right"
          onClick={toggleMusic}
          aria-label="toggle music"
        >
          {musicOn ? <Music size={18} /> : <VolumeX size={18} />}
        </button>
      </div>
      {children}
    </>
  );
});

const Button = memo(function Button({
  children,
  onClick,
  className = "",
  disabled = false,
}) {
  const { mobile, reduced } = useMotionSettings();
  return (
    <motion.button
      whileHover={mobile || reduced ? undefined : { scale: 1.035, y: -2 }}
      whileTap={{ scale: 0.965 }}
      transition={{ ...spring, duration: mobile ? 0.22 : 0.42 }}
      onClick={onClick}
      disabled={disabled}
      className={`btn ${className}`}
    >
      {children}
    </motion.button>
  );
});
const Floating = memo(function Floating({
  children,
  className = "",
  delay = 0,
}) {
  const { mobile, reduced } = useMotionSettings();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -12, 0], rotate: [0, 1.5, -1, 0] }}
      transition={{
        duration: mobile ? 4.6 : 5.8,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
});
const TextReveal = memo(function TextReveal({ text, className, delay = 0 }) {
  return (
    <motion.span className={className} initial="hidden" animate="show">
      {[...text].map((c, i) => (
        <motion.span
          key={`${c}-${i}`}
          variants={reveal}
          custom={delay + i * 0.55}
        >
          {c}
        </motion.span>
      ))}
    </motion.span>
  );
});

const Universe = memo(function Universe() {
  const nav = useNavigate();
  return (
    <motion.main {...page} className="screen">
      <Floating className="central-star-wrap">
        <div className="central-star" />
      </Floating>
      <motion.p
        variants={reveal}
        initial="hidden"
        animate="show"
        custom={7}
        className="line"
      >
        Out of 8 billion people...
      </motion.p>
      <motion.p
        variants={reveal}
        initial="hidden"
        animate="show"
        custom={16}
        className="line small"
      >
        somehow you became my favorite.
      </motion.p>
      <motion.div variants={reveal} initial="hidden" animate="show" custom={26}>
        <Button onClick={() => nav("/landing")}>begin →</Button>
      </motion.div>
    </motion.main>
  );
});
const Landing = memo(function Landing() {
  const nav = useNavigate();
  return (
    <motion.main {...page} className="screen">
      <h1 className="hero">
        <TextReveal text="Hi, Chiggi ❤️" />
      </h1>
      <motion.p
        variants={reveal}
        initial="hidden"
        animate="show"
        custom={15}
        className="sub"
      >
        There's something I've been meaning to tell you.
      </motion.p>
      <Floating delay={0.4} className="heart">
        <Heart fill={rose} />
      </Floating>
      <motion.div variants={reveal} initial="hidden" animate="show" custom={24}>
        <Button onClick={() => nav("/story/1")}>I'm listening →</Button>
      </motion.div>
    </motion.main>
  );
});
const chapters = [
  `I'm at one of the lowest points in my life right now, and somehow you came into it at exactly the right time. Maybe that's why every little conversation with you means so much to me. Honestly, I just want to tell you how much I appreciate you. Sometimes I wish you could see yourself through my eyes, because then you'd understand what I see in you and why talking to you makes me feel the way it does. At the same time, I'm scared. I'm scared that saying all this might ruin what we have, and that's the last thing I want. You've helped me more than you probably realize, and I genuinely don't want to lose you.`,
  `I don't just want someone to be with for a moment. I want someone who sees me grow over the next 10–12 years. Someone who knows the version of me that's confused today, and one day smiles because they watched me become the man I always wanted to be. I want to become someone reliable, dependable, and someone you can always count on — not because I have to, but because I'd genuinely want to be that person for you.`,
  `I know this might sound silly, but these words have been stuck in my head: 'I want you to want me. I need you to need me. I love you to love me. I'm begging you to beg me.' Maybe what I really mean is... I just want to matter to you the way you matter to me. And no matter where life takes us, I hope you know one thing: 'I can't promise to solve all your problems, but I promise you won't have to face them all alone.' Thank you for being here. You have no idea how much that has meant to me.`,
];
const Story = memo(function Story() {
  const { id } = useParams();
  const n = Math.min(Math.max(Number(id) || 1, 1), 3);
  const nav = useNavigate();
  const sentences = chapters[n - 1].match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
  return (
    <motion.main {...page} className="screen story">
      <div className="dots">
        {[1, 2, 3].map((i) => (
          <span key={i} className={i <= n ? "done" : ""} />
        ))}
      </div>
      <motion.div
        className="story-card"
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={spring}
      >
        {sentences.map((s, i) => (
          <motion.p
            key={i}
            variants={reveal}
            initial="hidden"
            animate="show"
            custom={i * 2}
          >
            {s.trim()}
          </motion.p>
        ))}
      </motion.div>
      <motion.div
        variants={reveal}
        initial="hidden"
        animate="show"
        custom={sentences.length * 2 + 5}
      >
        <Button
          onClick={() => (n < 3 ? nav(`/story/${n + 1}`) : nav("/stars"))}
        >
          Next →
        </Button>
      </motion.div>
    </motion.main>
  );
});

const starItems = [
  "your smile",
  "your kindness",
  "your laugh",
  "your determination",
  "your presence",
];
const Stars = memo(function Stars({ musicOn }) {
  const nav = useNavigate();
  const [got, setGot] = useState([]);
  const { mobile, reduced } = useMotionSettings();
  const pop = useSound(
    [
      "https://cdn.pixabay.com/download/audio/2022/03/15/audio_2b4595b4e3.mp3?filename=pop-94319.mp3",
    ],
    0.18,
  );
  const collect = useCallback(
    (i) => {
      setGot((v) => (v.includes(i) ? v : [...v, i]));
      if (musicOn) pop.play();
    },
    [musicOn, pop],
  );
  return (
    <motion.main {...page} className="screen">
      <p className="instruction">collect the stars</p>
      <div className="star-game">
        {starItems.map((t, i) => (
          <motion.button
            key={t}
            className={`game-star s${i} ${got.includes(i) ? "collected" : ""}`}
            animate={
              reduced
                ? undefined
                : {
                    y: mobile ? [0, -8, 0] : [0, -18, 0, 10, 0],
                    x: mobile ? [0, 3, 0] : [0, 8, -5, 0],
                    rotate: mobile ? [0, 2, 0] : [0, 5, -4, 2, 0],
                  }
            }
            transition={{
              duration: (mobile ? 3.8 : 5) + i * (mobile ? 0.25 : 0.55),
              repeat: Infinity,
              ease: "easeInOut",
            }}
            onClick={() => collect(i)}
          >
            <motion.span
              className="star-glyph"
              animate={
                got.includes(i)
                  ? {
                      scale: [1, 1.9, 1.1],
                    }
                  : undefined
              }
            >
              ✦
            </motion.span>
            {got.includes(i) && <i className="burst" />}
            <span className="star-card">{t}</span>
          </motion.button>
        ))}
      </div>
      {got.length === 5 && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={softSpring}
          className="final"
        >
          <p>You've collected everything...</p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1.1, ease }}
          >
            ...except my courage.
          </motion.p>
          <Button onClick={() => nav("/chat")}>maybe I found it →</Button>
        </motion.div>
      )}
    </motion.main>
  );
});
function Typing() {
  return (
    <span className="typing">
      <i />
      <i />
      <i />
    </span>
  );
}
const Chat = memo(function Chat() {
  const nav = useNavigate();
  const end = useRef(null);
  const [messages, setMessages] = useState([
    {
      him: true,
      text: "Before I say what I need to say... you can ask me anything.",
    },
  ]);
  const [asked, setAsked] = useState([]);
  const [typing, setTyping] = useState(false);
  const qs = [
    [
      "Why did you make this?",
      `Because I've been carrying this for a while now. And I thought you deserved something real — not just a text at 2am.`,
    ],
    [
      "What's your favorite memory with me?",
      `Every time you laugh at something only we'd find funny. Those moments feel like home.`,
    ],
    [
      "Are you sure about this?",
      `More than I've been sure about most things lately, honestly.`,
    ],
    [
      "What if I don't feel the same?",
      `Then I'll be okay. I just needed you to know. That part was never about changing anything — it was about being honest with you.`,
    ],
  ];
  useEffect(
    () => end.current?.scrollIntoView({ behavior: "smooth", block: "end" }),
    [messages, typing],
  );
  function ask(q, r, i) {
    if (asked.includes(i)) return;
    setMessages((m) => [...m, { text: q }]);
    setAsked((a) => [...a, i]);
    setTyping(true);
    setTimeout(
      () => {
        setTyping(false);
        setMessages((m) => [...m, { him: true, text: r }]);
      },
      1100 + Math.min(1800, r.length * 14),
    );
  }
  return (
    <motion.main {...page} className="screen chat">
      <section className="phone">
        <header>
          <span />
          him
        </header>
        <div className="msgs">
          {messages.map((m, i) => (
            <motion.div
              key={`${m.text}-${i}`}
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={spring}
              className={`bubble ${m.him ? "him" : "her"}`}
            >
              {m.text}
            </motion.div>
          ))}
          {typing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bubble him"
            >
              <Typing />
            </motion.div>
          )}
          <div ref={end} />
        </div>
        <div className="questions">
          {qs.map(([q, r], i) => (
            <button
              key={q}
              disabled={asked.includes(i)}
              onClick={() => ask(q, r, i)}
            >
              {q}
            </button>
          ))}
        </div>
        {asked.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring}
            className="ready"
          >
            <div className="bubble him">
              There's one more thing I want to say. Ready?
            </div>
            <Button onClick={() => nav("/confession")}>ready →</Button>
          </motion.div>
        )}
      </section>
    </motion.main>
  );
});
function Confession() {
  const [answer, setAnswer] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const submitted = useRef(false);
  const { mobile, reduced } = useMotionSettings();

  const notifyDiscord = useCallback(async (choice) => {
    if (submitted.current) return;
    submitted.current = true;
    setSubmitting(true);

    try {
      const response = await fetch("/api/discord-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answer: choice,
          timestamp: new Date().toLocaleString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Discord notification failed with status ${response.status}`);
      }
    } catch (error) {
      console.error("Failed to send Discord notification", error);
    } finally {
      setAnswer(choice);
    }
  }, []);

  async function yes() {
    if (submitted.current) return;
    if (!reduced)
      confetti({
        particleCount: mobile ? 5 : 220,
        spread: mobile ? 82 : 120,
        origin: { y: 0.62 },
        colors: [rose, purple, "#fff6ee", "#ffd166"],
        shapes: ["star", "circle"],
        scalar: mobile ? 0.75 : 1,
      });
    await notifyDiscord("yes");
  }

  async function no() {
    await notifyDiscord("no");
  }

  if (answer === "yes")
    return (
      <motion.main {...page} className="screen">
        <h2 className="confetti-title">
          You just made me the happiest person. 🎉
        </h2>
        <p className="sub">I promise I won't waste this.</p>
      </motion.main>
    );
  if (answer === "no")
    return (
      <motion.main {...page} className="screen">
        <No />
      </motion.main>
    );
  return (
    <motion.main {...page} className="screen confession">
      <motion.div
        className="lone-star"
        initial={{ opacity: 0, scale: 0.35 }}
        animate={{
          opacity: [0, 1, 1, 0],
          scale: [0.35, 1, 1.18, 0.82],
        }}
        transition={{ duration: 7.4, times: [0, 0.22, 0.68, 1], ease }}
      />
      <motion.div
        className="heart-bloom"
        initial={{ opacity: 0, scale: 0.3, rotate: -12 }}
        animate={{
          opacity: [0, 0, 1, 1],
          scale: [0.3, 0.3, 1.04, 1],
          rotate: [-12, -12, 0, 0],
        }}
        transition={{ duration: 8.2, times: [0, 0.58, 0.82, 1], ease }}
      >
        ♥
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 8.2, duration: 1.45, ease }}
        className="confess"
      >
        In the most selfish way possible...
      </motion.p>
      <motion.p
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 10.4, duration: 1.45, ease }}
        className="confess"
      >
        I hope no one admires you as much as I do.
      </motion.p>
      <motion.p
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 12.8, duration: 1.45, ease }}
        className="confess"
      >
        Because if there's one thing my heart knows for certain...
      </motion.p>
      <motion.p className="ask" initial="hidden" animate="show">
        {"Will you be my better half? ❤️".split(" ").map((word, i, words) => (
          <React.Fragment key={`${word}-${i}`}>
            <motion.span
              variants={reveal}
              custom={240 + i * 2.25}
              style={{ display: "inline-block" }}
            >
              {word}
            </motion.span>
            {i < words.length - 1 ? " " : null}
          </React.Fragment>
        ))}
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 17.15, duration: 1, ease }}
        className="choice"
      >
        <Button className="yes" onClick={yes} disabled={submitting}>
          yes ❤️
        </Button>
        <button className="no" onClick={no} disabled={submitting}>
          no
        </button>
      </motion.div>
    </motion.main>
  );
}
function No() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="no-msg"
    >
      Thank you for being honest. I hope we can still smile whenever we meet.
      That meant everything — getting to tell you.
    </motion.div>
  );
}
function App() {
  const [musicOn, setMusicOn] = useState(false);
  const loc = useLocation();
  const howl = useMemo(
    () =>
      new Howl({
        src: [
          "https://cdn.pixabay.com/download/audio/2022/10/25/audio_946a77b8a5.mp3?filename=lofi-study-112191.mp3",
        ],
        loop: true,
        volume: 0.22,
        html5: true,
      }),
    [],
  );
  useEffect(() => {
    musicOn ? howl.play() : howl.pause();
    return () => howl.stop();
  }, [musicOn, howl]);
  const collapseStars = loc.pathname === "/confession";
  const [transitioning, setTransitioning] = useState(false);
  useEffect(() => {
    setTransitioning(true);
    const id = window.setTimeout(() => setTransitioning(false), 360);
    return () => window.clearTimeout(id);
  }, [loc.pathname]);
  useEffect(() => {
    const syncHidden = () =>
      document.documentElement.classList.toggle("page-hidden", document.hidden);
    syncHidden();
    document.addEventListener("visibilitychange", syncHidden);
    return () => document.removeEventListener("visibilitychange", syncHidden);
  }, []);
  return (
    <Shell
      musicOn={musicOn}
      toggleMusic={() => setMusicOn((v) => !v)}
      collapseStars={collapseStars}
      transitioning={transitioning}
    >
      <AnimatePresence initial={false} mode="sync">
        <Routes location={loc} key={loc.pathname}>
          <Route path="/" element={<Universe />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/story/:id" element={<Story />} />
          <Route path="/stars" element={<Stars musicOn={musicOn} />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/confession" element={<Confession />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AnimatePresence>
    </Shell>
  );
}
createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
