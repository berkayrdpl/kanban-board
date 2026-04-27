"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowLeft, Pencil, Trash2, Check, X, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  deleteBoardAction,
  renameBoardAction,
} from "@/app/boards/actions";
import { ShareDialog } from "./share-dialog";

type Props = {
  id: string;
  title: string;
  shareToken: string | null;
};

export function BoardHeader({ id, title, shareToken }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const [isPending, startTransition] = useTransition();
  const [shareOpen, setShareOpen] = useState(false);

  function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || trimmed === title) {
      setIsEditing(false);
      setDraft(title);
      return;
    }
    const fd = new FormData();
    fd.set("id", id);
    fd.set("title", trimmed);
    startTransition(async () => {
      await renameBoardAction(fd);
      setIsEditing(false);
    });
  }

  function remove() {
    if (
      !confirm(
        `"${title}" board'ı ve içindeki tüm sütun + kartlar kalıcı olarak silinecek. Emin misin?`,
      )
    )
      return;
    const fd = new FormData();
    fd.set("id", id);
    startTransition(async () => {
      await deleteBoardAction(fd);
    });
  }

  return (
    <header className="mb-6 flex flex-wrap items-center gap-3 border-b pb-4">
      <Button asChild variant="ghost" size="sm" className="h-8 px-2">
        <Link href="/boards" aria-label="Board listesine dön">
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </Button>

      {isEditing ? (
        <form onSubmit={save} className="flex flex-1 items-center gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            maxLength={120}
            disabled={isPending}
            className="h-9 text-lg font-semibold"
          />
          <Button
            type="submit"
            size="icon"
            variant="ghost"
            className="h-9 w-9"
            disabled={isPending}
            aria-label="Kaydet"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-9 w-9"
            disabled={isPending}
            onClick={() => {
              setIsEditing(false);
              setDraft(title);
            }}
            aria-label="İptal"
          >
            <X className="h-4 w-4" />
          </Button>
        </form>
      ) : (
        <>
          <h1 className="flex-1 truncate text-xl font-semibold tracking-tight">
            {title}
          </h1>
          {shareToken ? (
            <span
              className="hidden rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 sm:inline"
              title="Bu board public link ile paylaşılıyor"
            >
              Paylaşılıyor
            </span>
          ) : null}
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-9 w-9"
            onClick={() => setShareOpen(true)}
            aria-label="Paylaş"
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-9 w-9"
            onClick={() => setIsEditing(true)}
            aria-label="Yeniden adlandır"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-9 w-9 hover:text-destructive"
            onClick={remove}
            disabled={isPending}
            aria-label="Sil"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      )}
      <ShareDialog
        boardId={id}
        initialToken={shareToken}
        open={shareOpen}
        onOpenChange={setShareOpen}
      />
    </header>
  );
}
