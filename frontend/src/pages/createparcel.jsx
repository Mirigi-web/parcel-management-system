
import { useEffect, useState } from "react";

function CreateParcel() {
  const [customers, setCustomers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [parcelTypes, setParcelTypes] = useState([]);

  const [senderId, setSenderId] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [destinationBranch, setDestinationBranch] = useState("");
  const [parcelTypeId, setParcelTypeId] = useState("");
  const [description, setDescription] = useState("");
  const [weight, setWeight] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setMessage("Please log in as staff first.");
          setMessageType("error");
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [customersResponse, branchesResponse, typesResponse] =
          await Promise.all([
            fetch("http://localhost:5000/api/customers", { headers }),
            fetch("http://localhost:5000/api/branches", { headers }),
            fetch("http://localhost:5000/api/parcel-types", { headers }),
          ]);

        const [customersData, branchesData, typesData] =
          await Promise.all([
            customersResponse.json(),
            branchesResponse.json(),
            typesResponse.json(),
          ]);

        if (!customersResponse.ok) {
          throw new Error(
            customersData.message || "Failed to load customers."
          );
        }

        if (!branchesResponse.ok) {
          throw new Error(
            branchesData.message || "Failed to load branches."
          );
        }

        if (!typesResponse.ok) {
          throw new Error(
            typesData.message || "Failed to load parcel types."
          );
        }

        if (!cancelled) {
          setCustomers(customersData.customers || []);
          setBranches(branchesData.branches || []);
          setParcelTypes(typesData.parcelTypes || []);
          setMessage("");
        }
      } catch (error) {
        console.error(error);

        if (!cancelled) {
          setMessage(error.message || "Unable to load parcel data.");
          setMessageType("error");
        }
      } finally {
        if (!cancelled) {
          setLoadingData(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreateParcel = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");
    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("Please log in as staff first.");
        setMessageType("error");
        return;
      }

      const response = await fetch("http://localhost:5000/api/parcels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sender_id: Number(senderId),
          recipient_name: recipientName,
          recipient_phone: recipientPhone,
          destination_branch: destinationBranch,
          parcel_description: description,
          weight: Number(weight),
          delivery_fee: Number(deliveryFee),
          parcel_type_id: parcelTypeId ? Number(parcelTypeId) : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to register parcel.");
      }

      setMessage(
        `Parcel registered successfully! Tracking number: ${
          data.parcel.tracking_number
        }. SMS notification requests have been initiated.`
      );
      setMessageType("success");

      setSenderId("");
      setRecipientName("");
      setRecipientPhone("");
      setDestinationBranch("");
      setParcelTypeId("");
      setDescription("");
      setWeight("");
      setDeliveryFee("");
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Unable to connect to the server.");
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    window.location.href = "/staff-dashboard";
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <p style={styles.eyebrow}>PARCEL MANAGEMENT SYSTEM</p>
          <h1 style={styles.title}>Register Parcel</h1>
          <p style={styles.subtitle}>
            Register a customer's parcel at your branch.
          </p>
        </div>

        <button type="button" onClick={goBack} style={styles.backButton}>
          ← Staff Dashboard
        </button>
      </header>

      <main style={styles.layout}>
        <section style={styles.infoPanel}>
          <div style={styles.illustration}>📦</div>
          <h2 style={styles.infoTitle}>New Parcel Registration</h2>
          <p style={styles.infoText}>
            Record sender and recipient information, select the destination,
            and enter the parcel details to create a tracking number.
          </p>

          <div style={styles.infoItem}>
            <span>✓</span>
            <span>Choose an existing customer as sender</span>
          </div>
          <div style={styles.infoItem}>
            <span>✓</span>
            <span>Record the recipient's contact details</span>
          </div>
          <div style={styles.infoItem}>
            <span>✓</span>
            <span>Generate a parcel tracking number</span>
          </div>
          <div style={styles.infoItem}>
            <span>✓</span>
            <span>Initiate automated notification requests</span>
          </div>

          <div style={styles.notice}>
            The parcel's origin is assigned automatically from your staff
            branch.
          </div>
        </section>

        <section style={styles.formCard}>
          <div style={styles.formHeading}>
            <div>
              <h2 style={styles.formTitle}>Parcel Details</h2>
              <p style={styles.formSubtitle}>
                Complete all required fields.
              </p>
            </div>
            <span style={styles.formIcon}>＋</span>
          </div>

          {loadingData && (
            <p style={styles.loading}>Loading customers and parcel options…</p>
          )}

          <form onSubmit={handleCreateParcel}>
            <h3 style={styles.groupTitle}>Sender & Recipient</h3>

            <div style={styles.field}>
              <label htmlFor="sender" style={styles.label}>
                Sender / Customer
              </label>
              <select
                id="sender"
                value={senderId}
                onChange={(e) => setSenderId(e.target.value)}
                style={styles.input}
                required
                disabled={loadingData || customers.length === 0}
              >
                <option value="">Select customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} — {customer.phone}
                  </option>
                ))}
              </select>
              {!loadingData && customers.length === 0 && (
                <small style={styles.hint}>
                  No customers found. Add a customer first.
                </small>
              )}
            </div>

            <div style={styles.field}>
              <label htmlFor="recipient-name" style={styles.label}>
                Recipient Name
              </label>
              <input
                id="recipient-name"
                type="text"
                placeholder="Enter recipient's full name"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                style={styles.input}
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
                placeholder="e.g. 0712345678"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                style={styles.input}
                required
              />
            </div>

            <h3 style={styles.groupTitle}>Parcel Information</h3>

            <div style={styles.field}>
              <label htmlFor="parcel-type" style={styles.label}>
                Parcel Type
              </label>
              <select
                id="parcel-type"
                value={parcelTypeId}
                onChange={(e) => setParcelTypeId(e.target.value)}
                style={styles.input}
                required
                disabled={loadingData || parcelTypes.length === 0}
              >
                <option value="">Select parcel type</option>
                {parcelTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.field}>
              <label htmlFor="destination" style={styles.label}>
                Destination Branch
              </label>
              <select
                id="destination"
                value={destinationBranch}
                onChange={(e) => setDestinationBranch(e.target.value)}
                style={styles.input}
                required
                disabled={loadingData || branches.length === 0}
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
              <label htmlFor="description" style={styles.label}>
                Parcel Description
              </label>
              <input
                id="description"
                type="text"
                placeholder="e.g. Electronics, documents, clothes"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.twoColumns}>
              <div style={styles.field}>
                <label htmlFor="weight" style={styles.label}>
                  Weight (kg)
                </label>
                <input
                  id="weight"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="e.g. 2.5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.field}>
                <label htmlFor="fee" style={styles.label}>
                  Delivery Fee (KES)
                </label>
                <input
                  id="fee"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 500"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
            </div>

            {message && (
              <div
                role="status"
                aria-live="polite"
                style={{
                  ...styles.message,
                  ...(messageType === "success"
                    ? styles.successMessage
                    : styles.errorMessage),
                }}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={
                submitting ||
                loadingData ||
                customers.length === 0 ||
                branches.length === 0 ||
                parcelTypes.length === 0
              }
              style={{
                ...styles.submitButton,
                opacity: submitting || loadingData ? 0.7 : 1,
                cursor: submitting || loadingData ? "wait" : "pointer",
              }}
            >
              {submitting ? "Registering Parcel…" : "＋ Register Parcel"}
            </button>

            <button
              type="button"
              onClick={goBack}
              style={styles.cancelButton}
            >
              Cancel and Return to Dashboard
            </button>
          </form>
        </section>
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
    boxSizing: "border-box",
    padding: "30px",
    background: "#f4f7fb",
    color: "#172033",
    fontFamily: "Arial, sans-serif",
  },
  header: {
    maxWidth: "1100px",
    margin: "0 auto 30px",
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
    margin: 0,
    lineHeight: 1.5,
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
  layout: {
    maxWidth: "1100px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
    gap: "24px",
    alignItems: "start",
  },
  infoPanel: {
    background: "#243b80",
    color: "#ffffff",
    borderRadius: "16px",
    padding: "30px",
    boxSizing: "border-box",
  },
  illustration: {
    width: "62px",
    height: "62px",
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,0.13)",
    borderRadius: "14px",
    fontSize: "30px",
    marginBottom: "25px",
  },
  infoTitle: {
    fontSize: "23px",
    margin: "0 0 12px",
  },
  infoText: {
    color: "#e0e7ff",
    lineHeight: 1.7,
    marginBottom: "25px",
  },
  infoItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    margin: "16px 0",
    lineHeight: 1.5,
  },
  notice: {
    background: "rgba(255,255,255,0.1)",
    padding: "14px",
    borderRadius: "9px",
    lineHeight: 1.6,
    marginTop: "25px",
    fontSize: "13px",
  },
  formCard: {
    background: "#ffffff",
    border: "1px solid #e0e5ef",
    borderRadius: "16px",
    padding: "28px",
    boxSizing: "border-box",
    boxShadow: "0 8px 25px rgba(28,42,75,0.04)",
  },
  formHeading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "25px",
  },
  formTitle: {
    fontSize: "21px",
    margin: "0 0 7px",
  },
  formSubtitle: {
    color: "#667085",
    fontSize: "14px",
    margin: 0,
  },
  formIcon: {
    background: "#e9edff",
    color: "#243b80",
    borderRadius: "10px",
    width: "40px",
    height: "40px",
    display: "grid",
    placeItems: "center",
    fontSize: "25px",
  },
  groupTitle: {
    fontSize: "15px",
    color: "#243b80",
    borderBottom: "1px solid #e8ecf4",
    paddingBottom: "10px",
    margin: "25px 0 18px",
  },
  field: {
    minWidth: 0,
    marginBottom: "19px",
  },
  label: {
    display: "block",
    fontWeight: "bold",
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
    background: "#ffffff",
    color: "#172033",
  },
  twoColumns: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
    gap: "14px",
  },
  loading: {
    background: "#eff4ff",
    color: "#243b80",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "14px",
  },
  message: {
    padding: "12px 14px",
    borderRadius: "8px",
    marginBottom: "16px",
    fontSize: "14px",
    lineHeight: 1.6,
    overflowWrap: "anywhere",
  },
  successMessage: {
    background: "#ecfdf3",
    color: "#027a48",
    border: "1px solid #abefc6",
  },
  errorMessage: {
    background: "#fef3f2",
    color: "#b42318",
    border: "1px solid #fecdca",
  },
  submitButton: {
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "8px",
    background: "#243b80",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "bold",
    marginTop: "5px",
  },
  cancelButton: {
    width: "100%",
    padding: "13px",
    border: "1px solid #d0d5dd",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#344054",
    fontWeight: "bold",
    marginTop: "12px",
    cursor: "pointer",
  },
  footer: {
    maxWidth: "1100px",
    margin: "30px auto 0",
    paddingTop: "18px",
    borderTop: "1px solid #e0e5ef",
    color: "#667085",
    fontSize: "12px",
  },
};

export default CreateParcel;
