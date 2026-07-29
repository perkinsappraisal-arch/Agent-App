import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";
import { CheckCircle2, ScrollText } from "lucide-react";

const empty = {
  kind: "buyer",
  full_name: "",
  email: "",
  phone: "",
  street_address: "",
  city: "",
  state: "",
  zip_code: "",
  property_type: "Single-family home",
  price_range: "$400k – $600k",
  timeline: "0 – 3 months",
  notes: "",
  attest_binding_escrow: false,
  signed_name: "",
};

export default function LeadForm() {
  const [form, setForm] = useState(empty);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1 = details, 2 = escrow consent
  const [result, setResult] = useState(null);
  const nav = useNavigate();

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const goNext = (e) => {
    e.preventDefault();
    // basic validation
    const required = ["full_name", "email", "phone", "street_address", "city", "state", "zip_code"];
    for (const k of required) {
      if (!form[k].trim()) {
        toast.error(`Please fill in ${k.replace("_", " ")}`);
        return;
      }
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.attest_binding_escrow) {
      toast.error("You must agree to the binding escrow consent.");
      return;
    }
    if (form.signed_name.trim().length < 2) {
      toast.error("Please type your full legal name to sign.");
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post("/leads", form);
      setResult(data);
      toast.success("Lead submitted successfully.");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24" data-testid="lead-success">
        <CheckCircle2 className="h-12 w-12 text-gold" />
        <h1 className="mt-6 font-display font-black tracking-mega text-4xl sm:text-5xl leading-none">
          Lead submitted.
        </h1>
        <p className="mt-4 text-fog text-lg leading-relaxed">
          {result.message} You can download a copy of your signed escrow
          consent below.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href={`${process.env.REACT_APP_BACKEND_URL}/api/contracts/${result.contract_id}/pdf`}
            target="_blank"
            rel="noreferrer"
            data-testid="lead-contract-pdf"
          >
            <Button className="btn-gold rounded-full h-11 px-6 font-semibold">
              Download signed PDF
            </Button>
          </a>
          <Button
            variant="ghost"
            className="btn-ghost rounded-full h-11 px-6"
            onClick={() => nav("/")}
            data-testid="lead-back-home"
          >
            Back to home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 lg:px-10 py-16">
      <div className="overline mb-3">Step {step} of 2</div>
      <h1 className="font-display font-black tracking-mega text-4xl sm:text-5xl leading-none">
        {step === 1 ? "Tell us what you need." : "Sign your escrow consent."}
      </h1>
      <p className="mt-3 text-fog max-w-xl">
        {step === 1
          ? "A vetted, independent local agent will reach out. No corporate iBuyers ever contact you."
          : "This binding consent tells your future closing agent how to disburse a small piece of the agent's commission at closing. It does NOT increase your cost."}
      </p>

      {step === 1 ? (
        <form
          onSubmit={goNext}
          className="mt-10 grid gap-6 rounded-2xl border border-hairline bg-surface p-8"
          data-testid="lead-form-step1"
        >
          <div>
            <Label className="text-ink">I am a</Label>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {["buyer", "seller"].map((k) => (
                <button
                  key={k}
                  type="button"
                  data-testid={`lead-kind-${k}`}
                  onClick={() => upd("kind", k)}
                  className={`px-4 py-3 rounded-xl border transition-colors text-left ${
                    form.kind === k
                      ? "border-gold bg-gold/10 text-ink"
                      : "border-hairline text-fog hover:border-gold/50"
                  }`}
                >
                  <div className="font-display font-bold capitalize">{k}</div>
                  <div className="text-xs mt-1">
                    {k === "buyer" ? "I want to purchase a home." : "I want to sell my home."}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" testId="lead-full-name">
              <Input value={form.full_name} onChange={(e) => upd("full_name", e.target.value)} data-testid="lead-full-name-input" />
            </Field>
            <Field label="Email" testId="lead-email">
              <Input type="email" value={form.email} onChange={(e) => upd("email", e.target.value)} data-testid="lead-email-input" />
            </Field>
            <Field label="Phone" testId="lead-phone">
              <Input value={form.phone} onChange={(e) => upd("phone", e.target.value)} data-testid="lead-phone-input" />
            </Field>
            <Field label="Property type" testId="lead-property-type">
              <Select value={form.property_type} onValueChange={(v) => upd("property_type", v)}>
                <SelectTrigger data-testid="lead-property-type-trigger"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Single-family home", "Condo", "Townhouse", "Multi-family", "Land", "Luxury"].map(o =>
                    <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="City" testId="lead-city">
              <Input value={form.city} onChange={(e) => upd("city", e.target.value)} data-testid="lead-city-input" />
            </Field>
            <Field label="State" testId="lead-state">
              <Input value={form.state} onChange={(e) => upd("state", e.target.value)} data-testid="lead-state-input" />
            </Field>
            <Field label="ZIP code" testId="lead-zip">
              <Input value={form.zip_code} onChange={(e) => upd("zip_code", e.target.value)} data-testid="lead-zip-input" />
            </Field>
          </div>

          <Field label={form.kind === "buyer" ? "Address you're looking near (or current address)" : "Address of the home you're selling"} testId="lead-address">
            <Input
              value={form.street_address}
              onChange={(e) => upd("street_address", e.target.value)}
              placeholder="123 Main St"
              data-testid="lead-address-input"
            />
            <div className="mt-1.5 text-xs text-navy/50">
              We match you with a trusted local agent within an hour of this address.
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Price range" testId="lead-price">
              <Select value={form.price_range} onValueChange={(v) => upd("price_range", v)}>
                <SelectTrigger data-testid="lead-price-trigger"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Under $250k", "$250k – $400k", "$400k – $600k", "$600k – $900k", "$900k – $1.5M", "$1.5M+"].map(o =>
                    <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Timeline" testId="lead-timeline">
              <Select value={form.timeline} onValueChange={(v) => upd("timeline", v)}>
                <SelectTrigger data-testid="lead-timeline-trigger"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["0 – 3 months", "3 – 6 months", "6 – 12 months", "Just exploring"].map(o =>
                    <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Notes (optional)" testId="lead-notes">
            <Textarea rows={3} value={form.notes} onChange={(e) => upd("notes", e.target.value)} data-testid="lead-notes-input" />
          </Field>

          <div className="flex justify-end pt-2">
            <Button type="submit" className="btn-gold rounded-full h-11 px-6 font-semibold" data-testid="lead-next">
              Continue to consent →
            </Button>
          </div>
        </form>
      ) : (
        <form
          onSubmit={submit}
          className="mt-10 space-y-6"
          data-testid="lead-form-step2"
        >
          <div className="tracing-beam rounded-2xl p-8 bg-surface">
            <div className="flex items-center gap-3 mb-4">
              <ScrollText className="h-6 w-6 text-gold" />
              <div className="overline">Binding escrow consent · v1.0</div>
            </div>
            <div className="space-y-4 text-fog leading-relaxed max-h-72 overflow-y-auto pr-3 text-sm">
              <p><strong className="text-ink">1. Purpose.</strong> You've requested a
              local, non-corporate agent referral from AgentEscrow.</p>
              <p><strong className="text-ink">2. Escrow Consent.</strong> You
              irrevocably instruct the closing / settlement agent of the resulting
              transaction to disburse to AgentEscrow, from the agent's commission
              at closing, an amount equal to
              <span className="text-gold"> six percent (6%) of the agent's Gross
              Commission LESS the Broker Fee </span> — deducted from the agent's
              commission only, not from your proceeds or purchase funds.</p>
              <p><strong className="text-ink">3. Binding.</strong> You will not
              instruct the closing agent to withhold this disbursement.</p>
              <p><strong className="text-ink">4. No Escrow Service.</strong>
              AgentEscrow is not itself a licensed escrow holder. Actual escrow,
              title and settlement services are performed by a licensed third
              party of your or the agent's choosing.</p>
              <p><strong className="text-ink">5. No Sale, No Obligation.</strong>
              If the transaction does not close, nothing is owed under this
              agreement.</p>
            </div>
          </div>

          <label
            className="flex gap-3 items-start p-5 rounded-xl border border-hairline bg-surface cursor-pointer hover:border-gold/50 transition-colors"
            data-testid="lead-attest-label"
          >
            <Checkbox
              checked={form.attest_binding_escrow}
              onCheckedChange={(v) => upd("attest_binding_escrow", !!v)}
              className="mt-0.5"
              data-testid="lead-attest-checkbox"
            />
            <span className="text-sm text-ink">
              I have read the above and I <strong className="text-gold">agree
              </strong>{" "}
              to the binding escrow consent described. I understand this
              consent is enforceable at closing.
            </span>
          </label>

          <Field label="Type your full legal name to sign" testId="lead-sign">
            <Input
              value={form.signed_name}
              onChange={(e) => upd("signed_name", e.target.value)}
              placeholder="e.g. Jordan A. Rivera"
              className="text-2xl font-display h-14 tracking-tight"
              data-testid="lead-signature-input"
            />
          </Field>

          <div className="flex justify-between pt-2">
            <Button
              type="button"
              variant="ghost"
              className="btn-ghost rounded-full h-11 px-6"
              onClick={() => setStep(1)}
              data-testid="lead-back"
            >
              ← Back
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="btn-gold rounded-full h-11 px-6 font-semibold"
              data-testid="lead-submit"
            >
              {submitting ? "Submitting…" : "Sign & submit lead"}
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
