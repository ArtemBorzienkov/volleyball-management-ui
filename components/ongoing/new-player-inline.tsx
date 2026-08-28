"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import API from "@/lib/api";
import type { Player } from "@/lib/types";

interface NewPlayerInlineFormProps {
  // Receives the created player so the caller can select it immediately, without waiting on the
  // ["players"] refetch this component triggers.
  onCreated: (player: Player) => void;
  onCancel: () => void;
}

// Lifted out of register-team-dialog / team-roster-editor, which each carry their own copy of this
// row. New call sites use this one; those two are candidates for the same migration.
export function NewPlayerInlineForm({ onCreated, onCancel }: NewPlayerInlineFormProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");

  const createPlayerMutation = useMutation({
    mutationFn: async (): Promise<Player> => {
      const response = await fetch(API.CREATE_PLAYER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), gender, active: true }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Request failed" }));
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: (player) => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
      onCreated(player);
    },
  });

  return (
    <div className="flex flex-col gap-2 rounded-md border border-input p-3">
      <Input
        autoFocus
        value={name}
        onChange={(changeEvent) => setName(changeEvent.target.value)}
        placeholder={t("addResults.addPlayerModal.namePlaceholder")}
      />
      <select
        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        value={gender}
        onChange={(changeEvent) => setGender(changeEvent.target.value)}
      >
        <option value="">{t("addResults.addPlayerModal.genderPlaceholder")}</option>
        <option value="male">{t("addResults.addPlayerModal.male")}</option>
        <option value="female">{t("addResults.addPlayerModal.female")}</option>
      </select>

      {createPlayerMutation.isError && (
        <p className="text-sm text-destructive">{(createPlayerMutation.error as Error).message}</p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={createPlayerMutation.isPending}>
          <span suppressHydrationWarning>{t("addResults.addPlayerModal.cancel")}</span>
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() => createPlayerMutation.mutate()}
          disabled={!name.trim() || !gender || createPlayerMutation.isPending}
        >
          <span suppressHydrationWarning>
            {createPlayerMutation.isPending
              ? t("addResults.addPlayerModal.creating")
              : t("addResults.addPlayerModal.create")}
          </span>
        </Button>
      </div>
    </div>
  );
}
