import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../api";

const EMPTY_FORM = { name: "", location: "", prefix: "" };
const DEFAULT_PREFIXES = {
  Nairobi: "NAI",
  Mombasa: "MOM",
  Kajiado: "KAJ",
  Voi: "VOI",
  Kisumu: "KIS",
};

function BranchManagement() {
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || "The request failed.");
    return result;
  }, []);

  const loadBranches = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (!localStorage.getItem("token")) {
  setError("No login token found. Please log in again.");
  return;
}
      const result = await request("/api/admin/branches");
      setBranches(result.branches || []);
    } catch (err) {
      setError(err.message || "Unable to load branches.");
    } finally {
      setLoading(false);
    }
  }, [navigate, request]);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: name === "prefix" ? value.toUpperCase().slice(0, 3) : value }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError("");
    setMessage("");
  }

  function startEditing(branch) {
    setEditingId(branch.id);
    setForm({
      name: branch.name || "",
      location: branch.location || "",
      prefix: branch.prefix || DEFAULT_PREFIXES[branch.name] || "",
    });
    setError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        name: form.name.trim(),
        location: form.location.trim(),
        prefix: form.prefix.trim().toUpperCase(),
      };
      const result = await request(
        editingId ? `/api/admin/branches/${editingId}` : "/api/admin/branches",
        { method: editingId ? "PUT" : "POST", body: JSON.stringify(payload) }
      );
      setMessage(result.message || (editingId ? "Branch updated." : "Branch created."));
      resetForm();
      await loadBranches();
    } catch (err) {
      setError(err.message || "Unable to save branch.");
    } finally {
      setSaving(false);
    }
  }

  const filteredBranches = branches.filter((branch) => {
    const term = search.trim().toLowerCase();
    return !term || [branch.name, branch.location, branch.prefix, branch.status]
      .some((value) => String(value || "").toLowerCase().includes(term));
  });

  const inputStyle = {
    width: "100%", boxSizing: "border-box", padding: 11,
    border: "1px solid #d4dce8", borderRadius: 8, marginTop: 6,
  };
  const buttonStyle = {
    padding: "10px 14px", border: "1px solid #d4dce8", borderRadius: 8,
    cursor: "pointer", fontWeight: 700, background: "#fff",
  };
  const labelStyle = { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 12 };
  const cardStyle = { background: "#fff", padding: 22, borderRadius: 13, border: "1px solid #e7ebf2", marginBottom: 20 };

  return (
    <main style={{ minHeight: "100vh", background: "#f4f7fc", padding: 24, fontFamily: "Arial, sans-serif", color: "#172033", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 1300, margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 22 }}>
          <div>
            <h1 style={{ margin: 0 }}>Branch Management</h1>
            <p style={{ color: "#64748b", lineHeight: 1.6 }}>View, add, and edit branches while protecting parcel history.</p>
          </div>
          <button style={buttonStyle} onClick={() => navigate("/admin-dashboard")}>← Admin Dashboard</button>
        </header>

        {error && <div role="alert" style={{ background: "#fee4e2", color: "#b42318", padding: 12, borderRadius: 8, marginBottom: 16 }}>{error}</div>}
        {message && <div role="status" style={{ background: "#dcfae6", color: "#067647", padding: 12, borderRadius: 8, marginBottom: 16 }}>{message}</div>}

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>{editingId ? "Edit Branch" : "Add Branch"}</h2>
          <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>
            Each branch needs a unique three-character tracking prefix. Branches cannot be deleted from this page. If parcels already reference a branch, its name is locked to protect existing records; its location can still be edited.
          </p>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
              <label style={labelStyle}>Branch name
                <input style={inputStyle} name="name" value={form.name} onChange={updateField} required maxLength={100} placeholder="e.g. Nakuru" />
              </label>
              <label style={labelStyle}>Location / address
                <input style={inputStyle} name="location" value={form.location} onChange={updateField} required maxLength={200} placeholder="e.g. Nakuru town" />
              </label>
              <label style={labelStyle}>Tracking prefix (3 characters)
                <input style={inputStyle} name="prefix" value={form.prefix} onChange={updateField} required minLength={3} maxLength={3} pattern="[A-Za-z0-9]{3}" title="Use exactly 3 letters or numbers" placeholder="e.g. NAK" />
              </label>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="submit" disabled={saving} style={{ ...buttonStyle, background: "#243b80", color: "#fff", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Saving..." : editingId ? "Save Changes" : "Add Branch"}
              </button>
              {editingId && <button type="button" style={buttonStyle} onClick={resetForm}>Cancel Editing</button>}
            </div>
          </form>
        </section>

        <section style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <h2 style={{ margin: 0 }}>Registered Branches ({filteredBranches.length})</h2>
            <button style={buttonStyle} onClick={loadBranches} disabled={loading}>{loading ? "Loading..." : "Refresh"}</button>
          </div>
          <input style={{ ...inputStyle, maxWidth: 440, marginBottom: 16 }} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, location, prefix or status..." aria-label="Search branches" />
          {loading ? <p>Loading branches...</p> : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", minWidth: 780, borderCollapse: "collapse", fontSize: 13 }}>
                <thead><tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                  {["Branch", "Location", "Tracking Prefix", "Staff", "Parcels", "Status", "Actions"].map((heading) => <th key={heading} style={{ padding: 12 }}>{heading}</th>)}
                </tr></thead>
                <tbody>
                  {filteredBranches.map((branch) => <tr key={branch.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: 12, fontWeight: 700 }}>{branch.name}</td>
                    <td style={{ padding: 12 }}>{branch.location || "—"}</td>
                    <td style={{ padding: 12 }}>{branch.prefix || DEFAULT_PREFIXES[branch.name] || "Not configured"}</td>
                    <td style={{ padding: 12 }}>{Number(branch.staff_count || 0).toLocaleString()}</td>
                    <td style={{ padding: 12 }}>{Number(branch.parcel_count || 0).toLocaleString()}</td>
                    <td style={{ padding: 12 }}>{branch.status || "Active"}</td>
                    <td style={{ padding: 12 }}><button type="button" style={buttonStyle} onClick={() => startEditing(branch)}>Edit</button></td>
                  </tr>)}
                  {!filteredBranches.length && <tr><td colSpan={7} style={{ padding: 22, textAlign: "center" }}>{branches.length ? "No branches match your search." : "No branches found."}</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default BranchManagement;
