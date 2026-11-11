import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../api";

function Dashboard() {
  const navigate = useNavigate();
  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")) || {}; } catch { return {}; }
  });

  const [summary, setSummary] = useState({ total: 0, inTransit: 0, delivered: 0, pending: 0 });
  const [parcels, setParcels] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  // Payment Modal State
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState("");

  const fetchCustomerData = useCallback(async (isRefresh = false) => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/"); return; }
    if (isRefresh) setRefreshing(true); else setLoadingSummary(true);
    setSummaryError("");

    try {
      const [summaryRes, parcelsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/customer/parcel-summary`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/api/my-parcels`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const summaryData = await summaryRes.json();
      const parcelsData = await parcelsRes.json();

      if (!summaryRes.ok || !parcelsRes.ok) throw new Error("Unable to load data.");

      setSummary({
        total: Number(summaryData.summary?.total ?? 0),
        inTransit: Number(summaryData.summary?.inTransit ?? 0),
        delivered: Number(summaryData.summary?.delivered ?? 0),
        pending: Number(summaryData.summary?.pending ?? 0),
      });
      setParcels(parcelsData.parcels || []);
    } catch (error) {
      setSummaryError(error.message);
    } finally {
      setLoadingSummary(false);
      setRefreshing(false);
    }
  }, [navigate]);

  useEffect(() => { fetchCustomerData(); }, [fetchCustomerData]);

  async function handleMpesaPush(e) {
    e.preventDefault();
    setIsProcessing(true);
    setPaymentNotice("");
    setSummaryError("");
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/payments/stk-push`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          trackingNumber: selectedParcel.tracking_number, 
          phoneNumber,
          amount: Number(payAmount)
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Payment failed");
      
      setPaymentNotice(`STK Push sent to ${phoneNumber} for KES ${payAmount}. Please enter your PIN.`);
      setTimeout(() => fetchCustomerData(true), 5000);
    } catch (err) {
      setSummaryError(err.message);
    } finally {
      setIsProcessing(false);
    }
  }

  // MATH HELPERS
  const getPaidAmount = (parcel) => Number(parcel.total_paid || 0);
  const getBalance = (parcel) => Number(parcel.delivery_fee) - getPaidAmount(parcel);
  const getPaymentStatus = (parcel) => {
    const paid = getPaidAmount(parcel);
    const fee = Number(parcel.delivery_fee);
    if (paid <= 0) return "Unpaid";
    if (paid >= fee) return "Fully Paid";
    return "Partially Paid";
  };

  function printReceipt(parcel) {
    const paid = getPaidAmount(parcel);
    const balance = getBalance(parcel);
    const status = getPaymentStatus(parcel);
    
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html><head><title>Receipt - ${parcel.tracking_number}</title>
      <style>
        body{font-family:monospace;width:300px;padding:10px;text-align:center;color:#000}
        .header{font-size:18px;font-weight:bold;margin-bottom:5px}
        .divider{border-bottom:1px dashed #000;margin:10px 0}
        .row{display:flex;justify-content:space-between;font-size:12px;margin:4px 0}
        .footer{font-size:10px;margin-top:20px}
        .bold{font-weight:bold}
      </style>
      </head><body>
        <div class="header">PARCEL TRACK</div>
        <div>Official Payment Receipt</div>
        <div class="divider"></div>
        
        <div class="row"><span>Tracking:</span> <span class="bold">${parcel.tracking_number}</span></div>
        <div class="row"><span>Date:</span> <span>${new Date().toLocaleString()}</span></div>
        <div class="row"><span>Recipient:</span> <span>${parcel.recipient_name}</span></div>
        <div class="divider"></div>
        
        <div style="text-align:left; font-size:12px; margin-bottom:10px">
          <span class="bold">Contents:</span><br/>
          ${parcel.parcel_description || "No description provided"}
        </div>
        <div class="divider"></div>
        
        <div class="row"><span>Total Fee:</span> <span>KES ${Number(parcel.delivery_fee).toLocaleString()}</span></div>
        <div class="row"><span>Total Paid:</span> <span>KES ${paid.toLocaleString()}</span></div>
        <div class="row bold"><span>Balance Due:</span> <span>KES ${balance.toLocaleString()}</span></div>
        <div class="divider"></div>
        
        <div class="bold" style="font-size:14px; margin-top:10px">STATUS: ${status.toUpperCase()}</div>
        
        <div class="footer">Thank you for choosing ParcelTrack!</div>
        <script>window.onload=function(){window.print();window.close();}</script>
      </body></html>
    `);
    printWindow.document.close();
  }

  const logout = () => { localStorage.clear(); navigate("/"); };
  const displayName = user.name || "Customer";

  const styles = {
    page: { minHeight: "100vh", background: "#f4f7fb", fontFamily: "Arial, sans-serif", color: "#24304a" },
    sidebar: { width: "245px", background: "#243b80", color: "#fff", padding: "28px 18px", display: "flex", flexDirection: "column" },
    logo: { display: "flex", alignItems: "center", gap: "12px", paddingBottom: "30px", borderBottom: "1px solid rgba(255,255,255,0.15)" },
    navButton: { width: "100%", textAlign: "left", padding: "13px 14px", marginTop: "8px", border: "none", borderRadius: "9px", color: "#e8edff", background: "transparent", cursor: "pointer", fontSize: "14px" },
    main: { flex: 1, padding: "32px" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" },
    title: { fontSize: "27px", margin: "0 0 9px", color: "#1c2c50" },
    card: { background: "#fff", padding: "20px", borderRadius: "14px", border: "1px solid #e7edf6", marginBottom: "20px" }
  };

  return (
    <div style={{ ...styles.page, display: "flex" }}>
      <aside style={styles.sidebar}>
        <div style={styles.logo}><span style={{ fontSize: "27px", background: "rgba(255,255,255,0.13)", padding: "9px", borderRadius: "10px" }}>📦</span><div><div style={{ fontWeight: 800, fontSize: "15px" }}>ParcelTrack</div><div style={{ fontSize: "11px", color: "#cbd7ff" }}>Customer Portal</div></div></div>
        <div style={{ marginTop: "25px" }}>
          <button style={{ ...styles.navButton, background: "rgba(255,255,255,0.13)" }} onClick={() => navigate("/dashboard")}>🏠 Dashboard</button>
          <button style={styles.navButton} onClick={() => navigate("/my-parcels")}>📦 My Parcels</button>
          <button style={styles.navButton} onClick={() => navigate("/track-parcel")}>🔎 Track Parcel</button>
        </div>
        <button style={{ ...styles.navButton, marginTop: "auto" }} onClick={logout}>↪ Logout</button>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <div><h1 style={styles.title}>Customer Dashboard</h1><p style={{ color: "#7b879b", margin: 0 }}>Welcome back, {displayName}.</p></div>
          <button onClick={() => fetchCustomerData(true)} style={{ padding: "10px 15px", background: "#fff", border: "1px solid #dce4f2", borderRadius: "8px", cursor: "pointer" }}>{refreshing ? "Refreshing..." : "↻ Refresh"}</button>
        </header>

        {summaryError && <div style={{ background: "#fff0f0", color: "#b42318", padding: "14px", borderRadius: "9px", marginBottom: "20px" }}>{summaryError}</div>}
        {paymentNotice && <div style={{ background: "#ecfdf3", color: "#027a48", padding: "14px", borderRadius: "9px", marginBottom: "20px" }}>{paymentNotice}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "18px", marginBottom: "32px" }}>
          {[{ title: "Total Parcels", value: summary.total, icon: "📦" }, { title: "In Transit", value: summary.inTransit, icon: "🚚" }, { title: "Delivered", value: summary.delivered, icon: "✅" }, { title: "Pending", value: summary.pending, icon: "⏳" }].map(s => (
            <div key={s.title} style={{ background: "#fff", padding: "20px", borderRadius: "14px", border: "1px solid #e7edf6" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}><span style={{ color: "#7b879b", fontWeight: 700, fontSize: "13px" }}>{s.title}</span><span style={{ fontSize: "20px" }}>{s.icon}</span></div>
              <div style={{ fontSize: "28px", fontWeight: 800 }}>{loadingSummary ? "—" : s.value}</div>
            </div>
          ))}
        </div>

        <section style={styles.card}>
          <h2 style={{ marginTop: 0, fontSize: "19px" }}>My Parcels & Payments</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: "700px", borderCollapse: "collapse", fontSize: "13px", marginTop: "15px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", textAlign: "left" }}>
                  <th style={{ padding: "12px", borderBottom: "1px solid #e2e8f0" }}>Tracking</th>
                  <th style={{ padding: "12px", borderBottom: "1px solid #e2e8f0" }}>Contents</th>
                  <th style={{ padding: "12px", borderBottom: "1px solid #e2e8f0" }}>Total Fee</th>
                  <th style={{ padding: "12px", borderBottom: "1px solid #e2e8f0" }}>Paid</th>
                  <th style={{ padding: "12px", borderBottom: "1px solid #e2e8f0" }}>Balance</th>
                  <th style={{ padding: "12px", borderBottom: "1px solid #e2e8f0" }}>Status</th>
                  <th style={{ padding: "12px", borderBottom: "1px solid #e2e8f0" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {parcels.length === 0 ? <tr><td colSpan="7" style={{ padding: "20px", textAlign: "center" }}>No parcels found.</td></tr> : parcels.map(p => {
                  const paid = getPaidAmount(p);
                  const balance = getBalance(p);
                  const status = getPaymentStatus(p);
                  return (
                    <tr key={p.id}>
                      <td style={{ padding: "12px", borderBottom: "1px solid #e2e8f0", fontWeight: "bold" }}>{p.tracking_number}</td>
                      <td style={{ padding: "12px", borderBottom: "1px solid #e2e8f0", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={p.parcel_description}>{p.parcel_description || "—"}</td>
                      <td style={{ padding: "12px", borderBottom: "1px solid #e2e8f0" }}>KES {Number(p.delivery_fee).toLocaleString()}</td>
                      <td style={{ padding: "12px", borderBottom: "1px solid #e2e8f0" }}>KES {paid.toLocaleString()}</td>
                      <td style={{ padding: "12px", borderBottom: "1px solid #e2e8f0", fontWeight: "bold", color: balance > 0 ? "#b42318" : "#16804a" }}>KES {balance.toLocaleString()}</td>
                      <td style={{ padding: "12px", borderBottom: "1px solid #e2e8f0" }}>
                        <span style={{ 
                          padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold",
                          background: status === "Fully Paid" ? "#dcfce7" : status === "Partially Paid" ? "#fef08a" : "#fee2e2",
                          color: status === "Fully Paid" ? "#166534" : status === "Partially Paid" ? "#854d0e" : "#991b1b"
                        }}>
                          {status}
                        </span>
                      </td>
                      <td style={{ padding: "12px", borderBottom: "1px solid #e2e8f0", display: "flex", gap: "8px" }}>
                        {balance > 0 && (
                          <button onClick={() => { setSelectedParcel(p); setPhoneNumber(""); setPayAmount(balance); setPaymentNotice(""); }} style={{ padding: "6px 12px", background: "#243b80", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", whiteSpace: "nowrap" }}>Pay</button>
                        )}
                        <button onClick={() => printReceipt(p)} style={{ padding: "6px 12px", background: "#fff", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", whiteSpace: "nowrap" }}>Receipt</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* M-PESA MODAL */}
        {selectedParcel && (
          <div style={{ position: "fixed", inset: 0, background: "#10182880", display: "grid", placeItems: "center", zIndex: 50 }}>
            <div style={{ background: "#fff", padding: "30px", borderRadius: "12px", width: "100%", maxWidth: "400px" }}>
              <h2 style={{ marginTop: 0 }}>Pay via M-Pesa</h2>
              <p style={{ color: "#64748b" }}>Tracking: <strong>{selectedParcel.tracking_number}</strong></p>
              <p style={{ color: "#64748b" }}>Remaining Balance: <strong>KES {getBalance(selectedParcel).toLocaleString()}</strong></p>
              
              <form onSubmit={handleMpesaPush}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Amount to Pay (KES)</label>
                <input 
                  type="number" 
                  value={payAmount} 
                  onChange={(e) => setPayAmount(e.target.value)} 
                  max={getBalance(selectedParcel)}
                  placeholder={`Max ${getBalance(selectedParcel)}`} 
                  required 
                  style={{ width: "100%", padding: "12px", border: "1px solid #cbd5e1", borderRadius: "8px", marginBottom: "16px" }} 
                />

                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>M-Pesa Phone Number</label>
                <input 
                  type="text" 
                  value={phoneNumber} 
                  onChange={(e) => setPhoneNumber(e.target.value)} 
                  placeholder="e.g. 0712345678" 
                  required 
                  style={{ width: "100%", padding: "12px", border: "1px solid #cbd5e1", borderRadius: "8px", marginBottom: "16px" }} 
                />

                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="button" onClick={() => setSelectedParcel(null)} style={{ flex: 1, padding: "10px", background: "#f1f5f9", border: "none", borderRadius: "8px", cursor: "pointer" }}>Cancel</button>
                  <button type="submit" disabled={isProcessing} style={{ flex: 1, padding: "10px", background: "#243b80", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}>{isProcessing ? "Sending..." : "Pay Now"}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
export default Dashboard;