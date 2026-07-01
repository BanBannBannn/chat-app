"use client";

import { useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { ImagePlus, Loader2, SendHorizontal } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { useChatStore } from "@/store/chat-store";
import type { Sticker } from "@/lib/stickers";

import { Button } from "@/components/ui/button";
import { EmojiPicker } from "@/components/chat/emoji-picker";
import { StickerPicker } from "@/components/chat/sticker-picker";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB — phải khớp với giới hạn bucket trong schema.sql
const TYPING_IDLE_MS = 1500;

interface MessageInputProps {
  currentUserId: string;
  roomId: string;
  onTyping: (isTyping: boolean) => void;
}

export function MessageInput({ currentUserId, roomId, onTyping }: MessageInputProps) {
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  // Theo dõi việc IME (bộ gõ tiếng Việt/Trung/Nhật...) đang "soạn" 1 ký tự —
  // xem giải thích chi tiết ở handleKeyDown bên dưới.
  const isComposingRef = useRef(false);

  const addMessage = useChatStore((s) => s.addMessage);

  function notifyTyping() {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      onTyping(true);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      onTyping(false);
    }, TYPING_IDLE_MS);
  }

  function stopTyping() {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    isTypingRef.current = false;
    onTyping(false);
  }

  function autoGrow() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }

  async function handleSendText() {
    const content = text.trim();
    if (!content || isSending) return;

    setIsSending(true);
    stopTyping();
    setText("");
    // Một số bàn phím ảo / bộ gõ (đặc biệt trên mobile) vẫn chèn thêm 1 ký
    // tự xuống dòng vào DOM ngay sau keydown dù đã preventDefault — buộc lại
    // value của textarea về rỗng ngay khung hình kế tiếp để chắc chắn không
    // còn sót lại gì trên màn hình.
    requestAnimationFrame(() => {
      if (textareaRef.current) textareaRef.current.value = "";
      autoGrow();
    });

    const supabase = createClient();
    const { data, error } = await supabase
      .from("messages")
      .insert({ room_id: roomId, sender_id: currentUserId, type: "text", content })
      .select()
      .single();

    if (error) {
      toast.error("Không gửi được tin nhắn", { description: error.message });
      setText(content); // trả lại nội dung để người dùng không mất chữ đã gõ
    } else if (data) {
      addMessage(data);
    }
    setIsSending(false);
  }

  async function handleSendSticker(sticker: Sticker) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("messages")
      .insert({ room_id: roomId, sender_id: currentUserId, type: "sticker", sticker_id: sticker.id })
      .select()
      .single();

    if (error) {
      toast.error("Không gửi được sticker", { description: error.message });
    } else if (data) {
      addMessage(data);
    }
  }

  function handleEmojiSelect(emoji: string) {
    setText((prev) => prev + emoji);
    notifyTyping();
    textareaRef.current?.focus();
  }

  async function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // cho phép chọn lại cùng file lần sau
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Chỉ hỗ trợ file ảnh");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Ảnh quá lớn", { description: "Vui lòng chọn ảnh dưới 8MB." });
      return;
    }

    setIsUploading(true);
    const supabase = createClient();

    const extension = file.name.split(".").pop() ?? "jpg";
    const path = `${currentUserId}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("chat-images")
      .upload(path, file, { contentType: file.type, cacheControl: "3600" });

    if (uploadError) {
      toast.error("Không tải ảnh lên được", { description: uploadError.message });
      setIsUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from("chat-images").getPublicUrl(path);

    const { data, error: insertError } = await supabase
      .from("messages")
      .insert({
        room_id: roomId,
        sender_id: currentUserId,
        type: "image",
        image_url: publicUrlData.publicUrl,
      })
      .select()
      .single();

    if (insertError) {
      toast.error("Không gửi được ảnh", { description: insertError.message });
    } else if (data) {
      addMessage(data);
    }
    setIsUploading(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Enter" || e.shiftKey) return;

    // ⚠️ Đây là nguyên nhân của bug "gửi rồi chữ vẫn còn, Enter lần 2 mới mất":
    // khi gõ tiếng Việt (đặc biệt trên điện thoại / bàn phím ảo có gợi ý từ),
    // phím Enter ĐẦU TIÊN nhiều khi chỉ dùng để IME "xác nhận" ký tự/từ đang
    // gõ (composition), trình duyệt báo `isComposing = true` hoặc keyCode 229
    // — KHÔNG phải ý định gửi tin nhắn của người dùng. Nếu ta cứ gọi
    // preventDefault() + gửi ngay ở lần Enter đó, sẽ vừa gửi tin nhắn thiếu
    // ký tự cuối, vừa để lại phần đang composing trên textarea (chỉ Enter
    // lần 2 mới thực sự "trống" vì lúc đó composition đã kết thúc).
    // => Bỏ qua hoàn toàn lần Enter này nếu đang trong quá trình composition.
    if (isComposingRef.current || e.nativeEvent.isComposing || e.keyCode === 229) {
      return;
    }

    e.preventDefault();
    handleSendText();
  }

  return (
    <div className="shrink-0 border-t border-border bg-card/70 px-3 py-3 backdrop-blur-sm sm:px-6">
      <div className="mx-auto flex max-w-2xl items-end gap-1.5">
        <EmojiPicker onSelect={handleEmojiSelect} />
        <StickerPicker onSelect={handleSendSticker} />

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Gửi ảnh"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? <Loader2 className="animate-spin" /> : <ImagePlus />}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />

        <textarea
          ref={textareaRef}
          value={text}
          rows={1}
          placeholder="Nhập tin nhắn..."
          onChange={(e) => {
            setText(e.target.value);
            autoGrow();
            if (e.target.value.trim()) notifyTyping();
            else stopTyping();
          }}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => {
            isComposingRef.current = true;
          }}
          onCompositionEnd={() => {
            isComposingRef.current = false;
          }}
          onBlur={stopTyping}
          className="flex-1 resize-none rounded-2xl border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
        />

        <Button
          type="button"
          size="icon"
          aria-label="Gửi"
          disabled={!text.trim() || isSending}
          onClick={handleSendText}
        >
          {isSending ? <Loader2 className="animate-spin" /> : <SendHorizontal />}
        </Button>
      </div>
    </div>
  );
}
