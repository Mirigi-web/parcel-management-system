
import { useEffect, useState } from "react";

function UpdateParcelStatus() {
  const [parcels, setParcels] = useState([]);
  const [selectedParcel, setSelectedParcel] = useState("");
  const [status, setStatus] = useState("");
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState("Loading parcels...");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const statuses = [
    "Received",
    "Dispatched",
    "In Transit",
    "Arrived",
    "Out for Delivery",
    "Delivered",
  ];

  useEffect(() => {
    let cancelled = false;

    async function loadParcels() {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setMessage("Please log in as staff first.");
          setMessageType("error");
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
          setMessageType("error");
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

  const selectedParcelDetails = parcels.find(
    (parcel) => String(parcel.id) === String(selectedParcel)
  );

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");

    if (!selectedParcel || !status || !location.trim()) {
      setMessage("Please complete all fields.");
      setMessageType("error");
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("Your session may have expired. Please log in again.");
        setMessageType("error");
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/parcels/${selectedParcel}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status,
            location: location.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update parcel status."
        );
      }

      setParcels((current) =>
        current.map((parcel) =>
          String(parcel.id) === String(selectedParcel)
            ? { ...parcel, status }
            : parcel
        )
      );

      setMessage(
        `Parcel ${selectedParcelDetails?.tracking_number || ""} updated to "${status}".`
      );
      setMessageType("success");

      setSelectedParcel("");
      setStatus("");
      setLocation("");
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
          <h1 style={styles.title}>Update Parcel Status</h1>
          <p style={styles.subtitle}>
            Record a parcel's latest status and current location.
          </p>
        </div>

        <button type="button" onClick={goBack} style={styles.backButton}>
          ← Staff Dashboard
        </button>
      </header>

      <main style={styles.layout}>
        <section style={styles.infoPanel}>
          <div style={styles.illustration}>🚚</div>
          <h2 style={styles.infoTitle}>Parcel Progress</h2>
          <p style={styles.infoText}>
            Keep parcel records current as shipments move through your
            delivery network.
          </p>

          <div style={styles.infoItem}>
            <span>1</span>
            <span>Choose the parcel to update.</span>
          </div>
          <div style={styles.infoItem}>
            <span>2</span>
            <span>Select its new delivery status.</span>
          </div>
          <div style={styles.infoItem}>
            <span>3</span>
            <span>Enter the current location and save.</span>
          </div>

          <div style={styles.notice}>
            A successful status update uses the existing backend route,
            which also initiates notification requests.
          </div>
        </section>

        <section style={styles.formCard}>
          <div style={styles.formHeading}>
            <div>
              <h2 style={styles.formTitle}>Update Details</h2>
              <p style={styles.formSubtitle}>
                Select a parcel and enter its latest information.
              </p>
            </div>
            <span style={styles.formIcon}>↗</span>
          </div>

          {selectedParcelDetails && (
            <div style={styles.selectedCard}>
              <p style={styles.selectedLabel}>Selected parcel</p>
              <strong style={styles.tracking}>
                {selectedParcelDetails.tracking_number}
              </strong>
              <p style={styles.currentStatus}>
                Current status: {selectedParcelDetails.status}
              </p>
              <p style={styles.currentStatus}>
                Recipient: {selectedParcelDetails.recipient_name}
              </p>
            </div>
          )}

          {loading && (
            <p style={styles.loading}>Loading branch parcels...</p>
          )}

          {!loading && parcels.length === 0 && (
            <div style={styles.noticeLight}>
              No parcels are available for updating at your branch.
              Register a parcel first.
            </div>
          )}

          <form onSubmit={handleUpdateStatus}>
            <div style={styles.field}>
              <label htmlFor="parcel" style={styles.label}>
                Select Parcel
              </label>
              <select
                id="parcel"
                value={selectedParcel}
                onChange={(e) => setSelectedParcel(e.target.value)}
                style={styles.input}
                required
                disabled={loading || parcels.length === 0}
              >
                <option value="">Choose a parcel</option>
                {parcels.map((parcel) => (
                  <option key={parcel.id} value={parcel.id}>
                    {parcel.tracking_number} — {parcel.recipient_name} (
                    {parcel.status})
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.field}>
              <label htmlFor="new-status" style={styles.label}>
                New Parcel Status
              </label>
              <select
                id="new-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={styles.input}
                required
              >
                <option value="">Select new status</option>
                {statuses.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.field}>
              <label htmlFor="location" style={styles.label}>
                Current Location
              </label>
              <input
                id="location"
                type="text"
                placeholder="e.g. Nairobi branch"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={styles.input}
                required
              />
              <small style={styles.hint}>
                Enter the location where the parcel is currently recorded.
              </small>
            </div>

            {message && (
              <div
                role="status"
                aria-live="polite"
                style={{
                  ...styles.message,
                  ...(messageType === "success"
                    ? styles.successMessage
                    : messageType === "error"
                      ? styles.errorMessage
                      : styles.infoMessage),
                }}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || loading || parcels.length === 0}
              style={{
                ...styles.submitButton,
                opacity: submitting || loading ? 0.7 : 1,
                cursor: submitting || loading ? "wait" : "pointer",
              }}
            >
              {submitting ? "Updating Status..." : "✓ Update Parcel Status"}
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
    padding: "30px",
    boxSizing: "border-box",
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
    alignItems: "center",
    gap: "12px",
    margin: "18px 0",
    lineHeight: 1.5,
  },
  notice: {
    background: "rgba(255,255,255,0.1)",
    padding: "14px",
    borderRadius: "9px",
    lineHeight: 1.6,
    marginTop: "28px",
    fontSize: "13px",
  },
  noticeLight: {
    background: "#eff4ff",
    color: "#2448a5",
    borderRadius: "8px",
    padding: "12px",
    marginBottom: "18px",
    fontSize: "13px",
    lineHeight: 1.6,
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
    lineHeight: 1.5,
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
    fontSize: "24px",
  },
  selectedCard: {
    padding: "15px",
    background: "#f8f9fc",
    border: "1px solid #e0e5ef",
    borderRadius: "9px",
    marginBottom: "22px",
    overflowWrap: "anywhere",
  },
  selectedLabel: {
    color: "#667085",
    fontSize: "12px",
    margin: "0 0 7px",
  },
  tracking: {
    color: "#243b80",
    fontSize: "16px",
  },
  currentStatus: {
    color: "#667085",
    fontSize: "13px",
    margin: "7px 0 0",
  },
  loading: {
    color: "#667085",
    fontSize: "14px",
  },
  field: {
    marginBottom: "20px",
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
    background: "#ffffff",
    color: "#172033",
  },
  hint: {
    display: "block",
    color: "#667085",
    fontSize: "12px",
    marginTop: "7px",
    lineHeight: 1.5,
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
  infoMessage: {
    background: "#eff4ff",
    color: "#2448a5",
    border: "1px solid #c7d7fe",
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

export default UpdateParcelStatus;
