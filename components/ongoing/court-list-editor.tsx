"use client";

import { useTranslation } from "react-i18next";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAX_COURTS, MAX_COURT_LABEL_LENGTH, courtListProblem, newCourtDraft, type CourtDraft } from "@/lib/ongoing-courts";

interface CourtListEditorProps {
  courts: CourtDraft[];
  onChange: (courts: CourtDraft[]) => void;
  /**
   * Once a result is recorded only renames are safe — anything else would move a fixture already
   * played — so rounds, order, adding and removing are locked while the labels stay editable.
   */
  isStructureLocked?: boolean;
  disabled?: boolean;
}

/**
 * The tournament's courts in fill order: the first court is used first in every round. Each court
 * is open for a range of rounds, all day by default. Shared by the create form and the Config tab.
 */
export function CourtListEditor({ courts, onChange, isStructureLocked = false, disabled = false }: CourtListEditorProps) {
  const { t } = useTranslation();
  const problem = courtListProblem(courts);
  const isStructureEditable = !disabled && !isStructureLocked;

  const update = (index: number, patch: Partial<CourtDraft>) =>
    onChange(courts.map((court, courtIndex) => (courtIndex === index ? { ...court, ...patch } : court)));
  const move = (index: number, offset: -1 | 1) => {
    const next = courts.slice();
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium" suppressHydrationWarning>
          {t("ongoing.courts.title")}
        </span>
        <span className="text-xs text-muted-foreground" suppressHydrationWarning>
          {t("ongoing.courts.hint")}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_4.5rem_4.5rem_auto] items-center gap-2 text-xs text-muted-foreground">
        <span suppressHydrationWarning>{t("ongoing.courts.label")}</span>
        <span suppressHydrationWarning>{t("ongoing.courts.fromRound")}</span>
        <span suppressHydrationWarning>{t("ongoing.courts.toRound")}</span>
        <span />
      </div>

      {courts.map((court, index) => (
        <div key={index} className="grid grid-cols-[1fr_4.5rem_4.5rem_auto] items-center gap-2">
          <Input
            aria-label={t("ongoing.courts.labelFor", { position: index + 1 })}
            value={court.label}
            maxLength={MAX_COURT_LABEL_LENGTH}
            disabled={disabled}
            onChange={(event) => update(index, { label: event.target.value })}
          />
          <Input
            aria-label={t("ongoing.courts.fromRoundFor", { position: index + 1 })}
            type="number"
            min={1}
            value={court.fromRound}
            disabled={!isStructureEditable}
            onChange={(event) => update(index, { fromRound: event.target.value })}
          />
          <Input
            aria-label={t("ongoing.courts.toRoundFor", { position: index + 1 })}
            type="number"
            min={1}
            placeholder={t("ongoing.courts.toEnd")}
            value={court.toRound}
            disabled={!isStructureEditable}
            onChange={(event) => update(index, { toRound: event.target.value })}
          />
          <div className="flex items-center">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t("ongoing.courts.moveUp", { position: index + 1 })}
              disabled={!isStructureEditable || index === 0}
              onClick={() => move(index, -1)}
            >
              <ArrowUp className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t("ongoing.courts.moveDown", { position: index + 1 })}
              disabled={!isStructureEditable || index === courts.length - 1}
              onClick={() => move(index, 1)}
            >
              <ArrowDown className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t("ongoing.courts.remove", { position: index + 1 })}
              disabled={!isStructureEditable || courts.length === 1}
              onClick={() => onChange(courts.filter((_court, courtIndex) => courtIndex !== index))}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        disabled={!isStructureEditable || courts.length >= MAX_COURTS}
        onClick={() => onChange([...courts, newCourtDraft(courts)])}
      >
        <Plus className="mr-1 size-3.5" />
        <span suppressHydrationWarning>{t("ongoing.courts.add")}</span>
      </Button>

      {isStructureLocked && (
        <p className="text-xs text-muted-foreground" suppressHydrationWarning>
          {t("ongoing.courts.lockedHint")}
        </p>
      )}
      {problem && (
        <p className="text-xs text-destructive" suppressHydrationWarning>
          {t(problem.key, problem.values)}
        </p>
      )}
    </div>
  );
}
