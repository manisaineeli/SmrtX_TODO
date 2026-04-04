import { useState, useEffect } from "react";
import { useGetProfile, useUpdateProfile, useGetUserStats } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { Trophy, Flame, Lock, LogOut, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

export default function Settings() {
  const { data: profile, isLoading: profileLoading } = useGetProfile();
  const { data: stats, isLoading: statsLoading } = useGetUserStats();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { updateUser, logout, token } = useAuth();

  const [name, setName] = useState("");
  const [themePref, setThemePref] = useState("system");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setThemePref(profile.theme);
    }
  }, [profile]);

  const handleSave = () => {
    updateProfile.mutate(
      { data: { name, theme: themePref as "light" | "dark" | "system" } },
      {
        onSuccess: (updatedProfile) => {
          toast({ title: "Settings saved!" });
          if (themePref !== "system") setTheme(themePref);
          updateUser(updatedProfile);
        },
        onError: () => toast({ title: "Failed to save settings", variant: "destructive" }),
      }
    );
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: "Please fill all password fields", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "New passwords do not match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setChangingPassword(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok) {
        toast({ title: "Password changed successfully!" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const err = await res.json() as { error?: string };
        toast({ title: err.error || "Failed to change password", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setChangingPassword(false);
    }
  };

  if (profileLoading || statsLoading) return (
    <div className="flex items-center justify-center py-20 text-white/30">Loading settings...</div>
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">Settings</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card className="bg-white/3 border-white/8 text-white">
            <CardHeader>
              <CardTitle className="text-white/90">Profile</CardTitle>
              <CardDescription className="text-white/40">Manage your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 ring-2 ring-violet-500/30">
                  <AvatarImage src={profile?.avatar || ""} />
                  <AvatarFallback className="text-xl bg-gradient-to-br from-violet-600 to-pink-600 text-white">
                    {profile?.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-white">{profile?.name}</p>
                  <p className="text-sm text-white/40">{profile?.email}</p>
                  <p className="text-xs text-white/25 mt-0.5">
                    Joined {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "—"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white/60 text-xs font-semibold uppercase tracking-wider">Display Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-violet-500/50"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/60 text-xs font-semibold uppercase tracking-wider">App Theme</Label>
                <Select value={themePref} onValueChange={setThemePref}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0c0c1e] border-white/10 text-white">
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System Default</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="gap-3">
              <Button
                onClick={handleSave}
                disabled={updateProfile.isPending}
                className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 border-0"
              >
                {updateProfile.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-white/3 border-white/8 text-white">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-violet-400" />
                <CardTitle className="text-white/90">Change Password</CardTitle>
              </div>
              <CardDescription className="text-white/40">Update your account password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white/60 text-xs font-semibold uppercase tracking-wider">Current Password</Label>
                <div className="relative">
                  <Input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-violet-500/50 pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white/60 text-xs font-semibold uppercase tracking-wider">New Password</Label>
                <div className="relative">
                  <Input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-violet-500/50 pr-10"
                    placeholder="Min 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {newPassword.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 4].map((lvl) => (
                      <div
                        key={lvl}
                        className={cn(
                          "h-1 flex-1 rounded-full transition-colors",
                          newPassword.length >= lvl * 3
                            ? lvl <= 2 ? "bg-red-500" : lvl === 3 ? "bg-yellow-500" : "bg-green-500"
                            : "bg-white/10"
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-white/60 text-xs font-semibold uppercase tracking-wider">Confirm New Password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={cn(
                    "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-violet-500/50",
                    confirmPassword && (confirmPassword === newPassword ? "border-green-500/50" : "border-red-500/50")
                  )}
                  placeholder="••••••••"
                />
              </div>
            </CardContent>
            <CardFooter className="gap-3">
              <Button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 border-0 gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                {changingPassword ? "Changing..." : "Update Password"}
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-red-500/5 border-red-500/10 text-white">
            <CardHeader>
              <CardTitle className="text-red-400/80 text-base">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80">Sign out of your account</p>
                  <p className="text-xs text-white/30">You will need to sign in again to access your data.</p>
                </div>
                <Button
                  variant="outline"
                  onClick={logout}
                  className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/40 gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="bg-white/3 border-white/8 text-white">
            <CardHeader>
              <CardTitle className="text-white/90 text-base">Stats & XP</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-violet-500/10 border border-violet-500/20 rounded-xl text-center">
                  <Trophy className="w-5 h-5 mx-auto mb-1 text-yellow-400" />
                  <div className="text-2xl font-bold text-white">{stats?.level || 1}</div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Level</div>
                </div>
                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl text-center">
                  <Flame className="w-5 h-5 mx-auto mb-1 text-orange-400" />
                  <div className="text-2xl font-bold text-white">{stats?.streak || 0}</div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Streak</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">XP Progress</span>
                  <span className="text-violet-400 font-medium">{stats?.xp || 0} XP</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((stats?.xp || 0) % 100)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full"
                  />
                </div>
                <p className="text-[10px] text-white/25">{100 - ((stats?.xp || 0) % 100)} XP to next level</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/3 border-white/8 text-white">
            <CardHeader>
              <CardTitle className="text-white/90 text-base">Badges</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {stats?.badges?.map((badge: { id: string; unlocked: boolean; name: string; description: string; icon: string }) => (
                  <motion.div
                    key={badge.id}
                    whileHover={badge.unlocked ? { scale: 1.1 } : {}}
                    className={cn(
                      "aspect-square rounded-xl flex items-center justify-center text-xl border",
                      badge.unlocked
                        ? "bg-violet-500/10 border-violet-500/30 shadow-md shadow-violet-500/10"
                        : "bg-white/3 border-white/5 opacity-25 grayscale"
                    )}
                    title={`${badge.name}: ${badge.description}`}
                  >
                    {badge.icon && badge.icon.startsWith("http") ? (
                      <img src={badge.icon} alt={badge.name} className="w-7 h-7 object-contain" />
                    ) : (
                      <span>{badge.icon || "🏆"}</span>
                    )}
                  </motion.div>
                ))}
                {(!stats?.badges || stats.badges.length === 0) && (
                  <div className="col-span-4 py-6 text-center text-xs text-white/20 border border-dashed border-white/5 rounded-xl">
                    Complete tasks to earn badges!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
