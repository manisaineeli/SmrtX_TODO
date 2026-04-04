import { useState } from "react";
import { useGetTasks, useCreateTask, useUpdateTask, useDeleteTask, useTrashTask, useRestoreTask, Task, TaskPriority, TaskStatus, UpdateTaskBodyStatus } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Edit2, RotateCcw, MoreVertical, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function Tasks() {
  const { data: tasks, isLoading } = useGetTasks();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const trashTask = useTrashTask();
  const restoreTask = useRestoreTask();
  const deleteTask = useDeleteTask();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    createTask.mutate(
      { data: { title: newTaskTitle } },
      {
        onSuccess: () => {
          setNewTaskTitle("");
          queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
          queryClient.invalidateQueries({ queryKey: ["/api/tasks/summary"] });
        },
        onError: () => {
          toast({ title: "Failed to create task", variant: "destructive" });
        }
      }
    );
  };

  const handleStatusChange = (id: string, status: UpdateTaskBodyStatus) => {
    updateTask.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
          queryClient.invalidateQueries({ queryKey: ["/api/tasks/summary"] });
        }
      }
    );
  };

  const handleTrash = (id: string) => {
    trashTask.mutate({ id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/tasks"] })
    });
  };

  const handleRestore = (id: string) => {
    restoreTask.mutate({ id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/tasks"] })
    });
  };

  const handleDelete = (id: string) => {
    deleteTask.mutate({ id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/tasks"] })
    });
  };

  const filteredTasks = tasks?.filter(t => filterStatus === "all" ? t.status !== "trash" : t.status === filterStatus) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
        <div className="flex items-center gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Active Tasks</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="done">Done</SelectItem>
              <SelectItem value="trash">Trash</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleCreateTask} className="flex gap-2">
            <Input 
              placeholder="What needs to be done?" 
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={createTask.isPending || !newTaskTitle.trim()}>
              <Plus className="w-4 h-4 mr-2" /> Add Task
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading tasks...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
            No tasks found.
          </div>
        ) : (
          filteredTasks.map(task => (
            <Card key={task.id} className={`transition-all ${task.status === 'done' ? 'opacity-60' : ''}`}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div 
                    className={`w-4 h-4 rounded-full border cursor-pointer flex items-center justify-center
                      ${task.status === 'done' ? 'bg-green-500 border-green-500' : 'border-muted-foreground'}`}
                    onClick={() => handleStatusChange(task.id, task.status === 'done' ? 'todo' : 'done')}
                  >
                    {task.status === 'done' && <X className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className={`font-medium ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </span>
                    {task.description && (
                      <span className="text-sm text-muted-foreground">{task.description}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {task.priority !== 'low' && (
                    <Badge variant="outline" className={
                      task.priority === 'urgent' ? 'text-red-500 border-red-500/20' :
                      task.priority === 'high' ? 'text-orange-500 border-orange-500/20' :
                      'text-yellow-500 border-yellow-500/20'
                    }>
                      {task.priority}
                    </Badge>
                  )}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {task.status === 'trash' ? (
                        <>
                          <DropdownMenuItem onClick={() => handleRestore(task.id)}>
                            <RotateCcw className="w-4 h-4 mr-2" /> Restore
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(task.id)} className="text-destructive focus:text-destructive">
                            <X className="w-4 h-4 mr-2" /> Delete Permanently
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <>
                          <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'todo')}>Mark To Do</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'in_progress')}>Mark In Progress</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'done')}>Mark Done</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTrash(task.id)} className="text-destructive focus:text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" /> Move to Trash
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
