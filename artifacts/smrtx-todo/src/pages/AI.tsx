import { useState, useRef, useEffect } from "react";
import { useAiChat, useSuggestTasks, ChatMessage, TaskSuggestion } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, User, Sparkles, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AI() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hello! I'm SAII, your AI productivity assistant. How can I help you manage your time and tasks today?" }
  ]);
  const [input, setInput] = useState("");
  const chatMutation = useAiChat();
  const { data: suggestions, isLoading: suggestionsLoading } = useSuggestTasks();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, chatMutation.isPending]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;

    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput("");

    chatMutation.mutate(
      { data: { message: input, history: messages.slice(-5) } },
      {
        onSuccess: (response) => {
          setMessages([...newMessages, { role: 'assistant', content: response.message }]);
        },
        onError: () => {
          setMessages([...newMessages, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now. Please try again later." }]);
        }
      }
    );
  };

  return (
    <div className="h-full flex flex-col space-y-4 max-h-[calc(100vh-2rem)]">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">SAII Assistant</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0">
        <Card className="col-span-1 md:col-span-2 flex flex-col h-full border-2">
          <CardHeader className="border-b px-4 py-3 bg-muted/30">
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" /> Chat with SAII
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden flex flex-col relative">
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 border'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatMutation.isPending && (
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="p-3 rounded-lg text-sm bg-muted/50 border flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary/40 animate-pulse" />
                    <span className="w-2 h-2 rounded-full bg-primary/60 animate-pulse delay-150" />
                    <span className="w-2 h-2 rounded-full bg-primary/80 animate-pulse delay-300" />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="p-3 border-t bg-muted/10">
            <form onSubmit={handleSend} className="flex w-full gap-2">
              <Input
                placeholder="Ask SAII to organize your day..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={chatMutation.isPending}
                className="flex-1 bg-background"
              />
              <Button type="submit" size="icon" disabled={!input.trim() || chatMutation.isPending}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-500" /> Suggested Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {suggestionsLoading ? (
                <div className="text-sm text-muted-foreground">Analyzing your habits...</div>
              ) : suggestions && suggestions.length > 0 ? (
                suggestions.map((task: TaskSuggestion, i: number) => (
                  <div key={i} className="p-3 rounded-md border text-sm space-y-2 bg-card">
                    <div className="font-medium">{task.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">{task.reason}</div>
                    <div className="flex items-center justify-between pt-1">
                      <Badge variant="secondary" className="text-[10px] px-1.5">{task.priority}</Badge>
                      <Button variant="ghost" size="sm" className="h-6 text-xs px-2">
                        <Plus className="w-3 h-3 mr-1" /> Add
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No suggestions right now. Keep using the app to get personalized recommendations!</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
