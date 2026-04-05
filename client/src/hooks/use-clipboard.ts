import { createContext, useContext, useState, useCallback } from "react";
import type { CopyPartyEntry } from "@/lib/copyparty";

export type ClipboardAction = "copy" | "cut";

export interface ClipboardState {
  entries: CopyPartyEntry[];
  action: ClipboardAction;
  sourcePath: string;
}

interface ClipboardContextValue {
  clipboard: ClipboardState | null;
  copy: (entries: CopyPartyEntry[], sourcePath: string) => void;
  cut: (entries: CopyPartyEntry[], sourcePath: string) => void;
  clear: () => void;
}

export const ClipboardContext = createContext<ClipboardContextValue>({
  clipboard: null,
  copy: () => {},
  cut: () => {},
  clear: () => {},
});

export function useClipboard() {
  return useContext(ClipboardContext);
}

export function useClipboardState(): ClipboardContextValue {
  const [clipboard, setClipboard] = useState<ClipboardState | null>(null);

  const copy = useCallback((entries: CopyPartyEntry[], sourcePath: string) => {
    setClipboard({ entries, action: "copy", sourcePath });
  }, []);

  const cut = useCallback((entries: CopyPartyEntry[], sourcePath: string) => {
    setClipboard({ entries, action: "cut", sourcePath });
  }, []);

  const clear = useCallback(() => {
    setClipboard(null);
  }, []);

  return { clipboard, copy, cut, clear };
}
