import { useMemo, useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth";

interface LoginLocationState {
  from?: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const destination = useMemo(() => {
    const state = location.state as LoginLocationState | null;
    return state?.from || "/browse/raid";
  }, [location.state]);

  if (!isLoading && isAuthenticated) {
    return <Navigate to={destination} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login(username.trim(), password);
      navigate(destination, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm rounded-sm border bg-background p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.08)]">
        <div className="mb-5 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
          <Lock className="h-4 w-4" />
          Secure Access
        </div>

        <h1 className="mb-1 font-mono text-xl font-black uppercase tracking-tight">Eagle Eye</h1>
        <p className="mb-5 text-sm text-muted-foreground">Sign in to continue.</p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label htmlFor="username" className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Username
            </label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              disabled={submitting}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              disabled={submitting}
            />
          </div>

          {error && (
            <div className="rounded-sm border border-destructive/30 bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
