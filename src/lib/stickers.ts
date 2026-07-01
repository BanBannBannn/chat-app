export interface Sticker {
  id: string;
  src: string;
  label: string;
}

/**
 * Default sticker pack — plain SVG files served from /public/stickers.
 * Want your own pack? Drop more .svg/.png files into public/stickers
 * and add an entry here; the chat only ever stores the sticker `id`
 * in the database, so swapping artwork later won't break old messages
 * unless you also rename the id.
 */
export const STICKERS: Sticker[] = [
  { id: "heart", src: "/stickers/heart.svg", label: "Trái tim" },
  { id: "fire", src: "/stickers/fire.svg", label: "Lửa" },
  { id: "thumbs-up", src: "/stickers/thumbs-up.svg", label: "Tán thành" },
  { id: "party", src: "/stickers/party.svg", label: "Tiệc tùng" },
  { id: "laugh", src: "/stickers/laugh.svg", label: "Cười lăn" },
  { id: "cool", src: "/stickers/cool.svg", label: "Ngầu" },
  { id: "cat", src: "/stickers/cat.svg", label: "Mèo" },
  { id: "star-struck", src: "/stickers/star-struck.svg", label: "Mắt hình sao" },
  { id: "clap", src: "/stickers/clap.svg", label: "Vỗ tay" },
  { id: "wave", src: "/stickers/wave.svg", label: "Vẫy tay" },
];

export function getStickerById(id: string): Sticker | undefined {
  return STICKERS.find((s) => s.id === id);
}
