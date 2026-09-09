"use client";

import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoginForm } from "@/components/auth/login-form";

interface LoginRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** What the visitor was trying to do, so the prompt does not read as a random interruption. */
  notice: string;
  /** Fires once the session exists — the caller resumes whatever the login interrupted. */
  onAuthenticated: () => void;
}

export function LoginRequiredDialog({
  open,
  onOpenChange,
  notice,
  onAuthenticated,
}: LoginRequiredDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle suppressHydrationWarning>{t("auth.loginRequiredTitle")}</DialogTitle>
          <DialogDescription suppressHydrationWarning>{t("auth.loginRequiredSubtitle")}</DialogDescription>
        </DialogHeader>
        <LoginForm
          autoFocus
          notice={notice}
          onSuccess={() => {
            onOpenChange(false);
            onAuthenticated();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
