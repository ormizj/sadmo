import Logo from "@/components/Logo";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/75 p-8 shadow-xl shadow-indigo-300/30 ring-1 ring-slate-900/5 backdrop-blur-xl sm:p-10">
      <div className="mb-8 space-y-4">
        <Logo />
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Welcome back
          </h1>
          <p className="text-sm text-slate-500">
            Sign in to your Sadmo account to continue.
          </p>
        </div>
      </div>

      <LoginForm />
    </div>
  );
}
