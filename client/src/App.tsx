import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/layout/AppShell";
import { BrowsePage } from "@/pages/BrowsePage";
import { SettingsPage } from "@/pages/SettingsPage";
import { LoginPage } from "@/pages/LoginPage";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import {
  ClipboardContext,
  useClipboardState,
} from "@/hooks/use-clipboard";
import { AuthProvider } from "@/context/auth";
import { Toaster } from "sonner";
import { UnauthorizedError } from "@/lib/api";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        if (error instanceof UnauthorizedError) return false;
        return failureCount < 1;
      },
    },
  },
});

function App() {
  const clipboardState = useClipboardState();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ClipboardContext.Provider value={clipboardState}>
          <TooltipProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route element={<ProtectedRoute />}>
                  <Route element={<AppShell />}>
                    <Route index element={<Navigate to="/browse/raid" replace />} />
                    <Route path="browse/*" element={<BrowsePage />} />
                    <Route path="settings" element={<SettingsPage />} />
                  </Route>
                </Route>
              </Routes>
            </BrowserRouter>
            <Toaster richColors position="top-right" />
          </TooltipProvider>
        </ClipboardContext.Provider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
