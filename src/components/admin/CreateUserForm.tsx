"use client";

import { useState, type FormEvent } from "react";
import { Mail, User as UserIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import TextField from "@/components/ui/TextField";
import Button from "@/components/ui/Button";
import {
  validateCreateUser,
  type CreateUserErrors,
} from "@/lib/validation/user";

type Result =
  | { type: "success"; email: string }
  | { type: "error"; message: string }
  | null;

export default function CreateUserForm() {
  const t = useTranslations("AdminUsers");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("USER");
  const [errors, setErrors] = useState<CreateUserErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResult(null);

    const next = validateCreateUser({ email, name, role });
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, role }),
      });

      if (res.status === 201) {
        setResult({ type: "success", email });
        setEmail("");
        setName("");
        setRole("USER");
        setErrors({});
        return;
      }

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        fields?: CreateUserErrors;
      };
      if (res.status === 422 && data.fields) {
        setErrors(data.fields);
      } else {
        setResult({ type: "error", message: data.error ?? t("errorGeneric") });
      }
    } catch {
      setResult({ type: "error", message: t("errorNetwork") });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {result?.type === "success" && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          {t("success", { email: result.email })}
        </p>
      )}
      {result?.type === "error" && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
        >
          {result.message}
        </p>
      )}

      <TextField
        id="email"
        name="email"
        type="email"
        label={t("emailLabel")}
        placeholder="person@company.com"
        autoComplete="off"
        leadingIcon={<Mail className="size-4" />}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
      />

      <TextField
        id="name"
        name="name"
        label={t("nameLabel")}
        placeholder="Jane Doe"
        leadingIcon={<UserIcon className="size-4" />}
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
      />

      <div className="space-y-1.5">
        <label
          htmlFor="role"
          className="block text-sm font-medium text-slate-700"
        >
          {t("roleLabel")}
        </label>
        <select
          id="role"
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
        >
          <option value="USER">{t("roleUser")}</option>
          <option value="ADMIN">{t("roleAdmin")}</option>
        </select>
        {errors.role && (
          <p className="text-xs font-medium text-red-600">{errors.role}</p>
        )}
      </div>

      <Button type="submit" variant="primary" disabled={submitting}>
        {submitting ? t("submitLoading") : t("submit")}
      </Button>
    </form>
  );
}
