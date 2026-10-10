import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Invalid email or password.");
        return;
      }

      if (!data.token || !data.user) {
        setMessage("The server returned an incomplete login response.");
        return;
      }

      // Save the JWT token and logged-in user.
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect according to the user's role.
      if (data.user.role === "staff") {
        navigate("/staff-dashboard");
      } else if (data.user.role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("LOGIN ERROR:", error);
      setMessage("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    page: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "30px 18px",
      boxSizing: "border-box",
      background: "#f3f6fc",
      fontFamily: "Arial, Helvetica, sans-serif",
    },
    container: {
      width: "100%",
      maxWidth: "1000px",
      minHeight: "570px",
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      background: "#ffffff",
      borderRadius: "20px",
      overflow: "hidden",
      boxShadow: "0 18px 55px rgba(36, 59, 128, 0.12)",
    },
    left: {
      background: "linear-gradient(145deg, #243b80, #3564b8)",
      color: "#ffffff",
      padding: "52px 38px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
    },
    logo: {
      width: "58px",
      height: "58px",
      borderRadius: "16px",
      background: "rgba(255,255,255,0.15)",
      border: "1px solid rgba(255,255,255,0.25)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "29px",
      marginBottom: "28px",
    },
    brand: {
      fontSize: "27px",
      lineHeight: 1.35,
      fontWeight: 800,
      margin: "0 0 16px",
    },
    description: {
      fontSize: "15px",
      lineHeight: 1.8,
      color: "#e1e9ff",
      margin: "0 0 30px",
    },
    feature: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginBottom: "18px",
      fontSize: "14px",
      color: "#f2f5ff",
    },
    check: {
      width: "25px",
      height: "25px",
      borderRadius: "50%",
      background: "rgba(255,255,255,0.17)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    right: {
      padding: "55px 42px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      minWidth: 0,
    },
    eyebrow: {
      color: "#3564b8",
      fontSize: "12px",
      fontWeight: 800,
      letterSpacing: "1.8px",
      textTransform: "uppercase",
      marginBottom: "12px",
    },
    heading: {
      color: "#17233f",
      fontSize: "31px",
      fontWeight: 800,
      margin: "0 0 12px",
    },
    subtitle: {
      color: "#718096",
      fontSize: "14px",
      lineHeight: 1.7,
      margin: "0 0 30px",
    },
    label: {
      display: "block",
      fontSize: "13px",
      fontWeight: 700,
      color: "#34415b",
      marginBottom: "9px",
    },
    input: {
      width: "100%",
      boxSizing: "border-box",
      padding: "14px 15px",
      border: "1px solid #dce3ef",
      borderRadius: "9px",
      fontSize: "14px",
      outline: "none",
      color: "#24304a",
      background: "#ffffff",
    },
    field: {
      marginBottom: "21px",
    },
    passwordWrap: {
      position: "relative",
    },
    passwordInput: {
      paddingRight: "70px",
    },
    showButton: {
      position: "absolute",
      right: "12px",
      top: "50%",
      transform: "translateY(-50%)",
      border: "none",
      background: "transparent",
      color: "#3564b8",
      cursor: "pointer",
      fontSize: "12px",
      fontWeight: 700,
    },
    submit: {
      width: "100%",
      padding: "15px",
      border: "none",
      borderRadius: "9px",
      background: loading ? "#7e91c3" : "#243b80",
      color: "#ffffff",
      fontSize: "15px",
      fontWeight: 700,
      cursor: loading ? "not-allowed" : "pointer",
      boxShadow: "0 7px 16px rgba(36, 59, 128, 0.18)",
      marginTop: "4px",
    },
    message: {
      padding: "12px 14px",
      marginTop: "18px",
      borderRadius: "8px",
      fontSize: "13px",
      lineHeight: 1.5,
      background: "#fff0f0",
      color: "#b42318",
      border: "1px solid #ffd5d5",
    },
    footer: {
      color: "#94a0b5",
      fontSize: "12px",
      textAlign: "center",
      marginTop: "28px",
    },
  };

  return (
    <div style={styles.page}>
      <style>{`
        * {
          box-sizing: border-box;
        }

        .login-input:focus {
          border-color: #3564b8 !important;
          box-shadow: 0 0 0 3px rgba(53, 100, 184, 0.12);
        }

        .login-submit:hover:not(:disabled) {
          background: #192d67 !important;
        }

        @media (max-width: 720px) {
          .login-container {
            grid-template-columns: 1fr !important;
            max-width: 460px !important;
          }

          .login-left {
            padding: 30px 26px !important;
          }

          .login-left .login-feature {
            display: none !important;
          }

          .login-left .login-brand {
            font-size: 23px !important;
          }

          .login-left .login-description {
            margin-bottom: 0 !important;
          }

          .login-right {
            padding: 35px 25px !important;
          }
        }
      `}</style>

      <div className="login-container" style={styles.container}>
        {/* Left panel */}
        <div className="login-left" style={styles.left}>
          <div style={styles.logo}>📦</div>

          <h1 className="login-brand" style={styles.brand}>
            Parcel Management
            <br />
            & Tracking System
          </h1>

          <p className="login-description" style={styles.description}>
            A smarter way to manage parcels, follow deliveries, and keep
            customers informed at every stage.
          </p>

          <div className="login-feature" style={styles.feature}>
            <span style={styles.check}>✓</span>
            <span>Track parcels from registration to delivery</span>
          </div>

          <div className="login-feature" style={styles.feature}>
            <span style={styles.check}>✓</span>
            <span>Receive automated delivery notifications</span>
          </div>

          <div className="login-feature" style={styles.feature}>
            <span style={styles.check}>✓</span>
            <span>Manage shipments through one platform</span>
          </div>
        </div>

        {/* Right panel */}
        <div className="login-right" style={styles.right}>
          <div style={styles.eyebrow}>Welcome back</div>

          <h2 style={styles.heading}>Sign in</h2>

          <p style={styles.subtitle}>
            Enter your account details to access your dashboard.
          </p>

          <form onSubmit={handleLogin}>
            <div style={styles.field}>
              <label htmlFor="email" style={styles.label}>
                Email address
              </label>

              <input
                id="email"
                className="login-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label htmlFor="password" style={styles.label}>
                Password
              </label>

              <div style={styles.passwordWrap}>
                <input
                  id="password"
                  className="login-input"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  style={{
                    ...styles.input,
                    ...styles.passwordInput,
                  }}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.showButton}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
              style={styles.submit}
            >
              {loading ? "Signing in..." : "Sign in to your account →"}
            </button>

            {message && (
              <div role="alert" style={styles.message}>
                {message}
              </div>
            )}
          </form>

          <div style={styles.footer}>
            Parcel Management & Tracking System
            <br />
            Secure access for customers, staff and administrators
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;