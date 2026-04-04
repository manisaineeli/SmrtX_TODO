import { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  CheckSquare2,
  FileText,
  Timer,
  BarChart3,
  Bot,
  Settings,
  LogOut,
  Moon,
  Sun,
  Music2,
  Smile,
  Zap,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", glow: "violet" },
  { href: "/tasks", icon: CheckSquare2, label: "Tasks", glow: "blue" },
  { href: "/notes", icon: FileText, label: "Notes", glow: "amber" },
  { href: "/pomodoro", icon: Timer, label: "Pomodoro", glow: "red" },
  { href: "/analytics", icon: BarChart3, label: "Analytics", glow: "emerald" },
  { href: "/ai", icon: Bot, label: "AI Assistant", glow: "cyan" },
  { href: "/music", icon: Music2, label: "Music", glow: "pink" },
  { href: "/mood", icon: Smile, label: "Mood Detector", glow: "yellow" },
];

const GLOW_CLASSES: Record<string, string> = {
  violet: "text-violet-400 shadow-violet-500/40",
  blue: "text-blue-400 shadow-blue-500/40",
  amber: "text-amber-400 shadow-amber-500/40",
  red: "text-red-400 shadow-red-500/40",
  emerald: "text-emerald-400 shadow-emerald-500/40",
  cyan: "text-cyan-400 shadow-cyan-500/40",
  pink: "text-pink-400 shadow-pink-500/40",
  yellow: "text-yellow-400 shadow-yellow-500/40",
};

const DOT_CLASSES: Record<string, string> = {
  violet: "bg-violet-400",
  blue: "bg-blue-400",
  amber: "bg-amber-400",
  red: "bg-red-400",
  emerald: "bg-emerald-400",
  cyan: "bg-cyan-400",
  pink: "bg-pink-400",
  yellow: "bg-yellow-400",
};

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-col w-64 h-full border-r border-white/5 bg-[#08081a] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none select-none">
        <div className="absolute top-16 -left-12 w-48 h-48 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute bottom-32 -right-12 w-48 h-48 rounded-full bg-cyan-600/8 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-pink-600/5 blur-2xl" />
      </div>

      <div className="p-5 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/40">
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-violet-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent leading-none">
              SmrtX
            </h1>
            <p className="text-[9px] text-white/20 font-semibold tracking-[0.2em] uppercase mt-0.5">
              Productivity OS
            </p>
          </div>
        </motion.div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto relative z-10 pb-2">
        {NAV_ITEMS.map((item, idx) => {
          const isActive = location === item.href || location.startsWith(item.href + "/");
          const iconClass = GLOW_CLASSES[item.glow] || "text-white/50";
          const dotClass = DOT_CLASSES[item.glow] || "bg-white";

          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.035, ease: "easeOut" }}
            >
              <Link href={item.href}>
                <div
                  className={cn(
                    "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer overflow-hidden",
                    isActive ? "text-white" : "text-white/40 hover:text-white/80 hover:bg-white/5"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavItem"
                      className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 rounded-xl border border-white/10"
                    />
                  )}
                  <item.icon
                    className={cn(
                      "w-4 h-4 relative z-10 transition-all duration-200 flex-shrink-0",
                      isActive ? iconClass : "group-hover:text-white/60"
                    )}
                  />
                  <span className="relative z-10 flex-1">{item.label}</span>
                  {isActive && (
                    <span className={cn("w-1.5 h-1.5 rounded-full relative z-10 flex-shrink-0", dotClass)} />
                  )}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      <div className="px-3 pb-4 pt-3 border-t border-white/5 space-y-2 relative z-10">
        <div className="flex items-center justify-between px-1 mb-1">
          <Link href="/settings">
            <div className="flex items-center gap-2 text-xs font-medium text-white/30 hover:text-white/70 transition-colors cursor-pointer py-1">
              <Settings className="w-3.5 h-3.5" />
              Settings
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-7 h-7 rounded-lg text-white/30 hover:text-amber-300 hover:bg-amber-400/10"
          >
            {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </Button>
        </div>

        <div className="flex items-center gap-2.5 px-2 py-2.5 rounded-xl bg-gradient-to-r from-white/5 to-transparent border border-white/5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-pink-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-md shadow-violet-500/30">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white/90 truncate leading-none">{user?.name}</p>
            <p className="text-[10px] text-white/30 truncate mt-0.5">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="w-7 h-7 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/10 flex-shrink-0"
            title="Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-[#06060f] text-white overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-600/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-600/5 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
