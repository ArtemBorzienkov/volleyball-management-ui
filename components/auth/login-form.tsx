"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/providers/auth-provider";

interface LoginFormProps {
  /** Runs after the session cookie is set; the caller decides where to go next. */
  onSuccess: () => void;
  /** Why the form is being shown, when it was not the visitor's own idea to log in. */
  notice?: string;
  autoFocus?: boolean;
}

export function LoginForm({ onSuccess, notice, autoFocus }: LoginFormProps) {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  // Built here rather than at module level so the messages follow the active language.
  const schema = z.object({
    email: z.string().email(t("auth.emailInvalid")),
    password: z.string().min(1, t("auth.passwordRequired")),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    setFormError(null);
    try {
      await login(data.email, data.password);
      onSuccess();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : t("auth.somethingWrong"));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {notice && (
        <p
          className="rounded-md border border-warning/40 bg-card p-3 text-sm text-card-foreground"
          role="status"
          suppressHydrationWarning
        >
          {notice}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="login-email" className="text-sm font-medium" suppressHydrationWarning>
          {t("auth.email")}
        </label>
        <Input id="login-email" type="email" autoFocus={autoFocus} {...register("email")} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="login-password" className="text-sm font-medium" suppressHydrationWarning>
          {t("auth.password")}
        </label>
        <Input id="login-password" type="password" {...register("password")} />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <Button type="submit" disabled={isSubmitting}>
        <span suppressHydrationWarning>{isSubmitting ? t("auth.loggingIn") : t("auth.logIn")}</span>
      </Button>

      <p className="text-sm text-muted-foreground">
        <span suppressHydrationWarning>{t("auth.noAccount")}</span>{" "}
        <Link href="/register" className="underline">
          <span suppressHydrationWarning>{t("auth.signUp")}</span>
        </Link>
      </p>
    </form>
  );
}
