

import { useCallback, useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../api";



function Dashboard() {

  const navigate = useNavigate();



  const [user] = useState(() => {

    try {

      return JSON.parse(localStorage.getItem("user")) || {};

    } catch {

      return {};

    }

  });



  const [summary, setSummary] = useState({

    total: 0,

    inTransit: 0,

    delivered: 0,

    pending: 0,

  });



  const [loadingSummary, setLoadingSummary] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [summaryError, setSummaryError] = useState("");



  const fetchCustomerSummary = useCallback(async (isRefresh = false) => {

    const token = localStorage.getItem("token");



    if (!token) {

      setSummaryError("Your session has expired. Please log in again.");

      setLoadingSummary(false);

      setRefreshing(false);

      return;

    }



    if (isRefresh) {

      setRefreshing(true);

    } else {

      setLoadingSummary(true);

    }



    setSummaryError("");



    try {

      const response = await fetch(

        `${API_BASE_URL}/api/customer/parcel-summary`,

        {

          headers: {

            Authorization: `Bearer ${token}`,

          },

        }

      );



      const data = await response.json();



      if (!response.ok) {

        throw new Error(

          data.message || "Unable to load your parcel summary."

        );

      }



      setSummary({

        total: Number(data.summary?.total ?? 0),

        inTransit: Number(data.summary?.inTransit ?? 0),

        delivered: Number(data.summary?.delivered ?? 0),

        pending: Number(data.summary?.pending ?? 0),

      });

    } catch (error) {

      console.error("Customer summary error:", error);

      setSummaryError(

        error.message || "Unable to load your parcel summary."

      );

    } finally {

      setLoadingSummary(false);

      setRefreshing(false);

    }

  }, []);



  useEffect(() => {

    fetchCustomerSummary();

  }, [fetchCustomerSummary]);



  const logout = () => {

    localStorage.removeItem("token");

    localStorage.removeItem("user");

    navigate("/");

  };



  const styles = {

    page: {

      minHeight: "100vh",

      background: "#f4f7fb",

      fontFamily: "Arial, Helvetica, sans-serif",

      color: "#24304a",

    },

    sidebar: {

      width: "245px",

      background: "#243b80",

      color: "#fff",

      padding: "28px 18px",

      display: "flex",

      flexDirection: "column",

      flexShrink: 0,

    },

    logo: {

      display: "flex",

      alignItems: "center",

      gap: "12px",

      padding: "0 8px 30px",

      borderBottom: "1px solid rgba(255,255,255,0.15)",

    },

    logoIcon: {

      fontSize: "27px",

      background: "rgba(255,255,255,0.13)",

      borderRadius: "10px",

      padding: "9px",

    },

    navButton: {

      width: "100%",

      textAlign: "left",

      padding: "13px 14px",

      marginTop: "8px",

      border: "none",

      borderRadius: "9px",

      color: "#e8edff",

      background: "transparent",

      cursor: "pointer",

      fontSize: "14px",

    },

    main: {

      flex: 1,

      minWidth: 0,

      padding: "32px",

    },

    header: {

      display: "flex",

      justifyContent: "space-between",

      alignItems: "center",

      gap: "16px",

      flexWrap: "wrap",

      marginBottom: "30px",

    },

    title: {

      fontSize: "27px",

      margin: "0 0 9px",

      color: "#1c2c50",

    },

    muted: {

      color: "#7b879b",

      fontSize: "14px",

      lineHeight: 1.6,

    },

    profile: {

      display: "flex",

      alignItems: "center",

      gap: "12px",

      background: "#fff",

      padding: "10px 16px",

      borderRadius: "12px",

      border: "1px solid #e8edf5",

    },

    avatar: {

      width: "42px",

      height: "42px",

      borderRadius: "50%",

      display: "flex",

      alignItems: "center",

      justifyContent: "center",

      background: "#e6edff",

      color: "#243b80",

      fontWeight: 800,

      fontSize: "17px",

    },

    grid: {

      display: "grid",

      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",

      gap: "18px",

      marginBottom: "32px",

    },

    stat: {

      background: "#fff",

      padding: "22px",

      borderRadius: "14px",

      border: "1px solid #e7edf6",

      boxShadow: "0 4px 15px rgba(32,55,100,0.035)",

    },

    statTop: {

      display: "flex",

      alignItems: "center",

      justifyContent: "space-between",

      marginBottom: "18px",

    },

    statIcon: {

      fontSize: "23px",

      background: "#edf2ff",

      borderRadius: "10px",

      padding: "10px",

    },

    statNumber: {

      fontSize: "30px",

      fontWeight: 800,

      margin: "0 0 8px",

      color: "#1c2c50",

    },

    section: {

      background: "#fff",

      border: "1px solid #e7edf6",

      borderRadius: "15px",

      padding: "24px",

      marginBottom: "24px",

    },

    sectionTitle: {

      fontSize: "19px",

      color: "#1c2c50",

      margin: "0 0 7px",

    },

    actionGrid: {

      display: "grid",

      gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",

      gap: "16px",

      marginTop: "22px",

    },

    action: {

      background: "#fff",

      border: "1px solid #e1e8f3",

      borderRadius: "12px",

      padding: "20px",

      textAlign: "left",

      cursor: "pointer",

      color: "#24304a",

    },

    actionIcon: {

      fontSize: "25px",

      display: "block",

      marginBottom: "14px",

    },

    primaryButton: {

      background: "#243b80",

      color: "#fff",

      border: "none",

      borderRadius: "9px",

      padding: "12px 17px",

      fontWeight: 700,

      cursor: "pointer",

    },

    secondaryButton: {

      background: "#fff",

      color: "#243b80",

      border: "1px solid #dce4f2",

      borderRadius: "9px",

      padding: "10px 14px",

      fontWeight: 700,

      cursor: "pointer",

      fontSize: "13px",

    },

    footer: {

      textAlign: "center",

      color: "#8b96a8",

      fontSize: "12px",

      padding: "20px 0",

    },

  };



  const displayName = user.name || user.full_name || "Customer";



  const stats = [

    {

      title: "Total Parcels",

      value: summary.total,

      icon: "📦",

      note: "All your parcels",

    },

    {

      title: "In Transit",

      value: summary.inTransit,

      icon: "🚚",

      note: "On their way",

    },

    {

      title: "Delivered",

      value: summary.delivered,

      icon: "✅",

      note: "Successfully delivered",

    },

    {

      title: "Pending",

      value: summary.pending,

      icon: "⏳",

      note: "Awaiting progress",

    },

  ];



  const actions = [

    {

      icon: "📦",

      title: "My Parcels",

      description: "View your parcels and their delivery statuses.",

      onClick: () => navigate("/my-parcels"),

      available: true,

    },

    {

      icon: "🔎",

      title: "Track a Parcel",

      description: "Check a parcel's latest delivery status.",

      onClick: () => navigate("/track-parcel"),

      available: true,

    },

    {

      icon: "💳",

      title: "Payment History",

      description: "Payment history will be available in a future update.",

      available: false,

    },

    {

      icon: "🔔",

      title: "Notifications",

      description: "A dedicated notification centre is coming soon.",

      available: false,

    },

    {

      icon: "👤",

      title: "My Profile",

      description: "Profile management is coming soon.",

      available: false,

    },

  ];



  return (

    <div className="customer-layout" style={{ ...styles.page, display: "flex" }}>

      <style>{`

        * { box-sizing: border-box; }



        .customer-nav:hover {

          background: rgba(255,255,255,0.12) !important;

        }



        .customer-action:hover:not(:disabled) {

          border-color: #9aaddb !important;

          transform: translateY(-2px);

        }



        .customer-action {

          transition: transform 0.15s, border-color 0.15s;

        }



        .customer-button:hover:not(:disabled) {

          opacity: 0.9;

        }



        @media (max-width: 760px) {

          .customer-layout {

            flex-direction: column !important;

          }



          .customer-sidebar {

            width: 100% !important;

            padding: 18px !important;

          }



          .customer-logo {

            padding-bottom: 16px !important;

          }



          .customer-nav-list {

            display: flex;

            flex-wrap: wrap;

            gap: 6px;

          }



          .customer-nav {

            width: auto !important;

            margin-top: 8px !important;

          }



          .customer-main {

            padding: 20px 15px !important;

          }

        }

      `}</style>



      <aside className="customer-sidebar" style={styles.sidebar}>

        <div className="customer-logo" style={styles.logo}>

          <span style={styles.logoIcon}>📦</span>

          <div>

            <div style={{ fontWeight: 800, fontSize: "15px" }}>ParcelTrack</div>

            <div style={{ fontSize: "11px", color: "#cbd7ff", marginTop: "4px" }}>

              Customer Portal

            </div>

          </div>

        </div>



        <div className="customer-nav-list" style={{ marginTop: "25px" }}>

          <button

            className="customer-nav"

            style={{

              ...styles.navButton,

              background: "rgba(255,255,255,0.13)",

            }}

            onClick={() => navigate("/dashboard")}

          >

            🏠 &nbsp; Dashboard

          </button>



          <button

            className="customer-nav"

            style={styles.navButton}

            onClick={() => navigate("/my-parcels")}

          >

            📦 &nbsp; My Parcels

          </button>



          <button

            className="customer-nav"

            style={styles.navButton}

            onClick={() => navigate("/track-parcel")}

          >

            🔎 &nbsp; Track Parcel

          </button>

        </div>



        <div style={{ marginTop: "auto", paddingTop: "30px" }}>

          <button

            className="customer-nav"

            style={styles.navButton}

            onClick={logout}

          >

            ↪ &nbsp; Logout

          </button>

        </div>

      </aside>



      <main className="customer-main" style={styles.main}>

        <header style={styles.header}>

          <div>

            <h1 style={styles.title}>Customer Dashboard</h1>

            <p style={{ ...styles.muted, margin: 0 }}>

              Welcome back, {displayName}. Here’s an overview of your parcels.

            </p>

          </div>



          <div style={styles.profile}>

            <div style={styles.avatar}>

              {displayName.charAt(0).toUpperCase()}

            </div>

            <div>

              <div style={{ fontSize: "14px", fontWeight: 700 }}>

                {displayName}

              </div>

              <div style={{ ...styles.muted, fontSize: "12px" }}>

                Customer account

              </div>

            </div>

          </div>

        </header>



        <section

          style={{

            display: "flex",

            justifyContent: "space-between",

            alignItems: "center",

            gap: "12px",

            flexWrap: "wrap",

            marginBottom: "18px",

          }}

        >

          <p style={{ ...styles.muted, margin: 0 }}>

            {loadingSummary

              ? "Loading parcel information..."

              : "Your parcel summary"}

          </p>



          <button

            className="customer-button"

            style={styles.secondaryButton}

            onClick={() => fetchCustomerSummary(true)}

            disabled={loadingSummary || refreshing}

          >

            {refreshing ? "Refreshing..." : "↻ Refresh Summary"}

          </button>

        </section>



        {summaryError && (

          <div

            role="alert"

            style={{

              background: "#fff0f0",

              color: "#b42318",

              padding: "14px",

              borderRadius: "9px",

              marginBottom: "20px",

              lineHeight: 1.5,

            }}

          >

            {summaryError}

            <button

              className="customer-button"

              style={{ ...styles.secondaryButton, marginLeft: "12px" }}

              onClick={() => fetchCustomerSummary(true)}

            >

              Try again

            </button>

          </div>

        )}



        <section style={styles.grid}>

          {stats.map((stat) => (

            <div key={stat.title} style={styles.stat}>

              <div style={styles.statTop}>

                <span style={{ ...styles.muted, fontWeight: 700 }}>

                  {stat.title}

                </span>

                <span style={styles.statIcon}>{stat.icon}</span>

              </div>



              <p style={styles.statNumber}>

                {loadingSummary ? "—" : stat.value}

              </p>



              <span style={{ ...styles.muted, fontSize: "12px" }}>

                {stat.note}

              </span>

            </div>

          ))}

        </section>



        <section style={styles.section}>

          <h2 style={styles.sectionTitle}>Quick Actions</h2>

          <p style={{ ...styles.muted, margin: 0 }}>

            Manage and follow your parcels from here.

          </p>



          <div style={styles.actionGrid}>

            {actions.map((action) => (

              <button

                key={action.title}

                type="button"

                className="customer-action"

                onClick={action.onClick}

                disabled={!action.available}

                title={!action.available ? "Coming soon" : action.title}

                style={{

                  ...styles.action,

                  opacity: action.available ? 1 : 0.65,

                  cursor: action.available ? "pointer" : "not-allowed",

                }}

              >

                <span style={styles.actionIcon}>{action.icon}</span>



                <strong style={{ display: "block", marginBottom: "9px" }}>

                  {action.title}

                </strong>



                <span style={{ ...styles.muted, fontSize: "13px" }}>

                  {action.description}

                </span>



                <div

                  style={{

                    color: action.available ? "#3564b8" : "#8b96a8",

                    fontSize: "12px",

                    fontWeight: 700,

                    marginTop: "17px",

                  }}

                >

                  {action.available ? "Open →" : "Coming soon"}

                </div>

              </button>

            ))}

          </div>

        </section>



        <section

          style={{

            ...styles.section,

            display: "flex",

            alignItems: "center",

            justifyContent: "space-between",

            flexWrap: "wrap",

            gap: "18px",

          }}

        >

          <div>

            <h2 style={styles.sectionTitle}>Need to track a parcel?</h2>

            <p style={{ ...styles.muted, marginBottom: 0 }}>

              Enter your tracking number to check its latest delivery status.

            </p>

          </div>



          <button

            className="customer-button"

            style={styles.primaryButton}

            onClick={() => navigate("/track-parcel")}

          >

            Track Parcel →

          </button>

        </section>



        <footer style={styles.footer}>

          Parcel Management & Tracking System

        </footer>

      </main>

    </div>

  );

}



export default Dashboard;
