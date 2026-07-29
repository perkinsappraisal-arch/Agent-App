import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import Landing from "@/pages/Landing";
import LeadForm from "@/pages/LeadForm";
import AgentApply from "@/pages/AgentApply";
import Login from "@/pages/Login";
import AgentDashboard from "@/pages/AgentDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import HowItWorks from "@/pages/HowItWorks";

function Protected({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-fog">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <Toaster
            theme="light"
            position="top-right"
            toastOptions={{
              className: "!bg-surface !text-navy !border-hairline",
            }}
          />
          <Layout>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/leads/new" element={<LeadForm />} />
              <Route path="/agents/apply" element={<AgentApply />} />
              <Route path="/login" element={<Login />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route
                path="/agent"
                element={
                  <Protected role="agent">
                    <AgentDashboard />
                  </Protected>
                }
              />
              <Route
                path="/admin"
                element={
                  <Protected role="admin">
                    <AdminDashboard />
                  </Protected>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
