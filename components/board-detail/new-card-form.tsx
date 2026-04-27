"use client";

import { useRef, useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createCardAction } from "@/app/boards/[id]/actions";

export function NewCardForm({
  columnId,
  boardId,
}: {
  columnId: string;
  boardId: string;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    const fd = new FormData();
    fd.set("column_id", columnId);
    fd.set("board_id", boardId);
    fd.set("title", trimmed);
    startTransition(async () => {
      await createCardAction(fd);
      setTitle("");
      // odaklı tut, ardı ardına ekleyebilsin
      inputRef.current?.focus();
    });
  }

  // Cmd/Ctrl + Enter → submit
  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
    if (e.key === "Escape") {
      setOpen(false);
      setTitle("");
    }
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="mt-2 h-8 justify-start text-muted-foreground hover:text-foreground"
        onClick={() => {
          setOpen(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
      >
        <Plus className="mr-1 h-4 w-4" />
        Kart ekle
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-2 flex flex-col gap-2">
      <Textarea
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Kart başlığı… (Cmd+Enter ile ekle)"
        maxLength={200}
        rows={2}
        disabled={isPending}
        className="min-h-[60px] resize-none text-sm"
      />
      <div className="flex items-center gap-1">
        <Button
          type="submit"
          size="sm"
          disabled={isPending || !title.trim()}
        >
          {isPending ? "Ekleniyor…" : "Ekle"}
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={() => {
            setOpen(false);
            setTitle("");
          }}
          aria-label="Kapat"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
