import { useEffect, useState } from "react";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui/tabs";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { UserCheck, UserX, Users, Home, DollarSign, Ban, ChevronDown, FileDown } from "lucide-react";

export default function AdminDashboard() {
  const [agents, setAgents] = useState([]);
  const [leads, setLeads] = useState([]);
  const [deals, setDeals] = useState([]);
  const [blacklist, setBlacklist] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const [a, l, d, b] = await Promise.all([
        api.get("/admin/agents"),
        api.get("/admin/leads"),
        api.get("/admin/deals"),
        api.get("/admin/blacklist"),
      ]);
      setAgents(a.data);
      setLeads(l.data);
      setDeals(d.data);
      setBlacklist(b.data.terms || []);
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const approvedAgents = agents.filter((a) => a.status === "approved");
  const pendingAgents = agents.filter((a) => a.status === "pending");
  const totalEscrow = deals.reduce((s, d) => s + (d.escrow_amount || 0), 0);

  const approve = async (id) => {
    try { await api.post(`/admin/agents/${id}/approve`); toast.success("Agent approved"); refresh(); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };
  const reject = async (id) => {
    try { await api.post(`/admin/agents/${id}/reject`); toast.success("Agent rejected"); refresh(); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };
  const assign = async (leadId, agentId) => {
    try { await api.post(`/admin/leads/${leadId}/assign`, { agent_id: agentId }); toast.success("Lead assigned"); refresh(); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };
  const markCollected = async (dealId) => {
    try { await api.post(`/admin/deals/${dealId}/mark-escrow-collected`); toast.success("Marked collected"); refresh(); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 lg:px-10 py-12" data-testid="admin-dashboard">
      <div className="overline mb-3">Admin console</div>
      <h1 className="font-display font-black tracking-mega text-4xl sm:text-5xl leading-none">
        Command center.
      </h1>

      <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat icon={Users} label="Approved agents" value={approvedAgents.length} testId="stat-approved" />
        <Stat icon={UserCheck} label="Pending review" value={pendingAgents.length} testId="stat-pending" />
        <Stat icon={Home} label="Leads" value={leads.length} testId="stat-total-leads" />
        <Stat icon={DollarSign} label="Escrow pipeline"
              value={`$${totalEscrow.toLocaleString(undefined,{maximumFractionDigits:0})}`}
              testId="stat-escrow" />
      </div>

      <Tabs defaultValue="agents" className="mt-12" data-testid="admin-tabs">
        <TabsList className="bg-surface border border-hairline">
          <TabsTrigger value="agents" data-testid="tab-agents">Agents</TabsTrigger>
          <TabsTrigger value="leads" data-testid="tab-leads">Leads</TabsTrigger>
          <TabsTrigger value="deals" data-testid="tab-deals">Escrow tracker</TabsTrigger>
          <TabsTrigger value="rules" data-testid="tab-rules">Blacklist</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="mt-6">
          <div className="rounded-2xl border border-hairline bg-surface overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-hairline hover:bg-transparent">
                  <TableHead className="text-fog uppercase text-xs tracking-widest">Name</TableHead>
                  <TableHead className="text-fog uppercase text-xs tracking-widest">Brokerage</TableHead>
                  <TableHead className="text-fog uppercase text-xs tracking-widest">Service area</TableHead>
                  <TableHead className="text-fog uppercase text-xs tracking-widest">License</TableHead>
                  <TableHead className="text-fog uppercase text-xs tracking-widest">Status</TableHead>
                  <TableHead className="text-fog uppercase text-xs tracking-widest text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && <TableRow><TableCell colSpan={6} className="text-center py-10 text-fog">Loading…</TableCell></TableRow>}
                {!loading && agents.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-fog">No agent applications yet.</TableCell></TableRow>
                )}
                {agents.map(a => (
                  <TableRow key={a.id} className="border-hairline hover:bg-obsidian/40" data-testid={`admin-agent-${a.id}`}>
                    <TableCell>
                      <div className="text-ink font-medium">{a.name}</div>
                      <div className="text-fog text-xs">{a.email} · {a.phone}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-ink text-sm">{a.brokerage}</div>
                      {a.blacklist_flag?.blocked && (
                        <Badge className="bg-signal/20 text-signal mt-1">
                          <Ban className="h-3 w-3 mr-1" />
                          {a.blacklist_flag.matched_term}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-fog text-sm">{a.service_area}</TableCell>
                    <TableCell className="text-fog text-xs font-mono">{a.license_number}</TableCell>
                    <TableCell>
                      <Badge className={
                        a.status === "approved" ? "bg-gold/20 text-gold" :
                        a.status === "pending" ? "bg-ink/10 text-ink" :
                        "bg-signal/20 text-signal"
                      }>{a.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {a.contract_id && (
                        <a href={`${process.env.REACT_APP_BACKEND_URL}/api/contracts/${a.contract_id}/pdf`} target="_blank" rel="noreferrer">
                          <Button variant="ghost" className="btn-ghost rounded-full h-9 px-3 text-xs" data-testid={`admin-pdf-${a.id}`}>
                            <FileDown className="h-3.5 w-3.5 mr-1" /> PDF
                          </Button>
                        </a>
                      )}
                      {a.status === "pending" && (
                        <>
                          <Button className="btn-gold rounded-full h-9 px-3 text-xs" onClick={() => approve(a.id)} data-testid={`admin-approve-${a.id}`}>
                            <UserCheck className="h-3.5 w-3.5 mr-1" /> Approve
                          </Button>
                          <Button variant="ghost" className="btn-ghost rounded-full h-9 px-3 text-xs" onClick={() => reject(a.id)} data-testid={`admin-reject-${a.id}`}>
                            <UserX className="h-3.5 w-3.5 mr-1" /> Reject
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="leads" className="mt-6">
          <div className="rounded-2xl border border-hairline bg-surface overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-hairline hover:bg-transparent">
                  <TableHead className="text-fog uppercase text-xs tracking-widest">Client</TableHead>
                  <TableHead className="text-fog uppercase text-xs tracking-widest">Kind</TableHead>
                  <TableHead className="text-fog uppercase text-xs tracking-widest">Location</TableHead>
                  <TableHead className="text-fog uppercase text-xs tracking-widest">Timeline</TableHead>
                  <TableHead className="text-fog uppercase text-xs tracking-widest">Assigned</TableHead>
                  <TableHead className="text-fog uppercase text-xs tracking-widest">Status</TableHead>
                  <TableHead className="text-fog uppercase text-xs tracking-widest text-right">Assign</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!loading && leads.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-10 text-fog">No leads yet.</TableCell></TableRow>
                )}
                {leads.map(l => (
                  <TableRow key={l.id} className="border-hairline hover:bg-obsidian/40" data-testid={`admin-lead-${l.id}`}>
                    <TableCell>
                      <div className="text-ink">{l.full_name}</div>
                      <div className="text-fog text-xs">{l.email}</div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="border-gold/40 text-gold">{l.kind}</Badge></TableCell>
                    <TableCell className="text-fog text-sm">
                      <div>{l.street_address}</div>
                      <div>{l.city}, {l.state} · {l.zip_code}</div>
                    </TableCell>
                    <TableCell className="text-fog text-sm">{l.timeline}</TableCell>
                    <TableCell className="text-fog text-xs">
                      {l.assigned_agent ? `${l.assigned_agent.name} — ${l.assigned_agent.brokerage}` : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        l.status === "closed" ? "bg-gold/20 text-gold" :
                        l.status === "assigned" ? "bg-ink/10 text-ink" :
                        "bg-signal/20 text-signal"
                      }>{l.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="btn-ghost rounded-full h-9 px-3 text-xs" data-testid={`admin-assign-btn-${l.id}`}>
                            Assign <ChevronDown className="h-3.5 w-3.5 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-surface border-hairline text-ink w-64">
                          <DropdownMenuLabel className="text-fog">Approved agents</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-hairline" />
                          {approvedAgents.length === 0 && (
                            <div className="px-2 py-3 text-xs text-fog">No approved agents yet.</div>
                          )}
                          {approvedAgents.map(a => (
                            <DropdownMenuItem key={a.id} onClick={() => assign(l.id, a.id)} data-testid={`admin-assign-to-${a.id}-${l.id}`}>
                              <div className="w-full">
                                <div className="text-ink">{a.name}</div>
                                <div className="text-fog text-xs">{a.brokerage}</div>
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="deals" className="mt-6">
          <div className="rounded-2xl border border-hairline bg-surface overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-hairline hover:bg-transparent">
                  <TableHead className="text-fog uppercase text-xs tracking-widest">Agent</TableHead>
                  <TableHead className="text-fog uppercase text-xs tracking-widest">Sale</TableHead>
                  <TableHead className="text-fog uppercase text-xs tracking-widest">Net commission</TableHead>
                  <TableHead className="text-fog uppercase text-xs tracking-widest">Escrow (6%)</TableHead>
                  <TableHead className="text-fog uppercase text-xs tracking-widest">Closing</TableHead>
                  <TableHead className="text-fog uppercase text-xs tracking-widest">Status</TableHead>
                  <TableHead className="text-fog uppercase text-xs tracking-widest text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!loading && deals.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-10 text-fog">No closed deals yet.</TableCell></TableRow>
                )}
                {deals.map(d => (
                  <TableRow key={d.id} className="border-hairline hover:bg-obsidian/40" data-testid={`admin-deal-${d.id}`}>
                    <TableCell>
                      <div className="text-ink">{d.agent?.name}</div>
                      <div className="text-fog text-xs">{d.agent?.brokerage}</div>
                    </TableCell>
                    <TableCell className="text-ink">${d.sale_price.toLocaleString()}</TableCell>
                    <TableCell className="text-fog">${d.net_commission.toLocaleString()}</TableCell>
                    <TableCell className="text-gold font-bold">${d.escrow_amount.toLocaleString()}</TableCell>
                    <TableCell className="text-fog text-sm">{d.closing_date}</TableCell>
                    <TableCell>
                      <Badge className={d.escrow_status === "collected" ? "bg-gold/20 text-gold" : "bg-ink/10 text-ink"}>
                        {d.escrow_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {d.escrow_status !== "collected" && (
                        <Button className="btn-gold rounded-full h-9 px-3 text-xs" onClick={() => markCollected(d.id)} data-testid={`admin-mark-collected-${d.id}`}>
                          Mark collected
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="rules" className="mt-6">
          <div className="rounded-2xl border border-hairline bg-surface p-8">
            <div className="overline mb-4">Corporate iBuyer blacklist</div>
            <p className="text-fog mb-6 max-w-2xl">
              Any agent applying with a brokerage name that contains one of these
              terms is auto-rejected. Case-insensitive substring match.
            </p>
            <div className="flex flex-wrap gap-2">
              {blacklist.map(t => (
                <Badge key={t} className="bg-signal/10 text-signal border border-signal/30 uppercase tracking-widest text-xs" data-testid={`blacklist-${t}`}>
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ icon: Icon, label, value, testId }) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface p-6" data-testid={testId}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-gold" strokeWidth={1.5} />
        <div className="overline">{label}</div>
      </div>
      <div className="mt-3 font-display text-3xl font-black tracking-mega">{value}</div>
    </div>
  );
}
