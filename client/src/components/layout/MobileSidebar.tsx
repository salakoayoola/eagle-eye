import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-60 p-0">
        <div onClick={() => setOpen(false)}>
          <MobileSidebarContent />
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Re-uses Sidebar internals but without the `hidden md:block` classes */
function MobileSidebarContent() {
  // We import Sidebar but it has `hidden md:block` — for mobile we need a
  // version that's always visible. Easiest to just render the sidebar component
  // and override via a wrapper.
  return (
    <div className="[&>aside]:block [&>aside]:w-full [&>aside]:border-0">
      <Sidebar />
    </div>
  );
}
