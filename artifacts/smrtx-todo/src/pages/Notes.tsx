import { useState } from "react";
import { useGetNotes, useCreateNote, useUpdateNote, useDeleteNote, useToggleNotePin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pin, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Notes() {
  const [search, setSearch] = useState("");
  const { data: notes, isLoading } = useGetNotes({ search: search || undefined });
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const togglePin = useToggleNotePin();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSave = () => {
    if (!newTitle.trim() && !newContent.trim()) return;
    
    if (editingId) {
      updateNote.mutate(
        { id: editingId, data: { title: newTitle, content: newContent } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
            resetForm();
          }
        }
      );
    } else {
      createNote.mutate(
        { data: { title: newTitle || "Untitled", content: newContent } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
            resetForm();
          }
        }
      );
    }
  };

  const resetForm = () => {
    setNewTitle("");
    setNewContent("");
    setEditingId(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (note: any) => {
    setEditingId(note.id);
    setNewTitle(note.title);
    setNewContent(note.content);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNote.mutate({ id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notes"] })
    });
  };

  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    togglePin.mutate({ id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notes"] })
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Notes</h1>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search notes..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> New Note</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Note" : "Create Note"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input
                  placeholder="Title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="text-lg font-medium border-0 px-0 focus-visible:ring-0"
                />
                <Textarea
                  placeholder="Start writing..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="min-h-[300px] resize-none border-0 px-0 focus-visible:ring-0"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                <Button onClick={handleSave} disabled={createNote.isPending || updateNote.isPending}>
                  Save
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">Loading notes...</div>
        ) : notes?.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground border rounded-lg border-dashed">
            No notes found. Create one to get started.
          </div>
        ) : (
          notes?.map(note => (
            <Card key={note.id} className="cursor-pointer hover:border-primary/50 transition-colors flex flex-col h-64" onClick={() => handleEdit(note)}>
              <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                <CardTitle className="text-base font-semibold line-clamp-1 flex-1">{note.title || "Untitled"}</CardTitle>
                <div className="flex items-center gap-1 -mt-1 -mr-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => handleTogglePin(note.id, e)}>
                    <Pin className={`w-4 h-4 ${note.pinned ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={(e) => handleDelete(note.id, e)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 flex-1 overflow-hidden">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6">
                  {note.content}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
