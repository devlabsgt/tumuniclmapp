"use client";

import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const ThemeSwitcher = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const ICON_SIZE = 24; // Tamaño de ícono grande

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">Haz click para cambiar el tema</span>
      <Button
        variant="ghost"
        size="lg"
        className="h-12 w-12 p-0 flex items-center justify-center"
        onClick={toggleTheme}
      >
        {theme === "light" ? (
          <Sun size={ICON_SIZE} className="text-black" />
        ) : (
          <Moon size={ICON_SIZE} className="text-blue-400" />
        )}
      </Button>
    </div>
  );
};

export { ThemeSwitcher };
