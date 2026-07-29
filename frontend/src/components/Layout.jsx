import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, ShieldCheck } from "lucide-react";

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const linkCls = ({ isActive }) =>
    `text-sm tracking-wide transition-colors font-medium ${
      isActive ? "text-gold" : "text-navy/70 hover:text-gold"
    }`;

  return (
    <div className="min-h-screen bg-obsidian text-navy">
      <header
        data-testid="site-header"
        className="glass sticky top-0 z-50"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-10 flex items-center justify-between py-4">
          <Link to="/" data-testid="nav-home" className="flex items-center gap-2 group">
            <ShieldCheck className="h-5 w-5 text-gold" strokeWidth={1.5} />
            <span className="font-display text-lg tracking-mega font-black">
              agent<span className="text-gold">escrow</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <NavLink to="/leads/new" className={linkCls} data-testid="nav-lead-form">
              I need an agent
            </NavLink>
            <NavLink to="/agents/apply" className={linkCls} data-testid="nav-agent-apply">
              I am an agent
            </NavLink>
            <NavLink to="/how-it-works" className={linkCls} data-testid="nav-how">
              How it works
            </NavLink>
          </nav>
          <div className="flex items-center gap-3">
            {user && user.role ? (
              <>
                {user.role === "admin" && (
                  <Button
                    data-testid="nav-admin"
                    variant="ghost"
                    className="btn-ghost rounded-full px-4"
                    onClick={() => nav("/admin")}
                  >
                    Admin
                  </Button>
                )}
                {user.role === "agent" && (
                  <Button
                    data-testid="nav-dashboard"
                    variant="ghost"
                    className="btn-ghost rounded-full px-4"
                    onClick={() => nav("/agent")}
                  >
                    Dashboard
                  </Button>
                )}
                <Button
                  data-testid="nav-logout"
                  variant="ghost"
                  className="btn-ghost rounded-full px-4"
                  onClick={async () => { await logout(); nav("/"); }}
                >
                  <LogOut className="h-4 w-4 mr-1.5" /> Sign out
                </Button>
              </>
            ) : (
              <Button
                data-testid="nav-login"
                className="btn-gold rounded-full px-5 font-semibold"
                onClick={() => nav("/login")}
              >
                Sign in
              </Button>
            )}
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-hairline mt-24 bg-butter/40">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-10 grid gap-6 md:grid-cols-3 text-sm text-navy/70">
          <div>
            <div className="font-display text-navy text-lg tracking-mega font-black">
              agent<span className="text-gold">escrow</span>
            </div>
            <p className="mt-2 max-w-xs">
              Risk-free real estate leads secured by binding closing-escrow
              commitments. No corporate iBuyers.
            </p>
          </div>
          <div>
            <div className="overline mb-3">The Rules</div>
            <ul className="space-y-1.5">
              <li>Zillow-structure entities are excluded.</li>
              <li>6% of net commission owed only at closing.</li>
              <li>No lead fees. No subscriptions.</li>
            </ul>
          </div>
          <div>
            <div className="overline mb-3">Legal</div>
            <p>
              AgentEscrow is not a licensed escrow holder. All disbursements are
              handled by the closing/settlement agent chosen for the transaction.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
