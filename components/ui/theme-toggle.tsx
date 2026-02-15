"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="min-w-[44px] min-h-[44px]">
        <Sun className="h-5 w-5 md:h-5 md:w-5" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="min-w-[44px] min-h-[44px]"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? (
        <Sun className="size-[18px] md:size-5 text-sparky-green drop-shadow-[0_0_6px_rgba(163,255,0,0.4)]" />
      ) : (
        <Moon className="size-[18px] md:size-5" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
