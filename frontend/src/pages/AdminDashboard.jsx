

import { useState } from "react";

import { useNavigate } from "react-router-dom";



const initialStats = [

  { label: "Total Parcels", value: "—", icon: "📦", color: "#e9efff" },

  { label: "In Transit", value: "—", icon: "🚚", color: "#fff2d9" },

  { label: "Delivered", value: "—", icon: "✅", color: "#e1f8ec" },

  { label: "Pending", value: "—", icon: "⏳", color: "#f2e9ff" },

];



const statuses = [

  "Received",

  "Dispatched",

  "In Transit",

  "Arrived",

  "Out for Delivery",

  "Delivered",

];



const navigation = [

  { label: "Overview", icon: "▦", action: "overview" },

  { label: "Manage Parcels", icon: "📦", action: "parcels" },

  { label: "Staff Management", icon: "👥", action: "staff" },

  { label: "Branches", icon: "📍", action: "branches" },

  { label: "Customers", icon: "♙", action: "customers" },

  { label: "Reports & Analytics", icon: "▥", action: "reports" },

  { label: "Notifications", icon: "🔔", action: "notifications" },

  { label: "System Logs", icon: "☷", action: "logs" },
  { label: "Fleet Management", icon: "🚚", action: "fleet" },
  { label: "Bulk Messages", icon: "✉️", action: "bulk" },
  { label: "Financial Management", icon: "💰", action: "finance" },

];



function AdminDashboard() {

  const navigate = useNavigate();

  const [activePage, setActivePage] = useState("overview");

  const [sidebarOpen, setSidebarOpen] = useState(false);



  const user = (() => {

    try {

      return JSON.parse(localStorage.getItem("user") || "null");

    } catch {

      return null;

    }

  })();



  function handleNavigation(action) {

    if (action === "overview") {

      setActivePage("overview");

    } else if (action === "parcels") {

      navigate("/admin-parcels");

    } else {

      setActivePage(action);

    }



    setSidebarOpen(false);

  }



  function logout() {

    localStorage.removeItem("token");

    localStorage.removeItem("user");

    navigate("/");

  }



  const styles = {

    page: {

      minHeight: "100vh",

      display: "flex",

      background: "#f4f7fc",

      color: "#1d2939",

      fontFamily: "Inter, Arial, sans-serif",

    },

    sidebar: {

      width: 250,

      minWidth: 250,

      background: "#182b5b",

      color: "#fff",

      padding: "26px 16px",

      display: "flex",

      flexDirection: "column",

      boxSizing: "border-box",

    },

    brand: {

      display: "flex",

      alignItems: "center",

      gap: 12,

      padding: "0 10px 28px",

      borderBottom: "1px solid #344675",

      marginBottom: 24,

    },

    logo: {

      width: 43,

      height: 43,

      borderRadius: 12,

      background: "#fff",

      color: "#243b80",

      display: "grid",

      placeItems: "center",

      fontSize: 23,

      fontWeight: 800,

    },

    navLabel: {

      color: "#aebcdd",

      fontSize: 11,

      fontWeight: 700,

      letterSpacing: 1.2,

      padding: "0 12px",

      marginBottom: 12,

    },

    navItem: (active) => ({

      width: "100%",

      display: "flex",

      alignItems: "center",

      gap: 12,

      padding: "12px",

      marginBottom: 5,

      border: "none",

      borderRadius: 9,

      background: active ? "#30477d" : "transparent",

      color: active ? "#fff" : "#d5def2",

      textAlign: "left",

      fontSize: 13,

      fontWeight: active ? 700 : 500,

      cursor: "pointer",

    }),

    main: {

      flex: 1,

      minWidth: 0,

      padding: "26px 30px",

      boxSizing: "border-box",

    },

    topbar: {

      display: "flex",

      justifyContent: "space-between",

      alignItems: "center",

      gap: 16,

      flexWrap: "wrap",

      marginBottom: 28,

    },

    card: {

      background: "#fff",

      border: "1px solid #e7ebf2",

      borderRadius: 14,

      padding: 20,

      boxShadow: "0 3px 12px rgba(26, 44, 82, 0.035)",

    },

    muted: { color: "#758198", fontSize: 13 },

    primaryButton: {

      background: "#243b80",

      color: "#fff",

      border: "none",

      borderRadius: 9,

      padding: "11px 16px",

      fontWeight: 700,

      cursor: "pointer",

    },

  };



  return (

    <div style={styles.page}>

      {sidebarOpen && (

        <button

          onClick={() => setSidebarOpen(false)}

          aria-label="Close navigation"

          style={{

            position: "fixed",

            inset: 0,

            background: "#10182880",

            border: "none",

            zIndex: 5,

          }}

        />

      )}



      <aside

        style={{

          ...styles.sidebar,

          position: "fixed",

          inset: "0 auto 0 0",

          height: "100vh",

          overflowY: "auto",

          zIndex: 6,

          transform:

            typeof window !== "undefined" && window.innerWidth <= 800

              ? sidebarOpen

                ? "translateX(0)"

                : "translateX(-100%)"

              : "translateX(0)",

          transition: "transform 0.2s ease",

        }}

      >

        <div style={styles.brand}>

          <div style={styles.logo}>P</div>

          <div>

            <div style={{ fontSize: 14, fontWeight: 800 }}>

              PARCEL TRACK

            </div>

            <div style={{ fontSize: 11, color: "#bdc9e5", marginTop: 4 }}>

              Administration

            </div>

          </div>

        </div>



        <div style={styles.navLabel}>MAIN MENU</div>



        {navigation.map((item) => (

          <button

            key={item.action}

            onClick={() => handleNavigation(item.action)}

            style={styles.navItem(activePage === item.action)}

          >

            <span style={{ width: 22, fontSize: 17 }}>{item.icon}</span>

            <span>{item.label}</span>

          </button>

        ))}



        <div style={{ flex: 1, minHeight: 30 }} />



        <div

          style={{

            background: "#263a6b",

            borderRadius: 12,

            padding: 14,

            marginBottom: 16,

          }}

        >

          <div style={{ fontSize: 12, fontWeight: 700 }}>

            System Administrator

          </div>

          <div

            style={{

              fontSize: 11,

              color: "#bdc9e5",

              marginTop: 5,

              overflowWrap: "anywhere",

            }}

          >

            {user?.email || "Admin account"}

          </div>

        </div>



        <button

          onClick={logout}

          style={{

            ...styles.navItem(false),

            color: "#ffd1d1",

            marginBottom: 0,

          }}

        >

          <span>↪</span> Log out

        </button>

      </aside>



      <main

        style={{

          ...styles.main,

          marginLeft:

            typeof window !== "undefined" && window.innerWidth > 800

              ? 250

              : 0,

          width:

            typeof window !== "undefined" && window.innerWidth > 800

              ? "calc(100% - 250px)"

              : "100%",

        }}

      >

        <header style={styles.topbar}>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>

            <button

              onClick={() => setSidebarOpen(true)}

              aria-label="Open navigation"

              style={{

                display: "none",

                border: "1px solid #dfe5ef",

                borderRadius: 8,

                padding: 9,

                background: "#fff",

                cursor: "pointer",

              }}

            >

              ☰

            </button>

            <div>

              <div style={{ fontSize: 25, fontWeight: 800 }}>

                Admin Dashboard

              </div>

              <div style={{ ...styles.muted, marginTop: 7 }}>

                Home / Administration / Overview

              </div>

            </div>

          </div>



          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>

            <span style={{ fontSize: 13, color: "#64748b" }}>

              Welcome, {user?.name || "Administrator"}

            </span>

            <button

              onClick={() => navigate("/admin-parcels")}

              style={styles.primaryButton}

            >

              + Manage Parcels

            </button>

          </div>

        </header>



        {activePage === "overview" ? (

          <>

            <section

              style={{

                ...styles.card,

                background: "linear-gradient(115deg, #243b80, #3e5db0)",

                color: "#fff",

                marginBottom: 22,

                padding: "25px 27px",

              }}

            >

              <div style={{ fontSize: 22, fontWeight: 800 }}>

                Operations Overview

              </div>

              <p

                style={{

                  color: "#e0e8ff",

                  fontSize: 13,

                  lineHeight: 1.7,

                  maxWidth: 650,

                  marginBottom: 0,

                }}

              >

                Monitor parcel movement across all branches, review business

                performance and manage your delivery operations from one place.

              </p>

            </section>



            <section

              style={{

                display: "grid",

                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",

                gap: 16,

                marginBottom: 22,

              }}

            >

              {initialStats.map((stat) => (

                <div key={stat.label} style={styles.card}>

                  <div

                    style={{

                      display: "flex",

                      justifyContent: "space-between",

                      alignItems: "center",

                    }}

                  >

                    <span style={styles.muted}>{stat.label}</span>

                    <span

                      style={{

                        background: stat.color,

                        width: 42,

                        height: 42,

                        borderRadius: 12,

                        display: "grid",

                        placeItems: "center",

                        fontSize: 20,

                      }}

                    >

                      {stat.icon}

                    </span>

                  </div>

                  <div

                    style={{

                      fontSize: 29,

                      fontWeight: 800,

                      marginTop: 18,

                    }}

                  >

                    {stat.value}

                  </div>

                  <div style={{ ...styles.muted, marginTop: 7 }}>

                    Awaiting live database connection

                  </div>

                </div>

              ))}

            </section>



            <section

              style={{

                display: "grid",

                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",

                gap: 18,

                marginBottom: 22,

              }}

            >

              <div style={styles.card}>

                <h3 style={{ fontSize: 16, marginTop: 0 }}>

                  Parcel Status Distribution

                </h3>

                <p style={styles.muted}>

                  Track parcels through each stage of the delivery process.

                </p>

                {statuses.map((status, index) => (

                  <div key={status} style={{ marginTop: 19 }}>

                    <div

                      style={{

                        display: "flex",

                        justifyContent: "space-between",

                        fontSize: 12,

                        marginBottom: 8,

                      }}

                    >

                      <span>{status}</span>

                      <span style={{ color: "#758198" }}>—</span>

                    </div>

                    <div

                      style={{

                        height: 8,

                        background: "#edf0f6",

                        borderRadius: 20,

                        overflow: "hidden",

                      }}

                    >

                      <div

                        style={{

                          height: "100%",

                          width: "0%",

                          background: [

                            "#647fca",

                            "#e4a54e",

                            "#8b73d6",

                            "#4d9dc5",

                            "#df8a70",

                            "#36a879",

                          ][index],

                          borderRadius: 20,

                        }}

                      />

                    </div>

                  </div>

                ))}

              </div>



              <div style={styles.card}>

                <h3 style={{ fontSize: 16, marginTop: 0 }}>

                  Administration Shortcuts

                </h3>

                <p style={styles.muted}>

                  Access the main tools for managing your delivery network.

                </p>

                {[

                  ["📦", "Manage all parcels", "parcels"],

                  ["👥", "Staff management", "staff"],

                  ["📍", "Branches", "branches"],

                  ["📊", "Reports & analytics", "reports"],

                  ["🔔", "Notifications", "notifications"],

                ].map(([icon, label, action]) => (

                  <button

                    key={action}

                    onClick={() => handleNavigation(action)}

                    style={{

                      display: "flex",

                      alignItems: "center",

                      gap: 12,

                      width: "100%",

                      padding: "14px 5px",

                      background: "transparent",

                      border: "none",

                      borderBottom: "1px solid #edf0f5",

                      cursor: "pointer",

                      textAlign: "left",

                      color: "#263754",

                      fontSize: 13,

                    }}

                  >

                    <span style={{ fontSize: 19 }}>{icon}</span>

                    <span style={{ flex: 1 }}>{label}</span>

                    <span style={{ color: "#758198" }}>→</span>

                  </button>

                ))}

              </div>

            </section>



            <section style={styles.card}>

              <h3 style={{ fontSize: 16, marginTop: 0 }}>Branch Overview</h3>

              <p style={styles.muted}>

                Parcel volumes and delivery performance by branch will appear

                here when we connect the dashboard to PostgreSQL.

              </p>

              <div

                style={{

                  padding: 24,

                  borderRadius: 10,

                  background: "#f7f9fd",

                  color: "#758198",

                  textAlign: "center",

                  fontSize: 13,

                }}

              >

                Branch analytics will load in the next step.

              </div>

            </section>

          </>

        ) : (

          <section style={styles.card}>

            <h2 style={{ marginTop: 0, fontSize: 20 }}>

              {navigation.find((item) => item.action === activePage)?.label}

            </h2>

            <p style={styles.muted}>

              This section is planned. We'll connect it to the relevant

              backend functionality in the next stages.

            </p>

            <button

              onClick={() => setActivePage("overview")}

              style={styles.primaryButton}

            >

              ← Back to Overview

            </button>

          </section>

        )}



        <footer

          style={{

            textAlign: "center",

            color: "#8a94a6",

            fontSize: 11,

            padding: "25px 0 5px",

          }}

        >

          Parcel Management & Tracking System · Administration

        </footer>

      </main>



      <style>{`

        @media (max-width: 800px) {

          main > header > div:first-child > button {

            display: inline-block !important;

          }

        }

        @media (min-width: 801px) {

          aside {

            transform: translateX(0) !important;

          }

        }

      `}</style>

    </div>

  );

}



export default AdminDashboard;