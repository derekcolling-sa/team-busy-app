"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { rollBuddy, getBuddyById, getBuddyImagePath, RARITY_STYLES, type Buddy } from "@/lib/buddies";

const MEMBERS = [
  { name: "Brendan", photo: "/photos/Brendan.jpg" },
  { name: "Callie", photo: "/photos/Callie.jpg" },
  { name: "Chris", photo: "/photos/Chris.jpg" },
  { name: "Derek", photo: "/photos/Derek.jpeg" },
  { name: "Erin", photo: "/photos/Erin.jpg" },
  { name: "KC", photo: "/photos/KC.jpeg" },
  { name: "Kerry", photo: "/photos/Kerry.jpg" },
  { name: "Maddie", photo: "/photos/Maddie.jpg" },
];

const WRITERS = ["Kerry", "Erin", "Maddie"];
const VP = ["Derek"];
const BOSS = "Derek";

const SUGGESTIONS: Record<string, string[]> = {
  writer: [
    "the brief said 'fun and irreverent.' the client meant 'safe and beige.' mid.",
    "on my third rewrite. the first one slayed. they just couldn't see it.",
    "if someone says 'make it punchy' one more time I'm submitting blank copy. no chill.",
    "concept sold. now to actually write the thing. bet.",
    "in a words hole. the vibes are bad. send help.",
    "headlines: still making them up. it's giving chaos.",
    "the copy is fire. now I just have to convince everyone else of that.",
    "writing my way out of a brief with zero actual direction. it's giving improv.",
  ],
  artDirector: [
    "the font is fine. the font has always been fine. it's giving slay.",
    "making it 'more premium' for the 4th time today. the vibe keeps shifting.",
    "moving boxes around until it looks like art. mood.",
    "logo bigger. got it. 🙄 the client is extra today.",
    "yes I will make it pop. no I will not explain what that means. bet.",
    "in InDesign. the layout is fire. please do not disturb.",
    "on my 6th version. client picks the first one. we all stan this outcome.",
    "it's always the kerning. always.",
  ],
  vp: [
    "on a call I could have been an email. no cap.",
    "reviewing 12 concepts. one of them is actually fire.",
    "saying 'great question' a lot today. it's a whole vibe.",
    "the brief has changed. again. we flex and we adapt.",
    "building decks. this is fine. everything is fine. bet.",
    "managing up. it's a lifestyle and I'm slaying it.",
    "holding the vision. and everyone's calendar. GOAT behavior.",
    "my feedback on your feedback: let's discuss. it's giving layers.",
  ],
};


const LABELS = ["Chillin'", "Sautéed", "Cooking", "Cooked"];
const EMOJIS = ["😎", "🍳", "🔥", "💀"];
const CARD_BGS = ["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"];
const TRACK_COLORS = ["#5cb85c", "#4a9eff", "#f5a623", "#e8742d"];
const ADHD_LABELS = ["locked tf in", "lowkey glazed", "brainrot szn", "absolutely feral"];
const ADHD_COLORS = ["#a8f5c8", "#b8d4ff", "#dbb8ff", "#ffb8e0"];

function timeAgo(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return "literally just now 👀";
  const minutes = Math.floor(seconds / 60);
  if (minutes === 1) return "like a min ago";
  if (minutes < 5) return `${minutes} mins ago no cap`;
  if (minutes < 60) return `${minutes} mins ago`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return "an hour ago bestie";
  if (hours < 24) return `${hours}h ago (oof)`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday… we not gonna talk about it";
  return `${days} days ago 💀`;
}

const BUDDIES_ENABLED = true;

// Returns 0–1 staleness: 0 = fresh, 1 = fully stale (16h → 48h)
function getStaleness(ts: number | undefined): number {
  if (!ts) return 0;
  const hours = (Date.now() - ts) / (1000 * 60 * 60);
  if (hours < 16) return 0;
  return Math.min((hours - 16) / 32, 1);
}

function getLevel(val: number) {
  if (val <= 20) return 0;
  if (val <= 50) return 1;
  if (val <= 77) return 2;
  return 3;
}

function getAdhdLevel(val: number) {
  if (val <= 25) return 0;
  if (val <= 50) return 1;
  if (val <= 75) return 2;
  return 3;
}

function getTrackStyle(value: number, level: number) {
  return {
    background: `linear-gradient(to right, ${TRACK_COLORS[level]} ${value}%, #d9d4cc ${value}%)`,
  };
}

function TickerItem({ msg }: { msg: { name: string; message: string }; photo: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "0 12px", flexShrink: 0, whiteSpace: "nowrap" }}>
      <span style={{ fontSize: "18px", fontWeight: 800, color: "#000", fontFamily: "var(--font-display)" }}>{msg.name}</span>
      <span style={{ fontSize: "18px", fontWeight: 500, color: "#000" }}>&ldquo;{msg.message}&rdquo;</span>
    </div>
  );
}

export default function Home() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [showFeatureRequest, setShowFeatureRequest] = useState(false);
  const [featureRequestText, setFeatureRequestText] = useState("");
  const [featureRequestSent, setFeatureRequestSent] = useState(false);
  const [showBugReport, setShowBugReport] = useState(false);
  const [bugReportText, setBugReportText] = useState("");
  const [bugReportSent, setBugReportSent] = useState(false);
  const [broadcast, setBroadcast] = useState<{ message: string; type: "urgent" | "broadcast" } | null>(null);
  const [banner, setBanner] = useState<{ message: string; type: string } | null>(null);

  const [messages, setMessages] = useState<{ name: string; message: string; ts: number }[]>([]);
  const [goHomeExpanded, setGoHomeExpanded] = useState(false);
  const [tickerCopies, setTickerCopies] = useState(0);
  const [tickerTextWidth, setTickerTextWidth] = useState(0);
  const tickerTextRef = useRef<HTMLDivElement>(null);
  const [urgentTickerCopies, setUrgentTickerCopies] = useState(0);
  const [urgentTickerWidth, setUrgentTickerWidth] = useState(0);
  const urgentTickerRef = useRef<HTMLDivElement>(null);
  const [statuses, setStatuses] = useState<Record<string, number>>({});
  const [statusNotes, setStatusNotes] = useState<Record<string, string>>({});
  const [editingNote, setEditingNote] = useState<string>("");
  const [oooStatuses, setOooStatuses] = useState<Record<string, boolean>>({});
  const [oooDetails, setOooDetails] = useState<Record<string, { note?: string; backDate?: string }>>({});
  const [sosStatuses, setSosStatuses] = useState<Record<string, boolean>>({});
  const [metcalfStatuses, setMetcalfStatuses] = useState<Record<string, boolean>>({});
  const [needWorkStatuses, setNeedWorkStatuses] = useState<Record<string, boolean>>({});
  const [cardFlipped, setCardFlipped] = useState(false);
  const [bossReactions, setBossReactions] = useState<Record<string, "heart" | "thumbsdown">>({});
  const [showGhostModal, setShowGhostModal] = useState(false);
  const [ghostNote, setGhostNote] = useState("");
  const [ghostBackDate, setGhostBackDate] = useState("");
  const [updatedAt, setUpdatedAt] = useState<Record<string, number>>({});
  const [sortedMembers, setSortedMembers] = useState(MEMBERS);
  const [loaded, setLoaded] = useState(false);
  const pageLoadTime = useRef(Date.now());
  const [photoOverrides, setPhotoOverrides] = useState<Record<string, string>>({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const adhdDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const sortTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [goHomeRequested, setGoHomeRequested] = useState(false);
  const [goHomeRequests, setGoHomeRequests] = useState<{ name: string; ts: number; count: number }[]>([]);
  const [timeOffRequests, setTimeOffRequests] = useState<{ name: string; ts: number }[]>([]);
  const [timeOffSent, setTimeOffSent] = useState(false);
  const [pokes, setPokes] = useState<{ from: string; to: string; ts: number }[]>([]);
  const [touchGrass, setTouchGrass] = useState<{ from: string; to: string; ts: number }[]>([]);
  const [takeover, setTakeover] = useState<string | null>(null);
  const [showTakeoverCompose, setShowTakeoverCompose] = useState(false);
  const [takeoverDraft, setTakeoverDraft] = useState("");
  const [bratMode, setBratMode] = useState(false);
  const [warMode, setWarMode] = useState(false);
  const [bodyDouble, setBodyDouble] = useState<string[]>([]);
  const [meetings, setMeetings] = useState<Record<string, number>>({});
  const [showMeetingPicker, setShowMeetingPicker] = useState(false);
  const [, setNow] = useState(Date.now());
  const [sessionTimes, setSessionTimes] = useState<Record<string, number>>({});
  const [adhdLevels, setAdhdLevels] = useState<Record<string, number>>({});
  const sessionAccRef = useRef(0);
  const lastVisibleRef = useRef<number | null>(null);
  const [pokedBy, setPokedBy] = useState<string[]>([]);
  const [ratings, setRatings] = useState<Record<string, Record<string, number>>>({});
  const [buddies, setBuddies] = useState<Record<string, { id: string; hatchedAt: number }>>({});
  const [showHatchModal, setShowHatchModal] = useState(false);
  const [hatchedBuddy, setHatchedBuddy] = useState<Buddy | null>(null);
  const [hatchPhase, setHatchPhase] = useState<"egg" | "cracking" | "reveal">("egg");
  const [vibeMuted, setVibeMuted] = useState(true);
  const vibeIframeRef = useRef<HTMLIFrameElement>(null);
  const [newMessage, setNewMessage] = useState<Record<string, string>>({});
  const [weatherEmoji, setWeatherEmoji] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("team-busy-user");
    if (saved) {
      setCurrentUser(saved);
    } else {
      setShowPicker(true);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const poll = await fetch("/api/poll").then((r) => r.json());
      if (poll.reload && poll.reload > pageLoadTime.current) {
        window.location.reload();
        return;
      }
      setStatuses(poll.status ?? {});
      setUpdatedAt(poll.updated ?? {});
      const notes = poll.notes ?? {};
      setStatusNotes(notes);
      setEditingNote((prev) => prev !== "" ? prev : (currentUser && notes[currentUser]) ? notes[currentUser] : prev);
      setOooStatuses(poll.ooo ?? {});
      setOooDetails(poll.oooDetails ?? {});
      setSosStatuses(poll.sos ?? {});
      setMessages(poll.messages ?? []);
      setBroadcast(poll.urgent?.message ? { message: poll.urgent.message, type: poll.urgent.type ?? "broadcast" } : null);
      setGoHomeRequests(poll.goHome ?? []);
      setTimeOffRequests(poll.timeOff ?? []);
      setMetcalfStatuses(poll.metcalf ?? {});
      setBossReactions(poll.bossReactions ?? {});
      setNeedWorkStatuses(poll.needWork ?? {});
      setSessionTimes(poll.sessionTime ?? {});
      setAdhdLevels(poll.adhd ?? {});
      setPokes(poll.pokes ?? []);
      setTouchGrass(poll.touchGrass ?? []);
      setTakeover(poll.takeover ?? null);
      setBodyDouble(poll.bodyDouble ?? []);
      setMeetings(poll.meetings ?? {});
      if (poll.banner?.message) setBanner({ message: poll.banner.message, type: poll.banner.type ?? "daily" });
    } catch {
      // retry next poll
    } finally {
      setLoaded(true);
    }
  }, []);

  // Slow data — photos, buddies, ratings change rarely; fetch once on mount
  const fetchSlowData = useCallback(async () => {
    try {
      const [photosData, buddiesData, ratingsData] = await Promise.all([
        fetch("/api/photos").then((r) => r.json()),
        fetch("/api/buddies").then((r) => r.json()),
        fetch("/api/ratings").then((r) => r.json()),
      ]);
      setPhotoOverrides(photosData.photos ?? {});
      setBuddies(buddiesData.buddies ?? {});
      setRatings(ratingsData.ratings ?? {});
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchSlowData();
    const interval = setInterval(fetchData, 12000);
    return () => clearInterval(interval);
  }, [fetchData, fetchSlowData]);

  // Session time tracking — accumulate visible time and flush every 30s
  useEffect(() => {
    if (!currentUser) return;
    const flush = () => {
      if (sessionAccRef.current <= 0) return;
      const secs = Math.round(sessionAccRef.current);
      sessionAccRef.current = 0;
      fetch("/api/session-time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: currentUser, seconds: secs }),
      }).catch(() => {});
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (lastVisibleRef.current !== null) {
          sessionAccRef.current += (Date.now() - lastVisibleRef.current) / 1000;
          lastVisibleRef.current = null;
        }
        flush();
      } else {
        lastVisibleRef.current = Date.now();
      }
    };
    if (document.visibilityState === "visible") lastVisibleRef.current = Date.now();
    document.addEventListener("visibilitychange", onVisibilityChange);
    const interval = setInterval(() => {
      if (lastVisibleRef.current !== null) {
        sessionAccRef.current += (Date.now() - lastVisibleRef.current) / 1000;
        lastVisibleRef.current = Date.now();
      }
      flush();
    }, 30000);
    const onUnload = () => {
      if (lastVisibleRef.current !== null) {
        sessionAccRef.current += (Date.now() - lastVisibleRef.current) / 1000;
        lastVisibleRef.current = null;
      }
      if (sessionAccRef.current > 0) {
        navigator.sendBeacon("/api/session-time", new Blob([JSON.stringify({ name: currentUser, seconds: Math.round(sessionAccRef.current) })], { type: "application/json" }));
      }
    };
    window.addEventListener("beforeunload", onUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      clearInterval(interval);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [currentUser]);

  // Auto-reload when a new version is deployed
  useEffect(() => {
    let currentBuildId: string | null = null;
    const checkVersion = async () => {
      try {
        const res = await fetch("/api/version");
        const { buildId } = await res.json();
        if (currentBuildId === null) {
          currentBuildId = buildId;
        } else if (buildId !== currentBuildId) {
          window.location.reload();
        }
      } catch { /* ignore */ }
    };
    checkVersion();
    const interval = setInterval(checkVersion, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Auto-show hatch modal for users who haven't hatched yet
  useEffect(() => {
    if (!BUDDIES_ENABLED) return;
    if (loaded && currentUser && currentUser !== "__guest__" && Object.keys(buddies).length > 0 && !buddies[currentUser] && !showHatchModal) {
      setHatchPhase("egg");
      setHatchedBuddy(null);
      setShowHatchModal(true);
    }
  }, [loaded, currentUser, buddies, showHatchModal]);

  // Sort: OOO members go to the back
  useEffect(() => {
    if (sortTimerRef.current) clearTimeout(sortTimerRef.current);
    sortTimerRef.current = setTimeout(() => {
      setSortedMembers(
        [...MEMBERS].sort((a, b) => {
          const aOOO = !!oooStatuses[a.name];
          const bOOO = !!oooStatuses[b.name];
          if (aOOO !== bOOO) return aOOO ? 1 : -1;
          return 0;
        })
      );
    }, 3000);
    return () => { if (sortTimerRef.current) clearTimeout(sortTimerRef.current); };
  }, [oooStatuses]);

  // Measure ticker text width and calculate copies needed to fill viewport
  useEffect(() => {
    if (!messages.length && !banner) return;
    let attempts = 0;
    let t: ReturnType<typeof setTimeout>;
    const calculate = () => {
      if (!tickerTextRef.current) return;
      const tw = tickerTextRef.current.offsetWidth;
      if (!tw && attempts < 5) {
        attempts++;
        t = setTimeout(calculate, 100 * attempts); // retry with backoff
        return;
      }
      if (!tw) return;
      setTickerTextWidth(tw);
      setTickerCopies(Math.ceil(window.innerWidth / tw) + 1);
    };
    t = setTimeout(calculate, 50);
    window.addEventListener("resize", calculate);
    return () => { clearTimeout(t); window.removeEventListener("resize", calculate); };
  }, [messages, banner]);

  // Measure urgent ticker
  useEffect(() => {
    if (!broadcast) return;
    const calculate = () => {
      if (!urgentTickerRef.current) return;
      const tw = urgentTickerRef.current.offsetWidth;
      if (!tw) return;
      setUrgentTickerWidth(tw);
      setUrgentTickerCopies(Math.ceil(window.innerWidth / tw) + 1);
    };
    const t = setTimeout(calculate, 30);
    window.addEventListener("resize", calculate);
    return () => { clearTimeout(t); window.removeEventListener("resize", calculate); };
  }, [broadcast]);

  useEffect(() => {
    fetch("https://api.open-meteo.com/v1/forecast?latitude=38.9822&longitude=-94.6708&current=weather_code&timezone=America%2FChicago")
      .then((r) => r.json())
      .then((d) => {
        const code: number = d?.current?.weather_code ?? -1;
        const emoji =
          code === 0 ? "☀️" :
          code <= 2 ? "🌤️" :
          code === 3 ? "☁️" :
          code <= 48 ? "🌫️" :
          code <= 55 ? "🌦️" :
          code <= 65 ? "🌧️" :
          code <= 77 ? "❄️" :
          code <= 82 ? "🌧️" :
          code <= 99 ? "⛈️" : "🌡️";
        setWeatherEmoji(emoji);
      })
      .catch(() => {});
  }, []);

  // Tick every second to keep meeting countdowns live
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const saveStatus = useCallback((name: string, value: number) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      await fetch("/api/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, value }),
      });
    }, 300);
  }, []);

  const handleSliderChange = (name: string, value: number) => {
    setStatuses((prev) => ({ ...prev, [name]: value }));
    saveStatus(name, value);
  };

  const saveNote = async (name: string, note: string) => {
    setStatusNotes((prev) => ({ ...prev, [name]: note }));
    await fetch("/api/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, note }),
    });
  };

  const toggleOOO = async (name: string) => {
    if (!oooStatuses[name]) {
      setGhostNote("");
      setGhostBackDate("");
      setShowGhostModal(true);
      return;
    }
    setOooStatuses((prev) => ({ ...prev, [name]: false }));
    setOooDetails((prev) => { const n = { ...prev }; delete n[name]; return n; });
    await fetch("/api/status/ooo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, ooo: false }),
    });
  };

  const confirmGhost = async () => {
    if (!currentUser) return;
    setOooStatuses((prev) => ({ ...prev, [currentUser]: true }));
    setOooDetails((prev) => ({ ...prev, [currentUser]: { note: ghostNote, backDate: ghostBackDate } }));
    setShowGhostModal(false);
    await fetch("/api/status/ooo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: currentUser, ooo: true, note: ghostNote, backDate: ghostBackDate }),
    });
  };

  const reactToBoss = async (reaction: "heart" | "thumbsdown") => {
    if (!currentUser || currentUser === BOSS) return;
    const current = bossReactions[currentUser];
    const next = current === reaction ? null : reaction;
    setBossReactions((prev) => {
      const updated = { ...prev };
      if (next === null) delete updated[currentUser];
      else updated[currentUser] = next;
      return updated;
    });
    await fetch("/api/boss-reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: currentUser, reaction: next }),
    });
  };

  const handleAdhdChange = (name: string, value: number) => {
    setAdhdLevels((prev) => ({ ...prev, [name]: value }));
    if (adhdDebounceRef.current) clearTimeout(adhdDebounceRef.current);
    adhdDebounceRef.current = setTimeout(async () => {
      await fetch("/api/status/adhd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, value }),
      });
    }, 300);
  };

  const toggleNeedWork = async (name: string) => {
    const newVal = !needWorkStatuses[name];
    setNeedWorkStatuses((prev) => ({ ...prev, [name]: newVal }));
    await fetch("/api/status/need-work", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, active: newVal }),
    });
  };

  const toggleMetcalf = async (name: string) => {
    const newVal = !metcalfStatuses[name];
    setMetcalfStatuses((prev) => ({ ...prev, [name]: newVal }));
    await fetch("/api/status/metcalf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, active: newVal }),
    });
  };

  const toggleSOS = async (name: string) => {
    const newVal = !sosStatuses[name];
    setSosStatuses((prev) => ({ ...prev, [name]: newVal }));
    await fetch("/api/status/sos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, sos: newVal }),
    });
  };

  const handleHatch = () => {
    setHatchPhase("egg");
    setHatchedBuddy(null);
    setShowHatchModal(true);
  };

  const crackEgg = () => {
    setHatchPhase("cracking");
    const buddy = rollBuddy();
    setTimeout(() => {
      setHatchedBuddy(buddy);
      setHatchPhase("reveal");
    }, 900);
  };

  const confirmHatch = async () => {
    if (!currentUser || !hatchedBuddy) return;
    setBuddies((prev) => ({ ...prev, [currentUser]: { id: hatchedBuddy.id, hatchedAt: Date.now() } }));
    setShowHatchModal(false);
    await fetch("/api/buddies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: currentUser, buddyId: hatchedBuddy.id }),
    });
  };


  const rateUser = async (ratee: string, stars: number) => {
    if (!currentUser || currentUser === ratee) return;
    setRatings((prev) => ({
      ...prev,
      [ratee]: { ...(prev[ratee] ?? {}), [currentUser]: stars },
    }));
    await fetch("/api/ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rater: currentUser, ratee, stars }),
    });
  };

  const sendPoke = async (to: string) => {
    if (!currentUser || currentUser === to) return;
    setPokes((prev) => [...prev.filter((p) => !(p.from === currentUser && p.to === to)), { from: currentUser, to, ts: Date.now() }]);
    await fetch("/api/poke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from: currentUser, to }),
    });
  };

  const sendTouchGrass = async (to: string) => {
    if (!currentUser || currentUser === to) return;
    setTouchGrass((prev) => [...prev.filter((p) => !(p.from === currentUser && p.to === to)), { from: currentUser, to, ts: Date.now() }]);
    await fetch("/api/touch-grass", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from: currentUser, to }),
    });
  };

  const dismissTouchGrass = async (from: string) => {
    if (!currentUser) return;
    setTouchGrass((prev) => prev.filter((p) => !(p.to === currentUser && p.from === from)));
    await fetch("/api/touch-grass", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: currentUser }),
    });
  };

  const dismissPoke = async (from: string) => {
    if (!currentUser) return;
    setPokes((prev) => prev.filter((p) => !(p.to === currentUser && p.from === from)));
    await fetch("/api/poke", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: currentUser }),
    });
  };

  const handleGoHome = async () => {
    if (!currentUser || goHomeRequested) return;
    setGoHomeRequested(true);
    setGoHomeRequests((prev) => {
      const existing = prev.find((r) => r.name === currentUser);
      if (existing) {
        return prev.map((r) => r.name === currentUser ? { ...r, count: r.count + 1, ts: Date.now() } : r);
      }
      return [...prev, { name: currentUser, ts: Date.now(), count: 1 }];
    });
    await fetch("/api/go-home", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: currentUser }),
    });
    setTimeout(() => setGoHomeRequested(false), 1500);
  };

  const formatCountdown = (endTs: number): string => {
    const secs = Math.max(0, Math.floor((endTs - Date.now()) / 1000));
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const toggleBodyDouble = async () => {
    if (!currentUser) return;
    const active = !bodyDouble.includes(currentUser);
    setBodyDouble((prev) => active ? [...prev, currentUser!] : prev.filter((n) => n !== currentUser));
    await fetch("/api/body-double", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: currentUser, active }),
    });
  };

  const setMeeting = async (minutes: number | null) => {
    if (!currentUser) return;
    const endTs = minutes ? Date.now() + minutes * 60 * 1000 : null;
    setMeetings((prev) => {
      const next = { ...prev };
      if (endTs) next[currentUser!] = endTs;
      else delete next[currentUser!];
      return next;
    });
    setShowMeetingPicker(false);
    await fetch("/api/meeting", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: currentUser, endTs }),
    });
  };

  const getSuggestions = (): string[] => {
    if (!currentUser) return [];
    if (WRITERS.includes(currentUser)) return SUGGESTIONS.writer;
    if (VP.includes(currentUser)) return SUGGESTIONS.vp;
    return SUGGESTIONS.artDirector;
  };

  const postMessage = async (about: string) => {
    const msg = (newMessage[about] ?? "").trim();
    if (!msg || !currentUser || currentUser === "__guest__") return;
    setNewMessage((prev) => ({ ...prev, [about]: "" }));
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: currentUser, message: msg }),
    });
  };

  const handleTimeOffRequest = async () => {
    if (!currentUser || timeOffSent) return;
    setTimeOffSent(true);
    setTimeOffRequests((prev) => prev.some((r) => r.name === currentUser) ? prev : [...prev, { name: currentUser, ts: Date.now() }]);
    await fetch("/api/time-off", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: currentUser }),
    });
  };

  const approveTimeOff = async (name: string) => {
    setTimeOffRequests((prev) => prev.filter((r) => r.name !== name));
    await fetch("/api/time-off", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
  };


  const pickUser = (name: string) => {
    localStorage.setItem("team-busy-user", name);
    setCurrentUser(name);
    setShowPicker(false);
  };

  const handlePhotoUpload = async (file: File) => {
    if (!currentUser) return;
    setUploadingPhoto(true);
    const form = new FormData();
    form.append("name", currentUser);
    form.append("file", file);
    const res = await fetch("/api/photos", { method: "POST", body: form });
    const data = await res.json();
    if (data.url) setPhotoOverrides((prev) => ({ ...prev, [currentUser]: data.url }));
    setUploadingPhoto(false);
  };

  const submitBugReport = async () => {
    if (!bugReportText.trim()) return;
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: currentUser, message: `[Bug Report] ${bugReportText.trim()}` }),
    });
    setBugReportText("");
    setBugReportSent(true);
    setTimeout(() => {
      setBugReportSent(false);
      setShowBugReport(false);
    }, 2000);
  };

  const submitFeatureRequest = async () => {
    if (!featureRequestText.trim()) return;
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: currentUser, message: `[Feature Request] ${featureRequestText.trim()}` }),
    });
    setFeatureRequestText("");
    setFeatureRequestSent(true);
    setTimeout(() => {
      setFeatureRequestSent(false);
      setShowFeatureRequest(false);
    }, 2000);
  };

  const submitFeedback = async () => {
    if (!feedbackText.trim()) return;
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: currentUser, message: feedbackText.trim() }),
    });
    setFeedbackText("");
    setFeedbackSent(true);
    setTimeout(() => {
      setFeedbackSent(false);
      setShowFeedback(false);
    }, 2000);
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const isGuest = currentUser === "__guest__";
  const myMember = MEMBERS.find((m) => m.name === currentUser);
  const bossMember = MEMBERS.find((m) => m.name === BOSS);
  const teamMembers = sortedMembers.filter((m) => m.name !== currentUser && m.name !== BOSS);
  const topOnlineUser = (() => {
    const entries = Object.entries(sessionTimes).filter(([name]) => name !== BOSS);
    if (!entries.length) return null;
    const sorted = entries.sort((a, b) => b[1] - a[1]);
    if (sorted[0][1] <= 0) return null;
    return sorted[0][0];
  })();

  const renderBuddyBadge = (buddyId: string) => {
    const buddy = getBuddyById(buddyId);
    if (!buddy) return null;
    const styles = RARITY_STYLES[buddy.rarity];
    return (
      <div className="flex flex-col items-center" title={`${buddy.name} — ${buddy.tagline}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={getBuddyImagePath(buddy)} alt={buddy.name} className="w-10 h-10 object-contain" />
        <span className="text-[9px] font-black uppercase tracking-widest mt-0.5" style={{ color: styles.text === "#ffffff" ? "#3D52F0" : "#1a1a1a" }}>{buddy.name}</span>
      </div>
    );
  };

  const renderMyCard = (member: typeof MEMBERS[0]) => {
    const value = statuses[member.name] ?? 50;
    const level = getLevel(value);
    const isOOO = !!oooStatuses[member.name];
    const isSOS = !!sosStatuses[member.name];
    const isMetcalf = !!metcalfStatuses[member.name];
    const isNeedWork = !!needWorkStatuses[member.name];

    return (
      <div
        onClick={() => setCardFlipped((f) => !f)}
        className={`rounded-[1.4rem] px-6 py-6 border-[4px] transition-all cursor-pointer select-none ${
          isOOO ? "border-black opacity-50"
          : isSOS ? "border-black shadow-[6px_6px_0_#e74c3c] hover:-translate-y-1 hover:shadow-[9px_9px_0_#e74c3c]"
          : "border-black shadow-[6px_6px_0_#000] hover:-translate-y-1 hover:shadow-[9px_9px_0_#000]"
        }`}
        style={{ background: "#ffffff", position: "relative", overflow: "hidden", transform: cardFlipped ? "rotate(180deg)" : undefined, transition: "transform 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}
      >
        {/* Staleness gradient */}
        {!isOOO && (() => { const t = getStaleness(updatedAt[member.name]); return t > 0 ? (
          <div className="absolute inset-x-0 bottom-0 pointer-events-none" style={{ height: "70%", background: `linear-gradient(to top, rgba(140,90,30,${0.3 + t * 0.6}) 0%, transparent 100%)`, zIndex: 0 }} />
        ) : null; })()}
        {/* Stop clicks on interactive content from flipping the card */}
        <div onClick={(e) => e.stopPropagation()}>
        {/* Avatar + name row */}
        <div className="flex items-center gap-4 mb-5">
          <label className="relative cursor-pointer group shrink-0" title="Click to update photo">
            <Image
              src={photoOverrides[member.name] ?? member.photo}
              alt={member.name} width={72} height={72}
              className={`rounded-full object-cover border-[4px] border-black w-[72px] h-[72px] transition-opacity ${uploadingPhoto ? "opacity-40" : "group-hover:opacity-70"}`}
            />
            <span className="absolute inset-0 flex items-center justify-center text-lg opacity-0 group-hover:opacity-100 transition-opacity">
              {uploadingPhoto ? "⏳" : "📷"}
            </span>
            <input type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); e.target.value = ""; }}
            />
          </label>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-2xl font-bold leading-tight" style={{ fontFamily: "var(--font-display)" }}>{member.name}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest bg-black text-white px-2 py-0.5 rounded-full">you</span>
            </div>
            {topOnlineUser === member.name && (
              <span className="text-[10px] font-extrabold text-black/50 uppercase tracking-widest">🖥️ most online</span>
            )}
            {updatedAt[member.name] && (
              <>
                <p className="text-[11px] text-[#7a6f64] font-semibold mt-0.5 italic">{timeAgo(updatedAt[member.name])}</p>
                {!isOOO && updatedAt[member.name] && (Date.now() - updatedAt[member.name]) > 48 * 60 * 60 * 1000 && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-3xl leading-none">💩</span>
                    <span className="fly-buzz text-xl">🪰</span>
                  </div>
                )}
              </>
            )}
          </div>
          {isOOO ? (
            <span className="text-sm font-bold px-3 py-1.5 rounded-full bg-[#e5e1dc] text-[#8a857d] border-2 border-black shrink-0">👻</span>
          ) : isSOS ? (
            <span className="text-2xl animate-pulse shrink-0">🚨</span>
          ) : isMetcalf ? (
            <span className="text-2xl animate-bounce shrink-0">🚗</span>
          ) : BUDDIES_ENABLED && buddies[member.name] ? (
            <div className="shrink-0 flex items-center gap-2">
              {renderBuddyBadge(buddies[member.name].id)}
              <span className="text-4xl emoji-hover cursor-default">{EMOJIS[level]}</span>
            </div>
          ) : (
            <span className="text-4xl emoji-hover cursor-default shrink-0">{EMOJIS[level]}</span>
          )}
        </div>


        {isOOO ? (
          <div className="w-full rounded-xl bg-[#e5e1dc] border-2 border-black px-3 py-3 flex flex-col gap-1.5">
            {oooDetails[member.name]?.note && <p className="text-xs text-[#6b6560] font-medium">💬 {oooDetails[member.name].note}</p>}
            {oooDetails[member.name]?.backDate && <p className="text-xs text-[#6b6560] font-medium">📅 Back {oooDetails[member.name].backDate}</p>}
            <button onClick={() => toggleOOO(member.name)} className="text-sm text-black font-bold hover:underline cursor-pointer text-center mt-1">
              I&apos;m back fr ✌️
            </button>
          </div>
        ) : isSOS ? (
          <div className="w-full rounded-xl bg-[#e74c3c]/10 border-2 border-[#e74c3c]/30 px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-[#c0392b] animate-pulse">🔥 Burnt af. Send halp.</p>
            <button onClick={() => toggleSOS(member.name)} className="text-xs font-bold text-[#c0392b] border-2 border-[#e74c3c]/40 rounded-lg px-3 py-1.5 hover:bg-[#e74c3c]/10 cursor-pointer transition-colors whitespace-nowrap">
              I&apos;m OK now ✌️
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-3">
              <input
                type="range" min={0} max={100} value={value}
                onChange={(e) => handleSliderChange(member.name, Number(e.target.value))}
                style={getTrackStyle(value, level)}
                className="flex-1"
              />
              {value === 100 ? (
                <button onClick={() => toggleSOS(member.name)} className="py-1.5 px-3 rounded-lg border-2 border-[#e74c3c] bg-[#e74c3c] text-white text-xs font-bold cursor-pointer hover:opacity-90 transition-opacity whitespace-nowrap">
                  halp
                </button>
              ) : (
                <span className="text-xs font-extrabold px-2.5 py-1.5 rounded-lg bg-black text-white whitespace-nowrap min-w-[80px] text-center uppercase tracking-wide">
                  {LABELS[level]}
                </span>
              )}
            </div>
            <input
              type="text"
              placeholder="add a note… (heads down, in the zone, free to vibe)"
              value={editingNote}
              onChange={(e) => setEditingNote(e.target.value)}
              onBlur={() => saveNote(member.name, editingNote)}
              onKeyDown={(e) => { if (e.key === "Enter") { (e.target as HTMLInputElement).blur(); } }}
              className="w-full text-xs font-medium text-black bg-white border-[3px] border-black rounded-xl px-3 py-2 focus:outline-none placeholder:text-[#b5b0a8] mb-3"
              maxLength={80}
            />
            {/* ADHD slider */}
            <div className="rounded-xl border-[3px] border-black px-3 py-2.5 mb-3" style={{ background: ADHD_COLORS[getAdhdLevel(adhdLevels[member.name] ?? 0)] }}>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-black/60 mb-1.5">adhd check</p>
              <div className="flex items-center gap-3">
                <input
                  type="range" min={0} max={100} value={adhdLevels[member.name] ?? 0}
                  onChange={(e) => handleAdhdChange(member.name, Number(e.target.value))}
                  style={{ background: `linear-gradient(to right, rgba(0,0,0,0.3) ${adhdLevels[member.name] ?? 0}%, rgba(0,0,0,0.1) ${adhdLevels[member.name] ?? 0}%)` }}
                  className="flex-1"
                />
                <span className="text-xs font-extrabold text-black whitespace-nowrap">{ADHD_LABELS[getAdhdLevel(adhdLevels[member.name] ?? 0)]}</span>
              </div>
            </div>
            <button onClick={() => toggleOOO(member.name)} className="w-full py-2 rounded-xl border-[3px] border-black bg-white text-sm text-black cursor-pointer transition-all font-bold hover:bg-[#FFE234] shadow-[3px_3px_0_#000]">
              👻 Going ghost
            </button>
            <button
              onClick={() => toggleMetcalf(member.name)}
              className={`w-full py-2 rounded-xl border-[3px] border-black text-sm font-bold cursor-pointer transition-all mt-2 ${isMetcalf ? "bg-black text-white shadow-none" : "bg-white text-black hover:bg-black hover:text-white shadow-[3px_3px_0_#000]"}`}
            >
              🚗 {isMetcalf ? "catch me on metcalf ✓" : "catch me on metcalf"}
            </button>
            <button
              onClick={() => toggleNeedWork(member.name)}
              className={`w-full py-2 rounded-xl border-[3px] border-black text-sm font-bold cursor-pointer transition-all mt-2 ${isNeedWork ? "bg-[#3D52F0] text-white shadow-none" : "bg-white text-black hover:bg-[#3D52F0] hover:text-white shadow-[3px_3px_0_#000]"}`}
            >
              📋 {isNeedWork ? "I need work ✓" : "I need work"}
            </button>
          </>
        )}
        {isMetcalf && member.name !== currentUser && (
          <div className="w-full rounded-xl bg-black px-4 py-2.5 flex items-center gap-2 mt-1">
            <span className="text-lg">🚗</span>
            <p className="text-sm font-bold text-white">catch me on metcalf</p>
          </div>
        )}
        {/* Incoming touch grass */}
        {touchGrass.filter((p) => p.to === member.name).length > 0 && (
          <div className="flex flex-col gap-1.5 mt-2">
            {touchGrass.filter((p) => p.to === member.name).map((tg) => (
              <div key={tg.from} className="flex items-center gap-2 bg-[#a8f5c8] border-[2px] border-black rounded-xl px-3 py-2 shadow-[2px_2px_0_#000] animate-pop-in">
                <span className="text-base">🌿</span>
                <span className="text-xs font-bold flex-1">{tg.from} says touch grass</span>
                <button
                  onClick={() => dismissTouchGrass(tg.from)}
                  className="w-5 h-5 rounded-full bg-black/10 hover:bg-black hover:text-white text-black text-[10px] font-bold flex items-center justify-center transition-colors cursor-pointer"
                >✕</button>
              </div>
            ))}
          </div>
        )}
        {/* Incoming pokes */}
        {pokes.filter((p) => p.to === member.name).length > 0 && (
          <div className="flex flex-col gap-1.5 mt-2">
            {pokes.filter((p) => p.to === member.name).map((poke) => (
              <div key={poke.from} className="flex items-center gap-2 bg-[#FFE234] border-[2px] border-black rounded-xl px-3 py-2 shadow-[2px_2px_0_#000] animate-pop-in">
                <span className="text-base">👉</span>
                <span className="text-xs font-bold flex-1">{poke.from} poked you!</span>
                <button
                  onClick={() => { sendPoke(poke.from); dismissPoke(poke.from); }}
                  className="text-[10px] font-bold bg-white border-[2px] border-black rounded-lg px-2 py-1 cursor-pointer hover:bg-black hover:text-white transition-colors"
                >poke back</button>
                <button
                  onClick={() => dismissPoke(poke.from)}
                  className="w-5 h-5 rounded-full bg-black/10 hover:bg-black hover:text-white text-black text-[10px] font-bold flex items-center justify-center transition-colors cursor-pointer"
                >✕</button>
              </div>
            ))}
          </div>
        )}
        {/* Body double + Meeting buttons */}
        {currentUser && !isGuest && (
          <div className="mt-2 flex gap-2">
            <button
              onClick={toggleBodyDouble}
              className={`flex-1 py-2 rounded-xl border-[3px] border-black text-xs font-extrabold uppercase tracking-widest shadow-[3px_3px_0_#000] cursor-pointer transition-all ${bodyDouble.includes(currentUser) ? "bg-[#b5f0c8] hover:bg-white" : "bg-white hover:bg-[#b5f0c8]"}`}
            >{bodyDouble.includes(currentUser) ? "🤝 doubling!" : "🤝 body double"}</button>
            <button
              onClick={() => meetings[currentUser] ? setMeeting(null) : setShowMeetingPicker(true)}
              className={`flex-1 py-2 rounded-xl border-[3px] border-black text-xs font-extrabold uppercase tracking-widest shadow-[3px_3px_0_#000] cursor-pointer transition-all ${meetings[currentUser] ? "bg-[#FF9DC8] hover:bg-white" : "bg-white hover:bg-[#FF9DC8]"}`}
            >{meetings[currentUser] ? `📅 ${formatCountdown(meetings[currentUser])}` : "📅 in a meeting"}</button>
          </div>
        )}
        {currentUser === BOSS && (
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => { setTakeoverDraft(takeover ?? ""); setShowTakeoverCompose(true); }}
              className="flex-1 py-2 rounded-xl border-[3px] border-black bg-black text-white text-xs font-extrabold uppercase tracking-widest shadow-[3px_3px_0_#FFE234] hover:bg-[#FFE234] hover:text-black transition-all cursor-pointer"
            >📣 screen takeover</button>
            {takeover && (
              <button
                onClick={async () => { setTakeover(null); await fetch("/api/takeover", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: "" }) }); }}
                className="px-3 py-2 rounded-xl border-[3px] border-black bg-white text-xs font-extrabold shadow-[3px_3px_0_#000] hover:bg-red-100 transition-colors cursor-pointer"
              >✕ end</button>
            )}
          </div>
        )}
        {!isGuest && (
          <div className="flex items-center gap-1.5 mt-2">
            <input
              type="text"
              placeholder="drop the tea… 🍵"
              value={newMessage[member.name] ?? ""}
              onChange={(e) => setNewMessage((prev) => ({ ...prev, [member.name]: e.target.value }))}
              onKeyDown={(e) => { if (e.key === "Enter") postMessage(member.name); }}
              maxLength={120}
              className="flex-1 px-3 py-1.5 rounded-xl border-[2px] border-black bg-white text-xs font-medium placeholder:text-black/30 focus:outline-none shadow-[2px_2px_0_#000] min-w-0"
            />
            <button
              onClick={() => postMessage(member.name)}
              disabled={!(newMessage[member.name] ?? "").trim()}
              className="shrink-0 px-2.5 py-1.5 rounded-xl border-[2px] border-black bg-[#FFE234] text-xs font-extrabold shadow-[2px_2px_0_#000] hover:bg-[#FF9DC8] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default"
            >✦</button>
          </div>
        )}
        </div>{/* end stopPropagation wrapper */}
      </div>
    );
  };

  const renderTeamCard = (member: typeof MEMBERS[0], i: number) => {
    const value = statuses[member.name] ?? 50;
    const level = getLevel(value);
    const isOOO = !!oooStatuses[member.name];
    const isSOS = !!sosStatuses[member.name];
    const isMetcalf = !!metcalfStatuses[member.name];
    const isNeedWork = !!needWorkStatuses[member.name];
    return (
      <div
        key={member.name}
        className={`animate-pop-in rounded-2xl px-4 py-4 border-[4px] transition-all flex flex-col gap-2 relative group cursor-default ${
          isOOO ? "border-black hover:-translate-y-1"
          : isSOS ? "border-black shadow-[5px_5px_0_#e74c3c] hover:-translate-y-1 hover:shadow-[8px_8px_0_#e74c3c]"
          : "border-black shadow-[5px_5px_0_#000] hover:-translate-y-1 hover:shadow-[8px_8px_0_#000]"
        }`}
        style={{
          animationDelay: `${i * 50}ms`,
          background: "#ffffff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Staleness gradient */}
        {!isOOO && (() => { const t = getStaleness(updatedAt[member.name]); return t > 0 ? (
          <div className="absolute inset-x-0 bottom-0 pointer-events-none" style={{ height: "70%", background: `linear-gradient(to top, rgba(140,90,30,${0.3 + t * 0.6}) 0%, transparent 100%)`, zIndex: 0 }} />
        ) : null; })()}
        {isOOO && (
          <>
            <div className="absolute inset-0 flex items-start justify-center pointer-events-none z-10" style={{ paddingTop: "18px" }}>
              <Image
                src="/spirit.png"
                alt="ghost mode"
                width={537}
                height={74}
                className="w-[115%] h-auto opacity-90"
                style={{ transform: "rotate(-8deg)" }}
              />
            </div>
            <div className="absolute bottom-3 right-3 z-20">
              <span className="text-[13px] font-extrabold text-black" style={{ fontFamily: "var(--font-display)" }}>
                {member.name}
              </span>
            </div>
          </>
        )}
        <div className={`flex flex-col gap-2 ${isOOO ? "opacity-30 grayscale" : ""}`}>
          <div className="flex items-center gap-3">
            <Image
              src={photoOverrides[member.name] ?? member.photo}
              alt={member.name} width={44} height={44}
              className="rounded-full object-cover border-[3px] border-black w-[44px] h-[44px] shrink-0 transition-transform group-hover:scale-110"
            />
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-xl leading-tight" style={{ fontFamily: "var(--font-display)" }}>{member.name}</p>
              {updatedAt[member.name] && (
                <>
                  <p className="text-[12px] text-black font-mono mt-0.5">{timeAgo(updatedAt[member.name])}</p>
                  {!isOOO && getStaleness(updatedAt[member.name]) > 0 && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-3xl leading-none">💩</span>
                      <span className="fly-buzz text-xl">🪰</span>
                    </div>
                  )}
                </>
              )}
            </div>
            {isSOS ? (
              <span className="text-xl animate-pulse shrink-0">🚨</span>
            ) : isMetcalf ? (
              <span className="text-2xl animate-bounce shrink-0">🚗</span>
            ) : BUDDIES_ENABLED && buddies[member.name] ? (
              <div className="shrink-0 flex items-center gap-2">
                {renderBuddyBadge(buddies[member.name].id)}
                <span className="text-4xl emoji-hover cursor-default">{EMOJIS[level]}</span>
              </div>
            ) : (
              <span className="text-4xl emoji-hover cursor-default shrink-0">{EMOJIS[level]}</span>
            )}
          </div>

          {!isSOS && (
            <div className="flex flex-col gap-1.5">
              <div className="h-3 rounded-full bg-black/10 overflow-hidden border-[2px] border-black">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${value}%`, background: TRACK_COLORS[level] }}
                />
              </div>
              <p className="text-sm font-extrabold text-black uppercase tracking-widest" style={{ fontFamily: "var(--font-display)" }}>{LABELS[level]}</p>
              {statusNotes[member.name] && (
                <p className="text-[12px] text-black font-medium font-mono leading-snug">
                  {statusNotes[member.name]}
                </p>
              )}
              {(() => {
                const adhdVal = adhdLevels[member.name] ?? 0;
                const adhdLvl = getAdhdLevel(adhdVal);
                return (
                  <div className="flex items-center gap-2 rounded-xl px-3 py-2 border-[2px] border-black shadow-[2px_2px_0_#000]" style={{ background: ADHD_COLORS[adhdLvl] }}>
                    <span className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#FFE234] border-[2px] border-black shrink-0">adhd</span>
                    <span className="text-sm font-extrabold text-black">{ADHD_LABELS[adhdLvl]}</span>
                  </div>
                );
              })()}
            </div>
          )}
          {meetings[member.name] && meetings[member.name] > Date.now() && (
            <div className="w-full rounded-xl bg-[#FF9DC8] border-[2px] border-black px-4 py-2.5 flex items-center gap-2 shadow-[2px_2px_0_#000]">
              <span className="text-lg">📅</span>
              <p className="text-sm font-bold flex-1">in a meeting</p>
              <span className="text-sm font-extrabold tabular-nums">{formatCountdown(meetings[member.name])}</span>
            </div>
          )}
          {bodyDouble.includes(member.name) && (
            <div className="w-full rounded-xl bg-[#b5f0c8] border-[2px] border-black px-4 py-2.5 flex items-center gap-2 shadow-[2px_2px_0_#000]">
              <span className="text-lg">🤝</span>
              <p className="text-sm font-bold flex-1">body doubling</p>
              {currentUser && currentUser !== member.name && !bodyDouble.includes(currentUser) && (
                <button onClick={toggleBodyDouble} className="text-[10px] font-extrabold bg-white border-[2px] border-black rounded-lg px-2 py-1 cursor-pointer hover:bg-black hover:text-white transition-colors">join</button>
              )}
            </div>
          )}
          {isMetcalf && (
            <div className="w-full rounded-xl bg-black px-4 py-2.5 flex items-center gap-2">
              <span className="text-lg">🚗</span>
              <p className="text-sm font-bold text-white">catch me on metcalf</p>
            </div>
          )}
          {isNeedWork && (
            <div className="w-full rounded-xl bg-[#3D52F0] px-4 py-2.5 flex items-center gap-2">
              <span className="text-lg">📋</span>
              <p className="text-sm font-bold text-white">I need work</p>
            </div>
          )}
          {currentUser && currentUser !== member.name && (
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => sendPoke(member.name)}
                disabled={pokes.some((p) => p.from === currentUser && p.to === member.name)}
                className={`flex-1 py-1.5 rounded-xl border-[2px] border-black text-xs font-bold transition-all cursor-pointer
                  ${pokes.some((p) => p.from === currentUser && p.to === member.name)
                    ? "bg-[#FFE234] opacity-60 cursor-default"
                    : "bg-white hover:bg-[#FFE234] active:scale-95 shadow-[2px_2px_0_#000]"
                  }`}
              >
                {pokes.some((p) => p.from === currentUser && p.to === member.name) ? "👉 poked!" : "👉 poke"}
              </button>
              <button
                onClick={() => sendTouchGrass(member.name)}
                disabled={touchGrass.some((p) => p.from === currentUser && p.to === member.name)}
                className={`flex-1 py-1.5 rounded-xl border-[2px] border-black text-xs font-bold transition-all cursor-pointer
                  ${touchGrass.some((p) => p.from === currentUser && p.to === member.name)
                    ? "bg-[#a8f5c8] opacity-60 cursor-default"
                    : "bg-white hover:bg-[#a8f5c8] active:scale-95 shadow-[2px_2px_0_#000]"
                  }`}
              >
                {touchGrass.some((p) => p.from === currentUser && p.to === member.name) ? "🌿 sent!" : "🌿 touch grass"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const OFFLINE = false;
  if (OFFLINE) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#1a1a1a", padding: "40px 20px", textAlign: "center" }}>
        <div style={{ fontSize: "64px", marginBottom: "24px" }}>🔧</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 6vw, 4rem)", fontWeight: 900, color: "#fff", marginBottom: "12px", letterSpacing: "-0.02em" }}>
          we&apos;ll be right back
        </h1>
        <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.5)", fontWeight: 500, maxWidth: "400px", lineHeight: 1.5 }}>
          vibe check is down for maintenance. check back soon bestie.
        </p>
      </div>
    );
  }

  const tickerSpeed = 120;
  const tickerDuration = tickerTextWidth ? tickerTextWidth / tickerSpeed : 0;
  const urgentDuration = urgentTickerWidth ? urgentTickerWidth / tickerSpeed : 0;
  const broadcastIsUrgent = broadcast?.type === "urgent";
  const broadcastBg = broadcastIsUrgent ? "#e74c3c" : "#FF9DC8";
  const broadcastBorder = broadcastIsUrgent ? "#FFE234" : "#000";
  const broadcastTextColor = broadcastIsUrgent ? "#fff" : "#000";
  const broadcastTextStroke = broadcastIsUrgent ? "0.5px #fff" : "none";
  const broadcastText = broadcast ? broadcast.message.toUpperCase() : "";

  return (
    <>
      {/* Banner — broadcast (pink or red scrolling) or normal ticker (yellow) */}
      {broadcast && (
        <div style={{ width: "100%", overflow: "hidden", background: broadcastBg, borderBottom: `4px solid ${broadcastBorder}`, height: "50px", position: "relative", zIndex: 10 }}>
          <div style={{
            display: "flex", alignItems: "center", height: "100%",
            ...(urgentDuration > 0 ? { animation: `ticker-scroll ${urgentDuration}s linear infinite`, ["--ticker-text-width" as string]: urgentTickerWidth } : {}),
            willChange: "transform",
          }}>
            <div ref={urgentTickerRef} style={{ display: "flex", alignItems: "center", height: "100%", flexShrink: 0, whiteSpace: "nowrap" }}>
              <div style={{ display: "flex", alignItems: "center", padding: "0 48px", flexShrink: 0, whiteSpace: "nowrap" }}>
                <span style={{ fontSize: "20px", fontWeight: 900, color: broadcastTextColor, letterSpacing: "0.12em", fontFamily: "var(--font-display)", WebkitTextStroke: broadcastTextStroke }}>{broadcastText}</span>
              </div>
            </div>
            {Array.from({ length: urgentTickerCopies }).map((_, ci) => (
              <div key={ci} style={{ display: "flex", alignItems: "center", padding: "0 48px", flexShrink: 0, whiteSpace: "nowrap" }}>
                <span style={{ fontSize: "20px", fontWeight: 900, color: broadcastTextColor, letterSpacing: "0.12em", fontFamily: "var(--font-display)", WebkitTextStroke: broadcastTextStroke }}>{broadcastText}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {!broadcast && (messages.length > 0 || banner !== null) && (
        <div style={{ width: "100%", overflow: "hidden", background: "#FFE234", borderBottom: "4px solid #000", height: "50px", position: "relative", zIndex: 10 }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            height: "100%",
            ...(tickerDuration > 0 ? {
              animation: `ticker-scroll ${tickerDuration}s linear infinite`,
              ["--ticker-text-width" as string]: tickerTextWidth,
            } : {}),
            willChange: "transform",
          }}>
            <div ref={tickerTextRef} style={{ display: "flex", alignItems: "center", height: "100%", flexShrink: 0, whiteSpace: "nowrap" }}>
              {banner && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0 24px", flexShrink: 0, whiteSpace: "nowrap" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "8px", background: "#000", color: "#FFE234", padding: "4px 14px", borderRadius: "999px", fontSize: "15px", fontWeight: 900, fontFamily: "var(--font-display)", letterSpacing: "0.08em" }}>
                    ✨ {banner.message} ✨
                  </span>
                </div>
              )}
              {messages.map((msg, i) => (
                <TickerItem key={i} msg={msg} photo={photoOverrides[msg.name] ?? (MEMBERS.find(m => m.name === msg.name)?.photo ?? "")} />
              ))}
            </div>
            {Array.from({ length: tickerCopies }).map((_, ci) => (
              <div key={ci} style={{ display: "flex", alignItems: "center", height: "100%", flexShrink: 0, whiteSpace: "nowrap" }}>
                {banner && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0 24px", flexShrink: 0, whiteSpace: "nowrap" }}>
                    <span style={{ fontSize: "16px" }}>✨</span>
                    <span style={{ fontSize: "18px", fontWeight: 900, color: "#000", fontFamily: "var(--font-display)", letterSpacing: "0.05em" }}>{banner.message}</span>
                    <span style={{ fontSize: "16px" }}>✨</span>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <TickerItem key={i} msg={msg} photo={photoOverrides[msg.name] ?? (MEMBERS.find(m => m.name === msg.name)?.photo ?? "")} />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}





      <div
        className={`min-h-screen px-4 sm:px-8 py-6 sm:py-8 transition-colors duration-300 relative ${warMode ? "war-mode" : ""}`}
        style={
          warMode ? { background: "#000", fontFamily: "monospace", color: "#00ff00" } :
          bratMode ? { background: "#8ace00", fontFamily: "Arial, sans-serif" } :
          undefined
        }
      >
        {/* Scanlines overlay */}
        {warMode && (
          <div className="pointer-events-none fixed inset-0 z-[200]" style={{
            background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)",
            mixBlendMode: "multiply",
          }} />
        )}
        <div className="max-w-[1280px] mx-auto">
          {/* Header */}
          <div className="flex flex-row items-start justify-between gap-4 mb-6 sm:mb-8">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span
                  className="text-3xl sm:text-5xl font-extrabold whitespace-nowrap transition-all"
                  style={{
                    fontFamily: warMode ? "monospace" : bratMode ? "Arial, sans-serif" : "var(--font-display)",
                    color: warMode ? "#00ff00" : bratMode ? "#000" : "#fff",
                    filter: bratMode ? "blur(0.6px)" : undefined,
                    textTransform: warMode ? "uppercase" : bratMode ? "lowercase" : undefined,
                    textShadow: warMode ? "0 0 10px #00ff00, 0 0 20px #00ff00" : undefined,
                    letterSpacing: warMode ? "0.05em" : undefined,
                  }}
                >{warMode ? `> ${today.toUpperCase()}_` : today}</span>
                {weatherEmoji && <span className="text-3xl sm:text-5xl">{weatherEmoji}</span>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-[3px] border-black bg-white text-[11px] font-bold text-black tracking-widest uppercase shadow-[3px_3px_0_#000]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3CB55A] animate-pulse inline-block" />
                v{process.env.NEXT_PUBLIC_APP_VERSION}
              </div>
              {!isGuest && <>
              <button
                onClick={() => setShowFeedback(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-[3px] border-black bg-[#FF9DC8] text-[11px] font-bold text-black hover:bg-[#FFE234] transition-colors cursor-pointer uppercase tracking-widest shadow-[3px_3px_0_#000]"
              >
                💬 Feedback
              </button>
              <button
                onClick={() => setShowFeatureRequest(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-[3px] border-black bg-[#FFE234] text-[11px] font-bold text-black hover:bg-[#FF9DC8] transition-colors cursor-pointer uppercase tracking-widest shadow-[3px_3px_0_#000]"
              >
                💡 Feature Request
              </button>
              <button
                onClick={() => setShowBugReport(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-[3px] border-black bg-[#FF9DC8] text-[11px] font-bold text-black hover:bg-[#FFE234] transition-colors cursor-pointer uppercase tracking-widest shadow-[3px_3px_0_#000]"
              >
                🐛 Submit Bug
              </button>
              </>}
              {currentUser && !isGuest && !VP.includes(currentUser) && (
                <button
                  onClick={handleTimeOffRequest}
                  disabled={timeOffSent || timeOffRequests.some((r) => r.name === currentUser)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-[3px] border-black bg-[#b5f0c8] text-[11px] font-bold text-black hover:bg-[#FFE234] transition-colors cursor-pointer uppercase tracking-widest shadow-[3px_3px_0_#000] disabled:opacity-60 disabled:cursor-default"
                >
                  🏖️ {(timeOffSent || timeOffRequests.some((r) => r.name === currentUser)) ? "Request sent!" : "hey Derek, approve my time off"}
                </button>
              )}
              <button
                onClick={() => setBratMode((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-[3px] border-black text-[11px] font-bold tracking-widest uppercase shadow-[3px_3px_0_#000] cursor-pointer transition-colors"
                style={{ background: bratMode ? "#8ace00" : "#fff", color: "#000", fontFamily: bratMode ? "Arial, sans-serif" : undefined }}
              >{bratMode ? "brat" : "brat mode"}</button>
              <button
                onClick={() => setWarMode((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-[3px] text-[11px] font-bold tracking-widest uppercase cursor-pointer transition-all"
                style={{ background: warMode ? "#00ff00" : "#000", color: warMode ? "#000" : "#00ff00", borderColor: "#00ff00", fontFamily: "monospace", boxShadow: warMode ? "0 0 8px #00ff00" : "3px 3px 0 #00ff00" }}
              >{warMode ? "■ TERMINATE" : "► WAR MODE"}</button>
              {topOnlineUser && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-[3px] border-black bg-[#39FF14] text-[11px] font-bold text-black tracking-widest uppercase shadow-[3px_3px_0_#000]">
                  <span className="font-extrabold">{topOnlineUser}</span> is chronically online
                </div>
              )}
              </div>
            </div>
            {/* Home sticker — right side */}
            {loaded && currentUser && !isGuest && (
              <button
                onClick={handleGoHome}
                disabled={goHomeRequested}
                title={goHomeRequested ? "Request sent!" : "I want to go home"}
                className={`transition-all cursor-pointer shrink-0 ${goHomeRequested ? "scale-95" : "hover:scale-110 hover:rotate-6"}`}
              >
                <Image src="/home.png" alt="I want to go home" width={120} height={120} className="rounded-full" />
              </button>
            )}
          </div>

          {/* Loading */}
          {!loaded ? (
            <p className="text-center text-white/60 text-lg animate-pulse">
              loading the vibes...
            </p>
          ) : (
            <>
              <div className="flex flex-col md:flex-row gap-6 md:gap-7 md:items-start">
                {/* Left: My card */}
                {myMember && (
                  <div className="animate-pop-in w-full md:w-[320px] md:shrink-0 md:sticky md:top-8">
                    {renderMyCard(myMember)}
                  </div>
                )}
                {/* Right: Team grid */}
                <div className="flex-1 min-w-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {teamMembers.map((member, i) => renderTeamCard(member, i))}
                  </div>
                </div>
              </div>

              {/* Go Home Requests */}
              {goHomeRequests.length > 0 && (() => {
                const sorted = [...goHomeRequests].sort((a, b) => b.count - a.count || a.ts - b.ts);
                const topScore = sorted[0].count;
                return (
                  <div className="animate-pop-in mt-6">
                    <div className="rounded-[1.4rem] border-[4px] border-black shadow-[6px_6px_0_#000] bg-[#FFE234] overflow-hidden">
                      <button
                        onClick={() => setGoHomeExpanded((v) => !v)}
                        className="w-full px-5 pt-4 pb-3 border-b-[3px] border-black flex items-center gap-3 cursor-pointer hover:bg-[#f5d800] transition-colors"
                      >
                        <h2 className="text-4xl font-extrabold text-black tracking-tight flex-1 text-left">Wants to go home</h2>
                        <span className="text-sm font-extrabold bg-black text-white px-3 py-1.5 rounded-full">{goHomeRequests.length}</span>
                        <span className="text-xl ml-1">{goHomeExpanded ? "▲" : "▼"}</span>
                      </button>
                      {goHomeExpanded && (
                        <div className="flex flex-wrap gap-3 px-5 py-4">
                          {sorted.map((r, i) => {
                            const isTop = i === 0 && topScore > 1;
                            const isAngel = r.count >= 777;
                            const isDevil = r.count === 666;
                            return (
                              <div key={r.name} className={`flex items-center gap-2.5 rounded-2xl px-4 py-2.5 border-[3px] shadow-[3px_3px_0_#000] ${isAngel ? "bg-sky-200 border-sky-400" : isDevil ? "bg-red-600 border-red-900" : isTop ? "bg-black border-black" : "bg-white border-black"}`}>
                                {isTop && !isDevil && !isAngel && <span className="text-base">🏆</span>}
                                {isAngel
                                  ? <span className="text-3xl w-9 h-9 flex items-center justify-center flex-shrink-0 animate-bounce">😇</span>
                                  : isDevil
                                  ? <span className="text-3xl w-9 h-9 flex items-center justify-center flex-shrink-0 animate-pulse">😈</span>
                                  : <Image
                                      src={photoOverrides[r.name] ?? (MEMBERS.find(m => m.name === r.name)?.photo ?? "")}
                                      alt={r.name} width={36} height={36}
                                      className="rounded-full object-cover w-9 h-9 border-2 border-black flex-shrink-0"
                                    />
                                }
                                <span className={`font-extrabold text-base ${isAngel ? "text-sky-800" : isDevil ? "text-white" : isTop ? "text-[#FFE234]" : "text-black"}`}>{r.name}</span>
                                <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${isAngel ? "bg-sky-400 text-white" : isDevil ? "bg-red-900 text-white" : isTop ? "bg-[#FFE234] text-black" : "bg-black text-[#FFE234]"}`}>x{r.count}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Boss Card */}
              {bossMember && currentUser !== BOSS && (
                <div className="animate-pop-in mt-8 rounded-[1.4rem] border-[4px] border-black shadow-[6px_6px_0_#000] bg-[#FFE234] overflow-hidden">
                  <div className="flex items-center gap-5 px-6 py-5">
                    <div className="relative shrink-0">
                      <Image
                        src={photoOverrides[bossMember.name] ?? bossMember.photo}
                        alt={bossMember.name} width={72} height={72}
                        className="rounded-full object-cover w-[72px] h-[72px] border-[3px] border-black"
                      />
                      <span className="absolute -bottom-1 -right-1 text-lg">👑</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>{bossMember.name}</span>
                        <span className="text-xs font-extrabold bg-black text-[#FFE234] px-3 py-1 rounded-full uppercase tracking-widest">The Boss</span>
                        {topOnlineUser === bossMember.name && (
                          <span className="text-[10px] font-extrabold text-black/50 uppercase tracking-widest">🖥️ most online</span>
                        )}
                        {sosStatuses[bossMember.name] && <span className="text-xl animate-pulse">🚨</span>}
                        {metcalfStatuses[bossMember.name] && <span className="text-xl animate-bounce">🚗</span>}
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex-1 h-3 rounded-full bg-black/20 overflow-hidden border-[2px] border-black max-w-xs">
                          <div className="h-full rounded-full transition-all" style={{ width: `${statuses[bossMember.name] ?? 50}%`, background: TRACK_COLORS[getLevel(statuses[bossMember.name] ?? 50)] }} />
                        </div>
                        <span className="text-xs font-extrabold uppercase tracking-widest">{LABELS[getLevel(statuses[bossMember.name] ?? 50)]}</span>
                      </div>
                      {statusNotes[bossMember.name] && (
                        <p className="text-xs font-medium text-black/70 mt-1 font-mono">{statusNotes[bossMember.name]}</p>
                      )}
                    </div>
                    <span className="text-5xl shrink-0">{EMOJIS[getLevel(statuses[bossMember.name] ?? 50)]}</span>
                  </div>
                  {currentUser !== BOSS && !isGuest && (
                    <div className="flex items-center gap-4 px-6 pb-5">
                      <button
                        onClick={() => reactToBoss("heart")}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border-[3px] border-black font-bold text-sm cursor-pointer transition-all shadow-[3px_3px_0_#000] active:shadow-none active:translate-y-[2px] ${bossReactions[currentUser ?? ""] === "heart" ? "bg-black text-white" : "bg-white hover:bg-black hover:text-white"}`}
                      >
                        ❤️ <span>{Object.values(bossReactions).filter(r => r === "heart").length}</span>
                      </button>
                      <button
                        onClick={() => reactToBoss("thumbsdown")}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border-[3px] border-black font-bold text-sm cursor-pointer transition-all shadow-[3px_3px_0_#000] active:shadow-none active:translate-y-[2px] ${bossReactions[currentUser ?? ""] === "thumbsdown" ? "bg-black text-white" : "bg-white hover:bg-black hover:text-white"}`}
                      >
                        👎 <span>{Object.values(bossReactions).filter(r => r === "thumbsdown").length}</span>
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-3 px-6 pb-5 flex-wrap">
                    <span className="text-xs font-extrabold uppercase tracking-widest text-black/50">today&apos;s vibes:</span>
                    <span className="flex items-center gap-1 text-sm font-bold">❤️ {Object.values(bossReactions).filter(r => r === "heart").length}</span>
                    <span className="flex items-center gap-1 text-sm font-bold">👎 {Object.values(bossReactions).filter(r => r === "thumbsdown").length}</span>
                  </div>
                </div>
              )}

              {/* Vibe Music */}
              <div className="mt-8 border-[3px] border-black rounded-[1.4rem] shadow-[5px_5px_0_#000] overflow-hidden bg-black">
                <div className="relative w-full" style={{ height: "min(85vh, 560px)" }}>
                  <iframe
                    ref={vibeIframeRef}
                    src="https://www.youtube.com/embed/vTfD20dbxho?autoplay=1&mute=1&loop=1&playlist=vTfD20dbxho&controls=0&modestbranding=1&rel=0&enablejsapi=1&start=4"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      width: "max(100%, calc(min(85vh, 560px) * 16 / 9))",
                      height: "max(100%, calc(100% * 9 / 16))",
                      border: "none",
                    }}
                  />
                  <button
                    onClick={() => {
                      const cmd = vibeMuted ? "unMute" : "mute";
                      vibeIframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: cmd, args: [] }), "*");
                      setVibeMuted(!vibeMuted);
                    }}
                    style={{
                      position: "absolute",
                      bottom: "16px",
                      right: "16px",
                      zIndex: 10,
                      background: "rgba(0,0,0,0.6)",
                      border: "2px solid rgba(255,255,255,0.4)",
                      borderRadius: "999px",
                      padding: "8px 16px",
                      color: "#fff",
                      fontSize: "13px",
                      fontWeight: 800,
                      cursor: "pointer",
                      backdropFilter: "blur(6px)",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    {vibeMuted ? "🔇 unmute" : "🔊 mute"}
                  </button>
                </div>
              </div>

            </>
          )}
        </div>

        {/* Meeting Picker Modal */}
        {showMeetingPicker && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white border-[4px] border-black rounded-[1.6rem] shadow-[7px_7px_0_#000] p-8 max-w-[380px] w-[92%] flex flex-col gap-4">
              <h2 className="text-2xl font-extrabold" style={{ fontFamily: "var(--font-display)" }}>📅 how long?</h2>
              <div className="grid grid-cols-2 gap-3">
                {[15, 30, 45, 60].map((min) => (
                  <button
                    key={min}
                    onClick={() => setMeeting(min)}
                    className="py-4 rounded-xl border-[3px] border-black bg-white hover:bg-[#FF9DC8] font-extrabold text-lg shadow-[3px_3px_0_#000] active:shadow-none active:translate-y-[2px] transition-all cursor-pointer"
                  >{min} min</button>
                ))}
              </div>
              <button onClick={() => setShowMeetingPicker(false)} className="text-sm text-black/40 hover:text-black transition-colors cursor-pointer">cancel</button>
            </div>
          </div>
        )}

        {/* Takeover Overlay — shown to everyone except Derek */}
        {takeover && currentUser !== BOSS && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "#FFE234" }}>
            <div className="max-w-2xl w-full px-8 text-center">
              <div className="text-6xl mb-6">📣</div>
              <p className="text-5xl sm:text-7xl font-extrabold text-black leading-tight" style={{ fontFamily: "var(--font-display)" }}>{takeover}</p>
              <p className="mt-8 text-sm font-bold text-black/40 uppercase tracking-widest">— Derek</p>
            </div>
          </div>
        )}

        {/* Takeover Compose Modal — Derek only */}
        {showTakeoverCompose && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white border-[4px] border-black rounded-[1.6rem] shadow-[7px_7px_0_#000] p-8 max-w-[480px] w-[92%] flex flex-col gap-4">
              <h2 className="text-2xl font-extrabold" style={{ fontFamily: "var(--font-display)" }}>📣 Screen Takeover</h2>
              <p className="text-sm text-black/50">This message will fill everyone&apos;s screen.</p>
              <textarea
                value={takeoverDraft}
                onChange={(e) => setTakeoverDraft(e.target.value)}
                placeholder="Type your message…"
                maxLength={200}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border-[3px] border-black text-lg font-bold focus:outline-none resize-none"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    if (!takeoverDraft.trim()) return;
                    setTakeover(takeoverDraft.trim());
                    setShowTakeoverCompose(false);
                    await fetch("/api/takeover", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: takeoverDraft.trim() }) });
                  }}
                  disabled={!takeoverDraft.trim()}
                  className="flex-1 py-3 rounded-xl bg-black text-white font-extrabold text-sm border-[3px] border-black shadow-[4px_4px_0_#FFE234] hover:bg-[#FFE234] hover:text-black transition-all cursor-pointer disabled:opacity-40 disabled:cursor-default"
                >send it 📣</button>
                <button
                  onClick={() => setShowTakeoverCompose(false)}
                  className="px-4 py-3 rounded-xl border-[3px] border-black font-bold text-sm hover:bg-black hover:text-white transition-colors cursor-pointer"
                >cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Hatch Modal */}
        {BUDDIES_ENABLED && showHatchModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="animate-bounce-in bg-white border-[4px] border-black rounded-[1.6rem] shadow-[7px_7px_0_#000] p-8 max-w-[400px] w-[92%] flex flex-col items-center gap-4">
              {hatchPhase === "egg" && (
                <>
                  <div className="text-7xl select-none">🥚</div>
                  <h2 className="text-2xl font-extrabold text-center" style={{ fontFamily: "var(--font-display)" }}>your buddy is waiting</h2>
                  <p className="text-sm text-[#8a857d] text-center">one-time hatch. you get what you get. no trades.</p>
                  <button
                    onClick={crackEgg}
                    className="mt-2 w-full py-3 rounded-2xl bg-[#FFE234] border-[3px] border-black font-extrabold text-base shadow-[4px_4px_0_#000] hover:bg-[#FF9DC8] transition-all cursor-pointer active:translate-y-[2px] active:shadow-none"
                  >
                    crack it open 🥚
                  </button>
                  <button onClick={() => setShowHatchModal(false)} className="text-sm text-[#b5b0a8] hover:text-black transition-colors cursor-pointer">
                    not yet
                  </button>
                </>
              )}

              {hatchPhase === "cracking" && (
                <div className="flex flex-col items-center gap-4 py-6">
                  <div className="text-7xl animate-egg-crack select-none">🥚</div>
                  <p className="text-base font-bold text-[#8a857d] animate-pulse">hatching…</p>
                </div>
              )}

              {hatchPhase === "reveal" && hatchedBuddy && (() => {
                const styles = RARITY_STYLES[hatchedBuddy.rarity];
                return (
                  <>
                    <div
                      className="w-full rounded-2xl border-[3px] border-black p-5 flex flex-col items-center gap-2 animate-buddy-flash shadow-[4px_4px_0_#000]"
                      style={{ background: styles.bg }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={getBuddyImagePath(hatchedBuddy)} alt={hatchedBuddy.name} className="w-28 h-28 object-contain" />
                      <span className="text-2xl font-extrabold mt-1" style={{ color: styles.text, fontFamily: "var(--font-display)" }}>{hatchedBuddy.name}</span>
                      <span className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border-[2px] border-black" style={{ color: styles.text }}>{styles.label}</span>
                      <span className="text-sm font-medium italic text-center" style={{ color: styles.text }}>&ldquo;{hatchedBuddy.tagline}&rdquo;</span>
                    </div>
                    <button
                      onClick={confirmHatch}
                      className="w-full py-3 rounded-2xl bg-black text-white border-[3px] border-black font-extrabold text-base shadow-[4px_4px_0_#555] hover:opacity-90 transition-all cursor-pointer active:translate-y-[2px] active:shadow-none"
                    >
                      let&apos;s goooo 🔥
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* Ghost Modal */}
        {showGhostModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="animate-bounce-in bg-white border-[4px] border-black rounded-[1.6rem] shadow-[7px_7px_0_#000] p-8 max-w-[420px] w-[92%]">
              <div className="text-4xl mb-2 text-center">👻</div>
              <h2 className="text-xl font-extrabold text-center mb-1" style={{ fontFamily: "var(--font-display)" }}>Going Ghost</h2>
              <p className="text-sm text-[#8a857d] text-center mb-5">Let the team know what&apos;s up</p>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs font-bold text-[#6b6560] uppercase tracking-wide mb-1 block">What&apos;s the vibe?</label>
                  <input
                    type="text"
                    placeholder="OOO, at a conference, touching grass…"
                    value={ghostNote}
                    onChange={(e) => setGhostNote(e.target.value)}
                    className="w-full border-2 border-black rounded-xl px-3 py-2.5 text-sm font-medium bg-white focus:outline-none"
                    maxLength={80}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#6b6560] uppercase tracking-wide mb-1 block">Back when?</label>
                  <input
                    type="text"
                    placeholder="Monday, Jan 20, TBD…"
                    value={ghostBackDate}
                    onChange={(e) => setGhostBackDate(e.target.value)}
                    className="w-full border-2 border-black rounded-xl px-3 py-2.5 text-sm font-medium bg-white focus:outline-none"
                    maxLength={40}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowGhostModal(false)}
                  className="flex-1 py-2.5 rounded-xl border-2 border-black text-sm font-bold text-[#8a857d] hover:text-black transition-all cursor-pointer"
                >
                  nevermind
                </button>
                <button
                  onClick={confirmGhost}
                  className="flex-1 py-2.5 rounded-xl border-2 border-black bg-black text-sm font-bold text-white hover:bg-[#2d2a26] transition-all cursor-pointer"
                >
                  go ghost 👻
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Modal */}
        {showFeedback && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="animate-bounce-in bg-white border-[4px] border-black rounded-[1.6rem] shadow-[7px_7px_0_#000] p-8 max-w-[420px] w-[92%]">
              {feedbackSent ? (
                <div className="text-center py-4">
                  <div className="text-5xl mb-3">🙏</div>
                  <p className="text-xl font-extrabold" style={{ fontFamily: "var(--font-display)" }}>Thanks!</p>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-1">
                    <h2 className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>App feedback</h2>
                    <button
                      onClick={() => { setShowFeedback(false); setFeedbackText(""); }}
                      className="text-[#b5b0a8] hover:text-black transition-colors cursor-pointer text-xl leading-none mt-0.5"
                    >✕</button>
                  </div>
                  <p className="text-sm text-[#b5b0a8] mb-5 font-medium">what&apos;s working, what&apos;s not, ideas — all welcome</p>
                  <textarea
                    autoFocus
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitFeedback(); }}
                    placeholder="type here..."
                    rows={4}
                    className="w-full border-[3px] border-black focus:border-black rounded-2xl px-4 py-3 text-sm font-medium outline-none resize-none bg-white transition-colors mb-4"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setShowFeedback(false); setFeedbackText(""); }}
                      className="flex-1 py-3 rounded-2xl border-[3px] border-black text-[#b5b0a8] font-bold text-sm cursor-pointer hover:text-black transition-all"
                    >nevermind</button>
                    <button
                      onClick={submitFeedback}
                      disabled={!feedbackText.trim()}
                      className="flex-1 py-3 rounded-2xl bg-black text-white font-bold text-sm cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-default"
                    >send it ✉️</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Feature Request Modal */}
        {showFeatureRequest && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="animate-bounce-in bg-white border-[4px] border-black rounded-[1.6rem] shadow-[7px_7px_0_#000] p-8 max-w-[420px] w-[92%]">
              {featureRequestSent ? (
                <div className="text-center py-4">
                  <div className="text-5xl mb-3">💡</div>
                  <p className="text-xl font-extrabold" style={{ fontFamily: "var(--font-display)" }}>Noted!</p>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-1">
                    <h2 className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>Feature Request</h2>
                    <button
                      onClick={() => { setShowFeatureRequest(false); setFeatureRequestText(""); }}
                      className="text-[#b5b0a8] hover:text-black transition-colors cursor-pointer text-xl leading-none mt-0.5"
                    >✕</button>
                  </div>
                  <p className="text-sm text-[#b5b0a8] mb-5 font-medium">got an idea? drop it here and we&apos;ll cook</p>
                  <textarea
                    autoFocus
                    value={featureRequestText}
                    onChange={(e) => setFeatureRequestText(e.target.value.slice(0, 200))}
                    onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitFeatureRequest(); }}
                    placeholder="what should we build..."
                    rows={4}
                    maxLength={200}
                    className="w-full border-[3px] border-black focus:border-black rounded-2xl px-4 py-3 text-sm font-medium outline-none resize-none bg-white transition-colors mb-2"
                  />
                  <p className="text-xs text-[#b5b0a8] text-right mb-4 font-medium">{featureRequestText.length}/200</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setShowFeatureRequest(false); setFeatureRequestText(""); }}
                      className="flex-1 py-3 rounded-2xl border-[3px] border-black text-[#b5b0a8] font-bold text-sm cursor-pointer hover:text-black transition-all"
                    >nevermind</button>
                    <button
                      onClick={submitFeatureRequest}
                      disabled={!featureRequestText.trim()}
                      className="flex-1 py-3 rounded-2xl bg-[#FFE234] border-[3px] border-black text-black font-bold text-sm cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-default shadow-[3px_3px_0_#000]"
                    >send it 💡</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Bug Report Modal */}
        {showBugReport && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="animate-bounce-in bg-white border-[4px] border-black rounded-[1.6rem] shadow-[7px_7px_0_#000] p-8 max-w-[420px] w-[92%]">
              {bugReportSent ? (
                <div className="text-center py-4">
                  <div className="text-5xl mb-3">🐛</div>
                  <p className="text-xl font-extrabold" style={{ fontFamily: "var(--font-display)" }}>Got it!</p>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-1">
                    <h2 className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>Submit a Bug</h2>
                    <button
                      onClick={() => { setShowBugReport(false); setBugReportText(""); }}
                      className="text-[#b5b0a8] hover:text-black transition-colors cursor-pointer text-xl leading-none mt-0.5"
                    >✕</button>
                  </div>
                  <p className="text-sm text-[#b5b0a8] mb-5 font-medium">something broken? spill the tea</p>
                  <textarea
                    autoFocus
                    value={bugReportText}
                    onChange={(e) => setBugReportText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitBugReport(); }}
                    placeholder="what broke and when..."
                    rows={4}
                    className="w-full border-[3px] border-black focus:border-black rounded-2xl px-4 py-3 text-sm font-medium outline-none resize-none bg-white transition-colors mb-4"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setShowBugReport(false); setBugReportText(""); }}
                      className="flex-1 py-3 rounded-2xl border-[3px] border-black text-[#b5b0a8] font-bold text-sm cursor-pointer hover:text-black transition-all"
                    >nevermind</button>
                    <button
                      onClick={submitBugReport}
                      disabled={!bugReportText.trim()}
                      className="flex-1 py-3 rounded-2xl bg-[#FF9DC8] border-[3px] border-black text-black font-bold text-sm cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-default shadow-[3px_3px_0_#000]"
                    >send it 🐛</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Identity Picker */}
        {showPicker && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="animate-bounce-in bg-white border-[4px] border-black rounded-[1.6rem] shadow-[7px_7px_0_#000] p-8 max-w-[420px] w-[92%]">
              <div className="text-center mb-7">
                <div className="text-5xl mb-3">👋</div>
                <h2 className="text-3xl font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>Who dis?</h2>
                <p className="text-sm text-[#b5b0a8] mt-1 font-medium">pick yourself bestie</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {MEMBERS.map((member) => (
                  <button
                    key={member.name}
                    onClick={() => pickUser(member.name)}
                    className="hover-wiggle flex items-center gap-3 px-4 py-3.5 border-[3px] border-black rounded-2xl bg-white hover:bg-[#FFE234] hover:shadow-[3px_3px_0_#000] transition-all cursor-pointer text-[15px] font-bold active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                  >
                    <Image
                      src={photoOverrides[member.name] ?? member.photo}
                      alt={member.name} width={42} height={42}
                      className="rounded-full object-cover w-[42px] h-[42px] border-2 border-black"
                    />
                    {member.name}
                  </button>
                ))}
              </div>
              <button
                onClick={() => pickUser("__guest__")}
                className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 border-[3px] border-dashed border-black rounded-2xl bg-white hover:bg-[#f7f7f5] transition-all cursor-pointer text-sm font-bold text-[#b5b0a8] hover:text-black"
              >
                👀 just looking (guest mode)
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Footer */}
      <div style={{ width: "100%", background: "#FF9DC8", borderTop: "4px solid #000" }}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-8 sm:py-12 flex flex-col sm:flex-row items-center gap-2 sm:gap-0 justify-between text-center sm:text-left">
          <span className="text-base font-extrabold text-black" style={{ fontFamily: "var(--font-display)" }}>Vibe Check 👁️👄👁️</span>
          <span className="text-sm font-bold text-black font-mono">track s&amp;a creative bandwidth. no cap.</span>
          <span className="text-sm font-bold text-black">v{process.env.NEXT_PUBLIC_APP_VERSION}</span>
        </div>
      </div>
    </>
  );
}
