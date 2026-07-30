import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function HowItWorks() {
  return (
    <div className="mx-auto max-w-4xl px-6 lg:px-10 py-16" data-testid="how-it-works">
      <div className="overline mb-3">How it works</div>
      <h1 className="font-display font-black tracking-mega text-4xl sm:text-5xl leading-none text-navy">
        A marketing service. Two contracts. One clean closing.
      </h1>

      <ol className="mt-14 space-y-10">
        {[
          {
            n: "01",
            title: "Client submits a lead",
            body: "A buyer or seller fills a short form and signs a binding escrow consent — instructing their future closing agent to disburse (a) a 6% marketing fee to AgentEscrow and (b) the premium for their 1-year home warranty, out of the agent's commission at closing. Nothing comes from the client's proceeds."
          },
          {
            n: "02",
            title: "Agent applies & signs the marketing agreement",
            body: "Independent local agents apply. Zillow, Trulia, Redfin, Opendoor, Offerpad and similar corporate structures are auto-rejected. Approved agents e-sign the 6% marketing fee + home-warranty commitment."
          },
          {
            n: "03",
            title: "Admin matches the lead — within an hour",
            body: "An admin assigns each lead to a vetted approved local agent who lives within an hour of the property or search area."
          },
          {
            n: "04",
            title: "Agent works the deal — risk free",
            body: "The agent contacts the client, represents them, and shepherds the transaction to closing. Nothing is owed unless a sale closes."
          },
          {
            n: "05",
            title: "Closing agent honors the disbursement instruction",
            body: "At settlement the closing agent disburses (a) 6% × (Gross Commission − Broker Fee) to AgentEscrow, and (b) the home warranty premium to the warranty provider — both out of the agent's commission. The client walks away with keys and a 1-year home warranty."
          },
        ].map(s => (
          <li key={s.n} className="grid grid-cols-[80px_1fr] gap-8">
            <div className="font-display text-5xl font-black tracking-mega text-gold">{s.n}</div>
            <div>
              <h3 className="font-display text-2xl font-bold tracking-tight text-navy">{s.title}</h3>
              <p className="mt-2 text-navy/70 leading-relaxed">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-16 flex flex-wrap gap-4">
        <Link to="/leads/new"><Button className="btn-gold rounded-full h-11 px-6 font-semibold">Submit a lead <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        <Link to="/agents/apply"><Button variant="ghost" className="btn-ghost rounded-full h-11 px-6">Apply as agent</Button></Link>
      </div>
    </div>
  );
}
