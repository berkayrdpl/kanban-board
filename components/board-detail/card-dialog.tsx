"use client";

import { useEffect, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteCardAction,
  updateCardAction,
} from "@/app/boards/[id]/actions";
import type { Card as CardType } from "@/types/database";

type Props = {
  card: CardType;
  boardId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CardDialog({ card, boardId, open, onOpenChange }: Props) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? "");
  const [isPending, startTransition] = useTransition();

  // Reset state when a different card opens
  useEffect(() => {
    setTitle(card.title);
    setDescription(card.description ?? "");
  }, [card.id, card.title, card.description]);

  function save() {
    const trimmed = title.trim();
    if (!trimmed) return;
    const fd = new FormData();
    fd.set("id", card.id);
    fd.set("board_id", boardId);
    fd.set("title", trimmed);
    fd.set("description", description);
    startTransition(async () => {
      await updateCardAction(fd);
      onOpenChange(false);
    });
  }

  function remove() {
    if (!confirm(`"${card.title}" kartı silinecek. Emin misin?`)) return;
    const fd = new FormData();
    fd.set("id", card.id);
    fd.set("board_id", boardId);
    startTransition(async () => {
      await deleteCardAction(fd);
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kart düzenle</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="card-title">Başlık</Label>
            <Input
              id="card-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              disabled={isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="card-description">Açıklama</Label>
            <Textarea
              id="card-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Detaylar, alt görevler, bağlantılar…"
              disabled={isPending}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={remove}
            disabled={isPending}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="mr-1 h-4 w-4" />
            Sil
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              İptal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={save}
              disabled={isPending || !title.trim()}
            >
              {isPending ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
