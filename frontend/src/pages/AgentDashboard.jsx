import { useEffect, useState } from "react";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Home, DollarSign, TrendingUp, ScrollText } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";

export default function AgentDashboard() {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [closeLead, setCloseLead] = useState(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const [l, d] = await Promise.all([
        api.get("/agent/leads"),
        api.get("/agent/deals"),
      ]);
      setLeads(l.data);
      setDeals(d.data);
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const totalEscrow = deals.reduce((s, d) => s + (d.escrow_amount || 0), 0);
  const totalNet = deals.reduce((s, d) => s + (d.net_commission || 0), 0);

  return (
    <div className="mx-auto max-w-7xl px-6 lg:px-10 py-12" data-testid="agent-dashboard">
      <div className="overline mb-3">Agent portal</div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display font-black tracking-mega text-4xl sm:text-5xl leading-none">
          {user?.name?.split(" ")[0] || "Agent"} — your leads.
        </h1>
        <div className="text-fog text-sm">{user?.brokerage} · {user?.service_area}</div>
      </div>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat icon={Home} label="Assigned leads" value={leads.length} testId="stat-leads" />
        <Stat icon={DollarSign} label="Closed deals" value={deals.length} testId="stat-deals" />
        <Stat icon={TrendingUp} label="Escrow due to platform"
              value={`$${totalEscrow.toLocaleString(undefined, {maximumFractionDigits: 0})}`}
              sub={`Your net: $${totalNet.toLocaleString(undefined, {maximumFractionDigits: 0})}`}
              testId="stat-escrow" />
      </div>

      <section className="mt-14">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl font-bold tracking-tight">Your leads</h2>
          <Button variant="ghost" className="btn-ghost rounded-full h-9 px-4 text-sm" onClick={refresh} data-testid="agent-refresh-leads">
            Refresh
          </Button>
        </div>
        <div className="rounded-2xl border border-hairline bg-surface overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-hairline hover:bg-transparent">
                <TableHead className="text-fog uppercase text-xs tracking-widest">Client</TableHead>
                <TableHead className="text-fog uppercase text-xs tracking-widest">Kind</TableHead>
                <TableHead className="text-fog uppercase text-xs tracking-widest">Location</TableHead>
                <TableHead className="text-fog uppercase text-xs tracking-widest">Timeline</TableHead>
                <TableHead className="text-fog uppercase text-xs tracking-widest">Status</TableHead>
                <TableHead className="text-fog uppercase text-xs tracking-widest text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-fog">Loading…</TableCell></TableRow>
              )}
              {!loading && leads.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-fog">No leads assigned yet.</TableCell></TableRow>
              )}
              {leads.map(l => (
                <TableRow key={l.id} className="border-hairline hover:bg-obsidian/40" data-testid={`agent-lead-${l.id}`}>
                  <TableCell>
                    <div className="font-medium text-ink">{l.full_name}</div>
                    <div className="text-fog text-xs">{l.email} · {l.phone}</div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="border-gold/40 text-gold">{l.kind}</Badge></TableCell>
                  <TableCell className="text-fog text-sm">{l.city}, {l.state} · {l.zip_code}</TableCell>
                  <TableCell className="text-fog text-sm">{l.timeline}</TableCell>
                  <TableCell>
                    <Badge className={
                      l.status === "closed" ? "bg-gold/20 text-gold" :
                      l.status === "assigned" ? "bg-ink/10 text-ink" :
                      "bg-signal/20 text-signal"
                    }>{l.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {l.status !== "closed" && (
                      <Button
                        className="btn-gold rounded-full h-9 px-4 text-sm"
                        onClick={() => setCloseLead(l)}
                        data-testid={`agent-close-btn-${l.id}`}
                      >
                        Mark closed
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl font-bold tracking-tight mb-4">Closed deals & escrow</h2>
        <div className="rounded-2xl border border-hairline bg-surface overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-hairline hover:bg-transparent">
                <TableHead className="text-fog uppercase text-xs tracking-widest">Sale price</TableHead>
                <TableHead className="text-fog uppercase text-xs tracking-widest">Gross commission</TableHead>
                <TableHead className="text-fog uppercase text-xs tracking-widest">Broker fee</TableHead>
                <TableHead className="text-fog uppercase text-xs tracking-widest">Net</TableHead>
                <TableHead className="text-fog uppercase text-xs tracking-widest">Escrow (6%)</TableHead>
                <TableHead className="text-fog uppercase text-xs tracking-widest">Closing</TableHead>
                <TableHead className="text-fog uppercase text-xs tracking-widest">Escrow status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deals.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-10 text-fog">No closed deals yet.</TableCell></TableRow>
              )}
              {deals.map(d => (
                <TableRow key={d.id} className="border-hairline hover:bg-obsidian/40" data-testid={`agent-deal-${d.id}`}>
                  <TableCell className="text-ink">${d.sale_price.toLocaleString()}</TableCell>
                  <TableCell className="text-fog">${d.gross_commission_amount.toLocaleString()}</TableCell>
                  <TableCell className="text-fog">${d.broker_fee_amount.toLocaleString()}</TableCell>
                  <TableCell className="text-ink">${d.net_commission.toLocaleString()}</TableCell>
                  <TableCell className="text-gold font-semibold">${d.escrow_amount.toLocaleString()}</TableCell>
                  <TableCell className="text-fog text-sm">{d.closing_date}</TableCell>
                  <TableCell>
                    <Badge className={d.escrow_status === "collected" ? "bg-gold/20 text-gold" : "bg-ink/10 text-ink"}>
                      {d.escrow_status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <CloseDealDialog
        lead={closeLead}
        onClose={() => setCloseLead(null)}
        onDone={() => { setCloseLead(null); refresh(); }}
      />
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub, testId }) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface p-6" data-testid={testId}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-gold" strokeWidth={1.5} />
        <div className="overline">{label}</div>
      </div>
      <div className="mt-3 font-display text-4xl font-black tracking-mega">{value}</div>
      {sub && <div className="text-fog text-xs mt-1">{sub}</div>}
    </div>
  );
}

function CloseDealDialog({ lead, onClose, onDone }) {
  const [salePrice, setSalePrice] = useState("");
  const [gc, setGc] = useState("3");
  const [bf, setBf] = useState("30");
  const [date, setDate] = useState(new Date());
  const [busy, setBusy] = useState(false);

  const open = !!lead;
  const preview = (() => {
    const sp = parseFloat(salePrice || 0);
    const gcAmt = sp * (parseFloat(gc || 0) / 100);
    const bfAmt = gcAmt * (parseFloat(bf || 0) / 100);
    const net = gcAmt - bfAmt;
    return { gcAmt, bfAmt, net, escrow: net * 0.06 };
  })();

  const submit = async () => {
    if (!salePrice) { toast.error("Enter sale price"); return; }
    setBusy(true);
    try {
      await api.post(`/agent/leads/${lead.id}/close`, {
        sale_price: parseFloat(salePrice),
        gross_commission_percent: parseFloat(gc),
        broker_fee_percent: parseFloat(bf),
        closing_date: format(date, "yyyy-MM-dd"),
      });
      toast.success("Deal recorded. Escrow queued.");
      onDone();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent data-testid="close-deal-dialog" className="bg-surface border-hairline text-ink max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl tracking-tight">
            Close deal — {lead?.full_name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-fog text-xs uppercase tracking-widest">Sale price ($)</Label>
            <Input value={salePrice} onChange={(e) => setSalePrice(e.target.value)} type="number" className="mt-2" data-testid="close-sale-price" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-fog text-xs uppercase tracking-widest">Gross commission %</Label>
              <Input value={gc} onChange={(e) => setGc(e.target.value)} type="number" step="0.1" className="mt-2" data-testid="close-gc-percent" />
            </div>
            <div>
              <Label className="text-fog text-xs uppercase tracking-widest">Broker fee % (of gross)</Label>
              <Input value={bf} onChange={(e) => setBf(e.target.value)} type="number" step="0.1" className="mt-2" data-testid="close-bf-percent" />
            </div>
          </div>
          <div>
            <Label className="text-fog text-xs uppercase tracking-widest">Closing date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="btn-ghost rounded-lg h-10 mt-2 w-full justify-start" data-testid="close-date-trigger">
                  <CalendarIcon className="h-4 w-4 mr-2 text-gold" />
                  {format(date, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-surface border-hairline">
                <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} />
              </PopoverContent>
            </Popover>
          </div>

          <div className="tracing-beam rounded-xl p-4 bg-obsidian text-sm space-y-1" data-testid="close-preview">
            <div className="flex justify-between text-fog"><span>Gross commission</span><span>${preview.gcAmt.toLocaleString(undefined,{maximumFractionDigits:0})}</span></div>
            <div className="flex justify-between text-fog"><span>Broker fee</span><span>−${preview.bfAmt.toLocaleString(undefined,{maximumFractionDigits:0})}</span></div>
            <div className="flex justify-between text-ink border-t border-hairline pt-1"><span>Net commission</span><span>${preview.net.toLocaleString(undefined,{maximumFractionDigits:0})}</span></div>
            <div className="flex justify-between text-gold font-bold text-base"><span>Escrow to platform (6%)</span><span>${preview.escrow.toLocaleString(undefined,{maximumFractionDigits:0})}</span></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" className="btn-ghost rounded-full h-10 px-5" onClick={onClose} data-testid="close-cancel">Cancel</Button>
          <Button className="btn-gold rounded-full h-10 px-5 font-semibold" onClick={submit} disabled={busy} data-testid="close-confirm">
            {busy ? "Recording…" : "Record closed deal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
