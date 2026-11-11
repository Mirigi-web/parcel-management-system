import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../api";

const statuses = [
  "Received",
  "Dispatched",
  "In Transit",
  "Arrived",
  "Out for Delivery",
  "Delivered",
];

const navigation = [
  { label: "Overview", icon: "▦", action: "overview" },
  { label: "Manage Parcels", icon: "📦", action: "parcels" },
  { label: "Staff Management", icon: "👥", action: "staff" },
  { label: "Branches", icon: "📍", action: "branches" },
  { label: "Customers", icon: "♙", action: "customers" },
  { label: "Items & Pricing", icon: "🏷️", action: "pricing" },
  { label: "Reports & Analytics", icon: "▥", action: "reports" },
  { label: "Notifications", icon: "🔔", action: "notifications" },
  { label: "System Logs", icon: "☷", action: "logs" },
  { label: "Fleet Management", icon: "🚚", action: "fleet" },
  { label: "Bulk Messages", icon: "✉️", action: "bulk" },
  { label: "Financial Management", icon: "💰", action: "finance" },
];

function AdminDashboard() {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [statusCounts, setStatusCounts] = useState({});
  const [branchSummary, setBranchSummary] = useState([]);
  const [error, setError] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/api/admin/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Unable to load dashboard statistics.");

        const data = await response.json();

        setStats(data.summary || {});
        setStatusCounts(data.statuses || {});
        setBranchSummary(data.branches || []);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (activePage === "overview") {
      fetchDashboardData();
    }
  }, [activePage]);

  function handleNavigation(action) {
    if (action === "overview") {
      setActivePage("overview");
    } else if (action === "parcels") {
      navigate("/admin-parcels");
    } else if (action === "pricing") {
      navigate("/admin-pricing");
    } else if (action === "staff") {
      navigate("/admin-staff");
    } else if (action === "branches") {
      navigate("/admin-branches");
    } else if (action === "customers") {
      navigate("/admin-customers");
    } else if (action === "logs") {
      navigate("/admin-logs");
    } else if (action === "fleet") {
      navigate("/admin-fleet");
    } else if (action === "bulk") {
      navigate("/admin-bulk-messages");
    } else if (action === "finance") {
      navigate("/admin-finances");
    } else if (action === "reports") {
      navigate("/admin-reports");
    } else if (action === "notifications") {
      navigate("/admin-notifications");
    } else {
      setActivePage(action);
    }
    setSidebarOpen(false);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  }

  const filteredBranches = selectedBranch
    ? branchSummary.filter((b) => String(b.id) === String(selectedBranch))
    : branchSummary;

  const displayStats =
    selectedBranch && filteredBranches.length > 0
      ? {
          total_parcels: filteredBranches[0].total_parcels,
          delivered: filteredBranches[0].delivered,
          in_transit: 0,
          pending: 0,
        }
      : stats;

  const statCards = [
    { label: "Total Parcels", value: displayStats.total_parcels || 0, icon: "📦", color: "#e9efff" },
    { label: "In Transit", value: displayStats.in_transit || 0, icon: "🚚", color: "#fff2d9" },
    { label: "Delivered", value: displayStats.delivered || 0, icon: "✅", color: "#e1f8ec" },
    { label: "Pending", value: displayStats.pending || (displayStats.total_parcels - displayStats.delivered) || 0, icon: "⏳", color: "#f2e9ff" },
  ];

  const styles = {
    page: { minHeight: "100vh", display: "flex", background: "#f4f7fc", color: "#1d2939", fontFamily: "Inter, Arial, sans-serif" },
    sidebar: { width: 250, minWidth: 250, background: "#182b5b", color: "#fff", padding: "26px 16px", display: "flex", flexDirection: "column", boxSizing: "border-box" },
    brand: { display: "flex", alignItems: "center", gap: 12, padding: "0 10px 28px", borderBottom: "1px solid #344675", marginBottom: 24 },
    logo: { width: 43, height: 43, borderRadius: 12, background: "#fff", color: "#243b80", display: "grid", placeItems: "center", fontSize: 23, fontWeight: 800 },
    navLabel: { color: "#aebcdd", fontSize: 11, fontWeight: 700, letterSpacing: 1.2, padding: "0 12px", marginBottom: 12 },
    navItem: (active) => ({
      width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px", marginBottom: 5,
      border: "none", borderRadius: 9, background: active ? "#30477d" : "transparent",
      color: active ? "#fff" : "#d5def2", textAlign: "left", fontSize: 13,
      fontWeight: active ? 700 : 500, cursor: "pointer",
    }),
    main: { flex: 1, minWidth: 0, padding: "26px 30px", boxSizing: "border-box" },
    topbar: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 28 },
    card: { background: "#fff", border: "1px solid #e7ebf2", borderRadius: 14, padding: 20, boxShadow: "0 3px 12px rgba(26, 44, 82, 0.035)" },
    muted: { color: "#758198", fontSize: 13 },
    primaryButton: { background: "#243b80", color: "#fff", border: "none", borderRadius: 9, padding: "11px 16px", fontWeight: 700, cursor: "pointer" },
  };

  return (
    <div style={styles.page}>
      {sidebarOpen && (
        <button onClick={() => setSidebarOpen(false)} aria-label="Close navigation"
          style={{ position: "fixed", inset: 0, background: "#10182880", border: "none", zIndex: 5 }} />
      )}

      <aside style={{
        ...styles.sidebar, position: "fixed", inset: "0 auto 0 0", height: "100vh", overflowY: "auto", zIndex: 6,
        transform: typeof window !== "undefined" && window.innerWidth <= 800
          ? sidebarOpen ? "translateX(0)" : "translateX(-100%)"
          : "translateX(0)",
        transition: "transform 0.2s ease",
      }}>
        <div style={styles.brand}>
          <div style={styles.logo}>P</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800 }}>PARCEL TRACK</div>
            <div style={{ fontSize: 11, color: "#bdc9e5", marginTop: 4 }}>Administration</div>
          </div>
        </div>

        <div style={styles.navLabel}>MAIN MENU</div>

        {navigation.map((item) => (
          <button key={item.action} onClick={() => handleNavigation(item.action)} style={styles.navItem(activePage === item.action)}>
            <span style={{ width: 22, fontSize: 17 }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}

        <div style={{ flex: 1, minHeight: 30 }} />

        <div style={{ background: "#263a6b", borderRadius: 12, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>System Administrator</div>
          <div style={{ fontSize: 11, color: "#bdc9e5", marginTop: 5, overflowWrap: "anywhere" }}>{user?.email || "Admin account"}</div>
        </div>

        <button onClick={logout} style={{ ...styles.navItem(false), color: "#ffd1d1", marginBottom: 0 }}>
          <span>↪</span> Log out
        </button>
      </aside>

      <main style={{
        ...styles.main,
        marginLeft: typeof window !== "undefined" && window.innerWidth > 800 ? 250 : 0,
        width: typeof window !== "undefined" && window.innerWidth > 800 ? "calc(100% - 250px)" : "100%",
      }}>
        <header style={styles.topbar}>
          <div>
            <div style={{ fontSize: 25, fontWeight: 800 }}>Admin Dashboard</div>
            <div style={{ ...styles.muted, marginTop: 7 }}>Home / Administration / Overview</div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}
              style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", color: "#1d2939", fontWeight: 600 }}>
              <option value="">🌍 All Branches</option>
              {branchSummary.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>

            <button onClick={() => navigate("/admin-parcels")} style={styles.primaryButton}>
              + Manage Parcels
            </button>
          </div>
        </header>

        {error && (
          <div style={{ ...styles.card, color: "#b42318", borderColor: "#f4b4b0", marginBottom: 22 }}>{error}</div>
        )}

        {activePage === "overview" && (
          <>
            <section style={{
              ...styles.card, background: "linear-gradient(115deg, #243b80, #3e5db0)", color: "#fff",
              marginBottom: 22, padding: "25px 27px",
            }}>
              <div style={{ fontSize: 22, fontWeight: 800 }}>
                {selectedBranch ? `Operations Overview: ${branchSummary.find((b) => String(b.id) === String(selectedBranch))?.name}` : "Operations Overview"}
              </div>
              <p style={{ color: "#e0e8ff", fontSize: 13, lineHeight: 1.7, maxWidth: 650, marginBottom: 0 }}>
                Monitor parcel movement across all branches, review business performance and manage your delivery operations from one place.
              </p>
            </section>

            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 22 }}>
              {statCards.map((stat) => (
                <div key={stat.label} style={styles.card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={styles.muted}>{stat.label}</span>
                    <span style={{ background: stat.color, width: 42, height: 42, borderRadius: 12, display: "grid", placeItems: "center", fontSize: 20 }}>
                      {stat.icon}
                    </span>
                  </div>
                  <div style={{ fontSize: 29, fontWeight: 800, marginTop: 18 }}>{loading ? "..." : stat.value}</div>
                  <div style={{ ...styles.muted, marginTop: 7 }}>{loading ? "Loading data..." : "Live from database"}</div>
                </div>
              ))}
            </section>

            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18, marginBottom: 22 }}>
              <div style={styles.card}>
                <h3 style={{ fontSize: 16, marginTop: 0 }}>Parcel Status Distribution</h3>
                <p style={styles.muted}>Track parcels through each stage of the delivery process.</p>
                {statuses.map((status, index) => {
                  const key = status.toLowerCase().replace(/ /g, "_");
                  const count = statusCounts[key] || 0;
                  const maxCount = Math.max(...Object.values(statusCounts).map(Number), 1);
                  const widthPercent = (count / maxCount) * 100;

                  return (
                    <div key={status} style={{ marginTop: 19 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 8 }}>
                        <span>{status}</span>
                        <span style={{ color: "#758198" }}>{loading ? "—" : count}</span>
                      </div>
                      <div style={{ height: 8, background: "#edf0f6", borderRadius: 20, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", width: loading ? "0%" : `${widthPercent}%`,
                          background: ["#647fca", "#e4a54e", "#8b73d6", "#4d9dc5", "#df8a70", "#36a879"][index],
                          borderRadius: 20, transition: "width 0.5s ease",
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={styles.card}>
                <h3 style={{ fontSize: 16, marginTop: 0 }}>Administration Shortcuts</h3>
                <p style={styles.muted}>Access the main tools for managing your delivery network.</p>
                {[
                  ["📦", "Manage all parcels", "parcels"],
                  ["👥", "Staff management", "staff"],
                  ["📍", "Branches", "branches"],
                  ["📊", "Reports & analytics", "reports"],
                  ["🔔", "Notifications", "notifications"],
                ].map(([icon, label, action]) => (
                  <button key={action} onClick={() => handleNavigation(action)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "14px 5px",
                      background: "transparent", border: "none", borderBottom: "1px solid #edf0f5",
                      cursor: "pointer", textAlign: "left", color: "#263754", fontSize: 13,
                    }}>
                    <span style={{ fontSize: 19 }}>{icon}</span>
                    <span style={{ flex: 1 }}>{label}</span>
                    <span style={{ color: "#758198" }}>→</span>
                  </button>
                ))}
              </div>
            </section>

            <section style={styles.card}>
              <h3 style={{ fontSize: 16, marginTop: 0 }}>Branch Overview</h3>
              <p style={styles.muted}>Parcel volumes and delivery performance by branch.</p>

              {loading ? (
                <div style={{ padding: 24, textAlign: "center", color: "#758198" }}>Loading branches...</div>
              ) : filteredBranches.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: "#758198" }}>No branch data available.</div>
              ) : (
                <div style={{ overflowX: "auto", marginTop: 12 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", padding: 12, background: "#f7f9fd", borderBottom: "1px solid #e4e9f2" }}>Branch Name</th>
                        <th style={{ textAlign: "left", padding: 12, background: "#f7f9fd", borderBottom: "1px solid #e4e9f2" }}>Total Parcels</th>
                        <th style={{ textAlign: "left", padding: 12, background: "#f7f9fd", borderBottom: "1px solid #e4e9f2" }}>Delivered</th>
                        <th style={{ textAlign: "left", padding: 12, background: "#f7f9fd", borderBottom: "1px solid #e4e9f2" }}>Delivery Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBranches.map((branch) => {
                        const rate = branch.total_parcels > 0
                          ? Math.round((branch.delivered / branch.total_parcels) * 100)
                          : 0;
                        return (
                          <tr key={branch.id}>
                            <td style={{ padding: 12, borderBottom: "1px solid #e4e9f2", fontWeight: 600 }}>{branch.name}</td>
                            <td style={{ padding: 12, borderBottom: "1px solid #e4e9f2" }}>{branch.total_parcels}</td>
                            <td style={{ padding: 12, borderBottom: "1px solid #e4e9f2" }}>{branch.delivered}</td>
                            <td style={{ padding: 12, borderBottom: "1px solid #e4e9f2" }}>
                              <span style={{
                                background: rate > 70 ? "#e1f8ec" : rate > 30 ? "#fff2d9" : "#fae4e3",
                                color: rate > 70 ? "#16804a" : rate > 30 ? "#b47c1a" : "#b42318",
                                padding: "4px 8px", borderRadius: 6, fontWeight: 700, fontSize: 12,
                              }}>
                                {rate}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        <footer style={{ textAlign: "center", color: "#8a94a6", fontSize: 11, padding: "25px 0 5px" }}>
          Parcel Management & Tracking System · Administration
        </footer>
      </main>
    </div>
  );
}

export default AdminDashboard;