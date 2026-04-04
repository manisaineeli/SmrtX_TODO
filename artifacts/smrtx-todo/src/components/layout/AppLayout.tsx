import { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  CheckSquare,
  FileText,
  Timer,
  BarChart3,
  Bot,
  Settings,
  LogOut,
  Moon,
  Sun
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/tasks", icon: CheckSquare, label: "Tasks" },
  { href: "/notes", icon: FileText, label: "Notes" },
  { href: "/pomodoro", icon: Timer, label: "Pomodoro" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/ai", icon: Bot, label: "AI Assistant" },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-col w-64 border-r bg-sidebar border-sidebar-border h-full">
      <div className="p-4 md:p-6">
        <h1 className="text-xl font-bold tracking-tight">SmrtX</h1>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href || location.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-4">
        <div className="flex items-center justify-between px-2">
          <Link href="/settings">
            <div className="flex items-center gap-3 text-sm font-medium text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors cursor-pointer">
              <Settings className="w-4 h-4" />
              Settings
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-8 h-8 rounded-full"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>

        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium leading-none">{user?.name}</span>
              <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                {user?.email}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={logout} className="w-8 h-8 text-muted-foreground hover:text-destructive">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="h-full p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
