import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../api";

export default function StaffPayment() {
  const navigate = useNavigate();
  const [parcels, setParcels] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  
  // Payment Modal State
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchParcels = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/staff/parcels`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load parcels");
      setParcels(data.parcels || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchParcels();
  }, [fetchParcels]);

  async function handleMpesaPush(e) {
    e.preventDefault();
    setIsProcessing(true);
    setError("");
    setNotice("");
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/payments/stk-push`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          trackingNumber: selectedParcel.tracking_number,
          phoneNumber: phoneNumber,
          amount: Number(payAmount),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Payment failed");
      
      setNotice(`STK Push sent to ${phoneNumber} for KES ${payAmount}. Ask customer to enter PIN.`);
      setTimeout(fetchParcels, 5000); // Refresh list after 5s
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  }

  // Helpers
  const getPaidAmount = (parcel) => Number(parcel.total_paid || 0);
  const getBalance = (parcel) => Number(parcel.delivery_fee) - getPaidAmount(parcel);
  const getPaymentStatus = (parcel) => {
    const paid = getPaidAmount(parcel);
    const fee = Number(parcel.delivery_fee);
    if (paid <= 0) return "Unpaid";
    if (paid >= fee) return "Fully Paid";
    return "Partially Paid";
  };

  const filteredParcels = parcels.filter((p) => {
    const term = search.toLowerCase();
    return (
      p.tracking_number.toLowerCase().includes(term) ||
      (p.customer_name && p.customer_name.toLowerCase().includes(term)) ||
      (p.recipient_name && p.recipient_name.toLowerCase().includes(term)) ||
      (p.recipient_phone && p.recipient_phone.includes(term))
    );
  });

  return (
    <main style={{ minHeight: "100vh", background: "#f4f7fc", padding: "24px", fontFamily: "Inter, Arial, sans-serif" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, color: "#172033" }}>Collect Payment</h1>
            <p style={{ color: "#64748b", marginTop: 4 }}>Trigger M-Pesa and print receipts for customers.</p>
          </div>
          <button onClick={() => navigate("/staff-dashboard")} style={{ padding: "10px 16px", background: "#fff", border: "1px solid #cbd5e1", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}>
            ← Back to Dashboard
          </button>
        </header>

        {error && <div style={{ background: "#fee4e2", color: "#b42318", padding: 14, borderRadius: 8, marginBottom: 16 }}>{error}</div>}
        {notice && <div style={{ background: "#dcfce7", color: "#166534", padding: 14, borderRadius: 8, marginBottom: 16 }}>{notice}</div>}

        <div style={{ background: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <input 
            type="text" 
            placeholder="Search by Tracking Number, Sender, or Recipient..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: 12, border: "1px solid #cbd5e1", borderRadius: 8, marginBottom: 20 }}
          />

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#f8fafc", textAlign: "left" }}>
                <th style={{ padding: 12, borderBottom: "1px solid #e2e8f0" }}>Tracking</th>
                <th style={{ padding: 12, borderBottom: "1px solid #e2e8f0" }}>Customer</th>
                <th style={{ padding: 12, borderBottom: "1px solid #e2e8f0" }}>Fee</th>
                <th style={{ padding: 12, borderBottom: "1px solid #e2e8f0" }}>Balance</th>
                <th style={{ padding: 12, borderBottom: "1px solid #e2e8f0" }}>Status</th>
                <th style={{ padding: 12, borderBottom: "1px solid #e2e8f0" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ padding: 20, textAlign: "center" }}>Loading...</td></tr>
              ) : filteredParcels.length === 0 ? (
                <tr><td colSpan="6" style={{ padding: 20, textAlign: "center" }}>No parcels found.</td></tr>
              ) : (
                filteredParcels.map((p) => {
                  const balance = getBalance(p);
                  const status = getPaymentStatus(p);
                  return (
                    <tr key={p.id}>
                      <td style={{ padding: 12, borderBottom: "1px solid #e2e8f0", fontWeight: "bold" }}>{p.tracking_number}</td>
                      <td style={{ padding: 12, borderBottom: "1px solid #e2e8f0" }}>
                        {p.customer_name || p.recipient_name}
                        <br/><span style={{ color: "#64748b", fontSize: 12 }}>{p.customer_phone || p.recipient_phone}</span>
                      </td>
                      <td style={{ padding: 12, borderBottom: "1px solid #e2e8f0" }}>KES {Number(p.delivery_fee).toLocaleString()}</td>
                      <td style={{ padding: 12, borderBottom: "1px solid #e2e8f0", fontWeight: "bold", color: balance > 0 ? "#b42318" : "#166534" }}>
                        KES {balance.toLocaleString()}
                      </td>
                      <td style={{ padding: 12, borderBottom: "1px solid #e2e8f0" }}>
                        <span style={{
                          padding: "4px 8px", borderRadius: 6, fontSize: 12, fontWeight: "bold",
                          background: status === "Fully Paid" ? "#dcfce7" : status === "Partially Paid" ? "#fef08a" : "#fee2e2",
                          color: status === "Fully Paid" ? "#166534" : status === "Partially Paid" ? "#854d0e" : "#991b1b",
                        }}>
                          {status}
                        </span>
                      </td>
                      <td style={{ padding: 12, borderBottom: "1px solid #e2e8f0" }}>
                        {balance > 0 && (
                          <button 
                            onClick={() => { 
                              setSelectedParcel(p); 
                              setPhoneNumber(p.recipient_phone || p.customer_phone || ""); 
                              setPayAmount(balance); 
                              setNotice(""); 
                            }} 
                            style={{ padding: "6px 12px", background: "#243b80", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}
                          >
                            Prompt M-Pesa
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAYMENT MODAL */}
        {selectedParcel && (
          <div style={{ position: "fixed", inset: 0, background: "#10182880", display: "grid", placeItems: "center", zIndex: 50 }}>
            <div style={{ background: "#fff", padding: 30, borderRadius: 12, width: "100%", maxWidth: 400 }}>
              <h2 style={{ marginTop: 0 }}>Collect Payment</h2>
              <p style={{ color: "#64748b" }}>Tracking: <strong>{selectedParcel.tracking_number}</strong></p>
              <p style={{ color: "#64748b" }}>Remaining Balance: <strong>KES {getBalance(selectedParcel).toLocaleString()}</strong></p>
              
              <form onSubmit={handleMpesaPush}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Amount to Collect (KES)</label>
                <input 
                  type="number" 
                  value={payAmount} 
                  onChange={(e) => setPayAmount(e.target.value)} 
                  max={getBalance(selectedParcel)}
                  required 
                  style={{ width: "100%", padding: 12, border: "1px solid #cbd5e1", borderRadius: 8, marginBottom: 16 }} 
                />

                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Customer's M-Pesa Phone Number</label>
                <input 
                  type="text" 
                  value={phoneNumber} 
                  onChange={(e) => setPhoneNumber(e.target.value)} 
                  placeholder="e.g. 0712345678" 
                  required 
                  style={{ width: "100%", padding: 12, border: "1px solid #cbd5e1", borderRadius: 8, marginBottom: 16 }} 
                />

                <div style={{ display: "flex", gap: 10 }}>
                  <button type="button" onClick={() => setSelectedParcel(null)} style={{ flex: 1, padding: 10, background: "#f1f5f9", border: "none", borderRadius: 8, cursor: "pointer" }}>Cancel</button>
                  <button type="submit" disabled={isProcessing} style={{ flex: 1, padding: 10, background: "#243b80", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}>
                    {isProcessing ? "Sending..." : "Send Prompt"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}