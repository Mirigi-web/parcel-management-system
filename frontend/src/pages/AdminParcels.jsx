

import { useCallback, useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import API_BASE_URL from "../api";

import * as XLSX from "xlsx";

import jsPDF from "jspdf";

import autoTable from "jspdf-autotable";



const STATUSES = [

  "Received",

  "Dispatched",

  "In Transit",

  "Arrived",

  "Out for Delivery",

  "Delivered",

];



const money = (value) =>

  new Intl.NumberFormat("en-KE", {

    style: "currency",

    currency: "KES",

    maximumFractionDigits: 2,

  }).format(Number(value || 0));



const dateText = (value) =>

  value ? new Date(value).toLocaleString() : "—";



function AdminParcels() {

  const navigate = useNavigate();



  const [parcels, setParcels] = useState([]);

  const [branches, setBranches] = useState([]);

  const [branchId, setBranchId] = useState("");

  const [fromDate, setFromDate] = useState("");

  const [toDate, setToDate] = useState("");

  const [status, setStatus] = useState("");

  const [paymentStatus, setPaymentStatus] = useState("");

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");



  const loadParcels = useCallback(async () => {

    const token = localStorage.getItem("token");



    if (!token) {

      setError("Please log in again.");

      setLoading(false);

      return;

    }



    setLoading(true);

    setError("");



    try {

      const params = new URLSearchParams();



      if (branchId) params.set("branchId", branchId);

      if (fromDate) params.set("fromDate", fromDate);

      if (toDate) params.set("toDate", toDate);

      if (status) params.set("status", status);

      if (paymentStatus) params.set("paymentStatus", paymentStatus);

      if (search.trim()) params.set("search", search.trim());



      const response = await fetch(

        `${API_BASE_URL}/api/admin/parcels?${params.toString()}`,

        {

          headers: {

            Authorization: `Bearer ${token}`,

          },

        }

      );



      const data = await response.json();



      if (!response.ok) {

        throw new Error(data.message || "Unable to load parcels.");

      }



      setParcels(data.parcels || []);

      setBranches(data.branches || []);

    } catch (err) {

      setError(err.message || "Could not connect to the server.");

    } finally {

      setLoading(false);

    }

  }, [branchId, fromDate, toDate, status, paymentStatus, search]);



  useEffect(() => {

    const timer = setTimeout(loadParcels, 300);

    return () => clearTimeout(timer);

  }, [loadParcels]);



  const totals = useMemo(() => {

    return parcels.reduce(

      (result, parcel) => {

        const fee = Number(parcel.delivery_fee || 0);

        const paid = Number(parcel.amount_paid || 0);



        result.fees += fee;

        result.paid += paid;

        result.outstanding += Math.max(0, fee - paid);



        return result;

      },

      { fees: 0, paid: 0, outstanding: 0 }

    );

  }, [parcels]);



  const exportRows = useMemo(

    () =>

      parcels.map((p) => ({

        "Tracking Number": p.tracking_number || "",

        Sender: p.sender_name || "",

        "Sender Phone": p.sender_phone || "",

        Recipient: p.recipient_name || "",

        "Recipient Phone": p.recipient_phone || "",

        "Origin Branch": p.origin_branch || "",

        "Destination Branch": p.destination_branch || "",

        Description: p.parcel_description || "",

        "Weight (kg)": Number(p.weight || 0),

        "Delivery Fee (KES)": Number(p.delivery_fee || 0),

        "Paid (KES)": Number(p.amount_paid || 0),

        "Outstanding (KES)": Math.max(

          0,

          Number(p.delivery_fee || 0) - Number(p.amount_paid || 0)

        ),

        "Payment Status": p.payment_status || "Unpaid",

        "Parcel Status": p.status || "",

        Registered: p.created_at || "",

      })),

    [parcels]

  );



  function downloadBlob(blob, filename) {

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");



    link.href = url;

    link.download = filename;

    document.body.appendChild(link);

    link.click();

    link.remove();



    URL.revokeObjectURL(url);

  }



  function exportCSV() {

    if (!exportRows.length) {

      alert("There are no records to export.");

      return;

    }



    const headers = Object.keys(exportRows[0]);



    const quote = (value) =>

      `"${String(value ?? "").replace(/"/g, '""')}"`;



    const csv = [

      headers.map(quote).join(","),

      ...exportRows.map((row) =>

        headers.map((header) => quote(row[header])).join(",")

      ),

    ].join("\r\n");



    downloadBlob(

      new Blob(["\uFEFF", csv], {

        type: "text/csv;charset=utf-8;",

      }),

      "admin-parcel-report.csv"

    );

  }



  function exportExcel() {

    if (!exportRows.length) {

      alert("There are no records to export.");

      return;

    }



    const sheet = XLSX.utils.json_to_sheet(exportRows);

    const workbook = XLSX.utils.book_new();



    XLSX.utils.book_append_sheet(workbook, sheet, "Parcel Report");



    XLSX.writeFile(workbook, "admin-parcel-report.xlsx");

  }



  function exportPDF() {

    if (!exportRows.length) {

      alert("There are no records to export.");

      return;

    }



    const doc = new jsPDF({

      orientation: "landscape",

      unit: "mm",

      format: "a4",

    });



    doc.setFontSize(16);

    doc.text("Parcel Management - Admin Report", 14, 14);



    doc.setFontSize(9);

    doc.text(

      `Generated: ${new Date().toLocaleString()}`,

      14,

      21

    );



    doc.text(

      `Records: ${parcels.length} | Fees: ${money(totals.fees)} | Paid: ${money(totals.paid)} | Outstanding: ${money(totals.outstanding)}`,

      14,

      27

    );



    autoTable(doc, {

      head: [[

        "Tracking",

        "Sender",

        "Recipient",

        "Origin",

        "Destination",

        "Fee",

        "Paid",

        "Payment",

        "Status",

        "Registered",

      ]],

      body: parcels.map((p) => [

        p.tracking_number || "",

        p.sender_name || "",

        p.recipient_name || "",

        p.origin_branch || "",

        p.destination_branch || "",

        money(p.delivery_fee),

        money(p.amount_paid),

        p.payment_status || "Unpaid",

        p.status || "",

        p.created_at

          ? new Date(p.created_at).toLocaleDateString()

          : "",

      ]),

      startY: 32,

      styles: { fontSize: 7, cellPadding: 2 },

      headStyles: { fillColor: [36, 59, 128] },

    });



    doc.save("admin-parcel-report.pdf");

  }



  async function handleDeleteParcel(parcel) {
    const trackingNumber = parcel.tracking_number || `Parcel #${parcel.id}`;
    const confirmed = window.confirm(
      `Are you sure you want to delete ${trackingNumber}? This action cannot be undone.`
    );

    if (!confirmed) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please log in again.");
      return;
    }

    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/parcels/${parcel.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || `Unable to delete ${trackingNumber}.`);
      }

      window.alert(data.message || `${trackingNumber} was deleted successfully.`);
      await loadParcels();
    } catch (err) {
      setError(err.message || "Could not connect to the server.");
    }
  }

  function clearFilters() {

    setBranchId("");

    setFromDate("");

    setToDate("");

    setStatus("");

    setPaymentStatus("");

    setSearch("");

  }



  const inputStyle = {

    width: "100%",

    boxSizing: "border-box",

    padding: 10,

    border: "1px solid #d4dce8",

    borderRadius: 7,

    background: "#fff",

  };



  const labelStyle = {

    display: "block",

    fontSize: 12,

    fontWeight: 700,

    marginBottom: 5,

    color: "#53627a",

  };



  const buttonStyle = {

    padding: "10px 14px",

    borderRadius: 7,

    border: "1px solid #d4dce8",

    background: "#fff",

    cursor: "pointer",

    fontWeight: 600,

  };



  return (

    <main

      style={{

        minHeight: "100vh",

        padding: 24,

        boxSizing: "border-box",

        background: "#f4f7fc",

        color: "#172033",

        fontFamily: "Arial, sans-serif",

      }}

    >

      <div style={{ maxWidth: 1500, margin: "0 auto" }}>

        <header

          style={{

            display: "flex",

            justifyContent: "space-between",

            alignItems: "center",

            flexWrap: "wrap",

            gap: 12,

            marginBottom: 20,

          }}

        >

          <div>

            <h1 style={{ margin: 0 }}>Admin Parcel Management</h1>

            <p style={{ color: "#64748b" }}>

              Filter, review, and export parcel reports.

            </p>

          </div>



          <button

            style={buttonStyle}

            onClick={() => navigate("/admin-dashboard")}

          >

            ← Admin Dashboard

          </button>

        </header>



        {error && (

          <p style={{ color: "#b42318", background: "#fee4e2", padding: 12 }}>

            {error}

          </p>

        )}



        <section

          style={{

            background: "#fff",

            borderRadius: 12,

            padding: 18,

            marginBottom: 18,

          }}

        >

          <h2 style={{ marginTop: 0 }}>Filters</h2>



          <div

            style={{

              display: "grid",

              gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",

              gap: 14,

            }}

          >

            <div>

              <label style={labelStyle}>Branch</label>

              <select

                style={inputStyle}

                value={branchId}

                onChange={(e) => setBranchId(e.target.value)}

              >

                <option value="">All branches</option>

                {branches.map((b) => (

                  <option key={b.id} value={b.id}>

                    {b.name}

                  </option>

                ))}

              </select>

            </div>



            <div>

              <label style={labelStyle}>From date</label>

              <input

                type="date"

                style={inputStyle}

                value={fromDate}

                max={toDate || undefined}

                onChange={(e) => setFromDate(e.target.value)}

              />

            </div>



            <div>

              <label style={labelStyle}>To date</label>

              <input

                type="date"

                style={inputStyle}

                value={toDate}

                min={fromDate || undefined}

                onChange={(e) => setToDate(e.target.value)}

              />

            </div>



            <div>

              <label style={labelStyle}>Parcel status</label>

              <select

                style={inputStyle}

                value={status}

                onChange={(e) => setStatus(e.target.value)}

              >

                <option value="">All statuses</option>

                {STATUSES.map((s) => (

                  <option key={s} value={s}>

                    {s}

                  </option>

                ))}

              </select>

            </div>



            <div>

              <label style={labelStyle}>Payment status</label>

              <select

                style={inputStyle}

                value={paymentStatus}

                onChange={(e) => setPaymentStatus(e.target.value)}

              >

                <option value="">All payments</option>

                <option value="Paid">Paid</option>

                <option value="Unpaid">Unpaid</option>

                <option value="Partially Paid">Partially Paid</option>

              </select>

            </div>



            <div>

              <label style={labelStyle}>Search</label>

              <input

                style={inputStyle}

                value={search}

                onChange={(e) => setSearch(e.target.value)}

                placeholder="Tracking, sender, recipient, phone"

              />

            </div>

          </div>



          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>

            <button style={buttonStyle} onClick={clearFilters}>

              Clear filters

            </button>

            <button

              style={{

                ...buttonStyle,

                background: "#243b80",

                color: "#fff",

              }}

              onClick={loadParcels}

            >

              Refresh results

            </button>

          </div>

        </section>



        <section

          style={{

            display: "grid",

            gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",

            gap: 14,

            marginBottom: 18,

          }}

        >

          {[

            ["Matching parcels", parcels.length],

            ["Delivery fees", money(totals.fees)],

            ["Payments received", money(totals.paid)],

            ["Outstanding balance", money(totals.outstanding)],

          ].map(([title, value]) => (

            <div

              key={title}

              style={{

                background: "#fff",

                borderRadius: 12,

                padding: 18,

              }}

            >

              <div style={{ color: "#64748b", fontSize: 13 }}>

                {title}

              </div>

              <div style={{ fontSize: 22, fontWeight: 800, marginTop: 8 }}>

                {value}

              </div>

            </div>

          ))}

        </section>



        <section

          style={{

            background: "#fff",

            borderRadius: 12,

            padding: 18,

          }}

        >

          <div

            style={{

              display: "flex",

              justifyContent: "space-between",

              alignItems: "center",

              flexWrap: "wrap",

              gap: 12,

              marginBottom: 16,

            }}

          >

            <h2 style={{ margin: 0 }}>Parcel records</h2>



            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>

              <button style={buttonStyle} onClick={exportExcel}>

                Excel (.xlsx)

              </button>

              <button style={buttonStyle} onClick={exportPDF}>

                PDF

              </button>

              <button style={buttonStyle} onClick={exportCSV}>

                CSV

              </button>

            </div>

          </div>



          {loading ? (

            <p>Loading parcels...</p>

          ) : (

            <div style={{ overflowX: "auto" }}>

              <table

                style={{

                  width: "100%",

                  minWidth: 1050,

                  borderCollapse: "collapse",

                  fontSize: 13,

                }}

              >

                <thead>

                  <tr style={{ background: "#f1f5f9", textAlign: "left" }}>

                    {[

                      "Tracking",

                      "Sender",

                      "Recipient",

                      "Origin",

                      "Destination",

                      "Fee",

                      "Paid",

                      "Balance",

                      "Payment",

                      "Parcel status",

                      "Registered",

                        "Actions",

                    ].map((heading) => (

                      <th key={heading} style={{ padding: 10 }}>

                        {heading}

                      </th>

                    ))}

                  </tr>

                </thead>



                <tbody>

                  {parcels.map((p) => {

                    const fee = Number(p.delivery_fee || 0);

                    const paid = Number(p.amount_paid || 0);



                    return (

                      <tr key={p.id}>

                        <td style={{ padding: 10 }}>{p.tracking_number}</td>

                        <td style={{ padding: 10 }}>

                          {p.sender_name || "—"}

                          <br />

                          {p.sender_phone || ""}

                        </td>

                        <td style={{ padding: 10 }}>

                          {p.recipient_name || "—"}

                          <br />

                          {p.recipient_phone || ""}

                        </td>

                        <td style={{ padding: 10 }}>{p.origin_branch || "—"}</td>

                        <td style={{ padding: 10 }}>{p.destination_branch || "—"}</td>

                        <td style={{ padding: 10 }}>{money(fee)}</td>

                        <td style={{ padding: 10 }}>{money(paid)}</td>

                        <td style={{ padding: 10 }}>

                          {money(Math.max(0, fee - paid))}

                        </td>

                        <td style={{ padding: 10 }}>

                          {p.payment_status || "Unpaid"}

                        </td>

                        <td style={{ padding: 10 }}>{p.status}</td>

                        <td style={{ padding: 10 }}>{dateText(p.created_at)}</td>

                        <td style={{ padding: 10 }}>
                          <button
                            type="button"
                            onClick={() => handleDeleteParcel(p)}
                            style={{
                              ...buttonStyle,
                              background: "#b42318",
                              borderColor: "#b42318",
                              color: "#fff",
                              whiteSpace: "nowrap",
                            }}
                            aria-label={`Delete parcel ${p.tracking_number || p.id}`}
                          >
                            Delete
                          </button>
                        </td>

                      </tr>

                    );

                  })}



                  {!parcels.length && (

                    <tr>

                      <td colSpan={12} style={{ padding: 18 }}>

                        {error ? "Unable to load records." : "No parcels match these filters."}

                      </td>

                    </tr>

                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </div>

    </main>

  );

}



export default AdminParcels;