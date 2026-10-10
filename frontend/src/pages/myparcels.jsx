
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

function MyParcels() {
  const navigate = useNavigate();

  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchParcels = useCallback(async (isRefresh = false) => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Your session has expired. Please log in again.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/my-parcels", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load your parcels.");
      }

      setParcels(Array.isArray(data.parcels) ? data.parcels : []);
    } catch (err) {
      console.error("My parcels error:", err);
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchParcels();
  }, [fetchParcels]);

  const statuses = [
    "All",
    "Received",
    "Dispatched",
    "In Transit",
    "Arrived",
    "Out for Delivery",
    "Delivered",
  ];

  const filteredParcels = useMemo(() => {
    const term = search.trim().toLowerCase();

    return parcels.filter((parcel) => {
      const matchesSearch = [
        parcel.tracking_number,
        parcel.recipient_name,
        parcel.recipient_phone,
        parcel.origin_branch,
        parcel.destination_branch,
        parcel.parcel_description,
        parcel.parcel_type,
      ].some((value) => String(value || "").toLowerCase().includes(term));

      const matchesStatus =
        statusFilter === "All" || parcel.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [parcels, search, statusFilter]);

  const statusStyle = (status) => {
    const colors = {
      Received: { background: "#e8efff", color: "#2449a6" },
      Dispatched: { background: "#f0e9ff", color: "#7040a8" },
      "In Transit": { background: "#fff0d8", color: "#975b00" },
      Arrived: { background: "#e0f5f1", color: "#087b68" },
      "Out for Delivery": { background: "#e5f0ff", color: "#1765b1" },
      Delivered: { background: "#e3f7e8", color: "#18733b" },
    };

    return colors[status] || {
      background: "#edf0f5",
      color: "#566176",
    };
  };

  const styles = {
    page: {
      minHeight: "100vh",
      background: "#f4f7fb",
      fontFamily: "Arial, Helvetica, sans-serif",
      color: "#24304a",
    },
    sidebar: {
      width: "245px",
      background: "#243b80",
      color: "#fff",
      padding: "28px 18px",
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
    },
    logo: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "0 8px 30px",
      borderBottom: "1px solid rgba(255,255,255,0.15)",
    },
    navButton: {
      width: "100%",
      textAlign: "left",
      padding: "13px 14px",
      marginTop: "8px",
      border: "none",
      borderRadius: "9px",
      color: "#e8edff",
      background: "transparent",
      cursor: "pointer",
      fontSize: "14px",
    },
    main: {
      flex: 1,
      minWidth: 0,
      padding: "32px",
    },
    title: {
      margin: "0 0 9px",
      color: "#1c2c50",
      fontSize: "27px",
    },
    muted: {
      color: "#7b879b",
      fontSize: "14px",
      lineHeight: 1.6,
    },
    button: {
      padding: "11px 15px",
      background: "#243b80",
      color: "#fff",
      border: "none",
      borderRadius: "9px",
      fontWeight: 700,
      cursor: "pointer",
    },
    panel: {
      background: "#fff",
      border: "1px solid #e7edf6",
      borderRadius: "15px",
      padding: "22px",
      marginTop: "24px",
      boxShadow: "0 4px 15px rgba(32,55,100,0.035)",
    },
    input: {
      width: "100%",
      padding: "12px 14px",
      border: "1px solid #dce3ef",
      borderRadius: "9px",
      fontSize: "14px",
      outline: "none",
      background: "#fff",
      color: "#24304a",
    },
    label: {
      display: "block",
      marginBottom: "8px",
      color: "#46536c",
      fontSize: "13px",
      fontWeight: 700,
    },
  };

  const money = (value) => {
    const amount = Number(value);

    if (!Number.isFinite(amount)) return "—";

    return `KES ${amount.toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-KE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="parcels-layout" style={{ ...styles.page, display: "flex" }}>
      <style>{`
        * { box-sizing: border-box; }

        .parcel-nav:hover {
          background: rgba(255,255,255,0.12) !important;
        }

        .parcel-row:hover {
          background: #f8faff;
        }

        .parcel-input:focus {
          border-color: #3564b8 !important;
          box-shadow: 0 0 0 3px rgba(53,100,184,0.10);
        }

        .parcel-table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        .parcel-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1050px;
          text-align: left;
        }

        .parcel-table th {
          background: #f7f9fd;
          color: #65718a;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          padding: 15px 13px;
          border-bottom: 1px solid #e8edf5;
          white-space: nowrap;
        }

        .parcel-table td {
          padding: 16px 13px;
          border-bottom: 1px solid #edf0f6;
          font-size: 13px;
          vertical-align: top;
        }

        @media (max-width: 760px) {
          .parcels-layout { flex-direction: column !important; }
          .parcel-sidebar { width: 100% !important; padding: 18px !important; }
          .parcel-logo { padding-bottom: 16px !important; }
          .parcel-nav-list { display: flex; flex-wrap: wrap; gap: 6px; }
          .parcel-nav { width: auto !important; margin-top: 8px !important; }
          .parcels-main { padding: 20px 15px !important; }
        }
      `}</style>

      <aside className="parcel-sidebar" style={styles.sidebar}>
        <div className="parcel-logo" style={styles.logo}>
          <span
            style={{
              fontSize: "27px",
              background: "rgba(255,255,255,0.13)",
              borderRadius: "10px",
              padding: "9px",
            }}
          >
            📦
          </span>

          <div>
            <div style={{ fontWeight: 800, fontSize: "15px" }}>ParcelTrack</div>
            <div style={{ fontSize: "11px", color: "#cbd7ff", marginTop: "4px" }}>
              Customer Portal
            </div>
          </div>
        </div>

        <div className="parcel-nav-list" style={{ marginTop: "25px" }}>
          <button
            className="parcel-nav"
            style={styles.navButton}
            onClick={() => navigate("/dashboard")}
          >
            🏠 &nbsp; Dashboard
          </button>

          <button
            className="parcel-nav"
            style={{
              ...styles.navButton,
              background: "rgba(255,255,255,0.13)",
            }}
            onClick={() => navigate("/my-parcels")}
          >
            📦 &nbsp; My Parcels
          </button>

          <button
            className="parcel-nav"
            style={styles.navButton}
            onClick={() => navigate("/track-parcel")}
          >
            🔎 &nbsp; Track Parcel
          </button>
        </div>

        <div style={{ marginTop: "auto", paddingTop: "30px" }}>
          <button className="parcel-nav" style={styles.navButton} onClick={logout}>
            ↪ &nbsp; Logout
          </button>
        </div>
      </aside>

      <main className="parcels-main" style={styles.main}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <h1 style={styles.title}>My Parcels</h1>
            <p style={{ ...styles.muted, margin: 0 }}>
              View your shipments and follow their delivery progress.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              style={{
                ...styles.button,
                background: "#fff",
                color: "#243b80",
                border: "1px solid #dce4f2",
              }}
              onClick={() => fetchParcels(true)}
              disabled={loading || refreshing}
            >
              {refreshing ? "Refreshing..." : "↻ Refresh"}
            </button>

            <button
              style={styles.button}
              onClick={() => navigate("/track-parcel")}
            >
              Track a Parcel →
            </button>
          </div>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
            gap: "15px",
            marginTop: "26px",
          }}
        >
          {[
            { label: "Total Parcels", value: parcels.length, icon: "📦" },
            {
              label: "In Transit",
              value: parcels.filter((p) =>
                ["In Transit", "Out for Delivery"].includes(p.status)
              ).length,
              icon: "🚚",
            },
            {
              label: "Delivered",
              value: parcels.filter((p) => p.status === "Delivered").length,
              icon: "✅",
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: "#fff",
                border: "1px solid #e7edf6",
                borderRadius: "13px",
                padding: "19px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <span style={{ ...styles.muted, fontWeight: 700 }}>
                  {item.label}
                </span>
                <span style={{ fontSize: "22px" }}>{item.icon}</span>
              </div>

              <div style={{ fontSize: "28px", fontWeight: 800, color: "#1c2c50" }}>
                {loading ? "—" : item.value}
              </div>
            </div>
          ))}
        </section>

        <section style={styles.panel}>
          <h2 style={{ margin: "0 0 7px", fontSize: "18px", color: "#1c2c50" }}>
            Your Shipment History
          </h2>

          <p style={{ ...styles.muted, margin: "0 0 22px" }}>
            Search your parcels or filter them by their current status.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
              gap: "16px",
              marginBottom: "22px",
            }}
          >
            <div>
              <label htmlFor="parcel-search" style={styles.label}>
                Search parcels
              </label>
              <input
                id="parcel-search"
                className="parcel-input"
                style={styles.input}
                placeholder="Tracking number, recipient, destination..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="parcel-status" style={styles.label}>
                Filter by status
              </label>
              <select
                id="parcel-status"
                className="parcel-input"
                style={styles.input}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              style={{
                padding: "15px",
                borderRadius: "9px",
                background: "#fff0f0",
                color: "#b42318",
                marginBottom: "20px",
                fontSize: "14px",
              }}
            >
              {error}
              {error.toLowerCase().includes("log in") && (
                <button
                  style={{ ...styles.button, marginLeft: "12px" }}
                  onClick={() => navigate("/")}
                >
                  Return to login
                </button>
              )}
              <button
                style={{
                  ...styles.button,
                  marginLeft: "12px",
                  background: "#fff",
                  color: "#243b80",
                  border: "1px solid #dce4f2",
                }}
                onClick={() => fetchParcels(true)}
              >
                Try again
              </button>
            </div>
          )}

          {loading ? (
            <p style={styles.muted}>Loading your parcels...</p>
          ) : !error && filteredParcels.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "42px 15px",
                background: "#f8faff",
                borderRadius: "12px",
              }}
            >
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>📦</div>
              <h3 style={{ color: "#24304a", margin: "0 0 8px" }}>
                {parcels.length === 0 ? "No parcels found yet" : "No matching parcels"}
              </h3>
              <p style={styles.muted}>
                {parcels.length === 0
                  ? "Parcels registered with your customer account will appear here."
                  : "Try changing your search or status filter."}
              </p>
              {(search || statusFilter !== "All") && (
                <button
                  style={styles.button}
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("All");
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : !error ? (
            <>
              <p style={{ ...styles.muted, marginBottom: "14px" }}>
                Showing {filteredParcels.length} of {parcels.length} parcel(s)
              </p>

              <div className="parcel-table-wrap">
                <table className="parcel-table">
                  <thead>
                    <tr>
                      <th>Tracking Number</th>
                      <th>Recipient</th>
                      <th>Origin</th>
                      <th>Destination</th>
                      <th>Parcel Type</th>
                      <th>Delivery Fee</th>
                      <th>Status</th>
                      <th>Registered</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredParcels.map((parcel) => (
                      <tr className="parcel-row" key={parcel.id}>
                        <td>
                          <strong style={{ color: "#243b80" }}>
                            {parcel.tracking_number || "—"}
                          </strong>
                          <div style={{ color: "#7b879b", marginTop: "5px" }}>
                            {parcel.parcel_description || ""}
                          </div>
                        </td>

                        <td>
                          <strong>{parcel.recipient_name || "—"}</strong>
                          <div style={{ color: "#7b879b", marginTop: "5px" }}>
                            {parcel.recipient_phone || ""}
                          </div>
                        </td>

                        <td>{parcel.origin_branch || "—"}</td>
                        <td>{parcel.destination_branch || "—"}</td>
                        <td>{parcel.parcel_type || "—"}</td>
                        <td>{money(parcel.delivery_fee)}</td>

                        <td>
                          <span
                            style={{
                              ...statusStyle(parcel.status),
                              display: "inline-block",
                              padding: "6px 9px",
                              borderRadius: "20px",
                              fontWeight: 700,
                              fontSize: "11px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {parcel.status || "Unknown"}
                          </span>
                        </td>

                        <td>{formatDate(parcel.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </section>

        <footer
          style={{
            textAlign: "center",
            color: "#8b96a8",
            fontSize: "12px",
            padding: "20px 0",
          }}
        >
          Parcel Management & Tracking System
        </footer>
      </main>
    </div>
  );
}

export default MyParcels;
