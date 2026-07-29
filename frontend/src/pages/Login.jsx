import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LogIn } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const res = await login(email.trim(), password);
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(`Welcome, ${res.user.name || res.user.email}`);
    const from = loc.state?.from;
    if (from) return nav(from, { replace: true });
    if (res.user.role === "admin") nav("/admin");
    else if (res.user.role === "agent") nav("/agent");
    else nav("/");
  };

  return (
    <div className="mx-auto max-w-md px-6 py-24">
      <div className="overline mb-3">Sign in</div>
      <h1 className="font-display font-black tracking-mega text-4xl sm:text-5xl leading-none">
        Welcome back.
      </h1>
      <p className="mt-3 text-fog">Agents & admins only.</p>

      <form
        onSubmit={submit}
        className="mt-10 rounded-2xl border border-hairline bg-surface p-8 space-y-5"
        data-testid="login-form"
      >
        <div>
          <Label className="text-fog text-xs uppercase tracking-widest">Email</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2"
            data-testid="login-email-input"
          />
        </div>
        <div>
          <Label className="text-fog text-xs uppercase tracking-widest">Password</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2"
            data-testid="login-password-input"
          />
        </div>
        <Button
          type="submit"
          disabled={busy}
          className="btn-gold rounded-full h-11 px-6 font-semibold w-full"
          data-testid="login-submit"
        >
          <LogIn className="h-4 w-4 mr-2" />
          {busy ? "Signing in…" : "Sign in"}
        </Button>
        <p className="text-fog text-sm text-center pt-2">
          New agent?{" "}
          <a href="/agents/apply" className="text-gold hover:text-gold-hi" data-testid="login-apply-link">
            Apply here →
          </a>
        </p>
      </form>
    </div>
  );
}
