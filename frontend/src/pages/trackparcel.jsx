
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const trackingSteps = [
  "Received",
  "Dispatched",
  "In Transit",
  "Arrived",
  "Out for Delivery",
  "Delivered",
];

const statusColors = {
  Received: { background: "#e8efff", color: "#2449a6" },
  Dispatched: { background: "#f0e9ff", color: "#7040a8" },
  "In Transit": { background: "#fff0d8", color: "#975b00" },
  Arrived: { background: "#e0f5f1", color: "#087b68" },
  "Out for Delivery": { background: "#e5f0ff", color: "#1765b1" },
  Delivered: { background: "#e3f7e8", color: "#18733b" },
};

function TrackParcel() {
  const navigate = useNavigate();

  const [trackingNumber, setTrackingNumber] = useState("");
  const [parcel, setParcel] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTrack = async (e) => {
    e.preventDefault();

    if (!trackingNumber.trim() || loading) return;

    setLoading(true);
    setMessage("");
    setParcel(null);

    try {
      const response = await fetch(
        `http://localhost:5000/api/parcels/track/${encodeURIComponent(
          trackingNumber.trim()
        )}`
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Parcel not found. Check your tracking number.");
        return;
      }

      setParcel(data.parcel);
    } catch (error) {
      console.error("Tracking error:", error);
      setMessage("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const currentStep = parcel
    ? trackingSteps.indexOf(parcel.status)
    : -1;

  const isDelivered = parcel?.status === "Delivered";
  const displayStatus = parcel?.status || "Unknown";
  const badgeColors = statusColors[displayStatus] || {
    background: "#edf0f5",
    color: "#566176",
  };

  const styles = {
    page: {
      minHeight: "100vh",
      background: "#f4f7fb",
      padding: "30px 18px",
      fontFamily: "Arial, Helvetica, sans-serif",
      color: "#24304a",
      boxSizing: "border-box",
    },
    container: {
      maxWidth: "920px",
      margin: "0 auto",
    },
    topBar: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "14px",
      marginBottom: "28px",
    },
    brand: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    logo: {
      fontSize: "25px",
      background: "#243b80",
      color: "#fff",
      borderRadius: "12px",
      padding: "12px",
    },
    title: {
      margin: "0 0 6px",
      fontSize: "27px",
      color: "#1c2c50",
    },
    subtitle: {
      color: "#7b879b",
      fontSize: "14px",
      lineHeight: 1.7,
      margin: 0,
    },
    button: {
      padding: "11px 15px",
      border: "none",
      borderRadius: "9px",
      background: "#243b80",
      color: "#fff",
      fontWeight: 700,
      cursor: "pointer",
      fontSize: "13px",
    },
    card: {
      background: "#fff",
      border: "1px solid #e7edf6",
      borderRadius: "15px",
      padding: "24px",
      marginBottom: "22px",
      boxShadow: "0 4px 15px rgba(32,55,100,0.035)",
    },
    label: {
      display: "block",
      fontWeight: 700,
      color: "#46536c",
      fontSize: "13px",
      marginBottom: "10px",
    },
    input: {
      flex: "1 1 250px",
      minWidth: 0,
      padding: "14px",
      border: "1px solid #dce3ef",
      borderRadius: "9px",
      fontSize: "14px",
      outline: "none",
      background: "#fff",
      color: "#24304a",
    },
    searchRow: {
      display: "flex",
      flexWrap: "wrap",
      gap: "12px",
    },
    error: {
      marginTop: "16px",
      padding: "13px 15px",
      background: "#fff0f0",
      border: "1px solid #ffd5d5",
      color: "#b42318",
      borderRadius: "9px",
      fontSize: "13px",
      lineHeight: 1.6,
    },
    mutedLabel: {
      fontSize: "11px",
      letterSpacing: "1px",
      color: "#7b879b",
      fontWeight: 700,
      margin: "0 0 8px",
    },
    sectionTitle: {
      fontSize: "19px",
      margin: "0 0 8px",
      color: "#1c2c50",
    },
    badge: {
      display: "inline-block",
      padding: "8px 13px",
      borderRadius: "20px",
      fontWeight: 700,
      fontSize: "12px",
      whiteSpace: "nowrap",
    },
    detailGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
      gap: "22px",
      marginTop: "22px",
    },
    detailItem: {
      minWidth: 0,
      overflowWrap: "anywhere",
    },
    detailValue: {
      fontSize: "14px",
      lineHeight: 1.6,
      color: "#273650",
    },
    timelineItem: {
      display: "flex",
      gap: "15px",
      minHeight: "82px",
    },
    timelineRail: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      width: "32px",
      flexShrink: 0,
    },
    timelineDot: {
      width: "30px",
      height: "30px",
      borderRadius: "50%",
      border: "2px solid #cbd5e1",
      background: "#fff",
      color: "#64748b",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "12px",
      fontWeight: 700,
      flexShrink: 0,
    },
    completedDot: {
      background: "#16834a",
      borderColor: "#16834a",
      color: "#fff",
    },
    currentDot: {
      border: "3px solid #3564b8",
      boxShadow: "0 0 0 4px #e6edff",
      color: "#243b80",
    },
    timelineLine: {
      width: "3px",
      flex: 1,
      minHeight: "45px",
      background: "#dce3ef",
    },
    completedLine: {
      background: "#16834a",
    },
    historyItem: {
      display: "flex",
      gap: "14px",
      padding: "17px 0",
      borderBottom: "1px solid #edf0f6",
    },
    footer: {
      textAlign: "center",
      color: "#8b96a8",
      fontSize: "12px",
      padding: "20px 0",
    },
  };

  const formatDate = (value) => {
    if (!value) return "Not available";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Not available";

    return date.toLocaleString("en-KE", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const formatMoney = (value) => {
    const amount = Number(value);

    if (!Number.isFinite(amount)) return "Not available";

    return `KES ${amount.toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  function Detail({ label, value }) {
    return (
      <div style={styles.detailItem}>
        <p style={styles.mutedLabel}>{label}</p>
        <strong style={styles.detailValue}>
          {value === null || value === undefined || value === ""
            ? "Not available"
            : value}
        </strong>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <style>{`
        * { box-sizing: border-box; }

        .track-input:focus {
          border-color: #3564b8 !important;
          box-shadow: 0 0 0 3px rgba(53,100,184,0.12);
        }

        .track-button:hover:not(:disabled) {
          opacity: 0.9;
        }

        @media (max-width: 600px) {
          .track-page-title { font-size: 23px !important; }
          .track-card { padding: 18px !important; }
        }
      `}</style>

      <div style={styles.container}>
        <header style={styles.topBar}>
          <div style={styles.brand}>
            <div style={styles.logo}>📦</div>
            <div>
              <h1 className="track-page-title" style={styles.title}>
                Track Your Parcel
              </h1>
              <p style={styles.subtitle}>
                Follow your shipment from registration to delivery.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="track-button"
            style={{
              ...styles.button,
              background: "#fff",
              color: "#243b80",
              border: "1px solid #dce4f2",
            }}
            onClick={() => navigate("/dashboard")}
          >
            ← Customer Dashboard
          </button>
        </header>

        <section className="track-card" style={styles.card}>
          <h2 style={styles.sectionTitle}>Find Your Shipment</h2>
          <p style={{ ...styles.subtitle, marginBottom: "22px" }}>
            Enter the tracking number provided when your parcel was registered.
          </p>

          <form onSubmit={handleTrack}>
            <label htmlFor="trackingNumber" style={styles.label}>
              Tracking Number
            </label>

            <div style={styles.searchRow}>
              <input
                id="trackingNumber"
                className="track-input"
                type="text"
                placeholder="e.g. PKG-MUWNZZ9J"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                style={styles.input}
                required
              />

              <button
                type="submit"
                className="track-button"
                style={{
                  ...styles.button,
                  padding: "14px 25px",
                  fontSize: "14px",
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? "wait" : "pointer",
                }}
                disabled={loading}
              >
                {loading ? "Searching..." : "🔎 Track Parcel"}
              </button>
            </div>
          </form>

          {message && (
            <div role="alert" style={styles.error}>
              {message}
            </div>
          )}
        </section>

        {parcel && (
          <>
            <section className="track-card" style={styles.card}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: "15px",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <p style={styles.mutedLabel}>TRACKING NUMBER</p>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "22px",
                      color: "#243b80",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {parcel.tracking_number}
                  </h2>
                  <p style={{ ...styles.subtitle, marginTop: "8px" }}>
                    Registered {formatDate(parcel.created_at)}
                  </p>
                </div>

                <span style={{ ...styles.badge, ...badgeColors }}>
                  {displayStatus}
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto 1fr",
                  alignItems: "center",
                  gap: "14px",
                  marginTop: "25px",
                  paddingTop: "22px",
                  borderTop: "1px solid #e7edf6",
                }}
              >
                <div>
                  <p style={styles.mutedLabel}>ORIGIN</p>
                  <strong>{parcel.origin_branch || "Unknown"}</strong>
                </div>

                <span style={{ fontSize: "24px", color: "#3564b8" }}>→</span>

                <div>
                  <p style={styles.mutedLabel}>DESTINATION</p>
                  <strong>{parcel.destination_branch || "Unknown"}</strong>
                </div>
              </div>
            </section>

            <section className="track-card" style={styles.card}>
              <h2 style={styles.sectionTitle}>Shipment Progress</h2>
              <p style={{ ...styles.subtitle, marginBottom: "28px" }}>
                {isDelivered
                  ? "Your parcel has been delivered."
                  : `Your parcel's current status is ${displayStatus}.`}
              </p>

              {currentStep === -1 ? (
                <p style={styles.subtitle}>
                  A standard progress timeline is not available for this status.
                </p>
              ) : (
                <div>
                  {trackingSteps.map((step, index) => {
                    const completed = index < currentStep;
                    const current = index === currentStep;
                    const reached = index <= currentStep;
                    const checked = completed || (isDelivered && current);

                    return (
                      <div key={step} style={styles.timelineItem}>
                        <div style={styles.timelineRail}>
                          <div
                            style={{
                              ...styles.timelineDot,
                              ...(reached ? styles.completedDot : {}),
                              ...(current && !isDelivered
                                ? styles.currentDot
                                : {}),
                            }}
                          >
                            {checked ? "✓" : index + 1}
                          </div>

                          {index < trackingSteps.length - 1 && (
                            <div
                              style={{
                                ...styles.timelineLine,
                                ...(completed || (isDelivered && current)
                                  ? styles.completedLine
                                  : {}),
                              }}
                            />
                          )}
                        </div>

                        <div style={{ paddingBottom: "22px", flex: 1 }}>
                          <strong
                            style={{
                              color: reached ? "#176b3a" : "#758198",
                            }}
                          >
                            {step}
                          </strong>

                          <p
                            style={{
                              ...styles.subtitle,
                              marginTop: "6px",
                            }}
                          >
                            {{
                              Received: "Parcel registered at the origin branch.",
                              Dispatched: "Parcel dispatched from the branch.",
                              "In Transit": "Parcel is travelling to its destination.",
                              Arrived: "Parcel has arrived at a branch.",
                              "Out for Delivery": "Parcel is on its final delivery journey.",
                              Delivered: "Parcel delivered to the recipient.",
                            }[step]}
                          </p>

                          {current && (
                            <span
                              style={{
                                display: "inline-block",
                                marginTop: "5px",
                                fontSize: "10px",
                                fontWeight: 800,
                                letterSpacing: "1px",
                                color: "#3564b8",
                              }}
                            >
                              CURRENT STATUS
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="track-card" style={styles.card}>
              <h2 style={styles.sectionTitle}>Parcel Details</h2>

              <div style={styles.detailGrid}>
                <Detail label="Recipient" value={parcel.recipient_name} />
                <Detail label="Recipient Phone" value={parcel.recipient_phone} />
                <Detail label="Parcel Type" value={parcel.parcel_type || "Not specified"} />
                <Detail label="Description" value={parcel.parcel_description} />
                <Detail label="Weight" value={parcel.weight != null ? `${parcel.weight} kg` : null} />
                <Detail label="Delivery Fee" value={formatMoney(parcel.delivery_fee)} />
                <Detail label="Date Registered" value={formatDate(parcel.created_at)} />
              </div>
            </section>

            <section className="track-card" style={styles.card}>
              <h2 style={styles.sectionTitle}>Tracking History</h2>
              <p style={{ ...styles.subtitle, marginBottom: "10px" }}>
                Recorded updates for this shipment.
              </p>

              {parcel.tracking_history?.length > 0 ? (
                [...parcel.tracking_history]
                  .reverse()
                  .map((history, index) => (
                    <div
                      key={`${history.timestamp}-${index}`}
                      style={styles.historyItem}
                    >
                      <div
                        style={{
                          width: "11px",
                          height: "11px",
                          background: "#3564b8",
                          borderRadius: "50%",
                          marginTop: "5px",
                          flexShrink: 0,
                        }}
                      />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: "8px",
                          }}
                        >
                          <strong>{history.status}</strong>
                          <span style={{ ...styles.subtitle, fontSize: "12px" }}>
                            {formatDate(history.timestamp)}
                          </span>
                        </div>

                        <p style={{ ...styles.subtitle, marginTop: "7px" }}>
                          Location: {history.location || "Not recorded"}
                        </p>
                      </div>
                    </div>
                  ))
              ) : (
                <p style={styles.subtitle}>No tracking history is available.</p>
              )}
            </section>
          </>
        )}

        <footer style={styles.footer}>
          Parcel Management & Tracking System
        </footer>
      </div>
    </div>
  );
}

export default TrackParcel;

