import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../api";

const emptyItem = () => ({
  id: `${Date.now()}-${Math.random()}`,
  parcelTypeId: "",
  typeSearch: "",
  quantity: "1",
  description: "",
});

function CreateParcel() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [parcelTypes, setParcelTypes] = useState([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerResults, setShowCustomerResults] = useState(false);
  const [senderId, setSenderId] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [destinationBranch, setDestinationBranch] = useState("");
  const [items, setItems] = useState([emptyItem()]);
  const [weight, setWeight] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("Please log in as staff first.");
        setMessageType("error");
        setLoadingData(false);
        return;
      }
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const responses = await Promise.all([
          fetch(`${API_BASE_URL}/api/customers`, { headers }),
          fetch(`${API_BASE_URL}/api/branches`, { headers }),
          fetch(`${API_BASE_URL}/api/parcel-types`, { headers }),
        ]);

        const data = await Promise.all(
          responses.map(async (r) => {
            const body = await r.json().catch(() => ({}));
            if (!r.ok) throw new Error(body.message || `Request failed (${r.status})`);
            return body;
          })
        );

        if (!cancelled) {
          setCustomers(data[0].customers || []);
          setBranches(data[1].branches || []);
          setParcelTypes(data[2].parcelTypes || []);
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(error.message || "Unable to load parcel data.");
          setMessageType("error");
        }
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers.slice(0, 8);
    return customers
      .filter((c) =>
        [c.name, c.phone, c.email].some((v) => String(v || "").toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [customers, customerSearch]);

  const updateItem = (id, field, value) =>
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );

  const addItem = () => setItems((current) => [...current, emptyItem()]);

  const removeItem = (id) =>
    setItems((current) => (current.length === 1 ? current : current.filter((item) => item.id !== id)));

  const itemCount = items.reduce(
    (sum, item) => sum + (Number.parseInt(item.quantity, 10) || 0),
    0
  );

  const handleCreateParcel = async (event) => {
    event.preventDefault();
    setMessage("");
    setMessageType("");

    // Existing sender: senderId is set. New sender: require both a name and phone.
    if (!senderId && (!customerSearch.trim() || !senderPhone.trim())) {
      setMessage("For a new sender, enter their full name and phone number. For an existing sender, select them from the search results.");
      setMessageType("error");
      return;
    }

    if (
      !items.length ||
      items.some(
        (item) =>
          !item.parcelTypeId ||
          !Number.isInteger(Number(item.quantity)) ||
          Number(item.quantity) < 1
      )
    ) {
      setMessage("Choose an item type and a quantity of at least 1 for every item row.");
      setMessageType("error");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please log in as staff first.");

      const contents = items.map((item) => ({
        parcel_type_id: Number(item.parcelTypeId),
        quantity: Number(item.quantity),
        description: item.description.trim(),
      }));

      const response = await fetch(`${API_BASE_URL}/api/parcels`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sender_id: senderId ? Number(senderId) : null,
          sender_name: selectedCustomer?.name || customerSearch.trim(),
          sender_phone: selectedCustomer?.phone || senderPhone.trim(),
          recipient_name: recipientName.trim(),
          recipient_phone: recipientPhone.trim(),
          destination_branch: destinationBranch,
          weight: Number(weight),
          items: contents,
          parcel_type_id: contents[0].parcel_type_id,
          parcel_description: contents
            .map((item) => {
              const type = parcelTypes.find((t) => Number(t.id) === item.parcel_type_id);
              return `${type?.name || "Item"} × ${item.quantity}${
                item.description ? ` (${item.description})` : ""
              }`;
            })
            .join(", "),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Failed to register parcel.");

      const trackingNumber = data.parcel?.tracking_number || "generated";
      const savedFee = data.delivery_fee ?? data.parcel?.delivery_fee;
      const feeText =
        savedFee !== undefined && savedFee !== null
          ? ` Total delivery fee: KES ${Number(savedFee).toLocaleString("en-KE", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}.`
          : "";

      const breakdownText = Array.isArray(data.items)
        ? " Breakdown: " +
          data
            .map(
              (item) =>
                `${item.name} × ${item.quantity} = KES ${Number(
                  item.line_delivery_fee
                ).toLocaleString("en-KE")}`
            )
            .join("; ") +
          "."
        : "";

      setMessage(
        `Parcel registered successfully! Tracking number: ${trackingNumber}.${feeText}${breakdownText} SMS notification requests have been initiated.`
      );
      setMessageType("success");
      setSenderId("");
      setSelectedCustomer(null);
      setCustomerSearch("");
      setSenderPhone("");
      setRecipientName("");
      setRecipientPhone("");
      setDestinationBranch("");
      setItems([emptyItem()]);
      setWeight("");
    } catch (error) {
      setMessage(error.message || "Unable to connect to the server.");
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  };

  const styles = {
    page: {
      minHeight: "100vh",
      boxSizing: "border-box",
      padding: "30px",
      background: "#f4f7fb",
      color: "#172033",
      fontFamily: "Arial, sans-serif",
    },
    header: {
      maxWidth: "1100px",
      margin: "0 auto 25px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "18px",
    },
    eyebrow: {
      color: "#5266b5",
      fontWeight: 700,
      fontSize: "11px",
      letterSpacing: "1.5px",
      marginBottom: "10px",
    },
    title: { fontSize: "clamp(27px, 4vw, 34px)", margin: "0 0 8px" },
    subtitle: { color: "#667085", margin: 0, lineHeight: 1.5 },
    button: {
      border: "1px solid #d8dfec",
      borderRadius: "8px",
      background: "#fff",
      color: "#243b80",
      padding: "12px 16px",
      fontWeight: 700,
      cursor: "pointer",
    },
    layout: {
      maxWidth: "1100px",
      margin: "0 auto",
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
      gap: "24px",
      alignItems: "start",
    },
    panel: {
      background: "#243b80",
      color: "#fff",
      borderRadius: "16px",
      padding: "28px",
      boxSizing: "border-box",
    },
    card: {
      background: "#fff",
      border: "1px solid #e0e5ef",
      borderRadius: "16px",
      padding: "clamp(18px, 3vw, 28px)",
      boxSizing: "border-box",
      boxShadow: "0 8px 25px rgba(28,42,75,.04)",
    },
    group: {
      fontSize: "15px",
      color: "#243b80",
      borderBottom: "1px solid #e8ecf4",
      paddingBottom: "10px",
      margin: "25px 0 18px",
    },
    field: { marginBottom: "18px", minWidth: 0 },
    label: {
      display: "block",
      fontWeight: 700,
      fontSize: "14px",
      marginBottom: "8px",
      color: "#344054",
    },
    input: {
      width: "100%",
      boxSizing: "border-box",
      padding: "13px 14px",
      border: "1px solid #d0d5dd",
      borderRadius: "8px",
      fontSize: "15px",
      outlineColor: "#5266b5",
      background: "#fff",
      color: "#172033",
    },
    small: { color: "#667085", fontSize: "12px", lineHeight: 1.5 },
    itemCard: {
      border: "1px solid #dfe5f0",
      background: "#fbfcff",
      borderRadius: "10px",
      padding: "15px",
      marginBottom: "12px",
    },
    itemGrid: {
      display: "grid",
      gridTemplateColumns: "minmax(0, 2fr) minmax(85px, 1fr)",
      gap: "12px",
    },
    addButton: {
      border: "1px solid #b8c7f5",
      background: "#eef2ff",
      color: "#243b80",
      borderRadius: "8px",
      padding: "11px 14px",
      fontWeight: 700,
      cursor: "pointer",
      marginBottom: "18px",
    },
    notice: {
      padding: "15px",
      background: "#eff6ff",
      border: "1px solid #bfdbfe",
      borderRadius: "9px",
      color: "#1e40af",
      fontSize: "14px",
      lineHeight: 1.6,
      marginBottom: "20px",
    },
    message: {
      padding: "12px 14px",
      borderRadius: "8px",
      marginBottom: "16px",
      fontSize: "14px",
      lineHeight: 1.6,
      overflowWrap: "anywhere",
    },
    submit: {
      width: "100%",
      padding: "14px",
      border: 0,
      borderRadius: "8px",
      background: "#243b80",
      color: "#fff",
      fontSize: "15px",
      fontWeight: 700,
      marginTop: "5px",
      cursor: "pointer",
    },
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <p style={styles.eyebrow}>PARCEL MANAGEMENT SYSTEM</p>
          <h1 style={styles.title}>Register Parcel</h1>
          <p style={styles.subtitle}>Register a delivery with one or more contents.</p>
        </div>
        <button
          type="button"
          style={styles.button}
          onClick={() => navigate("/staff-dashboard")}
        >
          ← Staff Dashboard
        </button>
      </header>

      <main style={styles.layout}>
        <aside style={styles.panel}>
          <div style={{ fontSize: 34, marginBottom: 18 }}>📦</div>
          <h2 style={{ marginTop: 0 }}>New Parcel Registration</h2>
          <p style={{ color: "#e0e7ff", lineHeight: 1.7 }}>
            Search for the sender, record the recipient, add all contents and quantities,
            then let the system calculate the delivery fee.
          </p>
          {[
            "Search customers by name, phone or email",
            "Add multiple types of contents",
            "Record the total parcel weight",
            "Generate tracking and initiate SMS notifications",
          ].map((text) => (
            <p key={text} style={{ display: "flex", gap: 10, lineHeight: 1.5 }}>
              <span>✓</span>
              <span>{text}</span>
            </p>
          ))}
          <div
            style={{
              marginTop: 24,
              padding: 14,
              background: "rgba(255,255,255,.1)",
              borderRadius: 9,
              lineHeight: 1.6,
              fontSize: 13,
            }}
          >
            The parcel's origin is assigned automatically from your staff branch. Items
            are parcel contents, not products for sale.
          </div>
        </aside>

        <section style={styles.card}>
          <div style={{ marginBottom: 22 }}>
            <h2 style={{ margin: "0 0 7px", fontSize: 22 }}>Parcel Details</h2>
            <p style={styles.subtitle}>Complete all required fields.</p>
          </div>

          {loadingData && (
            <p
              style={{
                padding: 12,
                background: "#eff4ff",
                borderRadius: 8,
                color: "#243b80",
              }}
            >
              Loading customers and parcel options…
            </p>
          )}

          <form onSubmit={handleCreateParcel}>
            <h3 style={styles.group}>Sender & Recipient</h3>

            <div style={{ ...styles.field, position: "relative" }}>
              <label htmlFor="customer-search" style={styles.label}>
                Search Sender / Customer
              </label>
              <input
                id="customer-search"
                style={styles.input}
                value={customerSearch}
                placeholder="Search existing sender or type a new sender's full name…"
                autoComplete="off"
                onFocus={() => setShowCustomerResults(true)}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setSenderId("");
                  setSelectedCustomer(null);
                  setShowCustomerResults(true);
                }}
                disabled={loadingData}
                required={!senderId}
              />
              {selectedCustomer && (
                <p style={{ color: "#027a48", fontSize: 13, margin: "8px 0 0" }}>
                  ✓ Selected: {selectedCustomer.name} · {selectedCustomer.phone}
                </p>
              )}
              {!selectedCustomer && (
                <div style={{ marginTop: 10 }}>
                  <label htmlFor="sender-phone" style={styles.label}>New sender phone number</label>
                  <input id="sender-phone" type="tel" style={styles.input} value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} placeholder="e.g. 0712345678" autoComplete="tel" />
                  <small style={styles.small}>For a new sender, enter their phone number here. No email or password is required.</small>
                </div>
              )}

              {showCustomerResults && !selectedCustomer && (
                <div
                  style={{
                    border: "1px solid #d0d5dd",
                    borderRadius: 8,
                    marginTop: 5,
                    maxHeight: 220,
                    overflowY: "auto",
                    background: "#fff",
                    position: "relative",
                    zIndex: 2,
                  }}
                >
                  {filteredCustomers.length ? (
                    filteredCustomers.map((customer) => (
                      <button
                        type="button"
                        key={customer.id}
                        onClick={() => {
                          setSenderId(String(customer.id));
                          setSelectedCustomer(customer);
                          setCustomerSearch(`${customer.name} — ${customer.phone}`);
                          setShowCustomerResults(false);
                        }}
                        style={{
                          display: "block",
                          textAlign: "left",
                          width: "100%",
                          padding: 12,
                          border: 0,
                          borderBottom: "1px solid #eef0f5",
                          background: "white",
                          cursor: "pointer",
                          color: "#172033",
                        }}
                      >
                        <strong>{customer.name}</strong>
                        <br />
                        <span style={{ color: "#667085", fontSize: 12 }}>
                          {customer.phone}
                          {customer.email ? ` · ${customer.email}` : ""}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p style={{ padding: 12, margin: 0, color: "#667085" }}>
                      No matching customer. Enter the sender phone number above to create a contact.
                    </p>
                  )}
                </div>
              )}
              {customers.length === 0 && !loadingData && (
                <small style={styles.small}>No customers found. Add a customer first.</small>
              )}
            </div>

            <div style={styles.field}>
              <label htmlFor="recipient-name" style={styles.label}>
                Recipient Name
              </label>
              <input
                id="recipient-name"
                style={styles.input}
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Enter recipient's full name"
                required
              />
            </div>

            <div style={styles.field}>
              <label htmlFor="recipient-phone" style={styles.label}>
                Recipient Phone
              </label>
              <input
                id="recipient-phone"
                type="tel"
                style={styles.input}
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="e.g. 0712345678"
                required
              />
            </div>

            <h3 style={styles.group}>Parcel Contents</h3>
            <p style={styles.small}>
              Add each kind of item inside this parcel. Quantity counts the number of that
              item type; it is not a selling price.
            </p>

            {items.map((item, index) => (
              <div key={item.id} style={styles.itemCard}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <strong style={{ color: "#243b80" }}>Item {index + 1}</strong>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      style={{
                        border: 0,
                        background: "transparent",
                        color: "#b42318",
                        cursor: "pointer",
                        fontWeight: 700,
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div style={styles.itemGrid}>
                  <div style={styles.field}>
                    <label htmlFor={`type-${item.id}`} style={styles.label}>
                      Item type
                    </label>
                    <input
                      id={`type-${item.id}`}
                      list={`parcel-types-${item.id}`}
                      style={styles.input}
                      value={item.typeSearch || ""}
                      placeholder="Search item type..."
                      autoComplete="off"
                      onChange={(e) => {
                        const searchText = e.target.value;
                        const exactMatch = parcelTypes.find(
                          (type) =>
                            String(type.name || "").trim().toLowerCase() ===
                            searchText.trim().toLowerCase()
                        );
                        setItems((current) =>
                          current.map((row) =>
                            row.id === item.id
                              ? {
                                  ...row,
                                  typeSearch: searchText,
                                  parcelTypeId: exactMatch ? String(exactMatch.id) : "",
                                }
                              : row
                          )
                        );
                      }}
                      required
                    />
                    <datalist id={`parcel-types-${item.id}`}>
                      {parcelTypes
                        .filter((type) =>
                          String(type.name || "")
                            .toLowerCase()
                            .includes((item.typeSearch || "").trim().toLowerCase())
                        )
                        .map((type) => (
                          <option key={type.id} value={type.name} />
                        ))}
                    </datalist>
                    {!item.parcelTypeId && item.typeSearch && item.typeSearch.trim() && (
                      <small style={{ color: "#b42318", display: "block", marginTop: 6 }}>
                        Choose an item type from the suggestions so its tariff can be found.
                      </small>
                    )}
                  </div>
                  <div style={styles.field}>
                    <label htmlFor={`qty-${item.id}`} style={styles.label}>
                      Quantity
                    </label>
                    <input
                      id={`qty-${item.id}`}
                      type="number"
                      min="1"
                      step="1"
                      style={styles.input}
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div style={styles.field}>
                  <label htmlFor={`desc-${item.id}`} style={styles.label}>
                    Description (optional)
                  </label>
                  <input
                    id={`desc-${item.id}`}
                    style={styles.input}
                    value={item.description}
                    onChange={(e) => updateItem(item.id, "description", e.target.value)}
                    placeholder="e.g. black laptop, A4 envelope"
                  />
                </div>
              </div>
            ))}

            <button type="button" onClick={addItem} style={styles.addButton}>
              ＋ Add another item type
            </button>

            <div style={styles.field}>
              <label htmlFor="destination" style={styles.label}>
                Destination Branch
              </label>
              <select
                id="destination"
                style={styles.input}
                value={destinationBranch}
                onChange={(e) => setDestinationBranch(e.target.value)}
                required
              >
                <option value="">Select destination branch</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.name}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.field}>
              <label htmlFor="weight" style={styles.label}>
                Total Parcel Weight (kg)
              </label>
              <input
                id="weight"
                type="number"
                step="0.01"
                min="0.01"
                style={styles.input}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 2.5"
                required
              />
            </div>

            <div style={styles.notice}>
              <strong>Delivery fee: calculated automatically</strong>
              <br />
              The fee comes from your configured delivery tariffs for the selected item
              types and destination. No item selling prices are used. Quantity is included
              in the fee calculation by the backend.
            </div>

            {message && (
              <div
                role="status"
                aria-live="polite"
                style={{
                  ...styles.message,
                  ...(messageType === "success"
                    ? {
                        background: "#ecfdf3",
                        color: "#027a48",
                        border: "1px solid #abefc6",
                      }
                    : {
                        background: "#fef3f2",
                        color: "#b42318",
                        border: "1px solid #fecdca",
                      }),
                }}
              >
                {message}
              </div>
            )}

            <div
              style={{
                padding: 12,
                background: "#f8fafc",
                borderRadius: 8,
                marginBottom: 16,
                color: "#344054",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>Total item quantity</span>
              <strong>{itemCount}</strong>
            </div>

            <button
              type="submit"
              disabled={
                submitting ||
                loadingData ||
                !branches.length ||
                !parcelTypes.length
              }
              style={{
                ...styles.submit,
                opacity: submitting || loadingData ? 0.7 : 1,
                cursor: submitting || loadingData ? "wait" : "pointer",
              }}
            >
              {submitting ? "Registering Parcel…" : "＋ Register Parcel"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/staff-dashboard")}
              style={{ ...styles.button, width: "100%", marginTop: 12 }}
            >
              Cancel and Return to Dashboard
            </button>
          </form>
        </section>
      </main>

      <footer
        style={{
          maxWidth: 1100,
          margin: "30px auto 0",
          paddingTop: 18,
          borderTop: "1px solid #e0e5ef",
          color: "#667085",
          fontSize: 12,
        }}
      >
        Parcel Management and Tracking System
      </footer>
    </div>
  );
}

export default CreateParcel;