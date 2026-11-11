import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import MyParcels from "./pages/myparcels";
import TrackParcel from "./pages/trackparcel";
import StaffDashboard from "./pages/staffDashboard";
import AddCustomer from "./pages/addcustomer";
import CreateParcel from "./pages/createparcel";
import ManageParcels from "./pages/manageparcels";
import UpdateParcelStatus from "./pages/updateparcelstatus";
import StaffPayment from "./pages/StaffPayment"; // 🔥 NEW IMPORT
import AdminDashboard from "./pages/AdminDashboard";
import AdminParcels from "./pages/adminparcels";
import AdminPricing from "./pages/AdminPricing";
import StaffManagement from "./pages/StaffManagement";
import BranchManagement from "./pages/BranchManagement";
import CustomerManagement from "./pages/CustomerManagement";
import AdminTools from "./pages/AdminTools";
import AdminReports from "./pages/AdminReports";
import AdminNotifications from "./pages/AdminNotifications";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        {/* Customer */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/my-parcels" element={<MyParcels />} />
        <Route path="/track-parcel" element={<TrackParcel />} />

        {/* Staff */}
        <Route path="/staff-dashboard" element={<StaffDashboard />} />
        <Route path="/add-customer" element={<AddCustomer />} />
        <Route path="/create-parcel" element={<CreateParcel />} />
        <Route path="/manage-parcels" element={<ManageParcels />} />
        <Route path="/update-parcel-status" element={<UpdateParcelStatus />} />
        <Route path="/collect-payment" element={<StaffPayment />} /> {/* 🔥 NEW ROUTE */}

        {/* Admin */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin-parcels" element={<AdminParcels />} />
        <Route path="/admin-pricing" element={<AdminPricing />} />
        <Route path="/admin-staff" element={<StaffManagement />} />
        <Route path="/admin-branches" element={<BranchManagement />} />
        <Route path="/admin-customers" element={<CustomerManagement />} />
        <Route path="/admin-reports" element={<AdminReports />} />
        <Route path="/admin-notifications" element={<AdminNotifications />} />
        <Route path="/admin-logs" element={<AdminTools />} />
        <Route path="/admin-fleet" element={<AdminTools />} />
        <Route path="/admin-bulk-messages" element={<AdminTools />} />
        <Route path="/admin-finances" element={<AdminTools />} />

        {/* Unknown URLs */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;