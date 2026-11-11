import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../api";

export default function AdminReports() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchReports() {
      try {
        const token = localStorage.getItem("token");
        
        // If there's no token, go to login
        if (!token) {
          navigate("/");
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };

        const [summaryRes, parcelsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/admin/summary`, { headers }),
          fetch(`${API_BASE_URL}/api/admin/parcels`, { headers })
        ]);

        // If the backend says we are not authorized (e.g., token expired)
        if (summaryRes.status === 401 || summaryRes.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/");
          return;
        }

        if (!summaryRes.ok || !parcelsRes.ok) {
          throw new Error("Failed to load report data from the server.");
        }

        const summaryData = await summaryRes.json();
        const parcelsData = await parcelsRes.json();

        setData({
          summary: summaryData,
          parcels: parcelsData.parcels || []
        });
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, [navigate]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f4f7fc", fontFamily: "Inter, Arial, sans-serif" }}>
        <h2 style={{ color: "#64748b" }}>Loading Reports...</h2>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f4f7fc", fontFamily: "Inter, Arial, sans-serif" }}>
        <div style={{ background: "#fff", padding: 30, borderRadius: 12, textAlign: "center" }}>
          <h2 style={{ color: "#b42318", marginTop: 0 }}>Something went wrong</h2>
          <p style={{ color: "#64748b" }}>{error || "Could not load data."}</p>
          <button onClick={() => navigate("/admin-dashboard")} style={{ padding: "10px 16px", background: "#243b80", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", marginTop: 10 }}>
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { summary, parcels } = data;

  // Safe calculations
  const totalRevenue = parcels.reduce((sum, p) => sum + Number(p.delivery_fee || 0), 0);
  const totalPaid = parcels.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0);
  const outstanding = Math.max(0, totalRevenue - totalPaid);
  const totalCustomers = summary?.summary?.total_customers || 0;
  const branches = summary?.branches || [];

  return (
    <main style={{ minHeight: "100vh", background: "#f4f7fc", padding: "32px 24px", fontFamily: "Inter, Arial, sans-serif", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30, flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ margin: 0, color: "#172033" }}>Reports & Analytics</h1>
            <p style={{ color: "#64748b", marginTop: 8 }}>High-level overview of your network's performance and finances.</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button 
              onClick={() => navigate("/admin-dashboard")}
              style={{ padding: "10px 16px", background: "#fff", color: "#172033", border: "1px solid #cbd5e1", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}
            >
              ← Back
            </button>
            <button 
              onClick={() => window.print()} 
              style={{ padding: "10px 16px", background: "#243b80", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}
            >
              🖨️ Print Report
            </button>
          </div>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginBottom: 24 }}>
          <div style={{ background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ color: "#64748b", fontSize: 13, fontWeight: 600 }}>TOTAL REVENUE (FEES)</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#172033", marginTop: 8 }}>
              KES {totalRevenue.toLocaleString()}
            </div>
          </div>

          <div style={{ background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ color: "#64748b", fontSize: 13, fontWeight: 600 }}>COLLECTED PAYMENTS</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#16804a", marginTop: 8 }}>
              KES {totalPaid.toLocaleString()}
            </div>
          </div>

          <div style={{ background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ color: "#64748b", fontSize: 13, fontWeight: 600 }}>OUTSTANDING BALANCE</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#b42318", marginTop: 8 }}>
              KES {outstanding.toLocaleString()}
            </div>
          </div>

          <div style={{ background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ color: "#64748b", fontSize: 13, fontWeight: 600 }}>TOTAL CUSTOMERS</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#172033", marginTop: 8 }}>
              {totalCustomers}
            </div>
          </div>
        </div>

        <div style={{ background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", marginBottom: 24 }}>
          <h2 style={{ marginTop: 0, fontSize: 18, color: "#172033" }}>Branch Performance</h2>
          <p style={{ color: "#64748b", fontSize: 14, marginBottom: 20 }}>A breakdown of parcel volume and delivery success per branch.</p>
          
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#f8fafc", textAlign: "left" }}>
                  <th style={{ padding: 12, borderBottom: "1px solid #e2e8f0", color: "#475569" }}>Branch</th>
                  <th style={{ padding: 12, borderBottom: "1px solid #e2e8f0", color: "#475569" }}>Total Parcels</th>
                  <th style={{ padding: 12, borderBottom: "1px solid #e2e8f0", color: "#475569" }}>Delivered</th>
                  <th style={{ padding: 12, borderBottom: "1px solid #e2e8f0", color: "#475569" }}>Success Rate</th>
                </tr>
              </thead>
              <tbody>
                {branches.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: 20, textAlign: "center", color: "#64748b" }}>No branches found.</td></tr>
                ) : (
                  branches.map(branch => {
                    const rate = branch.total_parcels > 0 ? Math.round((branch.delivered / branch.total_parcels) * 100) : 0;
                    return (
                      <tr key={branch.id}>
                        <td style={{ padding: 12, borderBottom: "1px solid #e2e8f0", fontWeight: 600 }}>{branch.name}</td>
                        <td style={{ padding: 12, borderBottom: "1px solid #e2e8f0" }}>{branch.total_parcels}</td>
                        <td style={{ padding: 12, borderBottom: "1px solid #e2e8f0" }}>{branch.delivered}</td>
                        <td style={{ padding: 12, borderBottom: "1px solid #e2e8f0" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontWeight: 700, width: 40 }}>{rate}%</span>
                            <div style={{ flex: 1, height: 6, background: "#e2e8f0", borderRadius: 10, maxWidth: 100 }}>
                              <div style={{ width: `${rate}%`, height: "100%", background: rate > 70 ? "#16804a" : rate > 30 ? "#eab308" : "#b42318", borderRadius: 10 }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  );
}
