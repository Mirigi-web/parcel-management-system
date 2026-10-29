import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../api";

export default function CustomerManagement() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/customers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Could not load customers");
        setCustomers(data.customers || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const filtered = useMemo(() => {
    return customers.filter((c) =>
      `${c.name} ${c.phone} ${c.email || ""}`
        .toLowerCase()
        .includes(query.toLowerCase())
    );
  }, [customers, query]);

  async function viewCustomer(customer) {
    setSelected(customer);
    setParcels([]);
    setError("");
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/customers/${customer.id}/parcels`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Could not load parcel history");
      setParcels(data.parcels || []);
    } catch (e) {
      setError(e.message);
    }
  }

  // Styles definition
  const styles = {
    container: {
      minHeight: "100vh",
      background: "#f4f7fc",
      padding: 24,
      fontFamily: "Arial, sans-serif",
      color: "#1d2939",
    },
    header: {
      maxWidth: 1100,
      margin: "0 auto 22px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
      flexWrap: "wrap",
    },
    title: {
      marginBottom: 5,
    },
    subtitle: {
      color: "#667085",
      marginTop: 0,
    },
    card: {
      background: "white",
      padding: 20,
      borderRadius: 12,
      border: "1px solid #e5eaf2",
      marginBottom: 16,
    },
    button: {
      padding: "10px 14px",
      borderRadius: 8,
      border: "1px solid #d4dbea",
      cursor: "pointer",
      background: "white",
      color: "#243b80",
      fontWeight: 700,
    },
    errorAlert: {
      color: "#a12b2b",
    },
    main: {
      maxWidth: 1100,
      margin: "auto",
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
      gap: 18,
    },
    searchInput: {
      width: "100%",
      padding: 12,
      boxSizing: "border-box",
      border: "1px solid #d0d5dd",
      borderRadius: 8,
      marginBottom: 12,
    },
    customerButton: (isSelected) => ({
      display: "block",
      width: "100%",
      textAlign: "left",
      padding: 12,
      marginBottom: 8,
      border: isSelected ? "2px solid #243b80" : "1px solid #e5eaf2",
      borderRadius: 8,
      background: "#fff",
      cursor: "pointer",
    }),
    customerMeta: {
      color: "#667085",
      marginTop: 4,
    },
    parcelItem: {
      padding: "12px 0",
      borderBottom: "1px solid #e5eaf2",
    },
    parcelDetail: {
      marginTop: 5,
    },
    parcelSubtext: {
      color: "#667085",
      fontSize: 13,
    },
    placeholderText: {
      color: "#667085",
    },
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Customer Management</h1>
          <p style={styles.subtitle}>
            Senders and recipients recorded during parcel registration.
          </p>
        </div>
        <button style={styles.button} onClick={() => navigate("/admin-dashboard")}>
          ← Admin Dashboard
        </button>
      </header>

      {error && (
        <p role="alert" style={{ ...styles.card, ...styles.errorAlert }}>
          {error}
        </p>
      )}

      <main style={styles.main}>
        {/* Customers Section */}
        <section style={styles.card}>
          <h2>Customers ({filtered.length})</h2>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, phone or email"
            style={styles.searchInput}
          />
          {loading ? (
            <p>Loading…</p>
          ) : filtered.length ? (
            filtered.map((c) => {
              const isSelected = selected?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => viewCustomer(c)}
                  style={styles.customerButton(isSelected)}
                >
                  <strong>{c.name}</strong>
                  <div style={styles.customerMeta}>
                    {c.phone}
                    {c.email ? ` · ${c.email}` : " · No login account"}
                  </div>
                </button>
              );
            })
          ) : (
            <p>No customers found.</p>
          )}
        </section>

        {/* Parcel History Section */}
        <section style={styles.card}>
          <h2>{selected ? selected.name : "Parcel history"}</h2>
          {!selected ? (
            <p style={styles.placeholderText}>
              Select a customer to view parcels where they are sender or recipient.
            </p>
          ) : parcels.length ? (
            parcels.map((p) => (
              <div key={p.id} style={styles.parcelItem}>
                <strong>{p.tracking_number}</strong>
                <div style={styles.parcelDetail}>Status: {p.status}</div>
                <div style={styles.parcelSubtext}>
                  {p.origin_branch} → {p.destination_branch}
                </div>
                <div style={styles.parcelSubtext}>Role: {p.customer_role}</div>
              </div>
            ))
          ) : (
            <p>No parcels found for this customer.</p>
          )}
        </section>
      </main>
    </div>
  );
}