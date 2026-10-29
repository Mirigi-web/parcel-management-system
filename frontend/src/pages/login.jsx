
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../api";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin(event) {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Invalid email or password.");
        return;
      }

      if (!data.token || !data.user) {
        setMessage("The server returned an incomplete login response.");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      const role = String(data.user.role || "").toLowerCase();

      if (role === "staff") {
        navigate("/staff-dashboard");
      } else if (role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      setMessage("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <style>{`
        * {
          box-sizing: border-box;
        }

        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: #f3f6fc;
          font-family: Arial, Helvetica, sans-serif;
        }

        .login-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          width: 100%;
          max-width: 1000px;
          overflow: hidden;
          border-radius: 18px;
          background: #ffffff;
          box-shadow: 0 18px 55px rgba(36, 59, 128, 0.12);
        }

        .login-left {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 48px 38px;
          color: #ffffff;
          background: linear-gradient(145deg, #243b80, #3564b8);
        }

        .login-logo {
          display: grid;
          place-items: center;
          width: 60px;
          height: 60px;
          margin-bottom: 28px;
          border: 1px solid rgba(255,255,255,0.25);
          border-radius: 15px;
          background: rgba(255,255,255,0.15);
          font-size: 30px;
        }

        .login-brand {
          margin: 0 0 16px;
          font-size: 27px;
          line-height: 1.4;
        }

        .login-description {
          margin: 0 0 28px;
          color: #e1e9ff;
          font-size: 15px;
          line-height: 1.8;
        }

        .login-feature {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
          font-size: 14px;
        }

        .login-check {
          display: grid;
          place-items: center;
          flex-shrink: 0;
          width: 25px;
          height: 25px;
          border-radius: 50%;
          background: rgba(255,255,255,0.17);
        }

        .login-right {
          min-width: 0;
          padding: 52px 42px;
        }

        .login-eyebrow {
          margin-bottom: 12px;
          color: #3564b8;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1.8px;
          text-transform: uppercase;
        }

        .login-heading {
          margin: 0 0 12px;
          color: #17233f;
          font-size: 31px;
        }

        .login-subtitle {
          margin: 0 0 30px;
          color: #718096;
          font-size: 14px;
          line-height: 1.7;
        }

        .login-field {
          margin-bottom: 21px;
        }

        .login-label {
          display: block;
          margin-bottom: 9px;
          color: #34415b;
          font-size: 13px;
          font-weight: 700;
        }

        .login-input {
          width: 100%;
          padding: 14px 15px;
          border: 1px solid #dce3ef;
          border-radius: 9px;
          background: #ffffff;
          color: #24304a;
          font-size: 14px;
        }

        .login-input:focus {
          border-color: #3564b8;
          outline: 2px solid rgba(53,100,184,0.15);
        }

        .login-password-wrap {
          position: relative;
        }

        .login-password-wrap .login-input {
          padding-right: 75px;
        }

        .login-show-password {
          position: absolute;
          top: 50%;
          right: 12px;
          transform: translateY(-50%);
          border: none;
          background: transparent;
          color: #3564b8;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .login-submit {
          width: 100%;
          margin-top: 4px;
          padding: 15px;
          border: none;
          border-radius: 9px;
          background: #243b80;
          color: #ffffff;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
        }

        .login-submit:hover:not(:disabled) {
          background: #192d67;
        }

        .login-submit:disabled {
          cursor: not-allowed;
          opacity: 0.7;
        }

        .login-error {
          margin-top: 18px;
          padding: 12px 14px;
          border: 1px solid #ffd5d5;
          border-radius: 8px;
          background: #fff0f0;
          color: #b42318;
          font-size: 13px;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        .login-footer {
          margin-top: 28px;
          color: #94a0b5;
          font-size: 12px;
          line-height: 1.8;
          text-align: center;
        }

        @media (max-width: 720px) {
          .login-container {
            grid-template-columns: 1fr;
            max-width: 460px;
          }

          .login-left {
            padding: 30px 26px;
          }

          .login-feature {
            display: none;
          }

          .login-brand {
            font-size: 23px;
          }

          .login-description {
            margin-bottom: 0;
          }

          .login-right {
            padding: 35px 25px;
          }
        }
      `}</style>

      <div className="login-container">
        <section className="login-left">
          <div className="login-logo">📦</div>

          <h1 className="login-brand">
            Parcel Management
            <br />
            &amp; Tracking System
          </h1>

          <p className="login-description">
            A smarter way to manage parcels, follow deliveries, and
            keep customers informed at every stage.
          </p>

          <div className="login-feature">
            <span className="login-check">✓</span>
            <span>Track parcels from registration to delivery</span>
          </div>

          <div className="login-feature">
            <span className="login-check">✓</span>
            <span>Receive automated delivery notifications</span>
          </div>

          <div className="login-feature">
            <span className="login-check">✓</span>
            <span>Manage shipments through one platform</span>
          </div>
        </section>

        <section className="login-right">
          <div className="login-eyebrow">Welcome back</div>

          <h2 className="login-heading">Sign in</h2>

          <p className="login-subtitle">
            Enter your account details to access your dashboard.
          </p>

          <form onSubmit={handleLogin}>
            <div className="login-field">
              <label className="login-label" htmlFor="email">
                Email address
              </label>

              <input
                className="login-input"
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="login-field">
              <label className="login-label" htmlFor="password">
                Password
              </label>

              <div className="login-password-wrap">
                <input
                  className="login-input"
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />

                <button
                  className="login-show-password"
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            <button
              className="login-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in to your account →"}
            </button>

            {message && (
              <div className="login-error" role="alert">
                {message}
              </div>
            )}
          </form>

          <div style={{ marginTop: 20, textAlign: "center" }}>
            <button
              type="button"
              onClick={() => navigate("/track-parcel")}
              style={{
                border: "none",
                background: "transparent",
                color: "#3159a8",
                fontWeight: 700,
                textDecoration: "underline",
                cursor: "pointer",
                fontSize: 15,
                padding: 8,
              }}
            >
              Track a parcel without signing in
            </button>
          </div>

          <div className="login-footer">
            Parcel Management &amp; Tracking System
            <br />
            Secure access for customers, staff and administrators
          </div>
        </section>
      </div>
    </main>
  );
}
