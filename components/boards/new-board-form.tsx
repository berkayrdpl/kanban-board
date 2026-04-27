"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createBoardAction,
  type BoardActionState,
} from "@/app/boards/actions";

const initial: BoardActionState = {};

export function NewBoardForm() {
  const [state, formAction, isPending] = useActionState(
    createBoardAction,
    initial,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // After successful submit (no error AND we re-rendered with empty state),
  // we already redirected via the action. So no client-side reset needed.
  // We just keep the form fresh.
  useEffect(() => {
    if (!isPending && !state.error) formRef.current?.reset();
  }, [isPending, state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-2 sm:flex-row sm:items-start"
    >
      <div className="flex-1">
        <Input
          name="title"
          placeholder="Yeni board başlığı (örn: Sprint 12)"
          required
          maxLength={120}
          aria-label="Board başlığı"
          disabled={isPending}
        />
        {state.error ? (
          <p className="mt-1 text-sm text-destructive">{state.error}</p>
        ) : null}
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Oluşturuluyor…" : "Oluştur"}
      </Button>
    </form>
  );
}
