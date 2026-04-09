"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { rollBuddy, getBuddyById, getBuddyImagePath, RARITY_STYLES, type Buddy } from "@/lib/buddies";

const MEMBERS = [
  { name: "Brendan", photo: "/photos/Brendan.jpg" },
  { name: "Callie", photo: "/photos/Callie.jpg" },
  { name: "Chris", photo: "/photos/Chris.jpg" },
  { name: "Erin", photo: "/photos/Erin.jpg" },
  { name: "KC", photo: "/photos/KC.jpeg" },
  { name: "Kerry", photo: "/photos/Kerry.jpg" },
  { name: "Maddie", photo: "/photos/Maddie.jpg" },
];

const WRITERS = ["Kerry", "Erin", "Maddie"];
const VP = ["Derek"];

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

function getSuggestions(name: string | null): string[] {
  if (!name) return [];
  if (VP.includes(name)) return SUGGESTIONS.vp;
  if (WRITERS.includes(name)) return SUGGESTIONS.writer;
  return SUGGESTIONS.artDirector;
}

const LABELS = ["Chillin'", "Sautéed", "Cooking", "Cooked"];
const EMOJIS = ["😎", "🍳", "🔥", "💀"];
const CARD_BGS = ["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"];
const TRACK_COLORS = ["#5cb85c", "#4a9eff", "#f5a623", "#e8742d"];

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
  const [newMessage, setNewMessage] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionIdx, setSuggestionIdx] = useState(0);
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
  const sortTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [chatMessages, setChatMessages] = useState<{ name: string; message: string; ts: number }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const [reactions, setReactions] = useState<Record<string, Record<string, string[]>>>({});
  const [hoveredMsg, setHoveredMsg] = useState<number | null>(null);
  const [goHomeRequested, setGoHomeRequested] = useState(false);
  const [goHomeRequests, setGoHomeRequests] = useState<{ name: string; ts: number; count: number }[]>([]);
  const [timeOffRequests, setTimeOffRequests] = useState<{ name: string; ts: number }[]>([]);
  const [timeOffSent, setTimeOffSent] = useState(false);
  const [pokes, setPokes] = useState<{ from: string; to: string; ts: number }[]>([]);
  const [pokedBy, setPokedBy] = useState<string[]>([]);
  const [ratings, setRatings] = useState<Record<string, Record<string, number>>>({});
  const [buddies, setBuddies] = useState<Record<string, { id: string; hatchedAt: number }>>({});
  const [showHatchModal, setShowHatchModal] = useState(false);
  const [hatchedBuddy, setHatchedBuddy] = useState<Buddy | null>(null);
  const [hatchPhase, setHatchPhase] = useState<"egg" | "cracking" | "reveal">("egg");

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
      const [statusRes, oooRes, sosRes, photosRes, msgsRes, urgentRes, chatRes, buddiesRes, reactionsRes, goHomeRes, reloadRes, bannerRes, pokeRes, timeOffRes, ratingsRes] = await Promise.all([
        fetch("/api/status"),
        fetch("/api/status/ooo"),
        fetch("/api/status/sos"),
        fetch("/api/photos"),
        fetch("/api/messages"),
        fetch("/api/urgent"),
        fetch("/api/chat"),
        fetch("/api/buddies"),
        fetch("/api/chat/reactions"),
        fetch("/api/go-home"),
        fetch("/api/reload"),
        fetch("/api/banner"),
        fetch("/api/poke"),
        fetch("/api/time-off"),
        fetch("/api/ratings"),
      ]);
      const [statusData, oooData, sosData, photosData, msgsData, urgentData, chatData, buddiesData, reactionsData, goHomeData, reloadData, bannerData, pokeData, timeOffData, ratingsData] = await Promise.all([
        statusRes.json(),
        oooRes.json(),
        sosRes.json(),
        photosRes.json(),
        msgsRes.json(),
        urgentRes.json(),
        chatRes.json(),
        buddiesRes.json(),
        reactionsRes.json(),
        goHomeRes.json(),
        reloadRes.json(),
        bannerRes.json(),
        pokeRes.json(),
        timeOffRes.json(),
        ratingsRes.json(),
      ]);
      if (reloadData.ts && reloadData.ts > pageLoadTime.current) {
        window.location.reload();
        return;
      }
      setStatuses(statusData.status);
      setUpdatedAt(statusData.updated);
      const notes = statusData.notes ?? {};
      setStatusNotes(notes);
      setEditingNote((prev) => prev !== "" ? prev : (currentUser && notes[currentUser]) ? notes[currentUser] : prev);
      setOooStatuses(oooData.ooo ?? oooData);
      setOooDetails(oooData.details ?? {});
      setSosStatuses(sosData);
      setPhotoOverrides(photosData.photos ?? {});
      setMessages(msgsData.messages ?? []);
      setBroadcast(urgentData.message ? { message: urgentData.message, type: urgentData.type ?? "broadcast" } : null);
      setChatMessages(chatData.messages ?? []);
      setBuddies(buddiesData.buddies ?? {});
      setReactions(reactionsData.reactions ?? {});
      setGoHomeRequests(goHomeData.requests ?? []);
      setTimeOffRequests(timeOffData.requests ?? []);
      setRatings(ratingsData.ratings ?? {});
      if (bannerData.banner?.message) setBanner({ message: bannerData.banner.message, type: bannerData.banner.type ?? "daily" });
      const allPokes: { from: string; to: string; ts: number }[] = pokeData.pokes ?? [];
      setPokes(allPokes);
    } catch {
      // retry next poll
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

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
    if (loaded && currentUser && !buddies[currentUser] && !showHatchModal) {
      setHatchPhase("egg");
      setHatchedBuddy(null);
      setShowHatchModal(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, currentUser]);

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
    if (!messages.length) return;
    const calculate = () => {
      if (!tickerTextRef.current) return;
      const tw = tickerTextRef.current.offsetWidth;
      if (!tw) return;
      setTickerTextWidth(tw);
      setTickerCopies(Math.ceil(window.innerWidth / tw) + 1);
    };
    const t = setTimeout(calculate, 30);
    window.addEventListener("resize", calculate);
    return () => { clearTimeout(t); window.removeEventListener("resize", calculate); };
  }, [messages]);

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

  const sendChat = async () => {
    if (!chatInput.trim() || !currentUser) return;
    const msg = { name: currentUser, message: chatInput.trim(), ts: Date.now() };
    setChatMessages((prev) => [...prev, msg]);
    setChatInput("");
    setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: currentUser, message: msg.message }),
    });
  };

  const REACTION_EMOJIS = ["👍", "❤️", "😂", "🔥", "💀", "👀"];

  const toggleReaction = async (ts: number, emoji: string) => {
    if (!currentUser) return;
    const key = String(ts);
    // optimistic update
    setReactions((prev) => {
      const msgReactions = { ...(prev[key] ?? {}) };
      const names = msgReactions[emoji] ?? [];
      msgReactions[emoji] = names.includes(currentUser)
        ? names.filter((n) => n !== currentUser)
        : [...names, currentUser];
      if (msgReactions[emoji].length === 0) delete msgReactions[emoji];
      return { ...prev, [key]: msgReactions };
    });
    await fetch("/api/chat/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ts, emoji, name: currentUser }),
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

  const postMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;
    const msg = { name: currentUser, message: newMessage.trim(), ts: Date.now() };
    setMessages((prev) => [msg, ...prev.filter((m) => m.name !== currentUser)]);
    setNewMessage("");
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: currentUser, message: msg.message }),
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

  const myMember = MEMBERS.find((m) => m.name === currentUser);
  const teamMembers = sortedMembers.filter((m) => m.name !== currentUser);

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

    return (
      <div
        className={`rounded-[1.4rem] px-6 py-6 border-[4px] transition-all ${
          isOOO ? "border-black opacity-50"
          : isSOS ? "border-black shadow-[6px_6px_0_#e74c3c] hover:-translate-y-1 hover:shadow-[9px_9px_0_#e74c3c]"
          : "border-black shadow-[6px_6px_0_#000] hover:-translate-y-1 hover:shadow-[9px_9px_0_#000]"
        }`}
        style={{ background: "#ffffff", position: "relative", overflow: "hidden" }}
      >
        {/* Staleness gradient */}
        {!isOOO && (() => { const t = getStaleness(updatedAt[member.name]); return t > 0 ? (
          <div className="absolute inset-x-0 bottom-0 pointer-events-none" style={{ height: "70%", background: `linear-gradient(to top, rgba(140,90,30,${0.3 + t * 0.6}) 0%, transparent 100%)`, zIndex: 0 }} />
        ) : null; })()}
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
          ) : BUDDIES_ENABLED && buddies[member.name] && member.name === currentUser ? (
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
            <button onClick={() => toggleOOO(member.name)} className="w-full py-2 rounded-xl border-[3px] border-black bg-white text-sm text-black cursor-pointer transition-all font-bold hover:bg-[#FFE234] shadow-[3px_3px_0_#000]">
              👻 Going ghost
            </button>
          </>
        )}
        {/* Incoming pokes */}
        {pokes.filter((p) => p.to === member.name).length > 0 && (
          <div className="flex flex-col gap-1.5 mt-2">
            {pokes.filter((p) => p.to === member.name).map((poke) => (
              <div key={poke.from} className="flex items-center gap-2 bg-[#FFE234] border-[2px] border-black rounded-xl px-3 py-2 shadow-[2px_2px_0_#000] animate-pop-in">
                <span className="text-base">👉</span>
                <span className="text-xs font-bold flex-1">{poke.from} poked you!</span>
                <button
                  onClick={() => sendPoke(poke.from)}
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
      </div>
    );
  };

  const renderTeamCard = (member: typeof MEMBERS[0], i: number) => {
    const value = statuses[member.name] ?? 50;
    const level = getLevel(value);
    const isOOO = !!oooStatuses[member.name];
    const isSOS = !!sosStatuses[member.name];

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
            ) : BUDDIES_ENABLED && buddies[member.name] && member.name === currentUser ? (
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
            </div>
          )}
          {currentUser && currentUser !== member.name && (
            <div className="flex items-center justify-center gap-0.5 mt-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const myRating = ratings[member.name]?.[currentUser] ?? 0;
                return (
                  <button
                    key={star}
                    onClick={() => rateUser(member.name, star)}
                    className="text-xl leading-none cursor-pointer hover:scale-125 transition-transform active:scale-95"
                    title={`Rate ${member.name} ${star} star${star !== 1 ? "s" : ""}`}
                  >
                    {star <= myRating ? "⭐" : "☆"}
                  </button>
                );
              })}
            </div>
          )}
          {currentUser && currentUser !== member.name && (
            <button
              onClick={() => sendPoke(member.name)}
              disabled={pokes.some((p) => p.from === currentUser && p.to === member.name)}
              className={`w-full mt-1 py-1.5 rounded-xl border-[2px] border-black text-xs font-bold transition-all cursor-pointer
                ${pokes.some((p) => p.from === currentUser && p.to === member.name)
                  ? "bg-[#FFE234] opacity-60 cursor-default"
                  : "bg-white hover:bg-[#FFE234] active:scale-95 shadow-[2px_2px_0_#000]"
                }`}
            >
              {pokes.some((p) => p.from === currentUser && p.to === member.name) ? "👉 poked!" : "👉 poke"}
            </button>
          )}
        </div>
      </div>
    );
  };

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
      {!broadcast && (messages.length > 0 || banner?.type === "feature") && (
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
              {banner?.type === "feature" && (
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
                {banner?.type === "feature" && (
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

      <div className="min-h-screen px-4 sm:px-8 py-6 sm:py-8">
        <div className="max-w-[1280px] mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mb-6 sm:mb-8">
            <div className="flex flex-col gap-1">
              <span className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white" style={{ fontFamily: "var(--font-display)" }}>
                Vibe Check <span className="whitespace-nowrap">👁️👄👁️</span>
              </span>
            </div>
            {/* Home button — only shown when user is selected */}
            {loaded && currentUser && (
              <button
                onClick={handleGoHome}
                disabled={goHomeRequested}
                title={goHomeRequested ? "Request sent!" : "I want to go home"}
                className={`transition-all cursor-pointer ${goHomeRequested ? "scale-95" : "hover:scale-110 hover:rotate-6"}`}
              >
                <Image src="/home.png" alt="I want to go home" width={120} height={120} className="rounded-full" />
              </button>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <span className="text-lg sm:text-2xl font-extrabold text-white" style={{ fontFamily: "var(--font-display)" }}>{today}</span>
              <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-[3px] border-black bg-white text-[11px] font-bold text-black tracking-widest uppercase shadow-[3px_3px_0_#000]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3CB55A] animate-pulse inline-block" />
                v{process.env.NEXT_PUBLIC_APP_VERSION}
              </div>
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
              {currentUser && !VP.includes(currentUser) && (
                <button
                  onClick={handleTimeOffRequest}
                  disabled={timeOffSent || timeOffRequests.some((r) => r.name === currentUser)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-[3px] border-black bg-[#b5f0c8] text-[11px] font-bold text-black hover:bg-[#FFE234] transition-colors cursor-pointer uppercase tracking-widest shadow-[3px_3px_0_#000] disabled:opacity-60 disabled:cursor-default"
                >
                  🏖️ {(timeOffSent || timeOffRequests.some((r) => r.name === currentUser)) ? "Request sent!" : "hey Derek, approve my time off"}
                </button>
              )}
              </div>
            </div>
          </div>

          {/* Go Home Requests + iPhone */}
          {goHomeRequests.length > 0 && (() => {
            const sorted = [...goHomeRequests].sort((a, b) => b.count - a.count || a.ts - b.ts);
            const topScore = sorted[0].count;
            return (
              <div className="animate-pop-in mb-6 flex gap-6 items-start">
                <div className="flex-1 rounded-[1.4rem] border-[4px] border-black shadow-[6px_6px_0_#000] bg-[#FFE234] overflow-hidden">
                  <div className="px-5 pt-4 pb-3 border-b-[3px] border-black flex items-center gap-3">
                    <Image src="/home.png" alt="home" width={56} height={56} className="w-14 h-14 rounded-full" />
                    <h2 className="text-2xl font-extrabold text-black tracking-tight flex-1">Wants to go home</h2>
                    <span className="text-sm font-extrabold bg-black text-white px-3 py-1.5 rounded-full">{goHomeRequests.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 px-5 py-4">
                    {sorted.map((r, i) => {
                      const isTop = i === 0 && topScore > 1;
                      return (
                        <div key={r.name} className={`flex items-center gap-2.5 rounded-2xl px-4 py-2.5 border-[3px] shadow-[3px_3px_0_#000] ${isTop ? "bg-black border-black" : "bg-white border-black"}`}>
                          {isTop && <span className="text-base">🏆</span>}
                          <Image
                            src={photoOverrides[r.name] ?? (MEMBERS.find(m => m.name === r.name)?.photo ?? "")}
                            alt={r.name} width={36} height={36}
                            className="rounded-full object-cover w-9 h-9 border-2 border-black flex-shrink-0"
                          />
                          <span className={`font-extrabold text-base ${isTop ? "text-[#FFE234]" : "text-black"}`}>{r.name}</span>
                          <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${isTop ? "bg-[#FFE234] text-black" : "bg-black text-[#FFE234]"}`}>x{r.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* iPhone */}
                <div className="relative shrink-0 hidden sm:block" style={{ width: 180 }}>
                  <div className="relative bg-black rounded-[2.4rem] border-[4px] border-black shadow-[8px_8px_0_#000]" style={{ padding: "12px 8px" }}>
                    <div className="absolute top-[15px] left-1/2 -translate-x-1/2 bg-black rounded-full z-10" style={{ width: 60, height: 18 }} />
                    <div className="overflow-hidden rounded-[1.8rem] bg-black" style={{ aspectRatio: "9/19.5", position: "relative" }}>
                      <iframe
                        src="https://www.youtube.com/embed/Q5KtBKk4hC0?autoplay=1&mute=1&loop=1&playlist=Q5KtBKk4hC0&controls=0&modestbranding=1&rel=0&vq=hd720"
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                        style={{ border: "none", display: "block", position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "100%", height: "100%" }}
                      />
                    </div>
                  </div>
                  <div className="absolute bg-black" style={{ left: -6, top: 65, width: 4, height: 26, borderRadius: "2px 0 0 2px" }} />
                  <div className="absolute bg-black" style={{ left: -6, top: 100, width: 4, height: 42, borderRadius: "2px 0 0 2px" }} />
                  <div className="absolute bg-black" style={{ left: -6, top: 152, width: 4, height: 42, borderRadius: "2px 0 0 2px" }} />
                  <div className="absolute bg-black" style={{ right: -6, top: 108, width: 4, height: 58, borderRadius: "0 2px 2px 0" }} />
                </div>
              </div>
            );
          })()}

          {/* Time Off Requests — visible to Derek */}
          {VP.includes(currentUser ?? "") && timeOffRequests.length > 0 && (
            <div className="animate-pop-in mb-6 rounded-[1.4rem] border-[4px] border-black shadow-[6px_6px_0_#000] bg-[#b5f0c8] overflow-hidden">
              <div className="px-5 pt-4 pb-3 border-b-[3px] border-black flex items-center gap-3">
                <span className="text-4xl">🏖️</span>
                <h2 className="text-2xl font-extrabold text-black tracking-tight flex-1">Time Off Requests</h2>
                <span className="text-sm font-extrabold bg-black text-white px-3 py-1.5 rounded-full">{timeOffRequests.length}</span>
              </div>
              <div className="flex flex-wrap gap-3 px-5 py-4">
                {timeOffRequests.map((r) => (
                  <div key={r.name} className="flex items-center gap-2.5 bg-white border-[3px] border-black rounded-2xl px-4 py-2.5 shadow-[3px_3px_0_#000]">
                    <Image
                      src={photoOverrides[r.name] ?? (MEMBERS.find(m => m.name === r.name)?.photo ?? "")}
                      alt={r.name} width={36} height={36}
                      className="rounded-full object-cover w-9 h-9 border-2 border-black flex-shrink-0"
                    />
                    <span className="font-extrabold text-base">{r.name}</span>
                    <span className="text-xs text-[#8a857d] font-semibold">{timeAgo(r.ts)}</span>
                    <button
                      onClick={() => approveTimeOff(r.name)}
                      className="ml-1 px-2.5 py-1 rounded-xl bg-black text-white text-[11px] font-extrabold cursor-pointer hover:bg-[#333] transition-colors"
                    >approved ✓</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message input strip */}
          {loaded && currentUser && (
            <div className="mb-7">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const suggestions = getSuggestions(currentUser);
                    setNewMessage(suggestions[suggestionIdx % suggestions.length]);
                    setSuggestionIdx((i) => i + 1);
                  }}
                  className="px-3 py-2.5 rounded-xl border-[3px] border-black bg-white hover:bg-[#FFE234] transition-colors cursor-pointer shrink-0 shadow-[3px_3px_0_#000] text-2xl leading-none"
                  title="Get a suggestion"
                >
                  🍵
                </button>
                <input
                  type="text"
                  placeholder="drop the tea…"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") postMessage(); }}
                  maxLength={120}
                  className="flex-1 text-base font-bold text-black bg-white border-[3px] border-black rounded-xl px-4 py-2.5 focus:outline-none shadow-[3px_3px_0_#000] placeholder:text-[#b5b0a8] placeholder:font-normal"
                />
                <button
                  onClick={postMessage}
                  disabled={!newMessage.trim()}
                  className="px-4 py-2.5 rounded-xl bg-[#FFE234] border-[3px] border-black text-black text-sm font-bold shadow-[3px_3px_0_#000] disabled:opacity-30 disabled:cursor-default hover:bg-[#FF9DC8] transition-all cursor-pointer shrink-0 active:translate-y-[2px] active:shadow-none"
                >
                  drop it ✦
                </button>
              </div>
            </div>
          )}

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

              {/* Team Chat */}
              {currentUser && (
                <div className="mt-8 border-[3px] border-black rounded-[1.4rem] bg-white shadow-[5px_5px_0_#000] overflow-hidden">
                  {/* Chat header */}
                  <div className="flex items-center gap-2 px-5 py-3 bg-[#3D52F0] border-b-[3px] border-black">
                    <span className="text-lg font-extrabold text-white" style={{ fontFamily: "var(--font-display)" }}>team chat 💬</span>
                    <span className="ml-auto text-xs font-bold text-white/70">{chatMessages.length} messages</span>
                  </div>

                  {/* Messages */}
                  <div className="h-[400px] overflow-y-auto p-5 flex flex-col gap-3 bg-[#f7f7f5]">
                    {chatMessages.length === 0 && (
                      <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
                        <div className="text-4xl mb-2">💬</div>
                        <p className="text-sm font-bold text-[#888]">no messages yet. break the ice.</p>
                      </div>
                    )}
                    {chatMessages.map((msg, i) => {
                      const isMe = msg.name === currentUser;
                      const member = MEMBERS.find((m) => m.name === msg.name);
                      const photo = photoOverrides[msg.name] ?? member?.photo ?? "";
                      const showName = i === 0 || chatMessages[i - 1]?.name !== msg.name;
                      const msgReactions = reactions[String(msg.ts)] ?? {};
                      const hasReactions = Object.keys(msgReactions).length > 0;
                      const isHovered = hoveredMsg === msg.ts;
                      return (
                        <div key={i}
                          className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                          onMouseEnter={() => setHoveredMsg(msg.ts)}
                          onMouseLeave={() => setHoveredMsg(null)}
                        >
                          <div className="w-8 h-8 shrink-0">
                            {photo && (
                              <Image src={photo} alt={msg.name} width={32} height={32}
                                className="rounded-full object-cover w-8 h-8 border-2 border-black" />
                            )}
                          </div>
                          <div className={`flex flex-col gap-0.5 max-w-[70%] ${isMe ? "items-end" : "items-start"}`}>
                            {showName && (
                              <span className="text-[10px] font-black uppercase tracking-wider text-[#888] px-1">{msg.name}</span>
                            )}
                            <div className="relative">
                              <div className={`px-3 py-2 rounded-2xl border-[2px] border-black text-sm font-medium leading-snug ${
                                isMe
                                  ? "bg-[#FFE234] rounded-br-sm shadow-[2px_2px_0_#000]"
                                  : "bg-white rounded-bl-sm shadow-[2px_2px_0_#000]"
                              }`}>
                                {msg.message}
                              </div>
                              {/* Emoji picker on hover */}
                              {isHovered && currentUser && (
                                <div className={`absolute top-[-32px] ${isMe ? "right-0" : "left-0"} flex gap-1 bg-white border-[2px] border-black rounded-xl px-1.5 py-1 shadow-[2px_2px_0_#000] z-10`}>
                                  {REACTION_EMOJIS.map((e) => (
                                    <button key={e} onClick={() => toggleReaction(msg.ts, e)}
                                      className={`text-base leading-none hover:scale-125 transition-transform cursor-pointer rounded px-0.5 ${(msgReactions[e] ?? []).includes(currentUser) ? "bg-[#FFE234]" : ""}`}
                                    >{e}</button>
                                  ))}
                                </div>
                              )}
                            </div>
                            {/* Reaction pills */}
                            {hasReactions && (
                              <div className={`flex flex-wrap gap-1 px-1 ${isMe ? "justify-end" : "justify-start"}`}>
                                {Object.entries(msgReactions).map(([emoji, names]) => (
                                  <button key={emoji} onClick={() => toggleReaction(msg.ts, emoji)}
                                    className={`flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full border-[2px] border-black cursor-pointer transition-colors ${
                                      names.includes(currentUser ?? "") ? "bg-[#FFE234]" : "bg-white hover:bg-[#f5f2ee]"
                                    }`}
                                    title={names.join(", ")}
                                  >
                                    <span>{emoji}</span>
                                    {names.length > 1 && <span className="font-bold text-[10px]">{names.length}</span>}
                                  </button>
                                ))}
                              </div>
                            )}
                            <span className="text-[9px] text-[#aaa] px-1">{timeAgo(msg.ts)}</span>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Input */}
                  <div className="px-4 py-3 border-t-[3px] border-black bg-white">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") sendChat(); }}
                        placeholder="say something…"
                        maxLength={300}
                        className="flex-1 bg-[#f7f7f5] border-[2px] border-black rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none placeholder:text-[#bbb] shadow-[2px_2px_0_#000]"
                      />
                      <button
                        onClick={sendChat}
                        disabled={!chatInput.trim()}
                        className="px-5 py-2.5 rounded-xl bg-[#3D52F0] border-[2px] border-black text-white text-sm font-bold shadow-[2px_2px_0_#000] disabled:opacity-30 hover:bg-[#2a3fd0] active:translate-y-[1px] active:shadow-none transition-all"
                      >
                        send
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

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
                    onChange={(e) => setFeatureRequestText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitFeatureRequest(); }}
                    placeholder="what should we build..."
                    rows={4}
                    className="w-full border-[3px] border-black focus:border-black rounded-2xl px-4 py-3 text-sm font-medium outline-none resize-none bg-white transition-colors mb-4"
                  />
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
