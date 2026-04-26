import { Progress } from "@/components/ui/progress";
import { X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export type TaskStatus = "pending" | "running" | "completed" | "failed";

export interface Task {
  id: string;
  name: string;
  status: TaskStatus;
  progress: number;
  error?: string;
}

interface TaskProgressProps {
  tasks: Task[];
  onClear: (id: string) => void;
  onClearAll: () => void;
}

export function TaskProgress({ tasks, onClear, onClearAll }: TaskProgressProps) {
  if (tasks.length === 0) return null;

  const activeTasks = tasks.filter((t) => t.status === "running" || t.status === "pending");
  const completedTasks = tasks.filter((t) => t.status === "completed" || t.status === "failed");

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2 rounded-lg border bg-background p-4 shadow-lg animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between border-b pb-2">
        <h3 className="text-sm font-medium">
          {activeTasks.length > 0
            ? `Running ${activeTasks.length} task${activeTasks.length > 1 ? "s" : ""}`
            : "Tasks completed"}
        </h3>
        {completedTasks.length > 0 && activeTasks.length === 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={onClearAll}
          >
            Clear all
          </Button>
        )}
      </div>

      <div className="max-h-60 overflow-y-auto pt-2">
        <div className="flex flex-col gap-3">
          {tasks.map((task) => (
            <div key={task.id} className="flex flex-col gap-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-1 items-center gap-2 min-w-0">
                  {task.status === "running" && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  )}
                  {task.status === "completed" && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  )}
                  {task.status === "failed" && (
                    <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                  )}
                  <span className="truncate text-xs font-medium">{task.name}</span>
                </div>
                <button
                  onClick={() => onClear(task.id)}
                  className="rounded-full p-0.5 hover:bg-muted"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
              
              <Progress value={task.progress} className="h-1" />
              
              {task.error && (
                <span className="text-[10px] text-destructive line-clamp-1">
                  {task.error}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
