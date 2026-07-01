"use client";

import { Smile } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const EMOJI_CATEGORIES: { label: string; emojis: string[] }[] = [
  {
    label: "😀",
    emojis: [
      "😀", "😁", "😂", "🤣", "😊", "😍", "🥰", "😘", "😉", "😎",
      "🤩", "🥳", "😏", "😢", "😭", "😡", "😱", "🥺", "😴", "🤔",
      "🙄", "😬", "😅", "🤭", "🤗", "🫶", "😇", "🙃", "😴", "🤤",
    ],
  },
  {
    label: "❤️",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💕", "💞",
      "💓", "💗", "💖", "💘", "💝", "👍", "👎", "👏", "🙏", "🤝",
      "🫂", "👋", "✌️", "🤞", "💪", "🤙", "👌", "🫶", "🤟", "🙌",
    ],
  },
  {
    label: "🐱",
    emojis: [
      "🐶", "🐱", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐷",
      "🐸", "🐵", "🐔", "🐦", "🐧", "🦋", "🌸", "🌺", "🌻", "🌈",
      "⭐", "🌙", "☀️", "🔥", "✨", "🎉", "🎊", "🍀", "🌊", "☁️",
    ],
  },
  {
    label: "🍕",
    emojis: [
      "🍕", "🍔", "🍟", "🌮", "🍣", "🍜", "🍩", "🍰", "🎂", "🍪",
      "🍫", "🍦", "🍓", "🍉", "🍑", "🥑", "☕", "🧋", "🍺", "🍷",
      "⚽", "🏀", "🎮", "🎵", "🎬", "📷", "✈️", "🚗", "🏖️", "🎁",
    ],
  },
];

export function EmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Chọn emoji">
          <Smile />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        <Tabs defaultValue="0">
          <TabsList className="w-full">
            {EMOJI_CATEGORIES.map((cat, index) => (
              <TabsTrigger key={cat.label} value={String(index)} className="text-base">
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {EMOJI_CATEGORIES.map((cat, index) => (
            <TabsContent key={cat.label} value={String(index)}>
              <ScrollArea className="h-52">
                <div className="grid grid-cols-6 gap-1 p-1">
                  {cat.emojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => onSelect(emoji)}
                      className="flex size-9 items-center justify-center rounded-lg text-xl transition-colors hover:bg-accent"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
