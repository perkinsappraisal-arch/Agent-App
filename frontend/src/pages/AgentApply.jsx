import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";
import { CheckCircle2, ShieldAlert, ScrollText } from "lucide-react";

const empty = {
  name: "",
  email: "",
  password: "",
  phone: "",
  brokerage: "",
  license_number: "",
  service_area: "",
  years_experience: 3,
  attest_not_zillow: false,
  attest_not_corporate: false,
  attest_will_pay_escrow: false,
  signed_name: "",
};

export default function AgentApply() {
  const [form, setForm] = useState(empty);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [result, setResult] = useState(null);
  const nav = useNavigate();

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const allAttested =
    form.attest_not_zillow && form.attest_not_corporate && form.attest_will_pay_escrow;

  const next = (e) => {
    e.preventDefault();
    const required = ["name", "email", "password", "phone", "brokerage", "license_number", "service_area"];
    for (const k of required) {
      if (!String(form[k]).trim()) {
        toast.error(`Please fill in ${k.replaceAll("_", " ")}`);
        return;
      }
    }
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!allAttested) {
      toast.error("You must confirm all three attestations to proceed.");
      return;
    }
    if (form.signed_name.trim().length < 2) {
      toast.error("Please type your full legal name to sign.");
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post("/agents/apply", form);
      setResult(data);
      if (data.blocked) {
        toast.error("Application declined — corporate iBuyer structure.");
      } else {
        toast.success("Application received. Awaiting admin approval.");
      }
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24" data-testid="agent-apply-result">
        {result.blocked ? (
          <>
            <ShieldAlert className="h-12 w-12 text-signal" />
            <h1 className="mt-6 font-display font-black tracking-mega text-4xl sm:text-5xl leading-none">
              Application declined.
            </h1>
            <p className="mt-4 text-fog text-lg leading-relaxed">
              Your brokerage matched an excluded corporate/iBuyer term:{" "}
              <span className="text-signal font-mono">{result.matched_term}</span>.
              AgentEscrow only accepts independent local agents.
            </p>
          </>
        ) : (
          <>
            <CheckCircle2 className="h-12 w-12 text-gold" />
            <h1 className="mt-6 font-display font-black tracking-mega text-4xl sm:text-5xl leading-none">
              Application received.
            </h1>
            <p className="mt-4 text-fog text-lg leading-relaxed">
              {result.message} You'll be able to log in once approved.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href={`${process.env.REACT_APP_BACKEND_URL}/api/contracts/${result.contract_id}/pdf`}
                target="_blank"
                rel="noreferrer"
                data-testid="agent-contract-pdf"
              >
                <Button className="btn-gold rounded-full h-11 px-6 font-semibold">
                  Download signed PDF
                </Button>
              </a>
              <Button
                variant="ghost"
                className="btn-ghost rounded-full h-11 px-6"
                onClick={() => nav("/login")}
                data-testid="agent-go-login"
              >
                Go to sign-in
              </Button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 lg:px-10 py-16">
      <div className="overline mb-3">Step {step} of 2 · Agent application</div>
      <h1 className="font-display font-black tracking-mega text-4xl sm:text-5xl leading-none">
        {step === 1 ? "Apply to receive leads." : "Sign the 6% escrow agreement."}
      </h1>
      <p className="mt-3 text-fog max-w-xl">
        {step === 1
          ? "AgentEscrow is only for independent, local, licensed agents. If your brokerage looks like Zillow, this is not for you."
          : "You are attesting to your independence and agreeing to route 6% of net commission through closing escrow — only when a deal actually closes."}
      </p>

      {step === 1 ? (
        <form
          onSubmit={next}
          className="mt-10 grid gap-6 rounded-2xl border border-hairline bg-surface p-8"
          data-testid="agent-form-step1"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" testId="agent-name">
              <Input value={form.name} onChange={(e) => upd("name", e.target.value)} data-testid="agent-name-input" />
            </Field>
            <Field label="Work email" testId="agent-email">
              <Input type="email" value={form.email} onChange={(e) => upd("email", e.target.value)} data-testid="agent-email-input" />
            </Field>
            <Field label="Phone" testId="agent-phone">
              <Input value={form.phone} onChange={(e) => upd("phone", e.target.value)} data-testid="agent-phone-input" />
            </Field>
            <Field label="Password (min 8 chars)" testId="agent-password">
              <Input type="password" value={form.password} onChange={(e) => upd("password", e.target.value)} data-testid="agent-password-input" />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Brokerage" testId="agent-brokerage">
              <Input value={form.brokerage} onChange={(e) => upd("brokerage", e.target.value)} placeholder="Independent local brokerage" data-testid="agent-brokerage-input" />
            </Field>
            <Field label="License #" testId="agent-license">
              <Input value={form.license_number} onChange={(e) => upd("license_number", e.target.value)} data-testid="agent-license-input" />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Service area (cities / counties — within a 1-hour drive)" testId="agent-service-area">
              <Input value={form.service_area} onChange={(e) => upd("service_area", e.target.value)} placeholder="e.g. Denver metro, Boulder County" data-testid="agent-service-area-input" />
              <div className="mt-1.5 text-xs text-navy/50">
                We only assign leads whose address is within an hour of areas you list here.
              </div>
            </Field>
            <Field label="Years of experience" testId="agent-years">
              <Input type="number" min="0" max="70" value={form.years_experience} onChange={(e) => upd("years_experience", Number(e.target.value || 0))} data-testid="agent-years-input" />
            </Field>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" className="btn-gold rounded-full h-11 px-6 font-semibold" data-testid="agent-next">
              Continue to contract →
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={submit} className="mt-10 space-y-6" data-testid="agent-form-step2">
          <div className="tracing-beam rounded-2xl p-8 bg-surface">
            <div className="flex items-center gap-3 mb-4">
              <ScrollText className="h-6 w-6 text-gold" />
              <div className="overline">Agent Lead & Commission Escrow Agreement · v1.0</div>
            </div>
            <div className="space-y-4 text-fog leading-relaxed max-h-72 overflow-y-auto pr-3 text-sm">
              <p><strong className="text-ink">1. Marketing service.</strong> AgentEscrow is a marketing service that refers qualifying local leads. No lead volume is guaranteed.</p>
              <p><strong className="text-ink">2. Marketing fee — 6% of your commission.</strong> Six percent of your <em>own</em> commission (Gross Commission − Broker Fee), collected via the closing agent, only at closing.</p>
              <p className="font-mono text-gold text-xs">Marketing Fee = 0.06 × (Gross Commission − Broker Fee)</p>
              <p><strong className="text-ink">3. Home warranty for the client.</strong> You will additionally purchase a 1-year home warranty for the client (default $600, confirmed at closing), paid out of your commission at closing.</p>
              <p><strong className="text-ink">4. Zillow / iBuyer exclusion.</strong> You attest you are not affiliated with Zillow, Trulia, Redfin, Opendoor, Offerpad, or any corporate iBuyer / platform-owned lead-farm.</p>
              <p><strong className="text-ink">5. Risk-free.</strong> If a lead doesn't close, nothing is owed and no home warranty is purchased.</p>
              <p><strong className="text-ink">6. Audit.</strong> Platform may verify closings against public and MLS records.</p>
            </div>
          </div>

          <Attest testId="attest-not-zillow" checked={form.attest_not_zillow} onCheck={(v) => upd("attest_not_zillow", v)}>
            I am <strong className="text-ink">not</strong> employed by, contracted to, or economically affiliated with Zillow, Trulia, Redfin, Opendoor, or Offerpad.
          </Attest>
          <Attest testId="attest-not-corporate" checked={form.attest_not_corporate} onCheck={(v) => upd("attest_not_corporate", v)}>
            My brokerage is an <strong className="text-ink">independent local firm</strong>, not a corporate iBuyer or platform-owned lead-farm.
          </Attest>
          <Attest testId="attest-will-pay" checked={form.attest_will_pay_escrow} onCheck={(v) => upd("attest_will_pay_escrow", v)}>
            I will instruct my closing agent to disburse, out of my commission at closing: (a) 6% of my commission to AgentEscrow as a marketing fee, and (b) the premium for the client's 1-year home warranty.
          </Attest>

          <Field label="Type your full legal name to sign" testId="agent-sign">
            <Input
              value={form.signed_name}
              onChange={(e) => upd("signed_name", e.target.value)}
              placeholder="e.g. Alex M. Chen"
              className="text-2xl font-display h-14 tracking-tight"
              data-testid="agent-signature-input"
            />
          </Field>

          <div className="flex justify-between pt-2">
            <Button
              type="button"
              variant="ghost"
              className="btn-ghost rounded-full h-11 px-6"
              onClick={() => setStep(1)}
              data-testid="agent-back"
            >
              ← Back
            </Button>
            <Button
              type="submit"
              disabled={submitting || !allAttested}
              className="btn-gold rounded-full h-11 px-6 font-semibold"
              data-testid="agent-submit"
            >
              {submitting ? "Submitting…" : "Sign & submit application"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function Field({ label, testId, children }) {
  return (
    <div data-testid={testId}>
      <Label className="text-fog text-xs uppercase tracking-widest">{label}</Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Attest({ testId, checked, onCheck, children }) {
  return (
    <label
      className="flex gap-3 items-start p-5 rounded-xl border border-hairline bg-surface cursor-pointer hover:border-gold/50 transition-colors"
      data-testid={`${testId}-label`}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onCheck(!!v)}
        className="mt-0.5"
        data-testid={testId}
      />
      <span className="text-sm text-ink">{children}</span>
    </label>
  );
}
