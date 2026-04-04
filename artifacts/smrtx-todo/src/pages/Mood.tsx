import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, CameraOff, RefreshCw, Smile, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Mood = {
  label: string;
  emoji: string;
  score: number;
  color: string;
  gradient: string;
  tip: string;
};

const MOOD_TIPS: Record<string, string> = {
  Happy: "You're glowing! Ride this wave and tackle your most creative tasks now.",
  Energetic: "High energy detected — perfect time for challenging, focused work!",
  Calm: "Serene vibes. Great for deep work, reading, or thoughtful planning.",
  Neutral: "Steady state. A consistent mood is great for routine tasks.",
  Tired: "Your light levels suggest fatigue. Consider a Pomodoro break or a walk.",
  Sad: "Take it easy. Start with small wins and don't forget to hydrate.",
};

function analyzeMood(canvas: HTMLCanvasElement): Mood[] {
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];
  const { width, height } = canvas;
  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  const size = Math.min(width, height) * 0.4;
  const imageData = ctx.getImageData(cx - size / 2, cy - size / 2, size, size);
  const data = imageData.data;

  let r = 0, g = 0, b = 0, count = 0;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    count++;
  }
  r /= count; g /= count; b /= count;

  const brightness = (r + g + b) / 3;
  const warmth = (r - b) / 255;
  const saturation = Math.max(r, g, b) - Math.min(r, g, b);

  const happy = Math.max(0, Math.min(100, (brightness / 255) * 60 + Math.max(0, warmth) * 40));
  const energetic = Math.max(0, Math.min(100, (saturation / 255) * 70 + (brightness / 255) * 30));
  const calm = Math.max(0, Math.min(100, 100 - saturation / 255 * 60 - Math.abs(warmth) * 40 + brightness / 255 * 20));
  const neutral = Math.max(0, Math.min(100, 50 + (brightness / 255 - 0.5) * 20 - saturation / 255 * 30));
  const tired = Math.max(0, Math.min(100, 100 - brightness / 255 * 80));
  const sad = Math.max(0, Math.min(100, Math.max(0, -warmth) * 60 + (100 - brightness / 255 * 60) * 0.4));

  const moods: Mood[] = [
    { label: "Happy", emoji: "😊", score: happy, color: "text-yellow-400", gradient: "from-yellow-500 to-orange-500", tip: MOOD_TIPS["Happy"] },
    { label: "Energetic", emoji: "⚡", score: energetic, color: "text-red-400", gradient: "from-red-500 to-pink-500", tip: MOOD_TIPS["Energetic"] },
    { label: "Calm", emoji: "😌", score: calm, color: "text-blue-400", gradient: "from-blue-500 to-cyan-500", tip: MOOD_TIPS["Calm"] },
    { label: "Neutral", emoji: "😐", score: neutral, color: "text-slate-400", gradient: "from-slate-500 to-slate-600", tip: MOOD_TIPS["Neutral"] },
    { label: "Tired", emoji: "😴", score: tired, color: "text-indigo-400", gradient: "from-indigo-500 to-violet-500", tip: MOOD_TIPS["Tired"] },
    { label: "Sad", emoji: "😢", score: sad, color: "text-sky-400", gradient: "from-sky-500 to-blue-600", tip: MOOD_TIPS["Sad"] },
  ];

  const total = moods.reduce((sum, m) => sum + m.score, 0) || 1;
  return moods
    .map((m) => ({ ...m, score: Math.round((m.score / total) * 100) }))
    .sort((a, b) => b.score - a.score);
}

export default function Mood() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [moods, setMoods] = useState<Mood[]>([]);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      setStream(s);
      setCameraOn(true);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.play();
      }
    } catch {
      setError("Camera access denied. Please allow camera permissions and try again.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setCameraOn(false);
    setMoods([]);
    setScanning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [stream]);

  const captureAndAnalyze = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const result = analyzeMood(canvas);
    setMoods(result);
  }, []);

  const startScanning = useCallback(() => {
    setScanning(true);
    captureAndAnalyze();
    intervalRef.current = setInterval(captureAndAnalyze, 1500);
  }, [captureAndAnalyze]);

  const stopScanning = useCallback(() => {
    setScanning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [stream]);

  const topMood = moods[0];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent">
          Mood Detector
        </h1>
        {topMood && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10"
          >
            <span className="text-2xl">{topMood.emoji}</span>
            <span className="font-semibold text-white">{topMood.label}</span>
            <span className={cn("text-sm font-bold", topMood.color)}>{topMood.score}%</span>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden bg-black border border-white/10 aspect-video">
            {cameraOn ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                {scanning && (
                  <div className="absolute inset-0 pointer-events-none">
                    <motion.div
                      animate={{ opacity: [0.3, 0.8, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="absolute inset-0 border-2 border-cyan-400/40 rounded-2xl"
                    />
                    <motion.div
                      animate={{ y: ["0%", "100%", "0%"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80"
                    />
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur rounded-lg px-3 py-1.5 flex items-center gap-2">
                      <motion.div
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-2 h-2 rounded-full bg-red-500"
                      />
                      <span className="text-xs text-white/80 font-medium">LIVE</span>
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                      <div className="w-32 h-40 border border-cyan-400/30 rounded-[50%]" />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-white/30" />
                </div>
                <p className="text-white/40 text-sm">Camera is off</p>
              </div>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-3">
            {!cameraOn ? (
              <Button onClick={startCamera} className="flex-1 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 border-0">
                <Camera className="w-4 h-4 mr-2" />
                Start Camera
              </Button>
            ) : (
              <>
                <Button
                  onClick={scanning ? stopScanning : startScanning}
                  className={cn(
                    "flex-1 border-0",
                    scanning
                      ? "bg-red-600/80 hover:bg-red-600"
                      : "bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500"
                  )}
                >
                  {scanning ? (
                    <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Stop Analysis</>
                  ) : (
                    <><Smile className="w-4 h-4 mr-2" />Analyze Mood</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={stopCamera}
                  className="border-white/10 text-white/60 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400"
                >
                  <CameraOff className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>

          <p className="text-xs text-white/20 text-center">
            Analysis uses ambient light and color patterns from your camera feed. No data is stored or sent.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider">Mood Analysis</h2>
          {moods.length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-white/2 p-8 flex flex-col items-center gap-3 text-center">
              <div className="text-5xl">🎭</div>
              <p className="text-white/40 text-sm">Start your camera and click Analyze Mood to detect your emotional state in real-time.</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={moods[0].label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                {moods.map((mood, i) => (
                  <motion.div
                    key={mood.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-center gap-3"
                  >
                    <span className="text-xl w-7 text-center flex-shrink-0">{mood.emoji}</span>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className={cn("font-medium", i === 0 ? "text-white" : "text-white/60")}>{mood.label}</span>
                        <span className={cn("font-bold", mood.color)}>{mood.score}%</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${mood.score}%` }}
                          transition={{ duration: 0.6, delay: i * 0.08 }}
                          className={cn("h-full rounded-full bg-gradient-to-r", mood.gradient)}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}

                {topMood && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-4 p-4 rounded-xl bg-white/5 border border-white/5"
                  >
                    <p className="text-xs text-white/30 uppercase tracking-wider font-semibold mb-1">AI Tip</p>
                    <p className="text-sm text-white/70">{topMood.tip}</p>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
