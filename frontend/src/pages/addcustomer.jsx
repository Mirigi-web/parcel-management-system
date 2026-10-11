import { useState } from "react";
import API_BASE_URL from "../api";

function AddCustomer() {

  const [name, setName] = useState("");

  const [email, setEmail] = useState("");

  const [phone, setPhone] = useState("");

  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");

  const [messageType, setMessageType] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const handleAddCustomer = async (e) => {

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

      const response = await fetch(

        `${API_BASE_URL}/api/customers`,

        {

          method: "POST",

          headers: {

            "Content-Type": "application/json",

            Authorization: `Bearer ${token}`,

          },

          body: JSON.stringify({

            name,

            email,

            phone,

            password,

          }),

        }

      );

      const data = await response.json();

      if (!response.ok) {

        setMessage(data.message || "Failed to add customer.");

        setMessageType("error");

        return;

      }

      setMessage(

        `Customer added successfully! Customer ID: ${data.customer.id}`

      );

      setMessageType("success");

      setName("");

      setEmail("");

      setPhone("");

      setPassword("");

    } catch (error) {

      console.error(error);

      setMessage("Unable to connect to the server. Please try again.");

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

          <h1 style={styles.title}>Add Customer</h1>

          <p style={styles.subtitle}>

            Register a new customer at your branch.

          </p>

        </div>

        <button

          type="button"

          onClick={goBack}

          style={styles.backButton}

        >

          ← Staff Dashboard

        </button>

      </header>

      <main style={styles.layout}>

        <section style={styles.infoPanel}>

          <div style={styles.illustration}>👤</div>

          <h2 style={styles.infoTitle}>Customer Registration</h2>

          <p style={styles.infoText}>

            Create a customer account so your branch can register parcels

            and keep delivery information organized.

          </p>

          <div style={styles.infoItem}>

            <span>✓</span>

            <span>Capture accurate contact details</span>

          </div>

          <div style={styles.infoItem}>

            <span>✓</span>

            <span>Use a temporary account password</span>

          </div>

          <div style={styles.infoItem}>

            <span>✓</span>

            <span>Keep customer records organized</span>

          </div>

        </section>

        <section style={styles.formCard}>

          <div style={styles.formHeading}>

            <div>

              <h2 style={styles.formTitle}>Customer Details</h2>

              <p style={styles.formSubtitle}>

                Fill in the information below.

              </p>

            </div>

            <span style={styles.formIcon}>＋</span>

          </div>

          <form onSubmit={handleAddCustomer}>

            <div style={styles.field}>

              <label htmlFor="customer-name" style={styles.label}>

                Customer Name

              </label>

              <input

                id="customer-name"

                type="text"

                placeholder="Enter customer's full name"

                value={name}

                onChange={(e) => setName(e.target.value)}

                style={styles.input}

                autoComplete="name"

                required

              />

            </div>

            <div style={styles.field}>

              <label htmlFor="customer-email" style={styles.label}>

                Email Address

              </label>

              <input

                id="customer-email"

                type="email"

                placeholder="customer@example.com"

                value={email}

                onChange={(e) => setEmail(e.target.value)}

                style={styles.input}

                autoComplete="email"

                required

              />

            </div>

            <div style={styles.field}>

              <label htmlFor="customer-phone" style={styles.label}>

                Phone Number

              </label>

              <input

                id="customer-phone"

                type="tel"

                placeholder="e.g. 0712345678"

                value={phone}

                onChange={(e) => setPhone(e.target.value)}

                style={styles.input}

                autoComplete="tel"

                required

              />

              <small style={styles.hint}>

                Enter a valid contact number for the customer.

              </small>

            </div>

            <div style={styles.field}>

              <label htmlFor="customer-password" style={styles.label}>

                Temporary Password

              </label>

              <input

                id="customer-password"

                type="password"

                placeholder="Create a temporary password"

                value={password}

                onChange={(e) => setPassword(e.target.value)}

                style={styles.input}

                autoComplete="new-password"

                minLength={8}

                required

              />

              <small style={styles.hint}>

                Use at least 8 characters.

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

                    : styles.errorMessage),

                }}

              >

                {message}

              </div>

            )}

            <button

              type="submit"

              disabled={submitting}

              style={{

                ...styles.submitButton,

                opacity: submitting ? 0.7 : 1,

                cursor: submitting ? "wait" : "pointer",

              }}

            >

              {submitting ? "Adding Customer..." : "＋ Add Customer"}

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

  formCard: {

    background: "#ffffff",

    border: "1px solid #e0e5ef",

    borderRadius: "16px",

    padding: "28px",

    boxSizing: "border-box",

    boxShadow: "0 8px 25px rgba(28, 42, 75, 0.04)",

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

  field: {

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

  hint: {

    display: "block",

    color: "#667085",

    fontSize: "12px",

    marginTop: "7px",

  },

  message: {

    padding: "12px 14px",

    borderRadius: "8px",

    marginBottom: "16px",

    fontSize: "14px",

    lineHeight: 1.5,

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

export default AddCustomer;
