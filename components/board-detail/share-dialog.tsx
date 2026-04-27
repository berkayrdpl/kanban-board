"use client";

import { useState, useTransition } from "react";
import { Check, Copy, Globe, Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toggleBoardShareAction } from "@/app/boards/actions";

type Props = {
  boardId: string;
  initialToken: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * "Paylaş" modal — user can flip sharing on/off and copy the public URL.
 *
 * The public URL contains an UUID token. RPC `get_shared_board` on the
 * Supabase side validates the token; revoking simply nulls it out so
 * existing links stop working immediately.
 */
export function ShareDialog({
  boardId,
  initialToken,
  open,
  onOpenChange,
}: Props) {
  const [token, setToken] = useState<string | null>(initialToken);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (typeof window !== "undefined" ? window.location.origin : "");
  const shareUrl = token ? `${siteUrl}/share/${token}` : "";

  function toggle() {
    startTransition(async () => {
      const res = await toggleBoardShareAction(boardId);
      if (res.error) {
        toast.error("İşlem başarısız", { description: res.error });
        return;
      }
      setToken(res.token);
      setCopied(false);
      toast.success(
        res.token ? "Paylaşım açıldı" : "Paylaşım kapatıldı",
        {
          description: res.token
            ? "Linke sahip olan herkes board'u görüntüleyebilir."
            : "Mevcut paylaşım linki artık çalışmıyor.",
        },
      );
    });
  }

  async function copyLink() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Link kopyalanamadı");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Board'u paylaş
          </DialogTitle>
          <DialogDescription>
            Linke sahip olan herkes <span className="font-medium">login olmadan</span>{" "}
            board'u <span className="font-medium">salt-okunur</span> görebilir.
            Sürükle-bırak veya düzenleme yok.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {token ? (
            <>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Link2 className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    readOnly
                    value={shareUrl}
                    className="pl-8 font-mono text-xs"
                    onFocus={(e) => e.currentTarget.select()}
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={copyLink}
                  className="shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="mr-1 h-4 w-4" />
                      Kopyalandı
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1 h-4 w-4" />
                      Kopyala
                    </>
                  )}
                </Button>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={toggle}
                disabled={isPending}
                className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                {isPending ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : null}
                Paylaşımı kapat
              </Button>
            </>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={toggle}
              disabled={isPending}
              className="w-full"
            >
              {isPending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Globe className="mr-1 h-4 w-4" />
              )}
              Paylaşım linkini oluştur
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
