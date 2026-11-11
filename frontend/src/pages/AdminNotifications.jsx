import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../api";

export default function AdminNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchNotifications() {
      try {
        const token = localStorage.getItem("token");
        
        if (!token) {
          navigate("/");
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/admin/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Backend route not found. Did you restart the backend?");
        }

        const data = await response.json();

        if (isMounted) {
          setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Unable to load notifications.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchNotifications();
    return () => { isMounted = false; };
  }, [navigate]);

  return (
    <main style={{ minHeight: "100vh", background: "#f4f7fc", padding: "32px 24px", fontFamily: "Inter, Arial, sans-serif", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30, flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ margin: 0, color: "#172033" }}>Notifications Center</h1>
            <p style={{ color: "#64748b", marginTop: 8 }}>Monitor automated SMS delivery statuses.</p>
          </div>
          <button 
            onClick={() => navigate("/admin-dashboard")}
            style={{ padding: "10px 16px", background: "#fff", color: "#172033", border: "1px solid #cbd5e1", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}
          >
            ← Back to Dashboard
          </button>
        </header>

        {error && (
          <div style={{ background: "#fee4e2", color: "#b42318", padding: 16, borderRadius: 8, marginBottom: 20, fontWeight: 600 }}>
            {error}
          </div>
        )}

        <div style={{ background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <h2 style={{ marginTop: 0, fontSize: 18, color: "#172033", marginBottom: 20 }}>Recent SMS Logs</h2>
          
          {loading ? (
            <p style={{ textAlign: "center", padding: 20, color: "#64748b" }}>Loading notifications...</p>
          ) : notifications.length === 0 ? (
            <p style={{ textAlign: "center", padding: 20, color: "#64748b" }}>No notifications found.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", textAlign: "left" }}>
                    <th style={{ padding: 12, borderBottom: "1px solid #e2e8f0", color: "#475569" }}>Recipient</th>
                    <th style={{ padding: 12, borderBottom: "1px solid #e2e8f0", color: "#475569" }}>Phone</th>
                    <th style={{ padding: 12, borderBottom: "1px solid #e2e8f0", color: "#475569" }}>Type</th>
                    <th style={{ padding: 12, borderBottom: "1px solid #e2e8f0", color: "#475569" }}>Status</th>
                    <th style={{ padding: 12, borderBottom: "1px solid #e2e8f0", color: "#475569" }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((n) => (
                    <tr key={n.id}>
                      <td style={{ padding: 12, borderBottom: "1px solid #e2e8f0", fontWeight: 600 }}>{n.name}</td>
                      <td style={{ padding: 12, borderBottom: "1px solid #e2e8f0" }}>{n.phone}</td>
                      <td style={{ padding: 12, borderBottom: "1px solid #e2e8f0" }}>{n.type} <span style={{color: "#94a3b8", fontSize: 12}}>({n.tracking_number})</span></td>
                      <td style={{ padding: 12, borderBottom: "1px solid #e2e8f0" }}>
                        <span style={{ 
                          background: n.status === "Sent" ? "#dcfce7" : "#fee2e2", 
                          color: n.status === "Sent" ? "#166534" : "#991b1b", 
                          padding: "4px 8px", borderRadius: 6, fontWeight: 700, fontSize: 12 
                        }}>
                          {n.status}
                        </span>
                      </td>
                      <td style={{ padding: 12, borderBottom: "1px solid #e2e8f0", color: "#64748b" }}>
                        {n.sent_at ? new Date(n.sent_at).toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}