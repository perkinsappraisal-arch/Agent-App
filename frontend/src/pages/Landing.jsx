import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Marquee from "@/components/Marquee";
import {
  ArrowUpRight, Ban, Lock, ScrollText, Users, Building2, Sparkles,
  KeyRound, Sun, Home as HomeIcon,
} from "lucide-react";

const HERO_IMG =
  "https://customer-assets-v7afamib.emergentagent.net/job_agent-lead-network/artifacts/2frhiuko_1785369748797.png";
const AGENT_1 = "https://images.unsplash.com/photo-1647580427155-0483906cb9de?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAxODF8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjByZWFsJTIwZXN0YXRlJTIwYWdlbnQlMjBwb3J0cmFpdHxlbnwwfHx8fDE3ODUzNjY3NDR8MA&ixlib=rb-4.1.0&q=85";
const AGENT_2 = "https://images.unsplash.com/photo-1581065178047-8ee15951ede6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAxODF8MHwxfHNlYXJjaHwyfHxwcm9mZXNzaW9uYWwlMjByZWFsJTIwZXN0YXRlJTIwYWdlbnQlMjBwb3J0cmFpdHxlbnwwfHx8fDE3ODUzNjY3NDR8MA&ixlib=rb-4.1.0&q=85";

export default function Landing() {
  return (
    <div data-testid="landing-page">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="sun-glow bg-rose h-72 w-72 -top-12 -left-16" />
        <div className="sun-glow bg-butter h-96 w-96 top-40 -right-24" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-10 pt-16 lg:pt-24 pb-20 lg:pb-24 grid gap-12 lg:grid-cols-12 items-center">
          <div className="lg:col-span-6 relative">
            <div className="overline mb-5 animate-reveal flex items-center gap-2" data-testid="hero-overline">
              <Sun className="h-3.5 w-3.5" strokeWidth={2.5} />
              Trusted local agents · within an hour
            </div>
            <h1
              data-testid="hero-headline"
              className="font-display font-black tracking-mega leading-[0.92] text-5xl sm:text-6xl lg:text-7xl text-navy animate-reveal"
            >
              Handshakes, not
              <br />
              <span className="text-gold">algorithms.</span>
            </h1>
            <p
              className="mt-6 text-lg text-navy/70 leading-relaxed max-w-lg animate-reveal"
              data-testid="hero-sub"
            >
              AgentEscrow connects real buyers and sellers with{" "}
              <span className="text-navy font-semibold">trusted local agents
              who live within an hour of your home</span>. Agents pay{" "}
              <span className="text-gold font-semibold">6% of net commission</span>{" "}
              — only when the house actually sells. Cheerful, closing-secured,
              corporate-free.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/leads/new" data-testid="hero-cta-lead">
                <Button className="btn-gold rounded-full h-12 px-7 font-semibold text-base">
                  I need an agent <ArrowUpRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/agents/apply" data-testid="hero-cta-agent">
                <Button variant="ghost" className="btn-ghost rounded-full h-12 px-7 text-base">
                  I am an agent
                </Button>
              </Link>
            </div>
            <div className="mt-10 flex items-center gap-6 text-navy/70 text-sm flex-wrap">
              <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-sage" /> Within 1 hour of you</span>
              <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-gold" /> No fees up-front</span>
              <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-rose" /> No Zillow · local only</span>
            </div>
          </div>

          <div className="lg:col-span-6 relative animate-reveal">
            <div className="relative rounded-[2rem] overflow-hidden border border-hairline shadow-[0_30px_80px_-30px_rgba(30,58,95,0.35)]">
              <img
                src={HERO_IMG}
                alt="Local agent handing keys to a happy buyer in front of a Victorian home"
                className="w-full h-[420px] sm:h-[520px] object-cover"
              />
              <div className="absolute top-5 right-5 chip-sold rounded-full px-4 py-2 shadow-md">
                <span className="font-display font-bold text-sm tracking-wider">SOLD · Escrow secured</span>
              </div>
            </div>
            {/* Floating stat card */}
            <div className="hidden md:block absolute -bottom-8 -left-6 rounded-2xl p-5 bg-surface border border-hairline shadow-xl animate-float">
              <div className="overline">Escrow to platform</div>
              <div className="mt-1 font-display text-3xl font-black tracking-mega text-gold">
                $18,240
              </div>
              <div className="text-navy/60 text-xs mt-0.5">on a recent $760k close</div>
            </div>
            <div className="hidden md:block absolute -top-4 -right-4 rounded-2xl p-4 bg-surface border border-hairline shadow-xl animate-float" style={{ animationDelay: "1.2s" }}>
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-sage" />
                <span className="text-xs font-semibold text-navy">Local agent · within an hour</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Marquee
        items={[
          "Trusted local agents within an hour",
          "Zero risk to agents",
          "6% escrow secured",
          "Local independent brokerages",
          "No Zillow. No Redfin. No Opendoor.",
          "Paid at closing — never before",
        ]}
      />

      {/* PILLARS */}
      <section className="mx-auto max-w-7xl px-6 lg:px-10 py-24 lg:py-28">
        <div className="overline mb-4">A better way to match</div>
        <h2 className="font-display font-black tracking-mega text-4xl sm:text-5xl max-w-3xl leading-[0.95] text-navy">
          A closing-secured lead network — not a corporate lead farm.
        </h2>

        <div className="mt-14 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div
            data-testid="pillar-risk-free"
            className="lg:col-span-5 lg:row-span-2 tracing-beam rounded-3xl p-8"
          >
            <div className="h-11 w-11 rounded-2xl bg-gold/12 flex items-center justify-center">
              <Lock className="h-5 w-5 text-gold" strokeWidth={2} />
            </div>
            <h3 className="mt-6 font-display text-3xl font-bold tracking-tight text-navy">
              Risk-free for the agent
            </h3>
            <p className="mt-4 text-navy/70 leading-relaxed">
              You owe nothing up front. Nothing monthly. Nothing if a lead
              doesn't close. The platform's fee comes out of the closing
              agent's disbursement — <span className="text-navy font-semibold">only</span>{" "}
              when the transaction actually funds.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4">
              <img src={AGENT_1} alt="" className="rounded-2xl aspect-[3/4] object-cover" />
              <img src={AGENT_2} alt="" className="rounded-2xl aspect-[3/4] object-cover mt-8" />
            </div>
          </div>

          <div
            data-testid="pillar-escrow"
            className="lg:col-span-7 rounded-3xl p-8 bg-surface border border-hairline"
          >
            <div className="h-11 w-11 rounded-2xl bg-sage/15 flex items-center justify-center">
              <ScrollText className="h-5 w-5 text-sage-lo" strokeWidth={2} />
            </div>
            <h3 className="mt-6 font-display text-3xl font-bold tracking-tight text-navy">
              6% of net commission — via closing escrow
            </h3>
            <p className="mt-4 text-navy/70 leading-relaxed">
              The agreed fee is exactly six percent of your gross commission{" "}
              <em>less your broker fee</em>, disbursed directly by the closing
              agent to AgentEscrow at settlement. The buyer or seller
              countersigns a binding consent so the closing agent honors the
              instruction.
            </p>
            <code className="mt-6 block rounded-xl bg-butter border border-hairline p-4 text-sm font-mono text-gold-lo">
              Escrow Amount = 0.06 × (Gross Commission − Broker Fee)
            </code>
          </div>

          <div
            data-testid="pillar-no-zillow"
            className="lg:col-span-7 rounded-3xl p-8 bg-surface border border-hairline"
          >
            <div className="h-11 w-11 rounded-2xl bg-signal/15 flex items-center justify-center">
              <Ban className="h-5 w-5 text-signal" strokeWidth={2} />
            </div>
            <h3 className="mt-6 font-display text-3xl font-bold tracking-tight text-navy">
              No Zillow. No corporate iBuyers.
            </h3>
            <p className="mt-4 text-navy/70 leading-relaxed">
              Zillow, Trulia, Redfin, Opendoor, Offerpad, and other corporate
              platform-farms are blocked from applying. Applications from those
              structures are auto-rejected. Every approved agent works for an
              independent local brokerage.
            </p>
            <ul className="mt-6 flex flex-wrap gap-2 text-xs">
              {["Zillow", "Trulia", "Redfin", "Opendoor", "Offerpad", "Compass", "HomeLight"].map((b) => (
                <li
                  key={b}
                  className="px-3 py-1 rounded-full border border-signal/40 text-signal bg-signal/5"
                >
                  Blocked · {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* BOTH-SIDES-SIGN band */}
      <section className="band-butter border-y border-hairline">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-24 grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <div className="overline mb-4">Binding, both sides</div>
            <h2 className="font-display font-black tracking-mega text-4xl sm:text-5xl leading-[0.95] text-navy">
              The buyer or seller signs too.
            </h2>
            <p className="mt-6 text-lg text-navy/70 leading-relaxed max-w-lg">
              When a lead is submitted, the buyer or seller signs a binding
              escrow consent — an instruction to their closing agent to
              disburse 6% of the agent's net commission to AgentEscrow at
              closing. It doesn't increase their cost. It doesn't come from
              their proceeds. It comes from the agent's commission.
            </p>
            <ul className="mt-8 space-y-3 text-navy">
              <li className="flex gap-3">
                <Sparkles className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                Signed PDF generated on submission
              </li>
              <li className="flex gap-3">
                <Users className="h-5 w-5 text-sage-lo shrink-0 mt-0.5" />
                Both parties countersign — enforceable at closing
              </li>
              <li className="flex gap-3">
                <Building2 className="h-5 w-5 text-navy shrink-0 mt-0.5" />
                Closing agent honors it as a written disbursement instruction
              </li>
            </ul>
          </div>
          <div className="relative">
            <div className="rounded-3xl overflow-hidden border border-hairline shadow-[0_30px_60px_-30px_rgba(30,58,95,0.35)] bg-surface">
              <div className="p-8 sm:p-10 space-y-4">
                <div className="overline">Buyer's escrow consent · v1.0</div>
                <div className="font-display text-2xl font-bold text-navy leading-tight">
                  I irrevocably instruct the closing agent to disburse 6% of
                  the referred agent's net commission to AgentEscrow at closing.
                </div>
                <div className="pt-3 border-t border-hairline">
                  <div className="text-navy/60 text-xs uppercase tracking-widest">Signed</div>
                  <div className="font-display text-3xl font-black text-gold tracking-tight mt-1">
                    Sam Buyer
                  </div>
                  <div className="text-navy/50 text-xs mt-1">
                    Typed electronic signature · 2026-07-29 · IP redacted
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 rounded-2xl px-4 py-2 bg-sage text-white shadow-md font-display text-sm font-bold rotate-3">
              Enforceable at closing
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS strip */}
      <section className="mx-auto max-w-7xl px-6 lg:px-10 py-24">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { icon: HomeIcon, tone: "gold", n: "01", t: "Client submits lead", b: "Buyer or seller signs the binding escrow consent — nothing paid up front." },
            { icon: KeyRound, tone: "sage", n: "02", t: "Local agent matched — within an hour", b: "Admin assigns to a vetted independent agent who lives within an hour of your home. No Zillow. No corporate lead farms." },
            { icon: Sparkles, tone: "rose", n: "03", t: "Only pays at closing", b: "6% of net commission is disbursed by the closing agent — only when the house sells." },
          ].map((s) => (
            <div key={s.n} className="rounded-3xl p-8 bg-surface border border-hairline hover:-translate-y-1 transition-transform">
              <div className={`h-11 w-11 rounded-2xl flex items-center justify-center bg-${s.tone}/15`}>
                <s.icon className={`h-5 w-5 text-${s.tone === "sage" ? "sage-lo" : s.tone}`} strokeWidth={2} />
              </div>
              <div className="overline mt-6" style={{ color: s.tone === "sage" ? "#4F6F42" : s.tone === "rose" ? "#B85069" : "#C55A3D" }}>Step {s.n}</div>
              <h3 className="mt-2 font-display text-2xl font-bold tracking-tight text-navy">{s.t}</h3>
              <p className="mt-3 text-navy/70">{s.b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA STRIP */}
      <section className="mx-auto max-w-7xl px-6 lg:px-10 pb-24">
        <div
          className="rounded-[2rem] overflow-hidden relative p-10 lg:p-16 band-sage border border-hairline"
          data-testid="cta-strip"
        >
          <div className="relative grid gap-8 lg:grid-cols-2 items-center">
            <div>
              <div className="overline mb-3" style={{ color: "#4F6F42" }}>Ready</div>
              <h2 className="font-display text-4xl sm:text-5xl font-black tracking-mega leading-[0.95] text-navy">
                Get started in{" "}
                <span className="text-gold">3 minutes.</span>
              </h2>
              <p className="mt-4 text-navy/70 max-w-md">
                Whether you're buying, selling, or licensed to close — pick
                your path below.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 lg:justify-end">
              <Link to="/leads/new">
                <Button className="btn-gold rounded-full h-12 px-7 font-semibold w-full sm:w-auto">
                  Submit a lead
                </Button>
              </Link>
              <Link to="/agents/apply">
                <Button variant="ghost" className="btn-ghost rounded-full h-12 px-7 w-full sm:w-auto">
                  Apply as agent
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
