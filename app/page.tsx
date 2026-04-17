"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { rollBuddy, type Buddy } from "@/lib/buddies";
import { MEMBERS, BOSS, CO_ADMIN, BUDDIES_ENABLED, VP, SUGGESTIONS, WRITERS, getStaleness, timeAgo } from "@/app/lib/constants";

// Components
import MyCard from "@/app/components/MyCard";
import TeamCard from "@/app/components/TeamCard";
import BossCard from "@/app/components/BossCard";
import VibeMusic from "@/app/components/VibeMusic";
import FeatureUpdates from "@/app/components/FeatureUpdates";
import GoHomeRequests from "@/app/components/GoHomeRequests";
import HireVoteWidget from "@/app/components/HireVoteWidget";
import TextSubmitModal from "@/app/components/modals/TextSubmitModal";
import GhostModal from "@/app/components/modals/GhostModal";
import HatchModal from "@/app/components/modals/HatchModal";
import MeetingPickerModal from "@/app/components/modals/MeetingPickerModal";
import TakeoverModal from "@/app/components/modals/TakeoverModal";
import Fireworks from "@/app/components/Fireworks";
import DisputeModal from "@/app/components/modals/DisputeModal";
import IdentityPicker from "@/app/components/modals/IdentityPicker";
import BrainRotOverlay from "@/app/components/modals/BrainRotOverlay";
import ProfessionalView from "@/app/components/ProfessionalView";

function TickerItem({ msg }: { msg: { name: string; message: string } }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "0 12px", flexShrink: 0, whiteSpace: "nowrap" }}>
      <span style={{ fontSize: "18px", fontWeight: 800, color: "#000", fontFamily: "var(--font-display)" }}>{msg.name}</span>
      <span style={{ fontSize: "18px", fontWeight: 500, color: "#000" }}>&ldquo;{msg.message}&rdquo;</span>
    </div>
  );
}

export default function Home() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const currentUserRef = useRef<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showFeatureRequest, setShowFeatureRequest] = useState(false);
  const [showBugReport, setShowBugReport] = useState(false);
  const [showTattle, setShowTattle] = useState(false);
  const [moods, setMoods] = useState<Record<string, string>>({});
  const [bans, setBans] = useState<Record<string, string>>({});
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [vibeVideoId, setVibeVideoId] = useState("vTfD20dbxho");
  const [brainRotVideoId, setBrainRotVideoId] = useState("xxfeav5MlmI");
  const [broadcast, setBroadcast] = useState<{ message: string; type: "urgent" | "broadcast" } | null>(null);
  const [banner, setBanner] = useState<{ message: string; type: string } | null>(null);
  const [messages, setMessages] = useState<{ name: string; message: string; ts: number }[]>([]);
  const [shippedFeatures, setShippedFeatures] = useState<{ name: string; message: string; ts: number; shippedAt: number; status?: "shipped" | "done" | "dumb" | "soon" }[]>([]);
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
  const [dontTalkStatuses, setDontTalkStatuses] = useState<Record<string, boolean>>({});
  const [medsStatuses, setMedsStatuses] = useState<Record<string, boolean>>({});
  const [hotColdStatuses, setHotColdStatuses] = useState<Record<string, "hot" | "cold">>({});
  const [bodyDoubles, setBodyDoubles] = useState<string[]>([]);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [bossReactions, setBossReactions] = useState<Record<string, "heart" | "thumbsdown">>({});
  const [showGhostModal, setShowGhostModal] = useState(false);
  const [ghostNote, setGhostNote] = useState("");
  const [ghostBackDate, setGhostBackDate] = useState("");
  const [updatedAt, setUpdatedAt] = useState<Record<string, number>>({});
  const [sortedMembers, setSortedMembers] = useState(MEMBERS);
  const [loaded, setLoaded] = useState(false);
  const pageLoadTime = useRef(Date.now());
  const isDragging = useRef(false);
  const isAdhdDragging = useRef(false);
  const [localSlider, setLocalSlider] = useState<number | null>(null);
  const [localAdhd, setLocalAdhd] = useState<number | null>(null);
  const [photoOverrides, setPhotoOverrides] = useState<Record<string, string>>({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const adhdDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const sortTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [goHomeRequested, setGoHomeRequested] = useState(false);
  const goHomeLock = useRef(false);
  const [goHomeRequests, setGoHomeRequests] = useState<{ name: string; ts: number; count: number }[]>([]);
  const [hireVoteData, setHireVoteData] = useState<{ votes: Record<string, { writer: boolean; designer: boolean }>; writerYes: number; designerYes: number; total: number; date: string } | null>(null);
  const [timeOffRequests, setTimeOffRequests] = useState<{ name: string; ts: number }[]>([]);
  const [timeOffSent, setTimeOffSent] = useState(false);
  const [moneyRequests, setMoneyRequests] = useState<{ name: string; ts: number }[]>([]);
  const [moneyRequestSent, setMoneyRequestSent] = useState(false);
  const [pokes, setPokes] = useState<{ from: string; to: string; ts: number }[]>([]);
  const [touchGrass, setTouchGrass] = useState<{ from: string; to: string; ts: number }[]>([]);
  const [takeover, setTakeover] = useState<string | null>(null);
  const [showTakeoverCompose, setShowTakeoverCompose] = useState(false);
  const [takeoverDraft, setTakeoverDraft] = useState("");
  const [bratMode, setBratMode] = useState(false);
  const [brainRot, setBrainRot] = useState(false);
  const [confettiOff, setConfettiOff] = useState(false);
  const [viewAsTeam, setViewAsTeam] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState<{ id: string; emoji: string; name: string }[]>([]);
  const reactionTimers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const [meetings, setMeetings] = useState<Record<string, number>>({});
  const [lastSeen, setLastSeen] = useState<Record<string, number>>({});
  const [showMeetingPicker, setShowMeetingPicker] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [sessionTimes, setSessionTimes] = useState<Record<string, number>>({});
  const [adhdLevels, setAdhdLevels] = useState<Record<string, number>>({});
  const sessionAccRef = useRef(0);
  const lastVisibleRef = useRef<number | null>(null);
  const [pokedBy, setPokedBy] = useState<string[]>([]);
  const [ratings, setRatings] = useState<Record<string, Record<string, number>>>({});
  const [appVibes, setAppVibes] = useState<Record<string, "up" | "down">>({});
  const [yesterdaySnapshot, setYesterdaySnapshot] = useState<Record<string, number>>({});
  const [buddies, setBuddies] = useState<Record<string, { id: string; hatchedAt: number }>>({});
  const [showHatchModal, setShowHatchModal] = useState(false);
  const [hatchedBuddy, setHatchedBuddy] = useState<Buddy | null>(null);
  const [hatchPhase, setHatchPhase] = useState<"egg" | "cracking" | "reveal">("egg");
  const [newMessage, setNewMessage] = useState<Record<string, string>>({});
  const [weatherEmoji, setWeatherEmoji] = useState<string | null>(null);
  const [uiMode, setUiMode] = useState<"classic" | "pro">("classic");
  const [uiModeLoaded, setUiModeLoaded] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem("team-busy-ui-mode");
    if (savedMode === "pro" || savedMode === "classic") setUiMode(savedMode);
    setUiModeLoaded(true);
  }, []);

  const switchToClassic = useCallback(() => {
    localStorage.setItem("team-busy-ui-mode", "classic");
    setUiMode("classic");
  }, []);

  const switchToPro = useCallback(() => {
    localStorage.setItem("team-busy-ui-mode", "pro");
    setUiMode("pro");
  }, []);

  useEffect(() => {
    setConfettiOff(localStorage.getItem("team-busy-confetti-off") === "true");
    setViewAsTeam(localStorage.getItem("team-busy-view-as-team") === "true");
    const saved = localStorage.getItem("team-busy-user");
    if (saved) {
      setCurrentUser(saved);
      currentUserRef.current = saved;
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
      if (!isDragging.current) setStatuses(poll.status ?? {});
      setUpdatedAt(poll.updated ?? {});
      const notes = poll.notes ?? {};
      setStatusNotes(notes);
      setEditingNote((prev) => prev !== "" ? prev : (currentUserRef.current && notes[currentUserRef.current]) ? notes[currentUserRef.current] : prev);
      setOooStatuses(poll.ooo ?? {});
      setOooDetails(poll.oooDetails ?? {});
      setSosStatuses(poll.sos ?? {});
      setMessages(poll.messages ?? []);
      setShippedFeatures(poll.shippedFeatures ?? []);
      setMoods(poll.moods ?? {});
      setBans(poll.bans ?? {});
      if (poll.videos?.vibeVideoId) setVibeVideoId(poll.videos.vibeVideoId);
      if (poll.videos?.brainRotVideoId) setBrainRotVideoId(poll.videos.brainRotVideoId);
      setBroadcast(poll.urgent?.message ? { message: poll.urgent.message, type: poll.urgent.type ?? "broadcast" } : null);
      setGoHomeRequests(poll.goHome ?? []);
      setTimeOffRequests(poll.timeOff ?? []);
      setMoneyRequests(poll.moneyRequests ?? []);
      setMetcalfStatuses(poll.metcalf ?? {});
      setBossReactions(poll.bossReactions ?? {});
      setNeedWorkStatuses(poll.needWork ?? {});
      setDontTalkStatuses(poll.dontTalk ?? {});
      setMedsStatuses(poll.meds ?? {});
      setHotColdStatuses(poll.hotCold ?? {});
      setBodyDoubles(poll.bodyDouble ?? []);
      setSessionTimes(poll.sessionTime ?? {});
      if (!isAdhdDragging.current) setAdhdLevels(poll.adhd ?? {});
      setPokes(poll.pokes ?? []);
      setTouchGrass(poll.touchGrass ?? []);
      setTakeover(poll.takeover ?? null);
      setMeetings(poll.meetings ?? {});
      setLastSeen(poll.lastSeen ?? {});
      if (poll.banner?.message) setBanner({ message: poll.banner.message, type: poll.banner.type ?? "daily" });
      if (poll.hireVote) setHireVoteData(poll.hireVote);
    } catch {
      // retry next poll
    } finally {
      setLoaded(true);
    }
  }, []);

  const fetchSlowData = useCallback(async () => {
    try {
      const [photosData, buddiesData, ratingsData, appVibesData, historyData] = await Promise.all([
        fetch("/api/photos").then((r) => r.json()),
        fetch("/api/buddies").then((r) => r.json()),
        fetch("/api/ratings").then((r) => r.json()),
        fetch("/api/app-vibe").then((r) => r.json()),
        fetch("/api/history?days=2").then((r) => r.json()),
      ]);
      setPhotoOverrides(photosData.photos ?? {});
      setBuddies(buddiesData.buddies ?? {});
      setRatings(ratingsData.ratings ?? {});
      setAppVibes(appVibesData.vibes ?? {});
      // Yesterday = second-to-last entry (index 0 is oldest, last is today)
      const entries: { date: string; snapshot: Record<string, number> }[] = historyData ?? [];
      const yesterday = entries.find(e => {
        const d = new Date(e.date + "T12:00:00");
        const y = new Date(); y.setDate(y.getDate() - 1);
        return d.toDateString() === y.toDateString();
      });
      if (yesterday && Object.keys(yesterday.snapshot).length > 0) {
        setYesterdaySnapshot(yesterday.snapshot);
      }
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchSlowData();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") fetchData();
    }, 30000);
    const onVisible = () => { if (document.visibilityState === "visible") fetchData(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [fetchData, fetchSlowData]);

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

  useEffect(() => {
    if (!BUDDIES_ENABLED) return;
    if (loaded && currentUser && currentUser !== "__guest__" && Object.keys(buddies).length > 0 && !buddies[currentUser] && !showHatchModal) {
      setHatchPhase("egg");
      setHatchedBuddy(null);
      setShowHatchModal(true);
    }
  }, [loaded, currentUser, buddies, showHatchModal]);

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

  useEffect(() => {
    if (!messages.length && !banner) return;
    let attempts = 0;
    let t: ReturnType<typeof setTimeout>;
    const calculate = () => {
      if (!tickerTextRef.current) return;
      const tw = tickerTextRef.current.offsetWidth;
      if (!tw && attempts < 5) {
        attempts++;
        t = setTimeout(calculate, 100 * attempts);
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
          code === 0 ? "🌞" :
          code <= 2 ? "⛅" :
          code === 3 ? "☁" :
          code <= 48 ? "☁" :
          code <= 55 ? "🌧" :
          code <= 65 ? "🌧" :
          code <= 77 ? "⛄" :
          code <= 82 ? "🌧" :
          code <= 99 ? "⛈" : "🌡";
        setWeatherEmoji(emoji);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timers = reactionTimers.current;
    return () => { timers.forEach(clearTimeout); };
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
      else updated[currentUser] = next as "heart" | "thumbsdown";
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
    await fetch("/api/status/toggle/need-work", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, active: newVal }),
    });
  };

  const toggleMetcalf = async (name: string) => {
    const newVal = !metcalfStatuses[name];
    setMetcalfStatuses((prev) => ({ ...prev, [name]: newVal }));
    await fetch("/api/status/toggle/metcalf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, active: newVal }),
    });
  };

  const toggleDontTalk = async (name: string) => {
    const newVal = !dontTalkStatuses[name];
    setDontTalkStatuses((prev) => ({ ...prev, [name]: newVal }));
    await fetch("/api/status/toggle/dont-talk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, active: newVal }),
    });
  };

  const toggleBodyDouble = async (name: string) => {
    const newVal = !bodyDoubles.includes(name);
    setBodyDoubles((prev) => newVal ? [...prev, name] : prev.filter((n) => n !== name));
    await fetch("/api/status/toggle/body-double", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, active: newVal }),
    });
  };

  const toggleMeds = async (name: string) => {
    const newVal = !medsStatuses[name];
    setMedsStatuses((prev) => ({ ...prev, [name]: newVal }));
    await fetch("/api/status/toggle/meds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, active: newVal }),
    });
  };

  const toggleHotCold = async (name: string, temp: "hot" | "cold" | null) => {
    setHotColdStatuses((prev) => {
      const next = { ...prev };
      if (temp === null) delete next[name]; else next[name] = temp;
      return next;
    });
    await fetch("/api/status/temp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, temp }),
    });
  };

  const toggleSOS = async (name: string) => {
    const newVal = !sosStatuses[name];
    setSosStatuses((prev) => ({ ...prev, [name]: newVal }));
    await fetch("/api/status/toggle/sos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, sos: newVal }),
    });
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
    await fetch("/api/nudge/poke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from: currentUser, to }),
    });
  };

  const sendTouchGrass = async (to: string) => {
    if (!currentUser || currentUser === to) return;
    setTouchGrass((prev) => [...prev.filter((p) => !(p.from === currentUser && p.to === to)), { from: currentUser, to, ts: Date.now() }]);
    await fetch("/api/nudge/touch-grass", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from: currentUser, to }),
    });
  };

  const dismissTouchGrass = async (from: string) => {
    if (!currentUser) return;
    setTouchGrass((prev) => prev.filter((p) => !(p.to === currentUser && p.from === from)));
    await fetch("/api/nudge/touch-grass", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: currentUser }),
    });
  };

  const dismissPoke = async (from: string) => {
    if (!currentUser) return;
    setPokes((prev) => prev.filter((p) => !(p.to === currentUser && p.from === from)));
    await fetch("/api/nudge/poke", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: currentUser }),
    });
  };

  const handleGoHome = async () => {
    if (!currentUser || goHomeLock.current) return;
    goHomeLock.current = true;
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
  };

  const formatCountdown = (endTs: number): string => {
    const secs = Math.max(0, Math.floor((endTs - Date.now()) / 1000));
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const sendReaction = (name: string, emoji: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setFloatingReactions((prev) => [...prev, { id, emoji, name }]);
    const timer = setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
      reactionTimers.current.delete(timer);
    }, 1200);
    reactionTimers.current.add(timer);
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
    await fetch("/api/request/time-off", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: currentUser }),
    });
  };

  const handleMoneyRequest = async () => {
    if (!currentUser || moneyRequestSent) return;
    setMoneyRequestSent(true);
    setMoneyRequests((prev) => prev.some((r) => r.name === currentUser) ? prev : [...prev, { name: currentUser, ts: Date.now() }]);
    await fetch("/api/request/money", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: currentUser }),
    });
  };

  const pickUser = (name: string) => {
    localStorage.setItem("team-busy-user", name);
    setCurrentUser(name);
    currentUserRef.current = name;
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

  const setMyMood = async (mood: string) => {
    if (!currentUser) return;
    setMoods((prev) => ({ ...prev, [currentUser]: mood }));
    await fetch("/api/mood", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: currentUser, mood }),
    });
  };

  const submitTattle = async (text: string) => {
    await fetch("/api/tattle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });
    setTimeout(() => setShowTattle(false), 2000);
  };

  const submitBugReport = async (text: string) => {
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: currentUser, message: `[Bug Report] ${text}` }),
    });
    setTimeout(() => setShowBugReport(false), 2000);
  };

  const submitFeatureRequest = async (text: string) => {
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: currentUser, message: `[Feature Request] ${text}` }),
    });
    setTimeout(() => setShowFeatureRequest(false), 2000);
  };

  const submitFeedback = async (text: string) => {
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: currentUser, message: text }),
    });
    setTimeout(() => setShowFeedback(false), 2000);
  };

  // ── Computed values ──────────────────────────────────────────────────────────

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const isGuest = currentUser === "__guest__";
  const nowDate = new Date(now);
  const currentHour = nowDate.getHours();

  const DAY_MESSAGES = [
    { main: "wait why are you here 💀", sub: "it's sunday bestie. log off.", tag: "go touch grass" },
    { main: "monday survived 😮‍💨", sub: "that was not it but we did it anyway.", tag: "send thoughts & prayers" },
    { main: "tuesday ate 💅", sub: "lowkey the underrated day. we cooked.", tag: "no crumbs left" },
    { main: "hump day cleared 🐪", sub: "we are so halfway there it's unreal.", tag: "understood the assignment" },
    { main: "thursday said slay 🫡", sub: "one more day. do not fumble.", tag: "almost cooked" },
    { main: "FRIDAY WE ATE 🔥", sub: "clock's out. we are so done here bestie.", tag: "left no crumbs" },
    { main: "it's saturday?? 💀", sub: "log off immediately. this is concerning.", tag: "chronically online" },
  ];
  const todayMsg = DAY_MESSAGES[nowDate.getDay()];
  const MORNING_MESSAGES = [
    { main: "good morning bestie ☀️", sub: "it's sunday, go back to sleep.", tag: "rest mode" },
    { main: "rise and grind? 😮‍💨", sub: "monday got us in a chokehold. stay strong.", tag: "caffeinate immediately" },
    { main: "tuesday check ☕️", sub: "we're locked in today fr. let's cook.", tag: "locked tf in" },
    { main: "wake up wednesday 🐪", sub: "halfway there. the light is visible.", tag: "hump day energy" },
    { main: "thursday slay incoming 💅", sub: "tomorrow is friday. hold the line.", tag: "so close" },
    { main: "FRIDAY FINALLY 🔥", sub: "we made it. just a few hours to freedom.", tag: "energy unmatched" },
    { main: "saturday?? at work?? 😭", sub: "hope you're getting paid double bestie.", tag: "not the vibe" },
  ];
  const AFTERNOON_MESSAGES = [
    { main: "sunday afternoon 😴", sub: "you really said no rest for the wicked huh.", tag: "concerning behavior" },
    { main: "monday afternoon grind 💀", sub: "we are in the thick of it. stay hydrated.", tag: "no thoughts head empty" },
    { main: "tuesday afternoon check 🫠", sub: "past the hump, not quite there. we push.", tag: "it's giving effort" },
    { main: "wednesday afternoon 🐪", sub: "halfway done. the finish line is visible.", tag: "locked in fr" },
    { main: "thursday afternoon 👀", sub: "one more day after this. do not fumble.", tag: "eyes on the prize" },
    { main: "friday afternoon 🔥", sub: "almost free. we are so close to the bag.", tag: "final stretch bestie" },
    { main: "saturday afternoon 💀", sub: "ok but why. log off immediately.", tag: "chronically online" },
  ];
  const afternoonMsg = AFTERNOON_MESSAGES[nowDate.getDay()];
  const morningMsg = MORNING_MESSAGES[nowDate.getDay()];
  const currentMin = nowDate.getMinutes();
  const currentSec = nowDate.getSeconds();
  const isMorning = currentHour < 12;
  const isAfternoon = currentHour >= 12 && currentHour < 17;
  const isCountdown = currentHour === 16 && currentMin >= 45;
  const secsUntil5 = isCountdown ? (17 * 3600) - (currentHour * 3600 + currentMin * 60 + currentSec) : 0;
  const countdownMins = Math.floor(secsUntil5 / 60);
  const countdownSecs = secsUntil5 % 60;

  // Lunch & clock-out countdowns
  const totalSecs = currentHour * 3600 + currentMin * 60 + currentSec;
  const lunchSecs = 12 * 3600; // noon
  const clockOutSecs = 17 * 3600; // 5pm
  const secsToLunch = lunchSecs - totalSecs;
  const secsToClockOut = clockOutSecs - totalSecs;

  const formatCountdownCompact = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const LUNCH_LABELS = ["food coma in", "sustenance in", "eating szn in", "lunch arc in"];
  const CLOCKOUT_LABELS = ["freedom in", "escape in", "logging off in", "peace out in"];
  const lunchLabel = LUNCH_LABELS[nowDate.getDay() % LUNCH_LABELS.length];
  const clockOutLabel = CLOCKOUT_LABELS[nowDate.getDay() % CLOCKOUT_LABELS.length];
  const myMember = MEMBERS.find((m) => m.name === currentUser);
  const bossMember = MEMBERS.find((m) => m.name === BOSS);
  const teamMembers = sortedMembers.filter((m) => (viewAsTeam || m.name !== currentUser) && m.name !== BOSS);
  const topOnlineUser = (() => {
    const entries = Object.entries(sessionTimes).filter(([name]) => name !== BOSS);
    if (!entries.length) return null;
    const sorted = entries.sort((a, b) => b[1] - a[1]);
    if (sorted[0][1] <= 0) return null;
    return sorted[0][0];
  })();

  const tickerSpeed = 120;
  const tickerDuration = tickerTextWidth ? tickerTextWidth / tickerSpeed : 0;
  const urgentDuration = urgentTickerWidth ? urgentTickerWidth / tickerSpeed : 0;
  const broadcastIsUrgent = broadcast?.type === "urgent";
  const broadcastBg = broadcastIsUrgent ? "#e74c3c" : "#FF9DC8";
  const broadcastBorder = broadcastIsUrgent ? "#FFE234" : "#000";
  const broadcastTextColor = broadcastIsUrgent ? "#fff" : "#000";
  const broadcastTextStroke = broadcastIsUrgent ? "0.5px #fff" : "none";
  const broadcastText = broadcast ? broadcast.message.toUpperCase() : "";

  if (uiModeLoaded && uiMode === "pro") {
    return <ProfessionalView onSwitchMode={switchToClassic} />;
  }

  return (
    <>
      {/* Broadcast ticker (pink or red scrolling) */}
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
      {/* Normal ticker (yellow) */}
      {!broadcast && (messages.length > 0 || banner !== null) && (
        <div style={{ width: "100%", overflow: "hidden", background: "#FFE234", borderBottom: "4px solid #000", height: "50px", position: "relative", zIndex: 10 }}>
          <div style={{
            display: "flex", alignItems: "center", height: "100%",
            ...(tickerDuration > 0 ? { animation: `ticker-scroll ${tickerDuration}s linear infinite`, ["--ticker-text-width" as string]: tickerTextWidth } : {}),
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
                <TickerItem key={i} msg={msg} />
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
                  <TickerItem key={i} msg={msg} />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        className="min-h-screen px-4 sm:px-8 py-6 sm:py-8 transition-colors duration-300 relative"
        style={bratMode ? { background: "#8ace00", fontFamily: "Arial, sans-serif" } : undefined}
      >
        <div className="max-w-[1280px] mx-auto">
          {/* Header */}
          <div className="flex flex-row items-start justify-between gap-4 mb-6 sm:mb-8">
            <div className="flex flex-col gap-2">
              <div className="text-xs font-bold uppercase tracking-widest text-[#39FF14]">someone cooked here</div>
              <div className="flex items-center gap-3">
                <span
                  className="text-3xl sm:text-5xl font-extrabold whitespace-nowrap transition-all"
                  style={{
                    fontFamily: bratMode ? "Arial, sans-serif" : "var(--font-display)",
                    color: bratMode ? "#000" : "#fff",
                    filter: bratMode ? "blur(0.6px)" : undefined,
                    textTransform: bratMode ? "lowercase" : undefined,
                  }}
                >{today}</span>
                {weatherEmoji && <span className="text-3xl sm:text-5xl">{weatherEmoji}</span>}
                {/* Lunch & clock-out countdowns */}
                {currentHour >= 7 && secsToLunch > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-[3px] border-black bg-[#FFE234] text-[11px] font-extrabold text-black uppercase tracking-widest shadow-[3px_3px_0_#000] tabular-nums whitespace-nowrap">
                    🍕 {lunchLabel} {formatCountdownCompact(secsToLunch)}
                  </span>
                )}
                {currentHour === 12 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-[3px] border-black bg-[#39FF14] text-[11px] font-extrabold text-black uppercase tracking-widest shadow-[3px_3px_0_#000] animate-pulse whitespace-nowrap">
                    🍕 it&apos;s lunch bestie go eat
                  </span>
                )}
                {currentHour >= 8 && secsToClockOut > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-[3px] border-black bg-[#FF9DC8] text-[11px] font-extrabold text-black uppercase tracking-widest shadow-[3px_3px_0_#000] tabular-nums whitespace-nowrap">
                    🏃 {clockOutLabel} {formatCountdownCompact(secsToClockOut)}
                  </span>
                )}
                {currentHour >= 17 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-[3px] border-black bg-[#39FF14] text-[11px] font-extrabold text-black uppercase tracking-widest shadow-[3px_3px_0_#000] animate-bounce whitespace-nowrap">
                    🎉 go home bestie we are so done
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-[3px] border-black bg-white text-[11px] font-bold text-black tracking-widest uppercase shadow-[3px_3px_0_#000]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3CB55A] animate-pulse inline-block" />
                  v{process.env.NEXT_PUBLIC_APP_VERSION}
                </div>
                {!isGuest && <>
                  <button onClick={() => setShowFeedback(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-[3px] border-black bg-[#FF9DC8] text-[11px] font-bold text-black hover:bg-[#FFE234] transition-colors cursor-pointer uppercase tracking-widest shadow-[3px_3px_0_#000]">💬 Feedback</button>
                  <button onClick={() => setShowFeatureRequest(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-[3px] border-black bg-[#FFE234] text-[11px] font-bold text-black hover:bg-[#FF9DC8] transition-colors cursor-pointer uppercase tracking-widest shadow-[3px_3px_0_#000]">💡 Feature Request</button>
                  <button onClick={() => setShowBugReport(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-[3px] border-black bg-[#FF9DC8] text-[11px] font-bold text-black hover:bg-[#FFE234] transition-colors cursor-pointer uppercase tracking-widest shadow-[3px_3px_0_#000]">🐛 Submit Bug</button>
                  <button onClick={() => setShowTattle(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-[3px] border-black bg-[#ff4d4d] text-[11px] font-bold text-white hover:bg-[#FFE234] hover:text-black transition-colors cursor-pointer uppercase tracking-widest shadow-[3px_3px_0_#000]">🫢 Tattle</button>
                </>}
                {currentUser && !isGuest && !VP.includes(currentUser) && (
                  <button
                    onClick={handleTimeOffRequest}
                    disabled={timeOffSent || timeOffRequests.some((r) => r.name === currentUser)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-[3px] border-black bg-[#b5f0c8] text-[11px] font-bold text-black hover:bg-[#FFE234] transition-colors cursor-pointer uppercase tracking-widest shadow-[3px_3px_0_#000] disabled:opacity-60 disabled:cursor-default"
                  >🏖️ {(timeOffSent || timeOffRequests.some((r) => r.name === currentUser)) ? "Request sent!" : "hey Derek, approve my time off"}</button>
                )}
                <button onClick={() => setBratMode((v) => !v)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-[3px] border-black text-[11px] font-bold tracking-widest uppercase shadow-[3px_3px_0_#000] cursor-pointer transition-colors" style={{ background: bratMode ? "#8ace00" : "#fff", color: "#000", fontFamily: bratMode ? "Arial, sans-serif" : undefined }}>{bratMode ? "brat" : "brat mode"}</button>
                <button onClick={() => setBrainRot(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-[3px] border-black bg-white text-[11px] font-bold text-black tracking-widest uppercase shadow-[3px_3px_0_#000] cursor-pointer hover:bg-[#FF9DC8] transition-colors">🧠 brain rot</button>
                <button
                  onClick={() => { const next = !confettiOff; setConfettiOff(next); localStorage.setItem("team-busy-confetti-off", String(next)); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-[3px] border-black bg-white text-[11px] font-bold text-black tracking-widest uppercase shadow-[3px_3px_0_#000] cursor-pointer hover:bg-[#FFE234] transition-colors"
                >🎉 {confettiOff ? "confetti on" : "confetti off"}</button>
                <button
                  onClick={() => { const next = !viewAsTeam; setViewAsTeam(next); localStorage.setItem("team-busy-view-as-team", String(next)); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-[3px] border-black bg-white text-[11px] font-bold text-black tracking-widest uppercase shadow-[3px_3px_0_#000] cursor-pointer hover:bg-[#39FF14] transition-colors"
                >👁️ {viewAsTeam ? "edit my card" : "view as team"}</button>
                <button
                  onClick={switchToPro}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-[3px] border-black bg-white text-[11px] font-bold text-black tracking-widest uppercase shadow-[3px_3px_0_#000] cursor-pointer hover:bg-[#FFE234] transition-colors"
                >👔 pro mode</button>
                {currentUser === BOSS && (
                  <a href="/admin" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-[3px] border-black bg-black text-[11px] font-bold text-white tracking-widest uppercase shadow-[3px_3px_0_#FFE234] cursor-pointer hover:bg-[#FFE234] hover:text-black transition-colors">⚡ admin</a>
                )}
                {currentUser === CO_ADMIN && (
                  <a href="/mod" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-[3px] border-black bg-[#FF9DC8] text-[11px] font-bold text-black tracking-widest uppercase shadow-[3px_3px_0_#000] cursor-pointer hover:bg-[#FFE234] transition-colors">🫢 mod</a>
                )}
                {topOnlineUser && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-[3px] border-black bg-[#39FF14] text-[11px] font-bold text-black tracking-widest uppercase shadow-[3px_3px_0_#000]">
                    <span className="font-extrabold">{topOnlineUser}</span> is chronically online
                  </div>
                )}
              </div>
            </div>
            {/* Home sticker — right side */}
            {loaded && currentUser && !isGuest && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleGoHome}
                  disabled={goHomeRequested}
                  title={goHomeRequested ? "Request sent!" : "I want to go home"}
                  className={`transition-all cursor-pointer shrink-0 ${goHomeRequested ? "scale-95" : "hover:scale-110 hover:rotate-6"}`}
                >
                  <Image src="/home.png" alt="I want to go home" width={120} height={120} className="rounded-full" />
                </button>
              </div>
            )}
          </div>

          {/* Loading */}
          {!loaded ? (
            <p className="text-center text-white/60 text-lg animate-pulse">loading the vibes...</p>
          ) : (
            <>
              {/* 4:45 Countdown */}
              {isCountdown && (
                <div className="mb-6 rounded-[1.4rem] border-[4px] border-black bg-black shadow-[6px_6px_0_#FFE234] px-6 py-4 flex items-center gap-4">
                  <span className="text-3xl animate-pulse">⏰</span>
                  <div className="flex-1">
                    <p className="text-[#FFE234] font-extrabold text-lg uppercase tracking-widest" style={{ fontFamily: "var(--font-display)" }}>freedom in</p>
                  </div>
                  <span className="text-5xl font-extrabold text-[#FFE234] tabular-nums" style={{ fontFamily: "var(--font-display)" }}>{countdownMins}:{String(countdownSecs).padStart(2, "0")}</span>
                </div>
              )}

              {/* Pods row — report card (left) + daily pod (right) */}
              <div className="flex flex-col md:flex-row gap-6 mb-6 items-start">

              {/* Hire vote pod — replaces yesterday's report card */}
              <HireVoteWidget
                currentUser={currentUser}
                hireVote={hireVoteData}
                onVoteUpdate={(updated) => setHireVoteData(updated)}
                className="order-last"
              />

              {/* Time-based pod — RIGHT */}
              {(() => {
                const msg = isMorning ? morningMsg : isAfternoon ? afternoonMsg : currentHour >= 17 ? todayMsg : null;
                const icon = isMorning ? "☕️" : isAfternoon ? "💻" : "🫡";
                if (!msg) return null;

                // Team cooking status — derived from already-polled statuses, no extra Redis
                const activeVals = MEMBERS.filter(m => !oooStatuses[m.name]).map(m => statuses[m.name] ?? 50);
                const teamAvg = activeVals.length ? activeVals.reduce((a, b) => a + b, 0) / activeVals.length : 50;
                const cookedCount = activeVals.filter(v => v > 77).length;
                const cookingCount = activeVals.filter(v => v > 50 && v <= 77).length;
                const chillCount = activeVals.filter(v => v <= 50).length;
                const total = activeVals.length;

                const bg = hotFraction < 0.25 ? "#FF9DC8"
                  : hotFraction < 0.5 ? "#FFB347"
                  : hotFraction < 0.75 ? "#FF6B35"
                  : "#e74c3c";

                // Text flips yellow on red so it stays readable
                const onDark = hotFraction >= 0.75;
                const textMain = onDark ? "#FFE234" : "#000";
                const textSub = onDark ? "rgba(255,226,52,0.75)" : "rgba(0,0,0,0.55)";
                const textTag = onDark ? "rgba(255,226,52,0.55)" : "rgba(0,0,0,0.35)";

                // Cooking-aware main headline — varies by cooking level + day so it feels fresh
                const d = nowDate.getDay();
                const COOK_MAINS = [
                  // 0 chill ≤35
                  ["we vibin' 😎✨", "monday? we eat 😤✨", "tuesday slay incoming 💅✨", "wednesday locked tf in 🧠✨", "thursday we are so unbothered 😌", "friday and we're THRIVING 🌸🔥", "saturday?? still vibing tho 😎"],
                  // 1 warming ≤55
                  ["starting to feel it 🍳👀", "monday heating up no cap 🌶️", "tuesday is cooking us slowly 🍳", "wednesday getting spicy 🌶️😤", "thursday heat rising fr 🔥👀", "friday is simmering 🍳🔥", "saturday grind, respect 😅🔥"],
                  // 2 cooking ≤75
                  ["we are COOKING 🔥🔥💀", "monday has us in the sauce 🌊🔥", "tuesday cooked different 💀🔥", "wednesday is NOT it 🔥🫠", "thursday said perish 💀🔥", "friday is FRYING us 🍳💀🔥", "saturday?? AND cooking?? 🆘🔥"],
                  // 3 cooked >75
                  ["fully cooked 💀💀💀", "monday destroyed us 🆘💀", "tuesday said no survivors 💀🔥💀", "wednesday ATE us alive 🪦💀", "thursday said rip bestie 💀🫠", "friday left no crumbs (of us) 💀🔥", "saturday cooked?? call 911 🆘💀"],
                ];
                const hotFraction = total > 0 ? (cookedCount + cookingCount) / total : 0;
                const cookLevel = hotFraction < 0.25 ? 0 : hotFraction < 0.5 ? 1 : hotFraction < 0.75 ? 2 : 3;
                const cookMain = COOK_MAINS[cookLevel][d];

                // Team heat strip — emoji heat meter + contextual message
                const heatEmojis = teamAvg <= 35 ? "😎😎😎" : teamAvg <= 55 ? "🍳🔥😅" : teamAvg <= 75 ? "🔥🔥💀" : "💀💀💀🆘";
                const teamHeat = teamAvg <= 35
                  ? { text: `${heatEmojis}  ${chillCount} of ${total} fully chillin'`, tag: "chill mode" }
                  : teamAvg <= 55
                  ? { text: `${heatEmojis}  ${cookingCount + cookedCount} of ${total} feeling the heat`, tag: "warming up" }
                  : teamAvg <= 75
                  ? { text: `${heatEmojis}  ${cookingCount} cooking · ${cookedCount} cooked`, tag: "it's getting hot" }
                  : { text: `${heatEmojis}  ${cookedCount} of ${total} fully cooked`, tag: "rip bestie" };

                const myVote = currentUser && !isGuest ? appVibes[currentUser] : null;
                const ups = Object.values(appVibes).filter(v => v === "up").length;
                const downs = Object.values(appVibes).filter(v => v === "down").length;

                const afterUpCopies = ["slay fr fr", "bestie said yes", "understood the assignment", "no notes", "ate and left no crumbs"];
                const afterDownCopies = ["valid tbh", "the audacity but ok", "we felt that", "ur so real for this", "noted bestie"];
                const afterCopy = myVote === "up"
                  ? afterUpCopies[Math.floor(Math.abs(currentUser?.charCodeAt(0) ?? 0) % afterUpCopies.length)]
                  : myVote === "down"
                  ? afterDownCopies[Math.floor(Math.abs(currentUser?.charCodeAt(0) ?? 0) % afterDownCopies.length)]
                  : null;

                const submitVibe = async (vote: "up" | "down") => {
                  if (!currentUser || isGuest || myVote) return;
                  setAppVibes(prev => ({ ...prev, [currentUser]: vote }));
                  await fetch("/api/app-vibe", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ user: currentUser, vote }),
                  });
                };

                return (
                  <div className="flex-1 min-w-0 order-first rounded-[1.4rem] border-[4px] border-black shadow-[6px_6px_0_#000] overflow-hidden" style={{ background: bg }}>
                    {/* Message row */}
                    <div className="px-6 py-5 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-4xl font-black leading-none" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.03em", color: textMain }}>{cookMain}</p>
                        <p className="text-sm font-bold mt-1" style={{ color: textSub }}>{msg.sub}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-3xl">{icon}</span>
                        <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: textTag }}>{msg.tag}</span>
                      </div>
                    </div>
                    {/* Team cooking status strip */}
                    <div className="border-t-[3px] border-black/20 px-5 py-2.5 flex items-center justify-between gap-3" style={{ background: "rgba(0,0,0,0.12)" }}>
                      <span className="text-sm font-extrabold" style={{ color: textMain }}>{teamHeat.text}</span>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest shrink-0" style={{ color: textTag }}>{teamHeat.tag}</span>
                    </div>
                    {/* Vote strip */}
                    {!isGuest && (
                      <div className="border-t-[3px] border-black px-5 py-3 flex items-center gap-3" style={{ background: "rgba(0,0,0,0.12)" }}>
                        {myVote ? (
                          <>
                            <span className="text-2xl">{myVote === "up" ? "👍" : "👎"}</span>
                            <span className="font-extrabold text-base uppercase tracking-widest text-black">{afterCopy}</span>
                            <div className="ml-auto flex items-center gap-2 shrink-0">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border-[2.5px] border-black bg-white font-extrabold text-sm shadow-[2px_2px_0_#000] tabular-nums">👍 {ups}</span>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border-[2.5px] border-black bg-white font-extrabold text-sm shadow-[2px_2px_0_#000] tabular-nums">👎 {downs}</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-black/50 shrink-0">rate the app</span>
                            <button
                              onClick={() => submitVibe("up")}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-[3px] border-black bg-white font-extrabold text-sm uppercase tracking-wide shadow-[3px_3px_0_#000] hover:translate-y-px hover:shadow-[2px_2px_0_#000] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
                            >👍 it&apos;s giving</button>
                            <button
                              onClick={() => submitVibe("down")}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-[3px] border-black bg-white font-extrabold text-sm uppercase tracking-wide shadow-[3px_3px_0_#000] hover:translate-y-px hover:shadow-[2px_2px_0_#000] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
                            >👎 not it</button>
                            {(ups + downs) > 0 && (
                              <div className="ml-auto flex items-center gap-2 shrink-0">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border-[2.5px] border-black bg-white font-extrabold text-sm shadow-[2px_2px_0_#000] tabular-nums">👍 {ups}</span>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border-[2.5px] border-black bg-white font-extrabold text-sm shadow-[2px_2px_0_#000] tabular-nums">👎 {downs}</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              </div>{/* end pods row */}

              {/* Confetti */}
              {!confettiOff && (
                <div className="fixed inset-0 pointer-events-none z-[50]">
                  {["#FF9DC8","#3D52F0","#e74c3c","#b5f0c8","#FFE234","#FF9DC8","#3D52F0","#a8f5c8","#dbb8ff","#ffb8e0","#FF4444","#000","#FF9DC8","#3D52F0","#b5f0c8","#FFE234","#dbb8ff","#e74c3c","#a8f5c8","#FF9DC8"].map((color, i) => (
                    <div key={i} className="absolute rounded-sm" style={{
                      top: "-20px",
                      left: `${(i * 5.1) % 100}%`,
                      width: i % 3 === 0 ? "12px" : "8px",
                      height: i % 3 === 0 ? "12px" : "18px",
                      background: color,
                      borderRadius: i % 4 === 0 ? "50%" : "2px",
                      animation: `confetti-fall ${2.5 + (i % 7) * 0.4}s ease-in ${(i * 0.18) % 2}s infinite`,
                    }} />
                  ))}
                </div>
              )}

              {/* Fireworks at 5pm */}
              {currentHour >= 17 && <Fireworks />}

              {/* Hall of Shame */}
              {currentHour >= 17 && Object.keys(lastSeen).filter(n => n !== BOSS && lastSeen[n] > Date.now() - 120000).length > 0 && (
                <div className="mb-6 rounded-[1.4rem] border-[4px] border-black bg-white shadow-[6px_6px_0_#000] overflow-hidden">
                  <div className="px-5 py-3 border-b-[3px] border-black bg-[#FF9DC8] flex items-center gap-3">
                    <span className="text-xl">😬</span>
                    <h2 className="text-lg font-extrabold tracking-tight flex-1" style={{ fontFamily: "var(--font-display)" }}>hall of shame — still here after 5</h2>
                  </div>
                  <div className="flex flex-wrap gap-3 px-5 py-4">
                    {Object.keys(lastSeen)
                      .filter(n => n !== BOSS && lastSeen[n] > Date.now() - 120000)
                      .sort((a, b) => (sessionTimes[b] ?? 0) - (sessionTimes[a] ?? 0))
                      .map(name => {
                        const secs = sessionTimes[name] ?? 0;
                        const hrs = Math.floor(secs / 3600);
                        const mins = Math.floor((secs % 3600) / 60);
                        const member = MEMBERS.find(m => m.name === name);
                        return (
                          <div key={name} className="flex items-center gap-2 px-3 py-2 rounded-xl border-[2px] border-black shadow-[2px_2px_0_#000] bg-white">
                            {member && <Image src={photoOverrides[name] ?? member.photo} alt={name} width={28} height={28} className="rounded-full object-cover w-7 h-7 border border-black" />}
                            <span className="font-extrabold text-sm">{name}</span>
                            <span className="text-xs font-bold text-black/40">{hrs > 0 ? `${hrs}h ` : ""}{mins}m</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Cards */}
              <div className="flex flex-col md:flex-row gap-6 md:gap-7 md:items-start">
                {myMember && !viewAsTeam && (
                  <div className="animate-pop-in w-full md:w-[320px] md:shrink-0 md:sticky md:top-8">
                    <MyCard
                      member={myMember}
                      statuses={statuses} oooStatuses={oooStatuses} oooDetails={oooDetails}
                      sosStatuses={sosStatuses} metcalfStatuses={metcalfStatuses}
                      needWorkStatuses={needWorkStatuses} dontTalkStatuses={dontTalkStatuses}
                      medsStatuses={medsStatuses} bodyDoubles={bodyDoubles}
                      photoOverrides={photoOverrides} updatedAt={updatedAt}
                      topOnlineUser={topOnlineUser} cardFlipped={cardFlipped} setCardFlipped={setCardFlipped}
                      localSlider={localSlider} setLocalSlider={setLocalSlider} isDragging={isDragging}
                      localAdhd={localAdhd} setLocalAdhd={setLocalAdhd} isAdhdDragging={isAdhdDragging}
                      editingNote={editingNote} setEditingNote={setEditingNote}
                      adhdLevels={adhdLevels} moods={moods} meetings={meetings}
                      pokes={pokes} touchGrass={touchGrass}
                      moneyRequestSent={moneyRequestSent} moneyRequests={moneyRequests}
                      currentUser={currentUser} isGuest={isGuest}
                      takeover={takeover} setTakeover={setTakeover}
                      takeoverDraft={takeoverDraft} setTakeoverDraft={setTakeoverDraft}
                      setShowTakeoverCompose={setShowTakeoverCompose}
                      newMessage={newMessage} setNewMessage={setNewMessage}
                      uploadingPhoto={uploadingPhoto} handlePhotoUpload={handlePhotoUpload}
                      buddies={buddies}
                      toggleOOO={toggleOOO} toggleMeds={toggleMeds} toggleBodyDouble={toggleBodyDouble}
                      toggleNeedWork={toggleNeedWork} toggleDontTalk={toggleDontTalk}
                      toggleMetcalf={toggleMetcalf} toggleSOS={toggleSOS}
                      hotColdStatuses={hotColdStatuses} toggleHotCold={toggleHotCold}
                      handleSliderChange={handleSliderChange} saveNote={saveNote}
                      handleAdhdChange={handleAdhdChange} handleMoneyRequest={handleMoneyRequest}
                      sendPoke={sendPoke} sendTouchGrass={sendTouchGrass}
                      dismissPoke={dismissPoke} dismissTouchGrass={dismissTouchGrass}
                      postMessage={postMessage} formatCountdown={formatCountdown}
                      setShowMeetingPicker={setShowMeetingPicker} setMeeting={setMeeting}
                      setMyMood={setMyMood}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className={`grid grid-cols-1 gap-4 ${viewAsTeam ? "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "md:grid-cols-2 xl:grid-cols-3"}`}>
                    {teamMembers.map((member, i) => (
                      <TeamCard
                        key={member.name}
                        member={member} i={i}
                        statuses={statuses} oooStatuses={oooStatuses}
                        sosStatuses={sosStatuses} metcalfStatuses={metcalfStatuses}
                        needWorkStatuses={needWorkStatuses} dontTalkStatuses={dontTalkStatuses}
                        medsStatuses={medsStatuses} bodyDoubles={bodyDoubles}
                        photoOverrides={photoOverrides} updatedAt={updatedAt}
                        currentUser={currentUser} isGuest={isGuest}
                        moods={moods} adhdLevels={adhdLevels} meetings={meetings}
                        pokes={pokes} touchGrass={touchGrass}
                        bans={bans} floatingReactions={floatingReactions}
                        hotColdStatuses={hotColdStatuses}
                        buddies={buddies} statusNotes={statusNotes}
                        sendReaction={sendReaction} sendPoke={sendPoke} sendTouchGrass={sendTouchGrass}
                        setShowDisputeModal={setShowDisputeModal}
                        formatCountdown={formatCountdown}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <GoHomeRequests goHomeRequests={goHomeRequests} photoOverrides={photoOverrides} />

              {bossMember && currentUser !== BOSS && (
                <BossCard
                  bossMember={bossMember} currentUser={currentUser} isGuest={isGuest}
                  topOnlineUser={topOnlineUser} statuses={statuses} statusNotes={statusNotes}
                  sosStatuses={sosStatuses} metcalfStatuses={metcalfStatuses}
                  bossReactions={bossReactions} photoOverrides={photoOverrides}
                  reactToBoss={reactToBoss}
                />
              )}

              <VibeMusic vibeVideoId={vibeVideoId} />
              <FeatureUpdates shippedFeatures={shippedFeatures} />
            </>
          )}
        </div>

        {/* Modals */}
        <MeetingPickerModal showMeetingPicker={showMeetingPicker} setShowMeetingPicker={setShowMeetingPicker} setMeeting={setMeeting} />
        <TakeoverModal takeover={takeover} setTakeover={setTakeover} showTakeoverCompose={showTakeoverCompose} setShowTakeoverCompose={setShowTakeoverCompose} takeoverDraft={takeoverDraft} setTakeoverDraft={setTakeoverDraft} currentUser={currentUser} />
        <HatchModal showHatchModal={showHatchModal} setShowHatchModal={setShowHatchModal} hatchPhase={hatchPhase} hatchedBuddy={hatchedBuddy} crackEgg={crackEgg} confirmHatch={confirmHatch} />
        <GhostModal showGhostModal={showGhostModal} ghostNote={ghostNote} setGhostNote={setGhostNote} ghostBackDate={ghostBackDate} setGhostBackDate={setGhostBackDate} confirmGhost={confirmGhost} setShowGhostModal={setShowGhostModal} />
        <TextSubmitModal show={showFeedback} onSubmit={submitFeedback} onClose={() => setShowFeedback(false)}
          title="App feedback" subtitle="what's working, what's not, ideas — all welcome" placeholder="type here..."
          sentEmoji="🙏" sentText="Thanks!" submitLabel="send it ✉️"
          submitClassName="flex-1 py-3 rounded-2xl bg-black text-white font-bold text-sm cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-default" />
        <TextSubmitModal show={showFeatureRequest} onSubmit={submitFeatureRequest} onClose={() => setShowFeatureRequest(false)}
          title="Feature Request" subtitle="got an idea? drop it here and we'll cook" placeholder="what should we build..."
          sentEmoji="💡" sentText="Noted!" submitLabel="send it 💡"
          submitClassName="flex-1 py-3 rounded-2xl bg-[#FFE234] border-[3px] border-black text-black font-bold text-sm cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-default shadow-[3px_3px_0_#000]" />
        <TextSubmitModal show={showBugReport} onSubmit={submitBugReport} onClose={() => setShowBugReport(false)}
          title="Submit a Bug" subtitle="something broken? spill the tea" placeholder="what broke and when..."
          sentEmoji="🐛" sentText="Got it!" submitLabel="send it 🐛"
          submitClassName="flex-1 py-3 rounded-2xl bg-[#FF9DC8] border-[3px] border-black text-black font-bold text-sm cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-default shadow-[3px_3px_0_#000]" />
        <TextSubmitModal show={showTattle} onSubmit={submitTattle} onClose={() => setShowTattle(false)}
          title="Tattle Box" subtitle="100% anonymous. vent freely." placeholder="spill it..."
          sentEmoji="🫢" sentText="Noted." sentSubtext="Derek will see this." submitLabel="send it 🫢"
          submitClassName="flex-1 py-3 rounded-2xl bg-[#ff4d4d] border-[3px] border-black text-white font-bold text-sm cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-default shadow-[3px_3px_0_#000]" />
        <DisputeModal showDisputeModal={showDisputeModal} setShowDisputeModal={setShowDisputeModal} currentUser={currentUser} bans={bans} />
        <IdentityPicker showPicker={showPicker} photoOverrides={photoOverrides} pickUser={pickUser} />
      </div>

      {/* Footer */}
      <div style={{ width: "100%", background: "#FF9DC8", borderTop: "4px solid #000" }}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-8 sm:py-12 flex flex-col sm:flex-row items-center gap-2 sm:gap-0 justify-between text-center sm:text-left">
          <span className="text-base font-extrabold text-black" style={{ fontFamily: "var(--font-display)" }}>Vibe Check 👁️👄👁️</span>
          <span className="text-sm font-bold text-black font-mono">track s&amp;a creative bandwidth. no cap.</span>
          <span className="text-sm font-bold text-black">v{process.env.NEXT_PUBLIC_APP_VERSION}</span>
        </div>
      </div>

      <BrainRotOverlay brainRot={brainRot} brainRotVideoId={brainRotVideoId} setBrainRot={setBrainRot} />
    </>
  );
}
