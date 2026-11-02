import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import { io } from "socket.io-client";
import QRCode from "qrcode";
import {
  ArrowLeft,
  RotateCcw,
  RotateCw,
  ListVideo,
  Volume2,
  VolumeX,
  Sun,
  Search,
  Pause,
  X,
  Maximize,
  Minimize,
  Smartphone,
  ArrowUpRight,
  Play,
  Settings2,
  ChevronLeft,
  Focus,
  Check,
  Link,
  Radio,
} from "lucide-react";
import {
  activeRegions,
  hit,
  clamp,
  validRegions,
  type Region,
} from "./logic.js";
import { characters, official, actors, titles, titleList, itemSub, itemsOf, kindLabel, type TitleId, type Track, type Title } from "./data";
import { BrowseHome, TitleDetails, TitleExtras } from "./BrowseHome";
const kindEn = { character: "CHARACTER", person: "CAST", prop: "PROP", place: "PLACE" } as const;
import { WorkClip } from "./WorkClip";
import { workInfo } from "./workInfo";
import { Modal } from "./Modal";
import { RemoteCursor, remoteInputActive } from "./RemoteCursor";
import "./style.css";
import "./streaming.css";
const socket = io({ autoConnect: false });
const params = new URLSearchParams(location.search),
  remote = location.pathname === "/remote";
type Point = { x: number; y: number };
type Drawn = {
  box: { x: number; y: number; width: number; height: number };
  time: number;
};
type Session = { id: string; hostToken: string; remoteToken: string };
type State = {
  pointer: Point;
  time: number;
  video?: string;
  playing?: boolean;
  selected: string | null;
  hover: string | null;
  connected: boolean;
};
const initial: State = {
  pointer: { x: 0.5, y: 0.5 },
  time: 0,
  selected: null,
  hover: null,
  connected: false,
};
type PlaybackPreferences = {
  volume: number;
  muted: boolean;
  brightness: number;
};
function readPlaybackPreferences(): PlaybackPreferences {
  try {
    const saved = JSON.parse(localStorage.getItem("point-playback") || "null");
    if (
      saved &&
      Number.isFinite(saved.volume) &&
      Number.isFinite(saved.brightness)
    ) {
      return {
        volume: Math.round(clamp(saved.volume / 100) * 100),
        muted: saved.muted === true,
        brightness: Math.max(40, Math.min(150, saved.brightness)),
      };
    }
  } catch {}
  return { volume: 100, muted: false, brightness: 100 };
}
function App() {
  const [view, setView] = useState<"browse" | "watch">(
    params.get("view") === "watch" ? "watch" : "browse",
  );
  const viewRef = useRef(view);
  viewRef.current = view;
  const [upNextDismissed, setUpNextDismissed] = useState(false);
  const [upNextLeft, setUpNextLeft] = useState(5);
  // Home voice-actor shelf: open that character's panel straight on the voice step
  // (choose-character's echo would reset the step).
  const openActor = (id: string) => {
    setLocalSelected(id);
    setDetail("voice");
    setLibraryOpen(false);
    setResultOpen(true);
  };
  const [titleOpen, setTitleOpen] = useState(false),
    [pairOpen, setPairOpen] = useState(false),
    [brightnessOpen, setBrightnessOpen] = useState(false),
    [showSaved, setShowSaved] = useState(false);
  const [saved, setSaved] = useState<TitleId[]>(() => {
    try {
      return (JSON.parse(localStorage.getItem("point-saved-titles") || "[]") as TitleId[]).filter((id) => id in titles);
    } catch {
      return [];
    }
  });
  // Which title the TV is on; each title keeps its own resume point.
  const [titleId, setTitleId] = useState<TitleId>(() => {
    try { return localStorage.getItem("point-title") === "chiikawa" ? "chiikawa" : "sunshine"; } catch { return "sunshine"; }
  });
  const titleRef = useRef(titleId);
  titleRef.current = titleId;
  const [detailsId, setDetailsId] = useState<TitleId>(titleId);
  const readResume = (id: TitleId) => {
    try {
      const t = Number(localStorage.getItem("point-resume-" + id));
      return Number.isFinite(t) ? Math.max(0, Math.min(titles[id].duration, t)) : 0;
    } catch {
      return 0;
    }
  };
  const [resume, setResume] = useState(() => readResume(titleId));
  const pendingPlay = useRef<number | null>(
      params.get("view") === "watch" ? resume : null,
    ),
    lastResumeSave = useRef(-1);
  const overlayRef = useRef({ titleOpen, pairOpen });
  overlayRef.current = { titleOpen, pairOpen };
  const toggleSaved = (id: TitleId) =>
    setSaved((previous) => {
      const next = previous.includes(id) ? previous.filter((x) => x !== id) : [...previous, id];
      try {
        localStorage.setItem("point-saved-titles", JSON.stringify(next));
      } catch {}
      return next;
    });
  const [playback, setPlayback] = useState(readPlaybackPreferences);
  const playbackRef = useRef(playback);
  playbackRef.current = playback;
  const controls = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (remote) return;
    try {
      localStorage.setItem("point-playback", JSON.stringify(playback));
    } catch {}
  }, [playback]);
  useEffect(() => {
    if (!controls.current || remote) return;
    const update = () =>
      theater.current?.style.setProperty(
        "--controls-height",
        `${controls.current?.getBoundingClientRect().height || 60}px`,
      );
    const observer = new ResizeObserver(update);
    observer.observe(controls.current);
    return () => observer.disconnect();
  }, []);
  const [libraryOpen, setLibraryOpen] = useState(false),
    [query, setQuery] = useState(""),
    [playing, setPlaying] = useState(false),
    [playerState, setPlayerState] = useState(-1),
    [ready, setReady] = useState(false),
    [joined, setJoined] = useState(false),
    [controlsVisible, setControlsVisible] = useState(true);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wakeControls = () => {
    setControlsVisible(true);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      if (player.current?.getPlayerState?.() === 1) setControlsVisible(false);
    }, 3000);
  };
  useEffect(
    () => () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    },
    [],
  );
  const [resultOpen, setResultOpen] = useState(false);
  const [resultMinimized, setResultMinimized] = useState(false);
  const [allWorks, setAllWorks] = useState(false);
  // A profile work opened from the voice step; its clip pauses the episode so audio never overlaps.
  const [openWork, setOpenWork] = useState<{ title: string; role: string } | null>(null);
  // TV side of a phone selection: only a brief check where the pointer was; the detail lives on the phone.
  const [pulse, setPulse] = useState<{ x: number; y: number; at: number } | null>(null);
  useEffect(() => {
    if (!pulse) return;
    const t = setTimeout(() => setPulse(null), 800);
    return () => clearTimeout(t);
  }, [pulse]);
  const resultOpenRef = useRef(resultOpen);
  resultOpenRef.current = resultOpen;
  // Clicking anywhere outside the panel closes it. The video layer is left out:
  // there a click selects a character, and a miss closes the panel (see selection-miss).
  useEffect(() => {
    if (remote || !resultOpen) return;
    const close = (e: MouseEvent) => {
      const t = e.target instanceof Element ? e.target : null;
      if (t?.closest('.result-panel, .video-interaction, .toast, .stream-modal')) return;
      setResultOpen(false);
    };
    document.addEventListener('click', close, true);
    return () => document.removeEventListener('click', close, true);
  }, [resultOpen]);

  const [fullscreen, setFullscreen] = useState(params.get("view") === "watch");
  const theater = useRef<HTMLDivElement>(null);
  const toggleFullscreen = () => {
    setFullscreen((value) => !value);
    wakeControls();
  };
  const [drawn, setDrawn] = useState<Drawn | null>(null),
    [dragBox, setDragBox] = useState<Drawn["box"] | null>(null);
  const dragStart = useRef<Point | null>(null);
  const [session, setSession] = useState<Session | null>(null),
    [state, setState] = useState(initial),
    [online, setOnline] = useState(false),
    [regions, setRegions] = useState<Region[]>([]),
    [notice, setNotice] = useState(""),
    [editor, setEditor] = useState(false),
    [mode, setMode] = useState("mouse"),
    [explore, setExplore] = useState(true),
    [localSelected, setLocalSelected] = useState<string | null>(null),
    [detail, setDetail] = useState("character"),
    [qr, setQr] = useState(""),
    [base, setBase] = useState(location.origin),
    [duration, setDuration] = useState(0),
    [speed, setSpeed] = useState(() => { try { const n = Number(localStorage.getItem('point-remote-speed')); return n >= .3 && n <= 2 ? n : 1; } catch { return 1; } }),
    [sensor, setSensor] = useState(false);
  // The phone follows whatever the TV is playing.
  const current: Title = remote ? (titleList.find((x) => x.video === state.video) ?? titles[titleId]) : titles[titleId];
  useEffect(() => { setResultMinimized(false); setAllWorks(false); }, [localSelected, libraryOpen, resultOpen]);
  const remoteInfo = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!remote || !resultOpen) return;
    const id = requestAnimationFrame(() => remoteInfo.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    return () => cancelAnimationFrame(id);
  }, [resultOpen, localSelected]);
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const [remoteSettings, setRemoteSettings] = useState(false);
  // Characters this phone has found, newest first.
  const [searchLog, setSearchLog] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('point-remote-history') || '[]').filter((id: string) => characters.some((c) => c.id === id)); } catch { return []; }
  });
  useEffect(() => { try { localStorage.setItem('point-remote-history', JSON.stringify(searchLog)); } catch {} }, [searchLog]);
  // Phone: a selection first shows a short preview sheet over the touchpad; details open from it.
  const [sheetOpen, setSheetOpen] = useState(false);
  const openDetail = () => {
    setDetail("character");
    setResultOpen(true);
    history.pushState({ remoteDetail: true }, "", location.href); // the phone's back button returns to the sheet
  };
  const closeDetail = () => {
    if (history.state?.remoteDetail) history.back(); // popstate closes the detail
    else setResultOpen(false);
    window.scrollTo({ top: 0 });
  };
  const touches = useRef(new Map<number, Point>());
  const tapStart = useRef<{ x: number; y: number; time: number; moved: boolean } | null>(null);
  const player = useRef<any>(null),
    pointer = useRef<Point>({ x: 0.5, y: 0.5 }),
    calibration = useRef<{ a: number; b: number } | null>(null),
    orientation = useRef<{ a: number; b: number } | null>(null),
    sensorCleanup = useRef<(() => void) | null>(null),
    lastSend = useRef(0);
  const enterWatch = (time: number, id: TitleId = titleRef.current) => {
    const switching = id !== titleRef.current;
    if (switching) {
      titleRef.current = id;
      setTitleId(id);
      setResume(readResume(id));
      try { localStorage.setItem("point-title", id); } catch {}
      socket.emit("video", titles[id].video);
    }
    setUpNextDismissed(false);
    setView("watch");
    setFullscreen(true);
    setTitleOpen(false);
    setPairOpen(false);
    setResultOpen(false);
    setLibraryOpen(false);
    setEditor(false);
    setBrightnessOpen(false);
    wakeControls();
    history.pushState({ view: "watch" }, "", "/?view=watch");
    if (ready) {
      setTimeout(() => {
        if (switching) player.current?.loadVideoById?.({ videoId: titles[id].video, startSeconds: time });
        else {
          player.current?.seekTo?.(time, true);
          player.current?.playVideo?.();
        }
      }, 60);
    } else pendingPlay.current = time;
  };
  const openDetails = (id: TitleId) => {
    setDetailsId(id);
    setTitleOpen(true);
  };
  const goBrowse = () => {
    player.current?.pauseVideo?.();
    setView("browse");
    setFullscreen(false);
    setResultOpen(false);
    setLibraryOpen(false);
    setTitleOpen(false);
    setPairOpen(false);
    setEditor(false);
    setBrightnessOpen(false);
    history.pushState({ view: "browse" }, "", "/");
  };
  useEffect(() => {
    const pop = () => {
      const next =
        new URLSearchParams(location.search).get("view") === "watch"
          ? "watch"
          : "browse";
      setView(next);
      setFullscreen(next === "watch");
      setTitleOpen(false);
      setPairOpen(false);
      setResultOpen(false);
      if (next === "browse") player.current?.pauseVideo?.();
    };
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, []);
  const chooseCharacter = (id: string) => {
    if (!remote && remoteInputActive) {
      socket.emit("choose-character", id, { target: "remote" });
      return;
    }
    setTitleOpen(false);
    setLocalSelected(id);
    setDetail("character");
    setLibraryOpen(false);
    setResultOpen(true);
    socket.emit("choose-character", id);
  };
  const skip = (delta: number) => {
    const time = player.current?.getCurrentTime?.() || 0;
    player.current?.seekTo?.(
      Math.max(0, Math.min(duration || 330, time + delta)),
      true,
    );
    wakeControls();
  };
  const changeVolume = (input: number) => {
    const volume = Math.round(clamp(input / 100) * 100);
    const muted = volume === 0;
    setPlayback((current) => ({ ...current, volume, muted }));
    player.current?.setVolume?.(volume);
    if (muted) player.current?.mute?.();
    else player.current?.unMute?.();
    wakeControls();
  };
  const toggleMute = () => {
    const current = playbackRef.current;
    const muted = !current.muted;
    const volume = !muted && current.volume === 0 ? 50 : current.volume;
    setPlayback((previous) => ({ ...previous, volume, muted }));
    player.current?.setVolume?.(volume);
    if (muted) player.current?.mute?.();
    else player.current?.unMute?.();
    wakeControls();
  };
  const changeBrightness = (brightness: number) => {
    setPlayback((current) => ({
      ...current,
      brightness: Math.max(40, Math.min(150, brightness)),
    }));
    wakeControls();
  };
  const point = (p: Point) => {
    pointer.current = p;
    setState((s) => ({ ...s, pointer: p }));
    socket.emit("pointer", p);
  };
  useEffect(() => {
    const connect = () => {
      setOnline(true);
      if (remote) {
        socket.emit(
          "join",
          { id: params.get("session"), token: params.get("token") },
          (r: any) => {
            if (r.error) {
              setJoined(false);
              setNotice(r.error);
            } else {
              setJoined(true);
              setNotice("");
            }
          },
        );
      } else {
        let saved = null;
        try {
          saved = JSON.parse(sessionStorage.getItem("point-session") || "null");
        } catch {}
        socket.emit("create", saved, (s: Session) => {
          setSession(s);
          socket.emit("video", titles[titleRef.current].video);
          sessionStorage.setItem("point-session", JSON.stringify(s));
        });
      }
    };
    socket.on("connect", connect);
    socket.on("disconnect", () => {
      setOnline(false);
      setJoined(false);
      setNotice("서버 연결이 끊겼습니다. 자동으로 재연결을 시도합니다.");
    });
    socket.on("connect_error", () =>
      setNotice("서버에 연결할 수 없습니다. 주소와 네트워크를 확인해 주세요."),
    );
    socket.on("state", (s: State) => {
      pointer.current = s.pointer;
      setState(s);
    });
    socket.on("regions", setRegions);
    socket.on("notice", setNotice);
    socket.on("selection-miss", (meta?: {target: string}) => {
      // A miss never jumps to search; it just asks gently for another try.
      if (remote && meta?.target === "host") return;
      if (!remote && meta?.target === "remote") return; // the phone gives its own feedback
      if (resultOpenRef.current) return setResultOpen(false);
      setNotice("앗, 캐릭터가 선택되지 않았어요. 캐릭터 위에 포인터를 올린 뒤 다시 눌러 주세요.");
    });
    socket.on('open-library', () => {
      if (!remote) return; // searching is personal: it opens on the phone only
      setLibraryOpen(true); setResultOpen(true);
    });
    socket.on("selected", (id: string, meta?: {target: string}) => {
      if (remote && meta?.target === "host") { setResultOpen(false); setLibraryOpen(false); setSheetOpen(false); return; }
      if (!remote && meta?.target === "remote") {
        setResultOpen(false);
        setPulse({ ...pointer.current, at: Date.now() });
        return;
      }
      setLocalSelected(id);
      if (remote) setSearchLog((h) => [id, ...h.filter((x) => x !== id)].slice(0, 8));
      setDetail("character");
      setLibraryOpen(false);
      setQuery("");
      // The phone updates the one preview sheet (never stacks a new one); the PC opens its panel.
      if (remote) setSheetOpen(true);
      else setResultOpen(true);
      navigator.vibrate?.(40);
    });
    socket.on("play", () => {
      const p = player.current;
      if (p?.getPlayerState) {
        if (p.getPlayerState() === 1) p.pauseVideo();
        else {
          if (p.getPlayerState() === 0) p.seekTo(0, true);
          p.playVideo();
        }
      }
    });
    socket.connect();
    fetch("/api/regions")
      .then((r) => r.json())
      .then(setRegions)
      .catch(() => setNotice("선택 영역 데이터를 읽지 못했습니다."));
    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      sensorCleanup.current?.();
    };
  }, []);
  useEffect(() => {
    if (remote) return;
    let previousAutoBase = location.origin;
    const updateNetwork = () =>
      fetch("/api/network", { cache: "no-store" })
        .then((response) => response.json())
        .then((network) => {
          if (
            !["localhost", "127.0.0.1"].includes(location.hostname) ||
            !network.addresses[0]
          )
            return;
          const next = `${location.protocol}//${network.addresses[0]}:${location.port || 5173}`;
          const previous = previousAutoBase;
          setBase((current) => (current === previous ? next : current));
          previousAutoBase = next;
        })
        .catch(() => {});
    updateNetwork();
    const networkTimer = setInterval(updateNetwork, 10000);
    let timer: ReturnType<typeof setInterval>;
    let disposed = false;
    const init = () => {
      if (disposed) return;
      player.current = new (window as any).YT.Player("youtube", {
        videoId: titles[titleRef.current].video,
        playerVars: { playsinline: 1, controls: 0, rel: 0, origin: location.origin },
        events: {
          onStateChange: (e: any) => {
            setPlaying(e.data === 1);
            socket.emit("playing", e.data === 1);
            setPlayerState(e.data);
            if (e.data === 1) wakeControls();
            if (e.data === 2 || e.data === 0) setControlsVisible(true);
            if (e.data === 2 || e.data === 0) {
              const t = player.current?.getCurrentTime?.() || 0;
              setResume(t);
              try {
                localStorage.setItem("point-resume-" + titleRef.current, String(t));
              } catch {}
            }
          },
          onReady: () => {
            player.current.setVolume(playbackRef.current.volume);
            if (playbackRef.current.muted || playbackRef.current.volume === 0)
              player.current.mute();
            else player.current.unMute();
            setReady(true);
            const want = titles[titleRef.current].video;
            if (player.current.getVideoData?.().video_id !== want)
              player.current.cueVideoById({ videoId: want, startSeconds: pendingPlay.current ?? 0 });
            if (pendingPlay.current !== null) {
              player.current.seekTo(pendingPlay.current, true);
              player.current.playVideo();
              pendingPlay.current = null;
            }
            setDuration(player.current.getDuration());
            timer = setInterval(() => {
              const t = player.current?.getCurrentTime?.() || 0;
              socket.emit("time", t);
              if (player.current?.getPlayerState?.() === 1) {
                setResume(t);
                const second = Math.floor(t);
                if (second !== lastResumeSave.current && second % 5 === 0) {
                  lastResumeSave.current = second;
                  try {
                    localStorage.setItem("point-resume-" + titleRef.current, String(t));
                  } catch {}
                }
              }
              setDuration(player.current?.getDuration?.() || 0);
            }, 200);
          },
          onError: (e: any) =>
            setNotice(
              `YouTube 재생 오류 (${e.data}). 원본에서 재생하거나 네트워크·임베드 허용 여부를 확인해 주세요.`,
            ),
        },
      });
    };
    if ((window as any).YT?.Player) init();
    else {
      (window as any).onYouTubeIframeAPIReady = init;
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.onerror = () =>
        setNotice(
          "YouTube에 연결할 수 없어요. 네트워크와 콘텐츠 차단 설정을 확인해 주세요.",
        );
      document.head.appendChild(script);
    }
    return () => {
      disposed = true;
      clearInterval(timer);
      clearInterval(networkTimer);
      player.current?.destroy?.();
    };
  }, []);
  useEffect(() => {
    if (ready || remote) return;
    const timeout = setTimeout(
      () =>
        setNotice(
          "YouTube 연결이 지연되고 있어요. 네트워크를 확인하거나 페이지를 새로고침해 주세요.",
        ),
      15000,
    );
    return () => clearTimeout(timeout);
  }, [ready]);
  const remoteUrl = session
    ? `${base}/remote?session=${session.id}&token=${session.remoteToken}`
    : "";
  useEffect(() => {
    if (remoteUrl)
      QRCode.toDataURL(remoteUrl, {
        width: 180,
        margin: 1,
        color: { dark: "#111214", light: "#ffffff" },
      }).then(setQr);
  }, [remoteUrl]);
  useEffect(() => {
    if (notice) {
      const t = setTimeout(() => setNotice(""), 9000);
      return () => clearTimeout(t);
    }
  }, [notice]);
  // Netflix-style ending card: appears when the credits start and, after a 5-second
  // countdown that only runs while the video plays, opens the title's detail page.
  const UP_NEXT_SECONDS = 5;
  const showUpNext =
    view === "watch" && ready && !editor &&
    (playerState === 0 || (state.time >= current.credits && !upNextDismissed));
  useEffect(() => {
    if (!showUpNext || !playing) {
      if (!showUpNext) setUpNextLeft(UP_NEXT_SECONDS);
      return;
    }
    const t = setInterval(() => setUpNextLeft((n) => n - 1), 1000);
    return () => clearInterval(t);
  }, [showUpNext, playing]);
  const goUpNext = () => {
    player.current?.pauseVideo?.();
    setUpNextDismissed(true);
    openDetails(titleRef.current);
  };
  useEffect(() => {
    if (showUpNext && upNextLeft <= 0) goUpNext();
  }, [upNextLeft]);
  const active = activeRegions(regions, state.time, current.video),
    hover = hit(active, state.pointer),
    selected = characters.find(
      (c) => c.id === (localSelected || state.selected),
    );
  const select = () => {
    if (explore) socket.emit("select", { target: remote || remoteInputActive ? "remote" : "host" });
  };
  const startSensor = async () => {
    try {
      if (!window.isSecureContext)
        throw Error(
          "센서는 HTTPS 연결이 필요합니다. 터치패드를 사용할 수 있습니다.",
        );
      const O = DeviceOrientationEvent as any;
      if (O.requestPermission && (await O.requestPermission()) !== "granted")
        throw Error("센서 권한이 허용되지 않았습니다.");
      sensorCleanup.current?.();
      calibration.current = null;
      let seen = false;
      const listener = (e: DeviceOrientationEvent) => {
        if (e.alpha === null || e.beta === null) return;
        seen = true;
        const v = { a: e.alpha, b: e.beta };
        orientation.current = v;
        if (!calibration.current) calibration.current = v;
        const delta = ((v.a - calibration.current.a + 540) % 360) - 180;
        const target = {
          x: clamp(0.5 - (delta / 65) * speedRef.current),
          y: clamp(
            0.5 + ((v.b - calibration.current.b) / 65) * speedRef.current,
          ),
        };
        const p = {
          x: pointer.current.x + (target.x - pointer.current.x) * 0.2,
          y: pointer.current.y + (target.y - pointer.current.y) * 0.2,
        };
        if (performance.now() - lastSend.current > 32) {
          lastSend.current = performance.now();
          point(p);
        }
      };
      window.addEventListener("deviceorientation", listener);
      sensorCleanup.current = () =>
        window.removeEventListener("deviceorientation", listener);
      setSensor(true);
      setMode("sensor");
      setTimeout(() => {
        if (!seen)
          setNotice(
            "센서 입력이 없습니다. 터치패드로 전환하거나 브라우저 권한을 확인해 주세요.",
          );
      }, 3000);
    } catch (e) {
      setNotice((e as Error).message);
    }
  };
  const videoPoint = (e: React.MouseEvent<HTMLDivElement>) => {
    const b = e.currentTarget.getBoundingClientRect();
    return {
      x: clamp((e.clientX - b.left) / b.width),
      y: clamp((e.clientY - b.top) / b.height),
    };
  };
  const openLibrary = () => {
    if (!remote && remoteInputActive) { socket.emit('open-library'); return; }
    setLibraryOpen(true);
    setResultOpen(true);
  };
  useEffect(() => {
    if (remote) return;
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (overlayRef.current.titleOpen || overlayRef.current.pairOpen) {
          setTitleOpen(false);
          setPairOpen(false);
          return;
        }
        setBrightnessOpen(false);
        setFullscreen(false);
        setResultOpen(false);
        setLibraryOpen(false);
        return;
      }
      if (viewRef.current !== "watch") return;
      if (
        event.repeat ||
        event.isComposing ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      )
        return;
      const target = event.target instanceof Element ? event.target : null;
      if (
        target?.closest(
          'textarea,select,input:not([type="checkbox"]):not([type="radio"]):not([type="range"]),[contenteditable="true"]',
        )
      )
        return;
      if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        toggleFullscreen();
        return;
      }
      if (event.key.toLowerCase() === "m") {
        event.preventDefault();
        toggleMute();
        return;
      }
      if (event.key === " " && !target?.closest("button,a,input")) {
        event.preventDefault();
        wakeControls();
        socket.emit("play");
      }
    };
    document.addEventListener("keydown", key, true);
    return () => document.removeEventListener("keydown", key, true);
  }, []);
  useEffect(() => {
    if (
      !fullscreen &&
      !titleOpen &&
      !pairOpen
    )
      return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [fullscreen, titleOpen, pairOpen]);
  useEffect(() => {
    if (!brightnessOpen) return;
    const dismiss = (event: PointerEvent) => {
      if (!(event.target as Element)?.closest('.player-brightness')) setBrightnessOpen(false);
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [brightnessOpen]);
  const library = (
    <div className="character-library">
      <div className="eyebrow">{current.name}</div>
      <h2>{current.id === "chiikawa" ? "어떤 친구가 궁금하세요?" : "무엇이 궁금하세요?"}</h2>
      <p>{current.id === "chiikawa" ? "이름이나 성우로 직접 찾아보세요." : "인물·배우·소품·장소 이름으로 찾아보세요."}</p>
      <label className="library-point-toggle">
        <input
          type="checkbox"
          checked={explore}
          onChange={(e) => setExplore(e.target.checked)}
        />{" "}
        영상에서 포인팅으로 선택
      </label>
      <label className="search-field">
        <Search size={16} />
        <input
          aria-label="이름 검색"
          placeholder={current.id === "chiikawa" ? "캐릭터, 성우 이름 검색" : "인물, 배우, 소품, 장소 검색"}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <div className="character-results">
        {itemsOf(current.id)
          .filter((c) =>
            (c.name + c.jp + c.voice + c.voiceJp + kindLabel[c.kind]).includes(query.trim()),
          )
          .map((c) => (
            <button key={c.id} onClick={() => chooseCharacter(c.id)}>
              <CharacterArt character={c} compact />
              <span>
                <strong>{c.name}</strong>
                <small>{itemSub(c)}</small>
              </span>
              <ArrowUpRight size={17} />
            </button>
          ))}
      </div>
      {!itemsOf(current.id).some((c) =>
        (c.name + c.jp + c.voice + c.voiceJp + kindLabel[c.kind]).includes(query.trim()),
      ) && <p>검색 결과가 없어요. 다른 이름을 입력해 보세요.</p>}
      <p className="small muted">
        영상 속 직접 선택은 장면별로 등록한 위치를 사용합니다. 목록에서는 시간에
        관계없이 정보를 찾을 수 있어요.
      </p>
      {current.ost && <TitleExtras title={current} />}
    </div>
  );
  const actor = selected && actors[selected.voiceJp];
  const related = selected?.related ? characters.find((c) => c.id === selected.related) : undefined;
  const linked = selected ? characters.filter((c) => c.related === selected.id) : [];
  // Jump between items inside the panel without telling the TV (it is a browse, not a new pick).
  const showItem = (id: string) => { setLocalSelected(id); setDetail("character"); };
  const profileWorks = actor?.works ?? [];
  const infoPanel = (
    <>
      {libraryOpen ? (
        library
      ) : selected ? (
        <div className={"detail detail-" + detail} key={selected.id + detail}>
          <button className="text-button" onClick={() => setDetail("character")}>
            <ChevronLeft size={15} />
            {detail === "character" ? kindLabel[selected.kind] + " 정보" : "뒤로"}
          </button>
          {detail === "character" ? (
            <CharacterArt key={selected.id} character={selected} />
          ) : (
            <ActorPhoto key={selected.id} character={selected} />
          )}
          <div className="eyebrow">{detail === "character" ? kindEn[selected.kind] : selected.kind === "person" ? "ACTOR" : "VOICE ACTOR"}</div>
          <h2>{detail === "character" ? selected.name : selected.voice}</h2>
          <p className="jp">{detail === "character" ? selected.jp : selected.voiceJp}</p>
          {detail === "character" ? (
            <>
              <p>{selected.description}</p>
              {selected.voice && (
                <button className="list-button" onClick={() => setDetail("voice")}>
                  <span>
                    <small>{selected.kind === "person" ? "배우" : "담당 성우 · 일본어판"}</small>
                    {selected.voice}
                  </span>
                  <ArrowUpRight size={20} />
                </button>
              )}
              {selected.facts && (
                <dl className="item-facts">
                  {selected.facts.map(([k, v]) => (
                    <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
                  ))}
                </dl>
              )}
              {related && (
                <button className="list-button" onClick={() => showItem(related.id)}>
                  <span>
                    <small>{selected.kind === "place" ? "극 중 운영자" : "이 장면의 인물"}</small>
                    {related.name}
                  </span>
                  <ArrowUpRight size={20} />
                </button>
              )}
              {linked.length > 0 && (
                <>
                  <h3>이 인물과 이어진 소품·장소</h3>
                  <div className="item-chips">
                    {linked.map((c) => (
                      <button key={c.id} onClick={() => showItem(c.id)}>
                        <small>{kindLabel[c.kind]}</small>
                        {c.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
              <a href={selected.source?.url ?? official} target="_blank" rel="noreferrer">
                {selected.source ? `출처: ${selected.source.label} ↗` : "공식 캐릭터·캐스트 출처 ↗"}
              </a>
            </>
          ) : selected.kind === "person" ? (
            <>
              <p>
                「{titles[selected.title].name}」에서 {selected.name} 역을 맡았어요.
              </p>
              <p className="muted">배우의 다른 출연작은 위키백과에서 확인할 수 있어요.</p>
              <a href={actor?.profile ?? selected.voiceSource} target="_blank" rel="noreferrer">
                위키백과에서 {selected.voice} 찾기 ↗
              </a>
            </>
          ) : (
            <>
              <p>
                {actor?.profile
                  ? `${actor.agency} 소속 · 출연작은 소속사 공식 프로필 기준이에요.`
                  : "공식 프로필을 찾지 못해, 이 영상 크레딧으로 확인한 배역만 보여 드려요."}
              </p>
              <h3>
                공식 프로필의 다른 출연작
                {profileWorks.length > 0 && ` (${profileWorks.length})`}
              </h3>
              {profileWorks.length > 0 ? (
                <>
                  <ul className="profile-works">
                    {(allWorks ? profileWorks : profileWorks.slice(0, 8)).map(([title, role]) => (
                      <li key={title + role}>
                        <button
                          onClick={() => {
                            if (!remote) player.current?.pauseVideo?.();
                            setOpenWork({ title, role });
                          }}
                        >
                          <small>{workInfo[title]?.ko.role ?? role}</small>
                          {workInfo[title]?.ko.title ?? title}
                          <em>{title}</em>
                          <Play size={14} fill="currentColor" />
                        </button>
                      </li>
                    ))}
                  </ul>
                  {profileWorks.length > 8 && (
                    <button className="text-button more-works" onClick={() => setAllWorks((v) => !v)}>
                      {allWorks ? "접기" : `모두 보기 (${profileWorks.length})`}
                    </button>
                  )}
                </>
              ) : (
                <p className="muted">
                  {actor?.profile
                    ? "공식 프로필에 치이카와 외의 출연작이 없어요."
                    : "확인된 다른 출연작이 없어요."}
                </p>
              )}
              <a href={actor?.profile ?? selected.voiceSource} target="_blank" rel="noreferrer">
                {actor?.profile ? "공식 프로필 ↗" : "크레딧이 나온 영상 ↗"}
              </a>
            </>
          )}
        </div>
      ) : (
        <div className="empty">
          <Focus size={44} />
          <h2>
            {current.id === "chiikawa" ? "궁금한 친구를" : "궁금한 인물·소품을"}
            <br />
            가리켜 보세요.
          </h2>
          <p>
            영상 속 대상을 직접 클릭하면
            <br />
            화면 너머의 이야기가 열립니다.
          </p>
          <button onClick={openLibrary}>
            <Search size={15} /> 직접 찾아보기
          </button>
        </div>
      )}
    </>
  );
  const glassPanel = (
        <aside className={"result-panel glass-info " + (resultMinimized ? "is-minimized" : "")} aria-label="캐릭터 탐색 정보">
          <div className="glass-toolbar">
            <button className="glass-fold" aria-label={resultMinimized ? "정보 카드 펼치기" : "정보 카드 접기"} aria-expanded={!resultMinimized} onClick={() => setResultMinimized(v => !v)}>
              {resultMinimized ? <><Focus size={16} /> {libraryOpen ? "캐릭터 찾기" : selected?.name || "탐색 정보"} · 펼치기</> : <><Minimize size={14} /> 접기</>}
            </button>
          <button
            className="close-result"
            aria-label="검색 결과 닫기"
            onClick={() => setResultOpen(false)}
          >
            <X size={18} />
          </button>
          </div>
          <div className="glass-content" inert={resultMinimized}><div>{infoPanel}</div></div>
          <div className="aside-bottom">
            <Radio size={16} />
            <span>
              마우스와 휴대폰,
              <br />
              어느 쪽으로든 탐색할 수 있어요.
            </span>
          </div>
        </aside>
  );
  return (
    <>
      {!remote && state.connected && <RemoteCursor socket={socket} wake={wakeControls} target={!!hover && view === "watch"} />}
      {openWork && selected &&
        createPortal(
          <Modal label={openWork.title + " 작품 상세"} onClose={() => setOpenWork(null)} className="title-modal work-modal">
            <WorkClip
              key={openWork.title}
              title={openWork.title}
              role={openWork.role}
              character={selected}
              onOpen={(title, role) => {
                setOpenWork({ title, role });
                for (const el of document.querySelectorAll(".work-modal, .work-modal .stream-modal")) el.scrollTo({ top: 0 });
              }}
            />
          </Modal>,
          !remote && view === "watch" && theater.current ? theater.current : document.body,
        )}
      {remote && (
        <>
          <header>
            <a className="brand" href="/">
              NUTFLIX
            </a>
            <span className="header-caption">POINT & DISCOVER</span>
            <div className="connection">
              <i className={online ? "on" : ""} />
              {online
                ? remote
                  ? joined
                    ? "리모컨 연결됨"
                    : "세션 확인 중"
                  : state.connected
                    ? "휴대폰 연결됨"
                    : "마우스로 탐색 중"
                : "서버 연결 중"}
            </div>
          </header>
        </>
      )}
      {notice &&
        createPortal(
          <div role="alert" className="toast">
            {notice}
            <button onClick={() => setNotice("")}>닫기</button>
          </div>,
          fullscreen && theater.current ? theater.current : document.body,
        )}
      {remote ? (
        <main className={"remote" + (resultOpen ? " is-detail" : sheetOpen ? " has-sheet" : "")}>
          <div className="remote-heading">
            <div><div className="eyebrow">NUTFLIX REMOTE</div><h1>터치패드</h1></div>
            <button aria-label="리모컨 설정" onClick={() => setRemoteSettings(true)}><Settings2 size={22} /></button>
          </div>
          <p className="remote-help">한 손가락으로 이동 · 한 번 탭해 선택<br />두 손가락으로 스크롤</p>
          <div
            className={"touchpad" + (!joined ? " disconnected" : "")}
            aria-label="터치패드: 밀어서 이동, 한 번 탭해 선택, 두 손가락으로 스크롤"
            onPointerDown={(e) => {
              if (!joined || (e.pointerType === 'mouse' && e.button !== 0)) return;
              e.currentTarget.setPointerCapture(e.pointerId);
              touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
              if (touches.current.size === 1) tapStart.current = { x: e.clientX, y: e.clientY, time: performance.now(), moved: false };
              else if (tapStart.current) tapStart.current.moved = true;
            }}
            onPointerMove={(e) => {
              const old = touches.current.get(e.pointerId);
              if (!old || !joined) return;
              const dx = e.clientX - old.x, dy = e.clientY - old.y;
              touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
              const start = tapStart.current;
              if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8) start.moved = true;
              if (touches.current.size > 1) socket.emit('ui-scroll', { dy: -dy / 300 / touches.current.size });
              else if (!sensor) socket.emit('ui-move', { dx: dx / 300 * speed, dy: dy / 300 * speed });
            }}
            onPointerUp={(e) => {
              if (!touches.current.has(e.pointerId)) return;
              const start = tapStart.current;
              touches.current.delete(e.pointerId);
              if (joined && start && !start.moved && performance.now() - start.time < 350 && Math.hypot(e.clientX - start.x, e.clientY - start.y) <= 8) {
                socket.emit(sensor ? 'select' : 'ui-tap');
                navigator.vibrate?.(15);
              }
              if (!touches.current.size) tapStart.current = null;
            }}
            onPointerCancel={() => { touches.current.clear(); tapStart.current = null; }}
          >
            <Focus size={32} />
            <p>{!joined ? "PC 연결을 기다리고 있어요" : sensor ? "휴대폰을 움직이고, 여기를 탭해 선택하세요" : "밀어서 이동하고, 톡 눌러 선택하세요"}</p>
            <small>{sensor ? "영상 속 캐릭터를 가리켜 보세요" : "홈 · 영상 · 정보 카드까지 조작할 수 있어요"}</small>
          </div>
          <div className="remote-play">
            <button
              disabled={!joined}
              aria-label={state.playing ? "일시정지" : "재생"}
              className={state.playing ? "is-playing" : ""}
              onClick={() => { socket.emit("play"); navigator.vibrate?.(15); }}
            >
              {state.playing ? <Pause size={30} fill="currentColor" /> : <Play size={30} fill="currentColor" />}
            </button>
            <span>{!joined ? "연결 대기 중" : state.playing ? "재생 중 · 눌러서 일시정지" : "일시정지됨 · 눌러서 재생"}</span>
          </div>
          {remoteSettings && <Modal label="리모컨 설정" onClose={() => setRemoteSettings(false)} className="remote-settings-modal">
            <h2>리모컨 설정</h2>
            <label className="speed">포인터 속도 <strong>{speed.toFixed(1)}×</strong>
              <input aria-label="포인터 속도" type="range" min=".3" max="2" step=".1" value={speed} onChange={(e) => { setSpeed(+e.target.value); try { localStorage.setItem('point-remote-speed', e.target.value); } catch {} }} />
            </label>
            <h3>조작 방식</h3>
            <div className="segmented">
              <button className={mode !== 'sensor' ? 'active' : ''} onClick={() => { sensorCleanup.current?.(); setSensor(false); setMode('touch'); }}>터치패드</button>
              <button className={mode === 'sensor' ? 'active' : ''} onClick={startSensor}>기울기 센서</button>
            </div>
            <p>터치패드는 사이트 전체를 조작합니다. 기울기 센서는 영상 속 캐릭터를 가리킬 때 사용합니다.</p>
            <button className="wide" onClick={() => { calibration.current = orientation.current; point({x:.5,y:.5}); socket.emit('ui-center'); }}>포인터 기준점 재설정</button>
          </Modal>}
          {current.ost && (
            <section className="remote-extras">
              <TitleExtras title={current} compact />
            </section>
          )}
          <section className="remote-history">
            <div className="remote-history-head">
              <h2>검색 기록</h2>
              {searchLog.length > 0 && <button onClick={() => setSearchLog([])}>지우기</button>}
            </div>
            {searchLog.length ? (
              <ul>
                {searchLog.map((id) => {
                  const c = characters.find((c) => c.id === id)!;
                  return (
                    <li key={id}>
                      <button onClick={() => chooseCharacter(id)}>
                        <img src={c.image} alt="" />
                        <span><strong>{c.name}</strong><small>{itemSub(c)}</small></span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p>영상 속 캐릭터를 가리켜 선택하면 여기에 기록돼요.</p>
            )}
          </section>
          {sheetOpen && selected && !resultOpen && (
            <section
              className="remote-sheet"
              aria-label="선택한 캐릭터 미리보기"
              onPointerDown={(e) => {
                // Swipes start on the sheet only, so a drag on the touchpad never moves it; the release may land anywhere.
                const start = e.clientY;
                const end = (ev: PointerEvent) => {
                  removeEventListener("pointerup", end);
                  removeEventListener("pointercancel", end);
                  if (ev.type !== "pointerup") return;
                  if (ev.clientY - start < -40) openDetail();
                  else if (ev.clientY - start > 40) setSheetOpen(false);
                };
                addEventListener("pointerup", end);
                addEventListener("pointercancel", end);
              }}
            >
              <div className="remote-sheet-grip" aria-hidden="true" />
              <div className="remote-sheet-body" key={selected.id}>
                <img src={selected.image} alt="" />
                <div>
                  <small>{titles[selected.title].name}</small>
                  <strong>{selected.name}</strong>
                  <span>{itemSub(selected)}</span>
                </div>
                <button className="remote-sheet-close" aria-label="미리보기 닫기" onClick={() => setSheetOpen(false)}><X size={18} /></button>
              </div>
              <button className="remote-sheet-more" onClick={openDetail}>자세히 보기</button>
            </section>
          )}
          {resultOpen && <aside className="remote-information" ref={remoteInfo}>
            <button className="wide remote-return" onClick={closeDetail}><ArrowLeft size={16} /> 터치패드로 돌아가기</button>
            {infoPanel}
          </aside>}
        </main>
      ) : (
        <>
          {view === "browse" && (
            <BrowseHome
              onPlay={enterWatch}
              onDetails={openDetails}
              titleId={titleId}
              onCharacter={chooseCharacter}
              onActor={openActor}
              onPair={() => setPairOpen(true)}
              onSearch={openLibrary}
              onEdit={() => {
                setView("watch");
                setFullscreen(false);
                setEditor(true);
                setTitleOpen(false);
                setResultOpen(false);
                wakeControls();
              }}
              connected={state.connected}
              resume={resume}
              saved={saved}
              showSaved={showSaved}
              onTab={setShowSaved}
            />
          )}
          <main
            className={
              "watch-shell " + (view === "watch" ? "is-active" : "is-inactive")
            }
            aria-hidden={view !== "watch"}
          >
            <div
              ref={theater}
              onPointerMove={wakeControls}
              onFocus={wakeControls}
              className={
                "workspace theater watch-stage " +
                (fullscreen ? "app-expanded " : "") +
                (resultOpen && (selected || libraryOpen)
                  ? "show-result "
                  : "") +
                (controlsVisible ? "controls-visible" : "")
              }
            >
              <div className="watch-topbar">
                <button
                  aria-label="홈으로 돌아가기"
                  title="홈으로 돌아가기"
                  onClick={goBrowse}
                >
                  <ArrowLeft size={30} />
                </button>
                <div>
                  <strong>{current.name}</strong>
                  <span>{current.label}</span>
                </div>
                {editor && (
                  <button
                    className="finish-edit"
                    onClick={() => {
                      setEditor(false);
                      setDragBox(null);
                    }}
                  >
                    편집 완료
                  </button>
                )}
                <button
                  aria-label="작품 상세 정보"
                  title="작품 상세 정보"
                  onClick={() => openDetails(titleId)}
                >
                  <ListVideo size={26} />
                </button>
              </div>
              <section className="viewing">
                <div className="video">
                  <div
                    className="video-picture"
                    style={{
                      filter: `brightness(${playback.brightness / 100})`,
                    }}
                  >
                    <div id="youtube" />
                  </div>
                  {!ready && (
                    <div className="player-loading">
                      <Radio size={25} />
                      <span>YouTube 영상을 준비하고 있어요.</span>
                    </div>
                  )}
                  {(explore || editor) && ready && (
                    <div
                      className={
                        "video-interaction " + (editor ? "drawing" : "")
                      }
                      role="application"
                      aria-label="영상 속 캐릭터 직접 선택"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        const keys = [
                          "ArrowLeft",
                          "ArrowRight",
                          "ArrowUp",
                          "ArrowDown",
                          "Enter",
                        ];
                        if (!keys.includes(e.key)) return;
                        e.preventDefault();
                        e.stopPropagation();
                        if (e.key === "Enter") select();
                        else
                          point({
                            x: clamp(
                              pointer.current.x +
                                (e.key === "ArrowRight"
                                  ? 0.025
                                  : e.key === "ArrowLeft"
                                    ? -0.025
                                    : 0),
                            ),
                            y: clamp(
                              pointer.current.y +
                                (e.key === "ArrowDown"
                                  ? 0.025
                                  : e.key === "ArrowUp"
                                    ? -0.025
                                    : 0),
                            ),
                          });
                      }}
                      onPointerDown={(e) => {
                        if (!editor) return;
                        player.current?.pauseVideo?.();
                        dragStart.current = videoPoint(e);
                        setDragBox(null);
                        e.currentTarget.setPointerCapture(e.pointerId);
                      }}
                      onPointerMove={(e) => {
                        const p = videoPoint(e);
                        if (editor && dragStart.current) {
                          const a = dragStart.current;
                          setDragBox({
                            x: Math.min(a.x, p.x),
                            y: Math.min(a.y, p.y),
                            width: Math.abs(a.x - p.x),
                            height: Math.abs(a.y - p.y),
                          });
                        } else if (!editor) point(p);
                      }}
                      onPointerUp={(e) => {
                        if (!editor || !dragStart.current) return;
                        const p = videoPoint(e),
                          a = dragStart.current;
                        dragStart.current = null;
                        const box = {
                          x: Math.min(a.x, p.x),
                          y: Math.min(a.y, p.y),
                          width: Math.abs(a.x - p.x),
                          height: Math.abs(a.y - p.y),
                        };
                        if (box.width > 0.01 && box.height > 0.01)
                          setDrawn({
                            box,
                            time:
                              player.current?.getCurrentTime?.() || state.time,
                          });
                      }}
                      onClick={(e) => {
                        if (editor || dragStart.current) return;
                        const p = videoPoint(e);
                        socket.emit(
                          "time",
                          player.current?.getCurrentTime?.() || state.time,
                        );
                        socket.emit("pointer", p);
                        socket.emit("select", { target: remote || remoteInputActive ? "remote" : "host" });
                      }}
                    >
                      {active.map((r, i) => (
                        <div
                          key={i}
                          className={
                            "video-region " +
                            (hover === r.characterId ? "hover" : "")
                          }
                          style={{
                            left: `${r.boundingBox.x * 100}%`,
                            top: `${r.boundingBox.y * 100}%`,
                            width: `${r.boundingBox.width * 100}%`,
                            height: `${r.boundingBox.height * 100}%`,
                          }}
                        >
                          <span>
                            {
                              characters.find((c) => c.id === r.characterId)
                                ?.name
                            }
                          </span>
                        </div>
                      ))}
                      {editor && dragBox && (
                        <div
                          className="draw-box"
                          style={{
                            left: `${dragBox.x * 100}%`,
                            top: `${dragBox.y * 100}%`,
                            width: `${dragBox.width * 100}%`,
                            height: `${dragBox.height * 100}%`,
                          }}
                        />
                      )}
                      {!editor && (
                        <div
                          className={"cursor " + (hover ? "target" : "")}
                          style={{
                            left: `${state.pointer.x * 100}%`,
                            top: `${state.pointer.y * 100}%`,
                          }}
                        >
                          <Focus size={28} />
                        </div>
                      )}
                    </div>
                  )}
                  {pulse && view === "watch" && (
                    <div key={pulse.at} className="select-pulse" style={{ left: `${pulse.x * 100}%`, top: `${pulse.y * 100}%` }} aria-hidden="true">
                      <Check size={22} strokeWidth={3} />
                    </div>
                  )}
                  {showUpNext && (
                    <div className="next-up" onClick={(e) => e.stopPropagation()}>
                      <p>
                        <small>이야기가 끝나가요</small>
                        {current.name} 상세 정보로 이동해요
                      </p>
                      <div>
                        {playerState !== 0 && (
                          <button className="next-up-credits" onClick={() => setUpNextDismissed(true)}>
                            크레딧 보기
                          </button>
                        )}
                        <button className="next-up-play" onClick={goUpNext}>
                          <span
                            className="next-up-fill"
                            style={{ transform: `scaleX(${playerState === 0 ? 0 : (UP_NEXT_SECONDS - upNextLeft) / UP_NEXT_SECONDS})` }}
                          />
                          <ListVideo size={20} />
                          상세 정보
                          {playerState !== 0 && playing && <small>{upNextLeft}초</small>}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <label className="video-seek">
                  <span>{format(state.time)}</span>
                  <input
                    aria-label="영상 시간 이동"
                    type="range"
                    min="0"
                    max={duration || 1}
                    step="0.01"
                    value={Math.min(state.time, duration || 1)}
                    onChange={(e) =>
                      player.current?.seekTo?.(+e.target.value, true)
                    }
                  />
                  <span aria-label="남은 재생 시간">
                    {format(Math.max(0, duration - state.time))}
                  </span>
                </label>
                <div ref={controls} className="direct-tools stream-controls">
                  <div className="transport-controls">
                    <button
                      className="player-icon play-control"
                      aria-label={playerState === 0 ? "처음부터 다시 재생" : playing ? "영상 일시정지" : "영상 재생"}
                      title="재생 / 일시정지 (Space)"
                      onClick={() => socket.emit("play")}
                      disabled={!ready}
                    >
                      {playerState === 0 ? (
                        <RotateCcw size={29} />
                      ) : playing ? (
                        <Pause size={31} fill="currentColor" />
                      ) : (
                        <Play size={31} fill="currentColor" />
                      )}
                    </button>
                    <button
                      className="player-icon skip-control"
                      aria-label="10초 뒤로"
                      title="10초 뒤로"
                      onClick={() => skip(-10)}
                      disabled={!ready}
                    >
                      <RotateCcw size={31} />
                      <small>10</small>
                    </button>
                    <button
                      className="player-icon skip-control"
                      aria-label="10초 앞으로"
                      title="10초 앞으로"
                      onClick={() => skip(10)}
                      disabled={!ready}
                    >
                      <RotateCw size={31} />
                      <small>10</small>
                    </button>
                    <div className="player-volume">
                      <button
                        className="player-icon"
                        aria-label={
                          playback.muted || playback.volume === 0
                            ? "음소거 해제"
                            : "음소거"
                        }
                        aria-pressed={playback.muted || playback.volume === 0}
                        aria-keyshortcuts="m"
                        title={
                          playback.muted ? "음소거 해제 (M)" : "음소거 (M)"
                        }
                        onClick={toggleMute}
                        disabled={!ready}
                      >
                        {playback.muted || playback.volume === 0 ? (
                          <VolumeX size={29} />
                        ) : (
                          <Volume2 size={29} />
                        )}
                      </button>
                      <input
                        aria-label="음량"
                        aria-valuetext={
                          playback.muted ? "음소거" : `${playback.volume}%`
                        }
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={playback.muted ? 0 : playback.volume}
                        onChange={(e) => changeVolume(+e.target.value)}
                        disabled={!ready}
                      />
                    </div>
                  </div>
                  <span className="playback-episode-title">
                    {current.name} <span>{current.label}</span>
                  </span>
                  <div className="player-feature-controls">
                    <button
                      className={
                        "player-discover " + (explore ? "enabled" : "")
                      }
                      title="캐릭터 정보 탐색"
                      onClick={openLibrary}
                    >
                      <Focus size={23} />
                      <span>캐릭터</span>
                    </button>
                    <button
                      className="player-icon"
                      aria-label="휴대폰 리모컨 연결"
                      title="휴대폰 리모컨 연결"
                      onClick={() => setPairOpen(true)}
                    >
                      <Smartphone size={26} />
                      {state.connected && <i className="paired-dot" />}
                    </button>
                    <div className="player-brightness">
                      <button
                        className="player-icon"
                        aria-label="영상 밝기 조절"
                        title="영상 밝기 조절"
                        aria-expanded={brightnessOpen}
                        onClick={() => {
                          setBrightnessOpen((v) => !v);
                          wakeControls();
                        }}
                      >
                        <Sun size={27} />
                      </button>
                      {brightnessOpen && (
                        <div className="brightness-popover">
                          <div>
                            <strong>영상 밝기</strong>
                            <output>{playback.brightness}%</output>
                          </div>
                          <input
                            aria-label="영상 밝기"
                            aria-valuetext={`${playback.brightness}%`}
                            type="range"
                            min="40"
                            max="150"
                            step="5"
                            value={playback.brightness}
                            onChange={(e) => changeBrightness(+e.target.value)}
                          />
                          <button onClick={() => changeBrightness(100)}>
                            기본값으로
                          </button>
                        </div>
                      )}
                    </div>
                    <button
                      className="player-icon fullscreen-button"
                      aria-label={
                        fullscreen ? "전체화면 나가기" : "전체화면으로 보기"
                      }
                      aria-keyshortcuts="f Escape"
                      title={
                        fullscreen
                          ? "전체화면 나가기 (Esc)"
                          : "전체화면으로 보기 (F)"
                      }
                      onClick={toggleFullscreen}
                    >
                      {fullscreen ? (
                        <Minimize size={27} />
                      ) : (
                        <Maximize size={27} />
                      )}
                    </button>
                  </div>
                </div>
                <div className="video-meta">
                  <div>
                    <span className="tag">지금 시청 중</span>
                    <h2>{current.name} · {current.label}</h2>
                    <p>YouTube · {current.source}</p>
                  </div>
                  <button
                    aria-label="재생 또는 일시정지"
                    onClick={() => socket.emit("play")}
                  >
                    <Play size={18} />
                  </button>
                </div>
                {editor && (
                  <Editor
                    title={current}
                    drawn={drawn}
                    regions={regions}
                    setRegions={setRegions}
                    time={state.time}
                    session={session}
                    seek={(t) => {
                      player.current?.seekTo(t, true);
                      player.current?.playVideo?.();
                      setTimeout(() => player.current?.pauseVideo?.(), 1000);
                    }}
                    notify={setNotice}
                  />
                )}
              </section>
              {glassPanel}
            </div>
          </main>
          {view === "browse" &&
            resultOpen &&
            (selected || libraryOpen) &&
            createPortal(
              <div className="watch-stage show-result browse-glass">{glassPanel}</div>,
              document.body,
            )}
          {titleOpen &&
            createPortal(
              <Modal
                label={titles[detailsId].name + " 작품 상세"}
                onClose={() => setTitleOpen(false)}
                className="title-modal"
              >
                <TitleDetails
                  title={titles[detailsId]}
                  onPlay={(time) => enterWatch(time, detailsId)}
                  onSave={() => toggleSaved(detailsId)}
                  saved={saved.includes(detailsId)}
                  onCharacter={chooseCharacter}
                />
              </Modal>,
              view === "watch" && theater.current
                ? theater.current
                : document.body,
            )}
          {pairOpen &&
            createPortal(
              <Modal
                label="휴대폰 리모컨 연결"
                onClose={() => setPairOpen(false)}
                className="pair-modal"
              >
                <div className="pair-dialog">
                  <Smartphone size={34} />
                  <h2>휴대폰을 리모컨으로.</h2>
                  <p>
                    같은 Wi-Fi에서 QR을 스캔하면
                    <br />
                    휴대폰으로 캐릭터를 가리킬 수 있어요.
                  </p>
                  {qr ? (
                    <img
                      className="pair-qr"
                      src={qr}
                      alt="휴대폰 리모컨 연결 QR 코드"
                    />
                  ) : (
                    <div className="pair-loading">
                      연결 코드를 준비하고 있어요.
                    </div>
                  )}
                  <div
                    className={
                      "pair-status " + (state.connected ? "connected" : "")
                    }
                  >
                    <i />
                    {state.connected
                      ? "휴대폰이 연결됐어요"
                      : "휴대폰 연결을 기다리는 중"}
                  </div>
                  <label>
                    접속 주소
                    <input
                      value={base}
                      onChange={(e) => setBase(e.target.value)}
                      placeholder="http://192.168.0.10:5173"
                    />
                  </label>
                  <div className="pair-actions">
                    <a href={remoteUrl} target="_blank" rel="noreferrer">
                      리모컨 열기 <ArrowUpRight size={15} />
                    </a>
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(remoteUrl);
                          setNotice("리모컨 연결 주소를 복사했어요.");
                        } catch {
                          setNotice(
                            "주소를 복사하지 못했어요. 접속 주소를 확인해 주세요.",
                          );
                        }
                      }}
                    >
                      연결 링크 복사
                    </button>
                  </div>
                  <p className="pair-hint">
                    터치패드는 바로 사용할 수 있어요.
                    <br />
                    기울기 센서를 사용하려면 HTTPS 연결이 필요합니다.
                  </p>
                </div>
              </Modal>,
              view === "watch" && theater.current
                ? theater.current
                : document.body,
            )}
        </>
      )}
    </>
  );
}
function ActorPhoto({ character }: { character: (typeof characters)[number] }) {
  const [failed, setFailed] = useState(false);
  return <a className="actor-portrait" href={character.voiceSource} target="_blank" rel="noreferrer" aria-label={character.voice + " 공식 프로필"}>
    {failed || !character.voiceImage ? <span>{character.kind === "person" ? "위키백과에서 보기 ↗" : "공식 프로필 보기 ↗"}</span> : <img src={character.voiceImage} alt={character.voice + " 프로필 사진"} onError={() => setFailed(true)} />}
  </a>;
}
function CharacterArt({
  character,
  compact = false,
}: {
  character: (typeof characters)[number];
  compact?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className={compact ? "character-art compact" : "character-art"}
      style={{ background: character.color }}
    >
      {failed ? (
        <span>{character.name}</span>
      ) : (
        <img
          src={character.image}
          alt={`${character.name} 캐릭터 이미지`}
          decoding="async"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
function format(t: number) {
  return `${Math.floor(t / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(t % 60)
    .toString()
    .padStart(2, "0")}`;
}
function Editor({
  drawn,
  regions,
  setRegions,
  time,
  session,
  seek,
  notify,
  title,
}: {
  title: Title;
  drawn: Drawn | null;
  regions: Region[];
  setRegions: (r: Region[]) => void;
  time: number;
  session: Session | null;
  seek: (t: number) => void;
  notify: (s: string) => void;
}) {
  const [draft, setDraft] = useState<Region>({
      characterId: itemsOf(title.id)[0].id,
      video: title.video,
      startTime: 0,
      endTime: 5,
      boundingBox: { x: 0.1, y: 0.1, width: 0.3, height: 0.5 },
      keyframes: [],
    }),
    [index, setIndex] = useState(-1);
  useEffect(() => {
    if (drawn) {
      setDraft((d) => ({
        ...d,
        video: title.video,
        startTime: Math.round(drawn.time * 100) / 100,
        endTime: Math.round((drawn.time + 1) * 100) / 100,
        boundingBox: drawn.box,
        keyframes: [],
      }));
      setIndex(-1);
    }
  }, [drawn]);
  const update = (key: string, value: number) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const add = () => {
    if (!validRegions([draft]))
      return notify(
        "시작·종료 시간과 좌표를 확인해 주세요. 영역은 패널 안에 있어야 합니다.",
      );
    setRegions(
      index < 0
        ? [...regions, draft]
        : regions.map((r, i) => (i === index ? draft : r)),
    );
    setIndex(-1);
    notify("목록에 반영했습니다. 서버 저장을 누르면 파일에 보관됩니다.");
  };
  return (
    <section className="editor">
      <h3>
        <Settings2 size={17} /> 장면 어노테이션
      </h3>
      <p className="small">
        영상 위 캐릭터 주위로 드래그하면 좌표가 입력됩니다. 캐릭터와 유효 시간을
        확인하고 영역 추가 → 서버 저장을 누르세요. 기본 구간은 1초이며 실제
        움직임에 맞게 조정하세요.
      </p>
      <details className="review-tools">
        <summary>편집 도구 · 시간 이동</summary>
        <div>
          {Array.from({ length: 46 }, (_, i) => (
            <button key={i} onClick={() => seek(i * 2)}>
              {i * 2}초로 이동
            </button>
          ))}
        </div>
      </details>
      <div className="editor-grid">
        <label>
          캐릭터
          <select
            value={draft.characterId}
            onChange={(e) =>
              setDraft({ ...draft, characterId: e.target.value })
            }
          >
            {itemsOf(title.id).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {kindLabel[c.kind]}
              </option>
            ))}
          </select>
        </label>
        {["startTime", "endTime"].map((k, i) => (
          <label key={k}>
            {i ? "종료(초)" : "시작(초)"}
            <input
              type="number"
              min="0"
              step=".1"
              value={(draft as any)[k]}
              onChange={(e) => update(k, +e.target.value)}
            />
          </label>
        ))}
        {(["x", "y", "width", "height"] as const).map((k) => (
          <label key={k}>
            {k}
            <input
              type="number"
              step=".01"
              min="0"
              max="1"
              value={draft.boundingBox[k]}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  boundingBox: { ...draft.boundingBox, [k]: +e.target.value },
                })
              }
            />
          </label>
        ))}
      </div>
      <div className="draft-preview">
        <div
          style={{
            left: `${draft.boundingBox.x * 100}%`,
            top: `${draft.boundingBox.y * 100}%`,
            width: `${draft.boundingBox.width * 100}%`,
            height: `${draft.boundingBox.height * 100}%`,
          }}
        >
          {characters.find((c) => c.id === draft.characterId)?.name}
        </div>
      </div>
      <div className="editor-actions">
        <button onClick={() => update("startTime", Math.round(time * 10) / 10)}>
          현재 시간을 시작점으로
        </button>
        <button onClick={() => seek(draft.startTime)}>시작점으로 이동</button>
        <button
          onClick={() => {
            if (time < draft.startTime || time > draft.endTime)
              return notify("키프레임은 시작과 종료 시간 사이에 추가하세요.");
            setDraft({
              ...draft,
              keyframes: [
                ...(draft.keyframes || []).filter(
                  (k) => Math.abs(k.time - time) > 0.05,
                ),
                {
                  time: Math.round(time * 100) / 100,
                  boundingBox: { ...draft.boundingBox },
                },
              ],
            });
          }}
        >
          현재 좌표 키프레임 추가 ({draft.keyframes?.length || 0})
        </button>
        <button onClick={() => setDraft({ ...draft, keyframes: [] })}>
          키프레임 비우기
        </button>
        <button className="primary" onClick={add}>
          {index < 0 ? "영역 추가" : "영역 수정 반영"}
        </button>
      </div>
      <div className="saved-regions">
        {regions.length === 0 ? (
          <p className="small">저장된 실제 장면 영역이 없습니다.</p>
        ) : (
          regions.map((r, i) => (
            <div key={i}>
              <button
                onClick={() => {
                  setDraft(structuredClone(r));
                  setIndex(i);
                  seek(r.startTime);
                }}
              >
                {characters.find((c) => c.id === r.characterId)?.name} ·{" "}
                {r.startTime}~{r.endTime}초 · 수정
              </button>
              <button
                onClick={() => setRegions(regions.filter((_, j) => i !== j))}
              >
                삭제
              </button>
            </div>
          ))
        )}
      </div>
      <div className="editor-actions">
        <button
          className="primary"
          onClick={async () => {
            try {
              const r = await fetch("/api/regions", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "X-Session-Id": session?.id || "",
                  "X-Session-Token": session?.hostToken || "",
                },
                body: JSON.stringify(regions),
              });
              const data = await r.json();
              if (!r.ok) throw Error(data.error);
              notify("서버 JSON 파일에 저장했습니다.");
            } catch (e) {
              notify((e as Error).message);
            }
          }}
        >
          <Check size={14} /> 서버 저장
        </button>
        <button
          onClick={() => {
            const url = URL.createObjectURL(
              new Blob([JSON.stringify(regions, null, 2)], {
                type: "application/json",
              }),
            );
            const a = document.createElement("a");
            a.href = url;
            a.download = "regions.json";
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          JSON 내보내기
        </button>
        <label className="file-button">
          JSON 가져오기
          <input
            type="file"
            accept="application/json"
            onChange={async (e) => {
              try {
                const file = e.target.files?.[0];
                if (!file) return;
                const data = JSON.parse(await file.text());
                if (!validRegions(data))
                  throw Error("유효한 영역 데이터가 아닙니다.");
                setRegions(data);
                notify("가져왔습니다. 서버 저장으로 보관하세요.");
              } catch (e) {
                notify((e as Error).message);
              }
            }}
          />
        </label>
      </div>
    </section>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
