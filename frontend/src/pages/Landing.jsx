import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Marquee from "@/components/Marquee";
import { ArrowUpRight, Ban, Lock, ScrollText, Users, Building2, Sparkles } from "lucide-react";

const HERO_BG =
  "https://images.unsplash.com/photo-1488972685288-c3fd157d7c7a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1ODR8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBhcmNoaXRlY3R1cmUlMjBhYnN0cmFjdHxlbnwwfHx8fDE3ODUzNjY3NDR8MA&ixlib=rb-4.1.0&q=85";
const LUX = "https://images.pexels.com/photos/7031406/pexels-photo-7031406.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";
const AGENT_1 = "https://images.unsplash.com/photo-1647580427155-0483906cb9de?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAxODF8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjByZWFsJTIwZXN0YXRlJTIwYWdlbnQlMjBwb3J0cmFpdHxlbnwwfHx8fDE3ODUzNjY3NDR8MA&ixlib=rb-4.1.0&q=85";
const AGENT_2 = "https://images.unsplash.com/photo-1581065178047-8ee15951ede6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAxODF8MHwxfHNlYXJjaHwyfHxwcm9mZXNzaW9uYWwlMjByZWFsJTIwZXN0YXRlJTIwYWdlbnQlMjBwb3J0cmFpdHxlbnwwfHx8fDE3ODUzNjY3NDR8MA&ixlib=rb-4.1.0&q=85";
const CONTRACT = "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNTl8MHwxfHNlYXJjaHwxfHxzaWduaW5nJTIwY29udHJhY3QlMjBjbG9zZSUyMHVwfGVufDB8fHx8MTc4NTM2Njc0NHww&ixlib=rb-4.1.0&q=85";

export default function Landing() {
  return (
    <div data-testid="landing-page">
      {/* HERO */}
      <section className="relative overflow-hidden grain">
        <img
          src={HERO_BG}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-obsidian/60 via-obsidian/70 to-obsidian" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-10 pt-24 pb-32 lg:pt-32 lg:pb-40">
          <div className="overline mb-6 animate-reveal" data-testid="hero-overline">
            The anti-Zillow lead network
          </div>
          <h1
            data-testid="hero-headline"
            className="font-display font-black tracking-mega leading-none text-5xl sm:text-6xl lg:text-7xl max-w-5xl animate-reveal"
          >
            Real leads. Real closings.
            <br />
            <span className="text-gold">Paid only when the house sells.</span>
          </h1>
          <p
            className="mt-8 text-lg sm:text-xl text-ink/70 max-w-2xl leading-relaxed animate-reveal"
            data-testid="hero-sub"
          >
            AgentEscrow matches vetted local agents with real buyers and
            sellers. Agents pay <span className="text-gold font-semibold">6% of
            net commission</span> — out of closing escrow — <em>only</em> when a
            deal closes. Nothing up front. Nothing if it fails.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
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
        </div>
      </section>

      <Marquee
        items={[
          "Zero risk to agents",
          "6% escrow secured",
          "Local independent brokerages",
          "No Zillow. No Redfin. No Opendoor.",
          "Paid at closing — never before",
        ]}
      />

      {/* PILLARS — asymmetric tetris grid */}
      <section className="mx-auto max-w-7xl px-6 lg:px-10 py-24 lg:py-32">
        <div className="overline mb-4">How this works differently</div>
        <h2 className="font-display font-black tracking-mega text-4xl sm:text-5xl max-w-3xl leading-none">
          A closing-secured lead network — not a corporate lead farm.
        </h2>

        <div className="mt-14 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div
            data-testid="pillar-risk-free"
            className="lg:col-span-5 lg:row-span-2 tracing-beam rounded-2xl p-8 bg-surface"
          >
            <Lock className="h-8 w-8 text-gold" strokeWidth={1.5} />
            <h3 className="mt-6 font-display text-3xl font-bold tracking-tight">
              Risk-free for the agent
            </h3>
            <p className="mt-4 text-fog leading-relaxed">
              You owe nothing up front. Nothing monthly. Nothing if a lead
              doesn't close. The platform's fee comes out of the closing agent's
              disbursement — <span className="text-ink">only</span> when the
              transaction actually funds.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4">
              <img src={AGENT_1} alt="" className="rounded-xl aspect-[3/4] object-cover" />
              <img src={AGENT_2} alt="" className="rounded-xl aspect-[3/4] object-cover mt-8" />
            </div>
          </div>

          <div
            data-testid="pillar-escrow"
            className="lg:col-span-7 rounded-2xl p-8 bg-surface border border-hairline"
          >
            <ScrollText className="h-8 w-8 text-gold" strokeWidth={1.5} />
            <h3 className="mt-6 font-display text-3xl font-bold tracking-tight">
              6% of net commission — via closing escrow
            </h3>
            <p className="mt-4 text-fog leading-relaxed">
              The agreed fee is exactly six percent of your gross commission{" "}
              <em>less your broker fee</em>, disbursed directly by the closing
              agent to AgentEscrow at settlement. The buyer or seller
              countersigns a binding consent so the closing agent honors the
              instruction.
            </p>
            <code className="mt-6 block rounded-lg bg-obsidian border border-hairline p-4 text-sm font-mono text-gold">
              Escrow Amount = 0.06 × (Gross Commission − Broker Fee)
            </code>
          </div>

          <div
            data-testid="pillar-no-zillow"
            className="lg:col-span-7 rounded-2xl p-8 bg-surface border border-hairline"
          >
            <Ban className="h-8 w-8 text-signal" strokeWidth={1.5} />
            <h3 className="mt-6 font-display text-3xl font-bold tracking-tight">
              No Zillow. No corporate iBuyers.
            </h3>
            <p className="mt-4 text-fog leading-relaxed">
              Zillow, Trulia, Redfin, Opendoor, Offerpad, and other corporate
              platform-farms are blocked from applying. Applications from those
              structures are auto-rejected. Every approved agent works for an
              independent local brokerage.
            </p>
            <ul className="mt-6 flex flex-wrap gap-2 text-xs">
              {["Zillow", "Trulia", "Redfin", "Opendoor", "Offerpad", "Compass", "HomeLight"].map((b) => (
                <li
                  key={b}
                  className="px-3 py-1 rounded-full border border-signal/40 text-signal/90"
                >
                  Blocked · {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CONTRACT SECTION */}
      <section className="relative overflow-hidden bg-surface/40 border-y border-hairline">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-24 grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <div className="overline mb-4">Binding, both sides</div>
            <h2 className="font-display font-black tracking-mega text-4xl sm:text-5xl leading-none">
              The buyer or seller signs too.
            </h2>
            <p className="mt-6 text-lg text-fog leading-relaxed max-w-lg">
              When a lead is submitted, the buyer or seller signs a binding
              escrow consent — an instruction to their closing agent to
              disburse 6% of the agent's net commission to AgentEscrow at
              closing. It doesn't increase their cost. It doesn't come from
              their proceeds. It comes from the agent's commission.
            </p>
            <ul className="mt-8 space-y-3 text-ink">
              <li className="flex gap-3">
                <Sparkles className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                Signed PDF generated on submission
              </li>
              <li className="flex gap-3">
                <Users className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                Both parties countersign — enforceable at closing
              </li>
              <li className="flex gap-3">
                <Building2 className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                Closing agent honors it as a written disbursement instruction
              </li>
            </ul>
          </div>
          <div className="relative">
            <img
              src={CONTRACT}
              alt=""
              className="rounded-2xl border border-hairline w-full max-h-[520px] object-cover"
            />
            <div className="absolute -bottom-6 -left-6 hidden lg:block rounded-xl p-4 bg-obsidian border border-gold/30 shadow-2xl">
              <div className="overline">Escrow Amount</div>
              <div className="font-display text-3xl font-black text-gold tracking-mega">
                $18,240<span className="text-ink/40 text-sm ml-2 font-normal">on a $760k close</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA STRIP */}
      <section className="mx-auto max-w-7xl px-6 lg:px-10 py-24">
        <div
          className="tracing-beam rounded-3xl overflow-hidden relative p-10 lg:p-16 bg-surface grain"
          data-testid="cta-strip"
        >
          <div className="relative grid gap-8 lg:grid-cols-2 items-center">
            <div>
              <div className="overline mb-3">Ready</div>
              <h2 className="font-display text-4xl sm:text-5xl font-black tracking-mega leading-none">
                Get started in{" "}
                <span className="text-gold">3 minutes.</span>
              </h2>
              <p className="mt-4 text-fog max-w-md">
                Whether you're buying, selling, or licensed to close — pick your
                path below.
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
          <img
            src={LUX}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-10 pointer-events-none"
          />
        </div>
      </section>
    </div>
  );
}
