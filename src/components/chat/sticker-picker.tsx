"use client";

import Image from "next/image";
import { Sticker as StickerIcon } from "lucide-react";

import { STICKERS, type Sticker } from "@/lib/stickers";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function StickerPicker({ onSelect }: { onSelect: (sticker: Sticker) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Chọn sticker">
          <StickerIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="start">
        <p className="mb-2 px-1 text-xs font-medium text-muted-foreground">
          Bộ sticker mặc định
        </p>
        <div className="grid grid-cols-5 gap-1.5">
          {STICKERS.map((sticker) => (
            <Tooltip key={sticker.id}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onSelect(sticker)}
                  className="sticker-tile flex size-12 items-center justify-center rounded-xl p-1.5 transition-colors hover:bg-accent"
                >
                  <Image
                    src={sticker.src}
                    alt={sticker.label}
                    width={40}
                    height={40}
                    className="size-full object-contain"
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent>{sticker.label}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
