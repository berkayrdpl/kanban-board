"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  deleteBoardAction,
  renameBoardAction,
} from "@/app/boards/actions";

type Props = {
  id: string;
  title: string;
  createdAt: string;
};

export function BoardListItem({ id, title, createdAt }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const [isPending, startTransition] = useTransition();

  function handleRename(e: React.FormEvent<HTMLFormElement>) {
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

  function handleDelete() {
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
    <li className="group flex items-center gap-2 rounded-md border bg-background px-3 py-2 transition-colors hover:bg-accent/40">
      {isEditing ? (
        <form onSubmit={handleRename} className="flex flex-1 items-center gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            maxLength={120}
            disabled={isPending}
            className="h-8"
          />
          <Button
            type="submit"
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            disabled={isPending}
            aria-label="Kaydet"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8"
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
          <Link
            href={`/boards/${id}`}
            className="flex-1 truncate text-sm font-medium hover:underline"
          >
            {title}
          </Link>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {new Date(createdAt).toLocaleDateString("tr-TR")}
          </span>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
            onClick={() => setIsEditing(true)}
            aria-label="Yeniden adlandır"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 hover:text-destructive"
            onClick={handleDelete}
            disabled={isPending}
            aria-label="Sil"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      )}
    </li>
  );
}
