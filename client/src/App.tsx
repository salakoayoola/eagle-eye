import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/layout/AppShell";
import { BrowsePage } from "@/pages/BrowsePage";
import { SettingsPage } from "@/pages/SettingsPage";
import {
  ClipboardContext,
  useClipboardState,
} from "@/hooks/use-clipboard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function App() {
  const clipboardState = useClipboardState();

  return (
    <QueryClientProvider client={queryClient}>
      <ClipboardContext.Provider value={clipboardState}>
        <TooltipProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<AppShell />}>
                <Route index element={<Navigate to="/browse/raid" replace />} />
                <Route path="browse/*" element={<BrowsePage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ClipboardContext.Provider>
    </QueryClientProvider>
  );
}

export default App;
