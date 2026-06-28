"use client";

import type { ReactNode } from "react";
import { Mail, Plus } from "lucide-react";
import Logo from "@/components/Logo";
import Button from "@/components/ui/Button";
import TextField from "@/components/ui/TextField";
import PasswordField from "@/components/ui/PasswordField";

export default function ComponentsDevPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Components
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Every UI primitive rendered with its variants and states.
        </p>
      </div>

      <Section title="Logo">
        <Swatch label="Default">
          <Logo />
        </Swatch>
        <Swatch label="markOnly">
          <Logo markOnly />
        </Swatch>
        <Swatch label='className="scale-150"'>
          <Logo className="scale-150" />
        </Swatch>
      </Section>

      <Section title="Button">
        <Swatch label="primary">
          <Button variant="primary">Primary</Button>
        </Swatch>
        <Swatch label="outline">
          <Button variant="outline">Outline</Button>
        </Swatch>
        <Swatch label="primary · disabled">
          <Button variant="primary" disabled>
            Primary
          </Button>
        </Swatch>
        <Swatch label="outline · disabled">
          <Button variant="outline" disabled>
            Outline
          </Button>
        </Swatch>
        <Swatch label="with leading icon">
          <Button variant="primary">
            <Plus className="size-4" />
            New
          </Button>
        </Swatch>
        <Swatch label="fullWidth" full>
          <Button variant="primary" fullWidth>
            Full width
          </Button>
        </Swatch>
      </Section>

      <Section title="TextField">
        <Swatch label="Default" full>
          <TextField id="tf-default" label="Name" placeholder="Jane Doe" />
        </Swatch>
        <Swatch label="With leading icon" full>
          <TextField
            id="tf-icon"
            type="email"
            label="Email"
            placeholder="you@company.com"
            leadingIcon={<Mail className="size-4" />}
          />
        </Swatch>
        <Swatch label="With error" full>
          <TextField
            id="tf-error"
            label="Email"
            defaultValue="not-an-email"
            error="Enter a valid email address."
          />
        </Swatch>
        <Swatch label="Disabled" full>
          <TextField
            id="tf-disabled"
            label="Workspace"
            placeholder="Disabled"
            defaultValue="acme-inc"
            disabled
          />
        </Swatch>
        <Swatch label="With trailing toggle (interactive)" full>
          <PasswordField
            id="tf-password"
            label="Password"
            placeholder="••••••••"
            defaultValue="hunter2"
            leadingIcon={<Mail className="size-4" />}
          />
        </Swatch>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h2>
      <div className="grid gap-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

function Swatch({
  label,
  children,
  full = false,
}: {
  label: string;
  children: ReactNode;
  full?: boolean;
}) {
  return (
    <div className={`space-y-2 ${full ? "sm:col-span-2" : ""}`}>
      <p className="font-mono text-xs text-slate-400">{label}</p>
      <div>{children}</div>
    </div>
  );
}
