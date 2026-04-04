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
import { Badge as BadgeIcon, Trophy, Flame } from "lucide-react";

export default function Settings() {
  const { data: profile, isLoading: profileLoading } = useGetProfile();
  const { data: stats, isLoading: statsLoading } = useGetUserStats();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { updateUser } = useAuth();

  const [name, setName] = useState("");
  const [themePref, setThemePref] = useState("system");

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setThemePref(profile.theme);
    }
  }, [profile]);

  const handleSave = () => {
    updateProfile.mutate(
      { data: { name, theme: themePref as 'light' | 'dark' | 'system' } },
      {
        onSuccess: (updatedProfile) => {
          toast({ title: "Settings saved successfully" });
          if (themePref !== "system") setTheme(themePref);
          updateUser(updatedProfile);
        },
        onError: () => {
          toast({ title: "Failed to save settings", variant: "destructive" });
        }
      }
    );
  };

  if (profileLoading || statsLoading) return <div className="p-8 text-center text-muted-foreground">Loading settings...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Manage your personal information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={profile?.avatar || ""} />
                  <AvatarFallback className="text-lg bg-primary/10 text-primary">
                    {profile?.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium text-lg">{profile?.email}</h3>
                  <p className="text-sm text-muted-foreground">Joined {new Date(profile?.createdAt || "").toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme">App Theme</Label>
                <Select value={themePref} onValueChange={setThemePref}>
                  <SelectTrigger id="theme">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System Default</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} disabled={updateProfile.isPending}>
                {updateProfile.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Stats & Achievements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-muted/50 rounded-lg border">
                  <Trophy className="w-5 h-5 mx-auto mb-2 text-yellow-500" />
                  <div className="text-2xl font-bold">{stats?.level || 1}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Level</div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg border">
                  <Flame className="w-5 h-5 mx-auto mb-2 text-orange-500" />
                  <div className="text-2xl font-bold">{stats?.streak || 0}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Day Streak</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <BadgeIcon className="w-4 h-4" /> Badges
                </h4>
                <div className="grid grid-cols-4 gap-2">
                  {stats?.badges?.map((badge: any) => (
                    <div 
                      key={badge.id} 
                      className={`aspect-square rounded-md flex items-center justify-center text-2xl border bg-card
                        ${badge.unlocked ? 'border-primary shadow-sm' : 'opacity-30 grayscale filter'}`}
                      title={badge.name + ": " + badge.description}
                    >
                      <img src={badge.icon} alt={badge.name} className="w-8 h-8 object-contain" />
                    </div>
                  ))}
                  {(!stats?.badges || stats.badges.length === 0) && (
                    <div className="col-span-4 text-sm text-muted-foreground text-center py-4 border rounded border-dashed">
                      Complete tasks to earn badges!
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
