"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PALETTES, PALETTE_STORAGE_KEY, currentPaletteValue, findPalette } from "@/lib/palette";
import { Palette } from "lucide-react";
import { useEffect, useState } from "react";

function applyPalette(value: string) {
  if (value === "neutral") document.documentElement.removeAttribute("data-palette");
  else document.documentElement.setAttribute("data-palette", value);
  try {
    localStorage.setItem(PALETTE_STORAGE_KEY, value);
  } catch {
    // Storage can be blocked (private mode); the color still changes for this visit.
  }
}

export function PaletteSwitcher() {
  const [palette, setPalette] = useState<string | null>(null);

  // Read the current scale on the client only (it lives in the browser).
  useEffect(() => {
    setPalette(currentPaletteValue());
  }, []);

  if (!palette) return null;

  const current = findPalette(palette);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="Change colors" title="Change colors">
          <Palette size={16} style={{ color: current.main }} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-content" align="end">
        <DropdownMenuRadioGroup
          value={palette}
          onValueChange={(value) => {
            applyPalette(value);
            setPalette(value);
          }}
        >
          {PALETTES.map((p) => (
            <DropdownMenuRadioItem key={p.value} value={p.value} className="flex gap-2">
              <span
                aria-hidden
                className="h-3 w-3 rounded-full border"
                style={{ backgroundColor: p.main }}
              />
              <span>{p.label}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
