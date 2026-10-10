
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MyParcels from "./pages/myparcels";
import CreateParcel from "./pages/createparcel";
import StaffDashboard from "./pages/StaffDashboard";
import AddCustomer from "./pages/AddCustomer";
import ManageParcels from "./pages/ManageParcels";
import UpdateParcelStatus from "./pages/UpdateParcelStatus";
import TrackParcel from "./pages/TrackParcel";
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
