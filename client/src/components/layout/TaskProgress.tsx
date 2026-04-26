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
    <div className="fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2 rounded-sm border-2 bg-background p-3 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] dark:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)] animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between border-b pb-2 mb-1">
        <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          {activeTasks.length > 0 && <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
          </span>}
          {activeTasks.length > 0
            ? `SYS_TASKS [${activeTasks.length}]`
            : "SYS_TASKS_IDLE"}
        </h3>
        {completedTasks.length > 0 && activeTasks.length === 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-5 px-1.5 text-[9px] font-bold uppercase font-mono hover:bg-muted"
            onClick={onClearAll}
          >
            Clear Log
          </Button>
        )}
      </div>

      <div className="max-h-60 overflow-y-auto pt-1">
        <div className="flex flex-col gap-3">
          {tasks.map((task) => (
            <div key={task.id} className="flex flex-col gap-1.5 border-b border-border/30 pb-3 last:border-0 last:pb-1">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-1 items-center gap-2 min-w-0">
                  {task.status === "running" && (
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  )}
                  {task.status === "completed" && (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  )}
                  {task.status === "failed" && (
                    <AlertCircle className="h-3 w-3 text-destructive" />
                  )}
                  <span className="truncate font-mono text-[10px] font-bold uppercase tracking-tight text-foreground/80">{task.name}</span>
                </div>
                <button
                  onClick={() => onClear(task.id)}
                  className="rounded-sm p-0.5 hover:bg-muted transition-colors"
                >
                  <X className="h-3 w-3 text-muted-foreground/50" />
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <Progress value={task.progress} className="h-1 rounded-none flex-1" />
                <span className="font-mono text-[9px] font-bold text-muted-foreground w-8 text-right">
                  {Math.round(task.progress)}%
                </span>
              </div>
              
              {task.error && (
                <span className="font-mono text-[9px] text-destructive font-bold uppercase leading-tight bg-destructive/5 p-1 rounded-sm border border-destructive/20 mt-1">
                  ERR: {task.error}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
