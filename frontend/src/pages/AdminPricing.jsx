
import { useEffect, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AdminPricing() {
  const [items, setItems] = useState([]);
  const [branches, setBranches] = useState([]);
  const [prices, setPrices] = useState([]);

  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");

  const [selectedItem, setSelectedItem] = useState("");
  const [itemSearch, setItemSearch] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [price, setPrice] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  const headers = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  async function loadPricing() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/pricing`,
        { headers: headers() }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load pricing.");
      }

      setItems(data.items || []);
      setBranches(data.branches || []);
      setPrices(data.prices || []);
    } catch (err) {
      setError(true);
      setMessage(err.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPricing();
  }, []);

  async function addItem(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError(false);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/parcel-types`,
        {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({
            name: itemName.trim(),
            description: description.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to add item.");
      }

      
setItemName("");
setDescription("");
setItemSearch("");
setSelectedItem("");
setMessage("Parcel item added successfully.");
await loadPricing();

    } catch (err) {
      setError(true);
      setMessage(err.message || "Unable to add item.");
    } finally {
      setSaving(false);
    }
  }

  async function savePrice(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError(false);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/pricing`,
        {
          method: "PUT",
          headers: headers(),
          body: JSON.stringify({
            parcel_type_id: Number(selectedItem),
            branch_id: Number(selectedBranch),
            price: Number(price),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save price.");
      }

      setMessage("Price saved successfully.");
      setPrice("");
      await loadPricing();
    } catch (err) {
      setError(true);
      setMessage(err.message || "Unable to save price.");
    } finally {
      setSaving(false);
    }
  }

  function formatPrice(value) {
    if (value === null || value === undefined) {
      return "Not configured";
    }

    return `KES ${Number(value).toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <p style={styles.eyebrow}>PARCEL MANAGEMENT SYSTEM</p>
          <h1 style={styles.title}>Items & Pricing</h1>
          <p style={styles.subtitle}>
            Add parcel items and configure fees for each destination.
          </p>
        </div>

        <button
          type="button"
          style={styles.secondaryButton}
          onClick={loadPricing}
          disabled={loading}
        >
          Refresh
        </button>
      </header>

      {message && (
        <div
          role="status"
          style={{
            ...styles.message,
            background: error ? "#fee2e2" : "#dcfce7",
            color: error ? "#991b1b" : "#166534",
          }}
        >
          {message}
        </div>
      )}

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Add a parcel item</h2>

        <form onSubmit={addItem} style={styles.form}>
          <label style={styles.label}>
            Item name
            <input
              style={styles.input}
              value={itemName}
              onChange={(event) => setItemName(event.target.value)}
              placeholder="e.g. Small Carton"
              required
            />
          </label>

          <label style={styles.label}>
            Description (optional)
            <input
              style={styles.input}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the parcel item"
            />
          </label>

          <button
            type="submit"
            style={styles.primaryButton}
            disabled={saving}
          >
            {saving ? "Saving..." : "Add Item"}
          </button>
        </form>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Set a destination price</h2>

        <form onSubmit={savePrice} style={styles.form}>
          
          
<label style={styles.label}>
  Search parcel item
  <input
    style={styles.input}
    type="text"
    placeholder="Type an item name..."
    value={
      selectedItem
        ? items.find(
            (item) => String(item.id) === String(selectedItem)
          )?.name || ""
        : itemSearch
    }
    onChange={(event) => {
      setItemSearch(event.target.value);
      setSelectedItem("");
    }}
    onFocus={() => {
      setItemSearch("");
      setSelectedItem("");
    }}
  />

  {!selectedItem && itemSearch.trim() !== "" && (
    <div style={{ marginTop: "6px" }}>
      {items
        .filter(
          (item) =>
            item.status === "Active" &&
            item.name.toLowerCase().includes(itemSearch.toLowerCase())
        )
        .map((item) => (
          <button
            key={item.id}
            type="button"
            style={{
              display: "block",
              width: "100%",
              padding: "10px",
              textAlign: "left",
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              cursor: "pointer",
            }}
            onClick={() => {
              setSelectedItem(String(item.id));
              setItemSearch(item.name);
            }}
          >
            {item.name}
          </button>
        ))}
    </div>
  )}
</label>


          <label style={styles.label}>
            Destination branch
            <select
              style={styles.input}
              value={selectedBranch}
              onChange={(event) =>
                setSelectedBranch(event.target.value)
              }
              required
            >
              <option value="">Select a destination</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </label>

          <label style={styles.label}>
            Price (KES)
            <input
              style={styles.input}
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="e.g. 500"
              required
            />
          </label>

          <button
            type="submit"
            style={styles.primaryButton}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Price"}
          </button>
        </form>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Configured prices</h2>

        {loading ? (
          <p>Loading pricing...</p>
        ) : prices.length === 0 ? (
          <p>No pricing records found. Add items and configure prices.</p>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.cell}>Item</th>
                  <th style={styles.cell}>Destination</th>
                  <th style={styles.cell}>Price</th>
                </tr>
              </thead>
              <tbody>
                {prices.map((row, index) => (
                  <tr key={`${row.parcel_type_id}-${row.branch_id}-${index}`}>
                    <td style={styles.cell}>{row.parcel_type}</td>
                    <td style={styles.cell}>{row.branch_name}</td>
                    <td style={styles.cell}>
                      {formatPrice(row.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "32px",
    background: "#f3f4f6",
    color: "#111827",
    fontFamily: "Arial, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "24px",
  },
  eyebrow: {
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "1.5px",
    color: "#64748b",
  },
  title: {
    fontSize: "30px",
    margin: "8px 0",
  },
  subtitle: {
    color: "#64748b",
  },
  card: {
    background: "#ffffff",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "24px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  sectionTitle: {
    fontSize: "20px",
    marginTop: 0,
    marginBottom: "20px",
  },
  form: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    alignItems: "end",
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    fontWeight: "600",
    fontSize: "14px",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "15px",
    background: "#ffffff",
  },
  primaryButton: {
    padding: "12px 18px",
    border: "none",
    borderRadius: "8px",
    background: "#172554",
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "10px 16px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    background: "#ffffff",
    cursor: "pointer",
  },
  message: {
    padding: "14px",
    borderRadius: "8px",
    marginBottom: "20px",
  },
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
  },
  cell: {
    padding: "12px",
    borderBottom: "1px solid #e5e7eb",
  },
};
