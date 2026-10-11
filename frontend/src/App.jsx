import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import MyParcels from "./pages/myparcels";
import CreateParcel from "./pages/createparcel";
import StaffDashboard from "./pages/staffDashboard";
import AddCustomer from "./pages/addcustomer";
import ManageParcels from "./pages/manageparcels";
import UpdateParcelStatus from "./pages/updateparcelstatus";
import TrackParcel from "./pages/trackparcel";
import AdminDashboard from "./pages/admindashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/my-parcels" element={<MyParcels />} />
        <Route path="/track-parcel" element={<TrackParcel />} />

        <Route path="/staff-dashboard" element={<StaffDashboard />} />
        <Route path="/add-customer" element={<AddCustomer />} />
        <Route path="/create-parcel" element={<CreateParcel />} />
        <Route path="/manage-parcels" element={<ManageParcels />} />
        <Route
          path="/update-parcel-status"
          element={<UpdateParcelStatus />}
        />

        <Route
          path="/admin-dashboard"
          element={<AdminDashboard />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;