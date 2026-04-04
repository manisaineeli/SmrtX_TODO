import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Send, Mic, MicOff, Sparkles, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

type Message = {
  role: "user" | "assistant";
  content: string;
  ts: number;
};

interface ISpeechRecognitionEvent {
  results: { [index: number]: { [index: number]: { transcript: string } } };
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

interface ISpeechRecognitionConstructor {
  new(): ISpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: ISpeechRecognitionConstructor;
    webkitSpeechRecognition: ISpeechRecognitionConstructor;
  }
}

const QUICK_PROMPTS = [
  "Give me a productivity tip",
  "Help me prioritize tasks",
  "Start a focus session",
  "Analyze my progress",
];

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

export default function FloatingAI() {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hey! I'm SAII, your AI productivity assistant. Ask me anything or use voice input. 🚀",
      ts: Date.now(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [pulse, setPulse] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [open, messages]);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join("");
      setInput(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
  }, []);

  const toggleVoice = useCallback(() => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      setInput("");
      recognitionRef.current.start();
      setListening(true);
    }
  }, [listening]);

  const sendMessage = useCallback(async (text?: string) => {
    const content = (text || input).trim();
    if (!content) return;
    setInput("");
    setLoading(true);

    setMessages((prev) => [...prev, { role: "user", content, ts: Date.now() }]);

    try {
      const res = await fetch(`${BASE_URL}/api/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: content }),
      });

      if (res.ok) {
        const data = await res.json() as { reply?: string; message?: string };
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply || data.message || "Got it!", ts: Date.now() },
        ]);
      } else {
        throw new Error("API error");
      }
    } catch {
      const smartReplies: Record<string, string> = {
        productivity: "Focus on your top 3 tasks each day. Use the Pomodoro technique to maintain energy. 🎯",
        prioritize: "Use the Eisenhower matrix: Urgent+Important first, Important+NotUrgent second. 📊",
        focus: "Start a 25-minute Pomodoro session now. Eliminate distractions and tackle one task at a time. ⏱️",
        progress: "Check your Analytics page for insights on your productivity trends and streaks! 📈",
      };

      const lower = content.toLowerCase();
      const fallback =
        Object.entries(smartReplies).find(([k]) => lower.includes(k))?.[1] ||
        "I'm here to help with productivity, tasks, notes, and focus sessions. What would you like to work on? 💡";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: fallback, ts: Date.now() },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, token]);

  useEffect(() => {
    if (!open) {
      const t = setInterval(() => setPulse((p) => !p), 3000);
      return () => clearInterval(t);
    }
  }, [open]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-80 sm:w-96 rounded-2xl border border-white/10 bg-[#0c0c1e]/95 backdrop-blur-xl shadow-2xl shadow-violet-900/30 overflow-hidden flex flex-col"
            style={{ height: "480px" }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-gradient-to-r from-violet-600/20 to-cyan-600/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">SAII</p>
                  <p className="text-[10px] text-white/30">AI Productivity Assistant</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                  className="w-7 h-7 rounded-lg text-white/40 hover:text-white hover:bg-white/10"
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                  className="w-7 h-7 rounded-lg text-white/40 hover:text-white hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-gradient-to-br from-violet-600 to-purple-700 text-white rounded-br-md"
                        : "bg-white/8 text-white/85 border border-white/5 rounded-bl-md"
                    )}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white/8 border border-white/5 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-violet-400"
                        animate={{ y: [-3, 3, -3] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {messages.length === 1 && (
              <div className="px-4 pb-2 flex gap-2 flex-wrap">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => sendMessage(p)}
                    className="text-[11px] px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/8 text-white/50 hover:text-white/80 hover:bg-white/10 transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            <div className="p-3 border-t border-white/5 flex items-center gap-2">
              <button
                onClick={toggleVoice}
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all",
                  listening
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : "bg-white/5 text-white/40 hover:text-white/70 hover:bg-white/10"
                )}
                title={recognitionRef.current ? (listening ? "Stop listening" : "Voice input") : "Voice not supported"}
              >
                {listening ? (
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
                    <MicOff className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder={listening ? "Listening..." : "Ask SAII anything..."}
                className="flex-1 bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-violet-500/50 transition-colors"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center flex-shrink-0 disabled:opacity-30 hover:shadow-lg hover:shadow-violet-500/20 transition-all"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen(!open)}
        whileTap={{ scale: 0.9 }}
        className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-cyan-600 flex items-center justify-center shadow-xl shadow-violet-500/40"
      >
        {!open && pulse && (
          <motion.div
            animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-0 rounded-2xl bg-violet-500"
          />
        )}
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="w-6 h-6 text-white" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <Bot className="w-6 h-6 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
