"use client";

import { useRef, useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createColumnAction } from "@/app/boards/[id]/actions";

export function NewColumnForm({ boardId }: { boardId: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    const fd = new FormData();
    fd.set("board_id", boardId);
    fd.set("title", trimmed);
    startTransition(async () => {
      await createColumnAction(fd);
      setTitle("");
      // Bir tane daha eklemek isteyebilir — odakta tut
      inputRef.current?.focus();
    });
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        className="h-fit w-[280px] shrink-0 sm:w-72 justify-start border-dashed bg-background/40 py-6 text-muted-foreground hover:bg-background"
        onClick={() => {
          setOpen(true);
          // focus next tick
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
      >
        <Plus className="mr-2 h-4 w-4" />
        Sütun ekle
      </Button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="flex w-[280px] shrink-0 sm:w-72 flex-col gap-2 rounded-lg border bg-muted/40 p-3"
    >
      <Input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Sütun başlığı (örn: Yapılacaklar)"
        maxLength={80}
        disabled={isPending}
        className="h-8 text-sm"
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
