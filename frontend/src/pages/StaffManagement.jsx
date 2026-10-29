
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../api";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  branch_id: "",
};

function StaffManagement() {
  const navigate = useNavigate();

  const [staff, setStaff] = useState([]);
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");

  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "The request failed.");
    }

    return data;
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      if (!localStorage.getItem("token")) {
        navigate("/");
        return;
      }

      const [staffData, pricingData] = await Promise.all([
        request("/api/admin/staff"),
        request("/api/admin/pricing"),
      ]);

      setStaff(staffData.staff || []);
      setBranches(pricingData.branches || []);
    } catch (err) {
      setError(err.message || "Unable to load staff.");
    } finally {
      setLoading(false);
    }
  }, [request, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setMessage("");
  }

  function startEditing(member) {
    setEditingId(member.id);
    setForm({
      name: member.name || "",
      email: member.email || "",
      phone: member.phone || "",
      password: "",
      branch_id: String(member.branch_id || ""),
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
        email: form.email.trim(),
        phone: form.phone.trim(),
        branch_id: Number(form.branch_id),
      };

      if (!editingId) {
        payload.password = form.password;
      }

      const data = await request(
        editingId
          ? `/api/admin/staff/${editingId}`
          : "/api/admin/staff",
        {
          method: editingId ? "PUT" : "POST",
          body: JSON.stringify(payload),
        }
      );

      setMessage(data.message || "Staff saved successfully.");
      resetForm();
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to save staff details.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(member) {
    const action = member.is_active ? "deactivate" : "activate";

    if (
      !window.confirm(
        `Are you sure you want to ${action} ${member.name}'s account?`
      )
    ) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const data = await request(
        `/api/admin/staff/${member.id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ is_active: !member.is_active }),
        }
      );

      setMessage(data.message || "Account status updated.");
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to update account status.");
    }
  }

  const filteredStaff = staff.filter((member) => {
    const term = search.trim().toLowerCase();

    return (
      !term ||
      [
        member.name,
        member.email,
        member.phone,
        member.branch_name,
      ].some((value) => String(value || "").toLowerCase().includes(term))
    );
  });

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: 10,
    border: "1px solid #d4dce8",
    borderRadius: 7,
    marginTop: 5,
  };

  const buttonStyle = {
    padding: "9px 12px",
    border: "1px solid #d4dce8",
    borderRadius: 7,
    cursor: "pointer",
    fontWeight: 600,
    background: "#fff",
  };

  const labelStyle = {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 12,
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4f7fc",
        padding: 24,
        fontFamily: "Arial, sans-serif",
        color: "#172033",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: 1300, margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 22,
          }}
        >
          <div>
            <h1 style={{ margin: 0 }}>Staff Management</h1>
            <p style={{ color: "#64748b" }}>
              Create staff accounts and manage branch assignments.
            </p>
          </div>

          <button
            style={buttonStyle}
            onClick={() => navigate("/admin-dashboard")}
          >
            ← Admin Dashboard
          </button>
        </header>

        {error && (
          <p
            role="alert"
            style={{
              background: "#fee4e2",
              color: "#b42318",
              padding: 12,
              borderRadius: 7,
            }}
          >
            {error}
          </p>
        )}

        {message && (
          <p
            role="status"
            style={{
              background: "#dcfae6",
              color: "#067647",
              padding: 12,
              borderRadius: 7,
            }}
          >
            {message}
          </p>
        )}

        <section
          style={{
            background: "#fff",
            padding: 20,
            borderRadius: 12,
            marginBottom: 20,
          }}
        >
          <h2>{editingId ? "Edit Staff Member" : "Add Staff Member"}</h2>

          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 14,
              }}
            >
              <label style={labelStyle}>
                Full name
                <input
                  style={inputStyle}
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  required
                  maxLength={120}
                />
              </label>

              <label style={labelStyle}>
                Email address
                <input
                  style={inputStyle}
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={updateField}
                  required
                />
              </label>

              <label style={labelStyle}>
                Phone number
                <input
                  style={inputStyle}
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={updateField}
                  required
                />
              </label>

              <label style={labelStyle}>
                Assigned branch
                <select
                  style={inputStyle}
                  name="branch_id"
                  value={form.branch_id}
                  onChange={updateField}
                  required
                >
                  <option value="">Select a branch</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </label>

              {!editingId && (
                <label style={labelStyle}>
                  Initial password
                  <input
                    style={inputStyle}
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={updateField}
                    minLength={8}
                    autoComplete="new-password"
                    required
                  />
                  <small>At least 8 characters.</small>
                </label>
              )}
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  ...buttonStyle,
                  background: "#243b80",
                  color: "#fff",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Save Changes"
                  : "Create Staff Account"}
              </button>

              {editingId && (
                <button
                  type="button"
                  style={buttonStyle}
                  onClick={resetForm}
                >
                  Cancel Editing
                </button>
              )}
            </div>
          </form>
        </section>

        <section
          style={{
            background: "#fff",
            padding: 20,
            borderRadius: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <h2>Staff Accounts ({filteredStaff.length})</h2>

            <button style={buttonStyle} onClick={loadData}>
              Refresh
            </button>
          </div>

          <input
            style={{ ...inputStyle, maxWidth: 420, marginBottom: 16 }}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, phone or branch..."
            aria-label="Search staff"
          />

          {loading ? (
            <p>Loading staff accounts...</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  minWidth: 850,
                  borderCollapse: "collapse",
                  fontSize: 13,
                }}
              >
                <thead>
                  <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                    {[
                      "Name",
                      "Email",
                      "Phone",
                      "Branch",
                      "Account",
                      "Actions",
                    ].map((heading) => (
                      <th key={heading} style={{ padding: 12 }}>
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredStaff.map((member) => (
                    <tr key={member.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: 12 }}>{member.name}</td>
                      <td style={{ padding: 12 }}>{member.email}</td>
                      <td style={{ padding: 12 }}>{member.phone}</td>
                      <td style={{ padding: 12 }}>{member.branch_name || "Unassigned"}</td>
                      <td style={{ padding: 12 }}>
                        <span
                          style={{
                            color: member.is_active ? "#067647" : "#b42318",
                            fontWeight: 700,
                          }}
                        >
                          {member.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td style={{ padding: 12 }}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <button
                            style={buttonStyle}
                            onClick={() => startEditing(member)}
                          >
                            Edit
                          </button>

                          <button
                            style={{
                              ...buttonStyle,
                              color: member.is_active ? "#b42318" : "#067647",
                            }}
                            onClick={() => toggleStatus(member)}
                          >
                            {member.is_active ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {!filteredStaff.length && (
                    <tr>
                      <td colSpan={6} style={{ padding: 20, textAlign: "center" }}>
                        {staff.length
                          ? "No staff members match your search."
                          : "No staff accounts found. Add your first staff member above."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default StaffManagement;
