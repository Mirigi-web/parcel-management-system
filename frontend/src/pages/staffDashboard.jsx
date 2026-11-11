import { useEffect, useState } from "react";
import API_BASE_URL from "../api";

function StaffDashboard() {
  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  const [summary, setSummary] = useState({
    total_parcels: 0,
    received: 0,
    dispatched: 0,
    in_transit: 0,
    arrived: 0,
    out_for_delivery: 0,
    delivered: 0,
  });

  const [message, setMessage] = useState("Loading parcel summary...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    let cancelled = false;

    async function loadSummary() {
      if (!token) {
        setMessage("Please log in as staff first.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/staff/parcel-summary`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load summary.");
        }

        if (!cancelled) {
          setSummary((previous) => ({
            ...previous,
            ...data.summary,
          }));
          setMessage("");
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(error.message || "Unable to connect to the server.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSummary();

    return () => {
      cancelled = true;
    };
  }, []);

  const actions = [
    {
      title: "Add Customer",
      description: "Register a customer at your branch.",
      path: "/add-customer",
      icon: "👤",
    },
    {
      title: "Register Parcel",
      description: "Create a parcel and tracking number.",
      path: "/create-parcel",
      icon: "📦",
    },
    {
      title: "Manage Parcels",
      description: "View parcels registered at your branch.",
      path: "/manage-parcels",
      icon: "🗂️",
    },
    {
      title: "Update Parcel Status",
      description: "Update parcel progress and location.",
      path: "/update-parcel-status",
      icon: "🚚",
    },
    // 🔥 NEW: Collect Payment Action
    {
      title: "Collect Payment",
      description: "Prompt M-Pesa for a customer picking up.",
      path: "/collect-payment",
      icon: "💳",
    },
  ];

  const stats = [
    { label: "Total Parcels", value: summary.total_parcels, icon: "📦" },
    { label: "Received", value: summary.received, icon: "📥" },
    { label: "Dispatched", value: summary.dispatched, icon: "🚛" },
    { label: "In Transit", value: summary.in_transit, icon: "🛣️" },
    { label: "Arrived", value: summary.arrived, icon: "🏢" },
    {
      label: "Out for Delivery",
      value: summary.out_for_delivery,
      icon: "🛵",
    },
    { label: "Delivered", value: summary.delivered, icon: "✅" },
  ];

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <p style={styles.eyebrow}>PARCEL MANAGEMENT SYSTEM</p>
          <h1 style={styles.heading}>Staff Dashboard</h1>
          <p style={styles.muted}>
            Welcome, {user?.name || "Staff Member"}
          </p>
        </div>

        <button onClick={logout} style={styles.logoutButton}>
          Log Out
        </button>
      </header>

      <section style={styles.branchPanel}>
        <div>
          <p style={styles.panelLabel}>Your assigned branch</p>
          <h2 style={styles.branchTitle}>
            Branch ID: {user?.branch_id || "Not assigned"}
          </h2>
        </div>
        <span style={styles.branchIcon}>🏢</span>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Staff Actions</h2>

        <div style={styles.actionGrid}>
          {actions.map((action) => (
            <button
              key={action.path}
              onClick={() => {
                window.location.href = action.path;
              }}
              style={styles.actionCard}
            >
              <span style={styles.actionIcon}>{action.icon}</span>
              <span style={styles.actionTitle}>{action.title}</span>
              <span style={styles.actionDescription}>
                {action.description}
              </span>
              <span style={styles.openLink}>Open →</span>
            </button>
          ))}
        </div>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Parcel Summary</h2>
        <p style={styles.muted}>
          Statistics for parcels registered at your branch.
        </p>

        {message && (
          <div
            role="status"
            style={styles.message}
          >
            {message}
          </div>
        )}

        <div style={styles.statsGrid}>
          {stats.map((stat) => (
            <div key={stat.label} style={styles.statCard}>
              <span style={styles.statIcon}>{stat.icon}</span>
              <p style={styles.statLabel}>{stat.label}</p>
              <p style={styles.statValue}>
                {loading ? "…" : Number(stat.value || 0).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer style={styles.footer}>
        Staff Dashboard · Parcel Management and Tracking System
      </footer>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "28px",
    background: "#f4f7fb",
    color: "#172033",
    fontFamily: "Arial, sans-serif",
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "26px",
  },
  eyebrow: {
    color: "#5266b5",
    fontSize: "12px",
    fontWeight: "bold",
    letterSpacing: "1.5px",
  },
  heading: {
    fontSize: "30px",
    margin: "8px 0",
  },
  muted: {
    color: "#667085",
    lineHeight: 1.5,
  },
  logoutButton: {
    border: "none",
    background: "#172033",
    color: "white",
    padding: "11px 18px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  branchPanel: {
    background: "#243b80",
    color: "white",
    borderRadius: "14px",
    padding: "22px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    marginBottom: "30px",
  },
  panelLabel: {
    margin: "0 0 8px",
    opacity: 0.8,
  },
  branchTitle: {
    margin: 0,
    fontSize: "20px",
  },
  branchIcon: {
    fontSize: "32px",
  },
  section: {
    marginBottom: "32px",
  },
  sectionTitle: {
    fontSize: "21px",
    marginBottom: "10px",
  },
  actionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    marginTop: "18px",
  },
  actionCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "10px",
    padding: "20px",
    border: "1px solid #e0e5ef",
    borderRadius: "12px",
    background: "white",
    cursor: "pointer",
    textAlign: "left",
    minHeight: "160px",
  },
  actionIcon: {
    fontSize: "26px",
  },
  actionTitle: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#172033",
  },
  actionDescription: {
    color: "#667085",
    lineHeight: 1.5,
  },
  openLink: {
    color: "#4058a5",
    fontWeight: "bold",
    marginTop: "auto",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))",
    gap: "14px",
    marginTop: "18px",
  },
  statCard: {
    background: "white",
    border: "1px solid #e0e5ef",
    borderRadius: "12px",
    padding: "18px",
  },
  statIcon: {
    fontSize: "23px",
  },
  statLabel: {
    color: "#667085",
    fontSize: "13px",
    marginBottom: "8px",
  },
  statValue: {
    fontSize: "27px",
    fontWeight: "bold",
    margin: 0,
  },
  message: {
    background: "#fff7e6",
    border: "1px solid #f0d7a0",
    borderRadius: "8px",
    padding: "12px",
    marginTop: "14px",
  },
  footer: {
    borderTop: "1px solid #e0e5ef",
    paddingTop: "18px",
    color: "#667085",
    fontSize: "12px",
  },
};

export default StaffDashboard;