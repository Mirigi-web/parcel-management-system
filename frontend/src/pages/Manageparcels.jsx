
import { useEffect, useMemo, useState } from "react";

function ManageParcels() {
  const [parcels, setParcels] = useState([]);
  const [message, setMessage] = useState("Loading parcels...");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    let cancelled = false;

    async function loadParcels() {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setMessage("Please log in as staff first.");
          return;
        }

        const response = await fetch(
          "http://localhost:5000/api/staff/parcels",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load parcels.");
        }

        if (!cancelled) {
          setParcels(data.parcels || []);
          setMessage("");
        }
      } catch (error) {
        console.error(error);

        if (!cancelled) {
          setMessage(error.message || "Unable to connect to the server.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadParcels();

    return () => {
      cancelled = true;
    };
  }, []);

  const statuses = [
    "Received",
    "Dispatched",
    "In Transit",
    "Arrived",
    "Out for Delivery",
    "Delivered",
  ];

  const filteredParcels = useMemo(() => {
    const query = search.trim().toLowerCase();

    return parcels.filter((parcel) => {
      const matchesSearch = [
        parcel.tracking_number,
        parcel.customer_name,
        parcel.customer_phone,
        parcel.recipient_name,
        parcel.recipient_phone,
        parcel.destination_branch,
        parcel.parcel_type,
        parcel.status,
      ].some((value) =>
        String(value || "").toLowerCase().includes(query)
      );

      const matchesStatus =
        statusFilter === "All" || parcel.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [parcels, search, statusFilter]);

  const getStatusStyle = (status) => {
    const colors = {
      Received: { background: "#e8efff", color: "#2448a5" },
      Dispatched: { background: "#f3e8ff", color: "#7e22ce" },
      "In Transit": { background: "#fff4d6", color: "#925b00" },
      Arrived: { background: "#e0f2fe", color: "#075985" },
      "Out for Delivery": { background: "#ffedd5", color: "#9a3412" },
      Delivered: { background: "#dcfce7", color: "#166534" },
    };

    return colors[status] || {
      background: "#f2f4f7",
      color: "#344054",
    };
  };

  const goBack = () => {
    window.location.href = "/staff-dashboard";
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <p style={styles.eyebrow}>PARCEL MANAGEMENT SYSTEM</p>
          <h1 style={styles.title}>Manage Parcels</h1>
          <p style={styles.subtitle}>
            View and search parcels registered at your branch.
          </p>
        </div>

        <button type="button" onClick={goBack} style={styles.backButton}>
          ← Staff Dashboard
        </button>
      </header>

      <main style={styles.container}>
        <section style={styles.summaryCard}>
          <div style={styles.summaryIcon}>📦</div>
          <div>
            <p style={styles.summaryLabel}>Total Branch Parcels</p>
            <h2 style={styles.summaryNumber}>
              {loading ? "…" : parcels.length}
            </h2>
          </div>
          <div style={styles.summaryNote}>
            {loading ? "Loading records…" : "Registered parcels"}
          </div>
        </section>

        <section style={styles.tableCard}>
          <div style={styles.tableHeading}>
            <div>
              <h2 style={styles.sectionTitle}>Parcel Records</h2>
              <p style={styles.sectionSubtitle}>
                Search by tracking number, customer, recipient, or destination.
              </p>
            </div>

            <button
              type="button"
              style={styles.refreshButton}
              onClick={() => window.location.reload()}
            >
              ↻ Refresh
            </button>
          </div>

          <div style={styles.filters}>
            <div style={styles.searchWrap}>
              <span style={styles.searchIcon}>⌕</span>
              <input
                type="search"
                placeholder="Search parcels..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={styles.searchInput}
                aria-label="Search parcels"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={styles.statusSelect}
              aria-label="Filter by parcel status"
            >
              <option value="All">All statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {message && (
            <div
              role="status"
              style={styles.errorMessage}
            >
              {message}
            </div>
          )}

          {!loading && !message && filteredParcels.length === 0 && (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📭</div>
              <h3 style={styles.emptyTitle}>
                {parcels.length === 0
                  ? "No parcels yet"
                  : "No matching parcels"}
              </h3>
              <p style={styles.emptyText}>
                {parcels.length === 0
                  ? "Parcels registered at your branch will appear here."
                  : "Try another search term or change the status filter."}
              </p>

              {(search || statusFilter !== "All") && (
                <button
                  type="button"
                  style={styles.refreshButton}
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("All");
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {filteredParcels.length > 0 && (
            <>
              <div style={styles.resultCount}>
                Showing <strong>{filteredParcels.length}</strong> of{" "}
                <strong>{parcels.length}</strong> parcels
              </div>

              <div style={styles.tableScroll}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Tracking Number</th>
                      <th style={styles.th}>Sender / Customer</th>
                      <th style={styles.th}>Recipient</th>
                      <th style={styles.th}>Destination</th>
                      <th style={styles.th}>Parcel Details</th>
                      <th style={styles.th}>Delivery Fee</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Date Registered</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredParcels.map((parcel) => (
                      <tr key={parcel.id}>
                        <td style={styles.td}>
                          <span style={styles.trackingNumber}>
                            {parcel.tracking_number}
                          </span>
                        </td>

                        <td style={styles.td}>
                          <strong style={styles.personName}>
                            {parcel.customer_name || "N/A"}
                          </strong>
                          <span style={styles.secondaryText}>
                            {parcel.customer_phone || "No phone"}
                          </span>
                        </td>

                        <td style={styles.td}>
                          <strong style={styles.personName}>
                            {parcel.recipient_name || "N/A"}
                          </strong>
                          <span style={styles.secondaryText}>
                            {parcel.recipient_phone || "No phone"}
                          </span>
                        </td>

                        <td style={styles.td}>
                          {parcel.destination_branch || "N/A"}
                        </td>

                        <td style={styles.td}>
                          <strong style={styles.personName}>
                            {parcel.parcel_type || "Other"}
                          </strong>
                          <span style={styles.secondaryText}>
                            {parcel.weight ?? "N/A"} kg
                          </span>
                        </td>

                        <td style={styles.td}>
                          KES {Number(parcel.delivery_fee || 0).toFixed(2)}
                        </td>

                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.badge,
                              ...getStatusStyle(parcel.status),
                            }}
                          >
                            {parcel.status || "Unknown"}
                          </span>
                        </td>

                        <td style={styles.td}>
                          {parcel.created_at
                            ? new Date(parcel.created_at).toLocaleString()
                            : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        <div style={styles.bottomActions}>
          <button
            type="button"
            onClick={() =>
              (window.location.href = "/create-parcel")
            }
            style={styles.primaryButton}
          >
            + Register New Parcel
          </button>

          <button
            type="button"
            onClick={goBack}
            style={styles.secondaryButton}
          >
            Back to Dashboard
          </button>
        </div>
      </main>

      <footer style={styles.footer}>
        Parcel Management and Tracking System
      </footer>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "30px",
    boxSizing: "border-box",
    background: "#f4f7fb",
    color: "#172033",
    fontFamily: "Arial, sans-serif",
  },
  header: {
    maxWidth: "1250px",
    margin: "0 auto 28px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "18px",
  },
  eyebrow: {
    color: "#5266b5",
    fontWeight: "bold",
    fontSize: "11px",
    letterSpacing: "1.5px",
    marginBottom: "10px",
  },
  title: {
    fontSize: "clamp(27px, 4vw, 34px)",
    margin: "0 0 8px",
  },
  subtitle: {
    color: "#667085",
    lineHeight: 1.5,
    margin: 0,
  },
  backButton: {
    border: "1px solid #d8dfec",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#243b80",
    padding: "12px 16px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  container: {
    maxWidth: "1250px",
    margin: "0 auto",
  },
  summaryCard: {
    background: "#ffffff",
    border: "1px solid #e0e5ef",
    borderRadius: "14px",
    padding: "22px",
    display: "flex",
    alignItems: "center",
    gap: "17px",
    marginBottom: "22px",
    flexWrap: "wrap",
  },
  summaryIcon: {
    background: "#e9edff",
    width: "52px",
    height: "52px",
    display: "grid",
    placeItems: "center",
    borderRadius: "12px",
    fontSize: "25px",
  },
  summaryLabel: {
    margin: "0 0 5px",
    color: "#667085",
    fontSize: "13px",
  },
  summaryNumber: {
    fontSize: "28px",
    margin: 0,
    color: "#243b80",
  },
  summaryNote: {
    marginLeft: "auto",
    color: "#667085",
    fontSize: "13px",
  },
  tableCard: {
    background: "#ffffff",
    border: "1px solid #e0e5ef",
    borderRadius: "14px",
    padding: "24px",
    boxShadow: "0 8px 25px rgba(28,42,75,0.03)",
  },
  tableHeading: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "15px",
    marginBottom: "22px",
  },
  sectionTitle: {
    fontSize: "20px",
    margin: "0 0 7px",
  },
  sectionSubtitle: {
    color: "#667085",
    fontSize: "13px",
    margin: 0,
    lineHeight: 1.5,
  },
  refreshButton: {
    border: "1px solid #d0d5dd",
    borderRadius: "8px",
    background: "#ffffff",
    padding: "10px 14px",
    color: "#344054",
    fontWeight: "bold",
    cursor: "pointer",
  },
  filters: {
    display: "flex",
    gap: "12px",
    marginBottom: "20px",
    flexWrap: "wrap",
  },
  searchWrap: {
    flex: "1 1 250px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    border: "1px solid #d0d5dd",
    borderRadius: "8px",
    padding: "0 12px",
    background: "#ffffff",
    minWidth: 0,
  },
  searchIcon: {
    color: "#667085",
    fontSize: "24px",
  },
  searchInput: {
    width: "100%",
    minWidth: 0,
    padding: "12px 0",
    border: "none",
    outline: "none",
    fontSize: "14px",
    background: "transparent",
  },
  statusSelect: {
    flex: "0 1 190px",
    minWidth: "160px",
    border: "1px solid #d0d5dd",
    borderRadius: "8px",
    padding: "12px",
    fontSize: "14px",
    background: "#ffffff",
    color: "#344054",
  },
  errorMessage: {
    background: "#fef3f2",
    color: "#b42318",
    padding: "14px",
    borderRadius: "8px",
    marginBottom: "15px",
    lineHeight: 1.5,
  },
  emptyState: {
    textAlign: "center",
    padding: "45px 15px",
  },
  emptyIcon: {
    fontSize: "35px",
    marginBottom: "12px",
  },
  emptyTitle: {
    margin: "0 0 10px",
    fontSize: "18px",
  },
  emptyText: {
    color: "#667085",
    fontSize: "14px",
    lineHeight: 1.6,
    marginBottom: "18px",
  },
  resultCount: {
    color: "#667085",
    fontSize: "13px",
    marginBottom: "12px",
  },
  tableScroll: {
    width: "100%",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    minWidth: "1050px",
    borderCollapse: "collapse",
    textAlign: "left",
    fontSize: "13px",
  },
  th: {
    padding: "14px 12px",
    background: "#f8f9fc",
    color: "#667085",
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.4px",
    borderBottom: "1px solid #e0e5ef",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "16px 12px",
    borderBottom: "1px solid #edf0f5",
    verticalAlign: "middle",
    lineHeight: 1.5,
  },
  trackingNumber: {
    color: "#243b80",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },
  personName: {
    display: "block",
    color: "#344054",
    marginBottom: "3px",
  },
  secondaryText: {
    display: "block",
    color: "#667085",
    fontSize: "12px",
    marginTop: "3px",
  },
  badge: {
    display: "inline-block",
    borderRadius: "20px",
    padding: "6px 10px",
    fontSize: "11px",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },
  bottomActions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "22px",
  },
  primaryButton: {
    background: "#243b80",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "13px 18px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  secondaryButton: {
    background: "#ffffff",
    color: "#344054",
    border: "1px solid #d0d5dd",
    borderRadius: "8px",
    padding: "13px 18px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  footer: {
    maxWidth: "1250px",
    margin: "28px auto 0",
    paddingTop: "18px",
    borderTop: "1px solid #e0e5ef",
    color: "#667085",
    fontSize: "12px",
  },
};

export default ManageParcels;
