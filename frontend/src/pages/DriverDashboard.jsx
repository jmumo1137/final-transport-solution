import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import api from "../api/api";
import { selectUserId, selectUserRole } from "../features/auth/authSlice";

export default function DriverDashboard() {
  const [driverInfo, setDriverInfo] = useState(null);
  const [files, setFiles] = useState({});
  const [licenseNumber, setLicenseNumber] = useState("");
  const [assignedOrders, setAssignedOrders] = useState([]);
  const role = useSelector(selectUserRole);
  const userId = useSelector(selectUserId);

  // Fetch driver info
  const fetchDriverInfo = async () => {
    try {
      const res = await api.get(`/api/drivers/${userId}`);
      setDriverInfo(res.data);
      setLicenseNumber(res.data.license_number || "");
    } catch (err) {
      console.error("fetchDriverInfo error:", err.response?.data || err.message);
    }
  };

  // Fetch assigned orders
  const fetchAssignedOrders = async () => {
    try {
      const res = await api.get(`/api/driver/orders`);
      setAssignedOrders(res.data || []);
    } catch (err) {
      console.error("fetchAssignedOrders error:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    if (role === "driver") {
      fetchDriverInfo();
      fetchAssignedOrders();
    }
  }, [role, userId]);

  // File selection
  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    setFiles(prev => ({ ...prev, [name]: selectedFiles[0] }));
  };

  // Upload a single file
  const handleUpload = async (docType) => {
    if (!files[docType]) return alert("Please select a file to upload.");
    const formData = new FormData();
    formData.append(docType, files[docType]);

    try {
      const res = await api.put(`/api/drivers/${userId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert(`${docType} uploaded successfully`);
      setFiles(prev => ({ ...prev, [docType]: null }));
      setDriverInfo(res.data);
    } catch (err) {
      console.error("Upload error:", err.response?.data || err.message);
      alert("Upload failed");
    }
  };

  // Update license number
  const handleLicenseUpdate = async () => {
    if (!licenseNumber) return alert("License number cannot be empty.");
    try {
      const res = await api.put(`/api/drivers/${userId}`, { license_number: licenseNumber });
      alert("License number updated successfully");
      setDriverInfo(res.data);
    } catch (err) {
      console.error("License update error:", err.response?.data || err.message);
      alert("Failed to update license number");
    }
  };

  // File status checker
  const checkStatus = (fileName, expiryDate = null) => {
    if (!fileName) return { status: "Missing", color: "gray" };
    if (expiryDate) {
      const today = new Date();
      const expiry = new Date(expiryDate);
      const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) return { status: "Expired", color: "red" };
      if (diffDays <= 30) return { status: "Expiring Soon", color: "orange" };
    }
    return { status: "Valid", color: "green" };
  };

  // Render Assigned Orders
  const renderAssignedOrders = () => (
    <div>
      <h2>Assigned Orders</h2>
      {assignedOrders.length > 0 ? (
        <table border="1" cellPadding="5" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Origin</th>
              <th>Destination</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {assignedOrders.map(order => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.origin}</td>
                <td>{order.destination}</td>
                <td>{order.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : <p>No assigned orders.</p>}
    </div>
  );

  // Render Driver Info & Compliance
  const renderDriverInfo = () => (
    <div>
      <h2>Driver Info & Compliance</h2>
      {driverInfo ? (
        <>
          <table border="1" cellPadding="5" style={{ width: "100%", marginTop: 10 }}>
            <thead>
              <tr>
                <th>Document</th>
                <th>File</th>
                <th>Expiry</th>
                <th>Upload</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { key: "license_file", label: "License", expiry: "license_expiry_date" },
                { key: "passport_photo", label: "Passport Photo", expiry: null },
                { key: "good_conduct_certificate", label: "Good Conduct Certificate", expiry: null },
                { key: "port_pass", label: "Port Pass", expiry: null },
              ].map(doc => {
                const fileName = driverInfo[doc.key];
                const expiryDate = doc.expiry ? driverInfo[doc.expiry] : null;
                const { status, color } = checkStatus(fileName, expiryDate);
                return (
                  <tr key={doc.key}>
                    <td>{doc.label}</td>
                    <td>
                      {fileName ? (
                        <a href={`/uploads/driver/${fileName}`} target="_blank" rel="noopener noreferrer">
                          {fileName}
                        </a>
                      ) : "Not uploaded"}
                    </td>
                    <td>{expiryDate || "N/A"}</td>
                    <td>
                      <input type="file" name={doc.key} onChange={handleFileChange} />
                      <button onClick={() => handleUpload(doc.key)} disabled={!files[doc.key]} style={{ marginLeft: 5 }}>
                        Upload
                      </button>
                    </td>
                    <td style={{ color }}>{status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ marginTop: 20 }}>
            <strong>Username: </strong> {driverInfo.username}
          </div>
          <div style={{ marginTop: 20 }}>
            <label>
              License Number:
              <input type="text" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} style={{ marginLeft: 5 }} />
            </label>
            <button onClick={handleLicenseUpdate} style={{ marginLeft: 10 }}>Update License Number</button>
          </div>
        </>
      ) : <p>No driver info found</p>}
    </div>
  );

  // Render based on current route
  const path = window.location.pathname;
  if (path === "/dashboard") return renderAssignedOrders();
  if (path === "/driver") return renderDriverInfo();
  return <p>Page not found</p>;
}
