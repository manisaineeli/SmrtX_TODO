import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Repeat, Shuffle, Music2, Heart } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const TRACKS = [
  {
    id: 1,
    title: "Lofi Vibes",
    artist: "SmrtX Radio",
    duration: 0,
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    color: "from-violet-600 to-purple-900",
    emoji: "🌙",
  },
  {
    id: 2,
    title: "Ambient Flow",
    artist: "SmrtX Radio",
    duration: 0,
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    color: "from-cyan-600 to-blue-900",
    emoji: "🌊",
  },
  {
    id: 3,
    title: "Focus Mode",
    artist: "SmrtX Radio",
    duration: 0,
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
    color: "from-emerald-600 to-teal-900",
    emoji: "🎯",
  },
  {
    id: 4,
    title: "Chill Beats",
    artist: "SmrtX Radio",
    duration: 0,
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-17.mp3",
    color: "from-pink-600 to-rose-900",
    emoji: "✨",
  },
  {
    id: 5,
    title: "Deep Work",
    artist: "SmrtX Radio",
    duration: 0,
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    color: "from-amber-600 to-orange-900",
    emoji: "🔥",
  },
  {
    id: 6,
    title: "Night Session",
    artist: "SmrtX Radio",
    duration: 0,
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
    color: "from-indigo-600 to-violet-900",
    emoji: "🌃",
  },
];

function formatTime(seconds: number) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function VisualizerBars({ playing }: { playing: boolean }) {
  const bars = Array.from({ length: 20 });
  return (
    <div className="flex items-end gap-0.5 h-10">
      {bars.map((_, i) => (
        <motion.div
          key={i}
          className="w-1.5 rounded-full bg-gradient-to-t from-violet-500 to-cyan-400 opacity-80"
          animate={
            playing
              ? {
                  height: [
                    `${8 + Math.random() * 24}px`,
                    `${16 + Math.random() * 24}px`,
                    `${4 + Math.random() * 20}px`,
                  ],
                }
              : { height: "4px" }
          }
          transition={{
            duration: 0.4 + Math.random() * 0.4,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
            delay: i * 0.05,
          }}
        />
      ))}
    </div>
  );
}

export default function Music() {
  const [trackIdx, setTrackIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [muted, setMuted] = useState(false);
  const [liked, setLiked] = useState<Set<number>>(new Set());
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const track = TRACKS[trackIdx];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onLoaded = () => setDuration(audio.duration);
    const onEnded = () => {
      if (repeat) { audio.currentTime = 0; audio.play(); }
      else nextTrack();
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnded);
    };
  }, [trackIdx, repeat]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume;
  }, [volume, muted]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else { audio.play().then(() => setPlaying(true)).catch(() => {}); }
  }, [playing]);

  const nextTrack = useCallback(() => {
    const next = shuffle
      ? Math.floor(Math.random() * TRACKS.length)
      : (trackIdx + 1) % TRACKS.length;
    setTrackIdx(next);
    setPlaying(false);
    setTimeout(() => {
      audioRef.current?.play().then(() => setPlaying(true)).catch(() => {});
    }, 100);
  }, [trackIdx, shuffle]);

  const prevTrack = useCallback(() => {
    if (currentTime > 3) {
      if (audioRef.current) { audioRef.current.currentTime = 0; return; }
    }
    setTrackIdx((idx) => (idx - 1 + TRACKS.length) % TRACKS.length);
    setPlaying(false);
    setTimeout(() => {
      audioRef.current?.play().then(() => setPlaying(true)).catch(() => {});
    }, 100);
  }, [currentTime]);

  const seek = (val: number[]) => {
    if (audioRef.current) audioRef.current.currentTime = val[0];
    setCurrentTime(val[0]);
  };

  const toggleLike = (id: number) => {
    setLiked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-violet-400 bg-clip-text text-transparent">
        Music
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4">
          <motion.div
            key={track.id}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "relative rounded-3xl overflow-hidden p-8 bg-gradient-to-br",
              track.color
            )}
          >
            <div className="absolute inset-0 bg-black/30" />
            <div className="relative z-10 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <motion.p
                    key={track.id + "title"}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl font-bold text-white"
                  >
                    {track.title}
                  </motion.p>
                  <p className="text-white/60 mt-1">{track.artist}</p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => toggleLike(track.id)}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                    liked.has(track.id) ? "bg-pink-500 text-white" : "bg-white/10 text-white/60 hover:bg-white/20"
                  )}
                >
                  <Heart className={cn("w-5 h-5", liked.has(track.id) && "fill-current")} />
                </motion.button>
              </div>

              <div className="flex items-center gap-6">
                <span className="text-6xl">{track.emoji}</span>
                <VisualizerBars playing={playing} />
              </div>

              <div className="space-y-2">
                <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={1}
                  onValueChange={seek}
                  className="w-full [&_[role=slider]]:bg-white [&_[role=slider]]:border-0 [&_.bg-primary]:bg-white/60"
                />
                <div className="flex justify-between text-xs text-white/50">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => setShuffle(!shuffle)}
                    className={cn("text-white/50 hover:text-white transition-colors", shuffle && "text-cyan-300")}
                  >
                    <Shuffle className="w-4 h-4" />
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.85 }} onClick={prevTrack} className="text-white/70 hover:text-white">
                    <SkipBack className="w-6 h-6" />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={togglePlay}
                    className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg shadow-white/20"
                  >
                    {playing
                      ? <Pause className="w-6 h-6 text-black" />
                      : <Play className="w-6 h-6 text-black ml-0.5" />}
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.85 }} onClick={nextTrack} className="text-white/70 hover:text-white">
                    <SkipForward className="w-6 h-6" />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => setRepeat(!repeat)}
                    className={cn("text-white/50 hover:text-white transition-colors", repeat && "text-cyan-300")}
                  >
                    <Repeat className="w-4 h-4" />
                  </motion.button>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => setMuted(!muted)} className="text-white/60 hover:text-white">
                    {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <Slider
                    value={[muted ? 0 : volume * 100]}
                    max={100}
                    step={1}
                    onValueChange={(v) => { setVolume(v[0] / 100); setMuted(false); }}
                    className="w-20 [&_[role=slider]]:bg-white [&_[role=slider]]:border-0 [&_.bg-primary]:bg-white/60"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-white/3 backdrop-blur overflow-hidden">
          <div className="p-4 border-b border-white/5">
            <h2 className="font-semibold text-white/70 text-sm flex items-center gap-2">
              <Music2 className="w-4 h-4" />
              Playlist
            </h2>
          </div>
          <div className="divide-y divide-white/5">
            {TRACKS.map((t, idx) => (
              <motion.button
                key={t.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setTrackIdx(idx);
                  setPlaying(false);
                  setTimeout(() => {
                    audioRef.current?.play().then(() => setPlaying(true)).catch(() => {});
                  }, 100);
                }}
                className={cn(
                  "w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-white/5",
                  trackIdx === idx && "bg-white/8"
                )}
              >
                <div className={cn("w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center text-lg flex-shrink-0", t.color)}>
                  {t.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium truncate", trackIdx === idx ? "text-white" : "text-white/70")}>{t.title}</p>
                  <p className="text-xs text-white/30 truncate">{t.artist}</p>
                </div>
                {trackIdx === idx && playing && (
                  <div className="flex items-end gap-0.5 h-4 flex-shrink-0">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-0.5 bg-violet-400 rounded-full"
                        animate={{ height: ["6px", "14px", "4px"] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                )}
                <AnimatePresence>
                  {liked.has(t.id) && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="text-pink-400 flex-shrink-0"
                    >
                      <Heart className="w-3.5 h-3.5 fill-current" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      <audio ref={audioRef} src={track.src} preload="metadata" />
    </div>
  );
}
