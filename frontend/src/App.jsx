import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import MyParcels from "./pages/myparcels";
import CreateParcel from "./pages/createparcel";
import StaffDashboard from "./pages/staffDashboard";
import AddCustomer from "./pages/addcustomer";
import ManageParcels from "./pages/Manageparcels";
import UpdateParcelStatus from "./pages/updateparcelstatus";
import TrackParcel from "./pages/trackparcel";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* LOGIN */}
        <Route path="/" element={<Login />} />

        {/* CUSTOMER */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/my-parcels" element={<MyParcels />} />
        <Route path="/track-parcel" element={<TrackParcel />} />

        {/* STAFF */}
        <Route path="/staff-dashboard" element={<StaffDashboard />} />
        <Route path="/add-customer" element={<AddCustomer />} />
        <Route path="/create-parcel" element={<CreateParcel />} />
        <Route path="/manage-parcels" element={<ManageParcels />} />
        <Route
          path="/update-parcel-status"
          element={<UpdateParcelStatus />}
        />

        {/* ADMIN */}
        <Route
          path="/admin-dashboard"
          element={<AdminDashboard />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;