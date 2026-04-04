import { useState, useEffect } from "react";
import { useCreatePomodoroSession, useGetPomodoroSessions, CreatePomodoroSessionBodyType } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Play, Square, Pause, RotateCcw, Brain, Coffee } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const WORK_MINUTES = 25;
const SHORT_BREAK_MINUTES = 5;
const LONG_BREAK_MINUTES = 15;

export default function Pomodoro() {
  const [mode, setMode] = useState<CreatePomodoroSessionBodyType>('work');
  const [timeLeft, setTimeLeft] = useState(WORK_MINUTES * 60);
  const [isRunning, setIsRunning] = useState(false);
  
  const createSession = useCreatePomodoroSession();
  const { data: history } = useGetPomodoroSessions();
  const queryClient = useQueryClient();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      setIsRunning(false);
      // Timer finished, record session
      const duration = mode === 'work' ? WORK_MINUTES : mode === 'short_break' ? SHORT_BREAK_MINUTES : LONG_BREAK_MINUTES;
      createSession.mutate(
        { data: { type: mode, duration } },
        {
          onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/pomodoro"] })
        }
      );
      
      // Auto-switch mode
      if (mode === 'work') {
        setMode('short_break');
        setTimeLeft(SHORT_BREAK_MINUTES * 60);
      } else {
        setMode('work');
        setTimeLeft(WORK_MINUTES * 60);
      }
    }
    
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode, createSession, queryClient]);

  const handleModeChange = (newMode: CreatePomodoroSessionBodyType) => {
    setMode(newMode);
    setIsRunning(false);
    if (newMode === 'work') setTimeLeft(WORK_MINUTES * 60);
    else if (newMode === 'short_break') setTimeLeft(SHORT_BREAK_MINUTES * 60);
    else setTimeLeft(LONG_BREAK_MINUTES * 60);
  };

  const toggleTimer = () => setIsRunning(!isRunning);
  const resetTimer = () => {
    setIsRunning(false);
    if (mode === 'work') setTimeLeft(WORK_MINUTES * 60);
    else if (mode === 'short_break') setTimeLeft(SHORT_BREAK_MINUTES * 60);
    else setTimeLeft(LONG_BREAK_MINUTES * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex flex-col items-center justify-center space-y-2 text-center mt-8">
        <h1 className="text-4xl font-bold tracking-tight">Focus Timer</h1>
        <p className="text-muted-foreground">Master your time with the Pomodoro technique.</p>
      </div>

      <Card className="border-2 shadow-sm overflow-hidden">
        <div className="flex border-b">
          <Button
            variant="ghost"
            className={`flex-1 rounded-none h-14 ${mode === 'work' ? 'bg-primary/10 border-b-2 border-primary' : ''}`}
            onClick={() => handleModeChange('work')}
          >
            <Brain className="w-4 h-4 mr-2" /> Focus
          </Button>
          <Button
            variant="ghost"
            className={`flex-1 rounded-none h-14 ${mode === 'short_break' ? 'bg-primary/10 border-b-2 border-primary' : ''}`}
            onClick={() => handleModeChange('short_break')}
          >
            <Coffee className="w-4 h-4 mr-2" /> Short Break
          </Button>
          <Button
            variant="ghost"
            className={`flex-1 rounded-none h-14 ${mode === 'long_break' ? 'bg-primary/10 border-b-2 border-primary' : ''}`}
            onClick={() => handleModeChange('long_break')}
          >
            <Coffee className="w-4 h-4 mr-2" /> Long Break
          </Button>
        </div>
        
        <CardContent className="p-12 flex flex-col items-center justify-center space-y-8">
          <div className="text-8xl md:text-9xl font-bold tracking-tighter tabular-nums text-primary">
            {formatTime(timeLeft)}
          </div>
          
          <div className="flex items-center gap-4">
            <Button size="lg" className="w-32 h-14 text-lg" onClick={toggleTimer}>
              {isRunning ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
              {isRunning ? "Pause" : "Start"}
            </Button>
            <Button size="lg" variant="outline" className="w-14 h-14 p-0" onClick={resetTimer}>
              <RotateCcw className="w-5 h-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {history && history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
            <CardDescription>Your completed focus blocks today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {history.slice(0, 5).map((session: any) => (
                <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${session.type === 'work' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {session.type === 'work' ? <Brain className="w-4 h-4" /> : <Coffee className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-medium capitalize">{session.type.replace('_', ' ')}</div>
                      <div className="text-xs text-muted-foreground">{new Date(session.completedAt).toLocaleTimeString()}</div>
                    </div>
                  </div>
                  <div className="font-bold">{session.duration} min</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
