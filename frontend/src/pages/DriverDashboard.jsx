import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { selectUserId, selectUserRole } from "../features/auth/authSlice";

export default function DriverDashboard() {
  const [driverInfo, setDriverInfo] = useState(null);
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [files, setFiles] = useState({});
  const [licenseNumber, setLicenseNumber] = useState("");
  const role = useSelector(selectUserRole);
  const userId = useSelector(selectUserId);
  const navigate = useNavigate();

  // ---------------------- Fetch Driver Info ----------------------
  const fetchDriverInfo = async () => {
    try {
      const res = await api.get(`/api/drivers/${userId}`);
      setDriverInfo(res.data);
      setLicenseNumber(res.data.license_number || "");
    } catch (err) {
      console.error("fetchDriverInfo error:", err.response?.data || err.message);
    }
  };

  // ---------------------- Fetch Assigned Orders ----------------------
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

  // ---------------------- File Upload ----------------------
  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    setFiles(prev => ({ ...prev, [name]: selectedFiles[0] }));
  };

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

  // ---------------------- Document Status ----------------------
  const getExpiryTooltip = (date) => {
    if (!date) return '';
    const today = new Date();
    const expDate = new Date(date);
    const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? `Expires in ${diffDays} day(s)` : `Expired ${Math.abs(diffDays)} day(s) ago`;
  };

  const getUploadTooltip = (date) => {
    if (!date) return '';
    return `Uploaded: ${new Date(date).toLocaleDateString()}`;
  };

  const checkStatus = (fileName, expiryDate = null) => {
    if (!fileName) return { status: "Missing", color: "#f8f9fa" };
    if (expiryDate) {
      const today = new Date();
      const expiry = new Date(expiryDate);
      const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) return { status: "Expired", color: "#f8d7da" };
      if (diffDays <= 30) return { status: "Expiring Soon", color: "#fff3cd" };
    }
    return { status: "Valid", color: "#d4edda" };
  };

const handleLoadOrder = async (orderId) => {
  try {
    const quantity = prompt("Enter quantity loaded (in tons or liters):");
    if (!quantity || isNaN(quantity) || quantity <= 0) {
      alert("Please enter a valid quantity greater than zero.");
      return;
    }

    const res = await api.post(`/api/orders/${orderId}/loaded`, {
      quantity_loaded: Number(quantity),
    });

    alert(res.data.message || "Order marked as loaded!");
    fetchAssignedOrders(); // refresh list
  } catch (err) {
    console.error("handleLoadOrder error:", err.response?.data || err.message);
    alert(err.response?.data?.message || "Failed to mark order as loaded.");
  }
};

const handleStartJourney = async (orderId) => {
  try {
    const confirmStart = window.confirm("Start the journey for this order?");
    if (!confirmStart) return;

    const res = await api.post(`/api/orders/${orderId}/enroute`);

    alert(res.data.message || "Journey started successfully!");
    fetchAssignedOrders(); // ✅ refresh orders after status change
  } catch (err) {
    console.error("❌ handleStartJourney error:", err);

    if (err.response) {
      // Backend responded with an error (like 400 or 500)
      alert(err.response.data.message || "Failed to start journey.");
    } else if (err.request) {
      // No response (Network / CORS / server down)
      alert("Network error or server unavailable. Please check your connection.");
      // Safe refresh to reinitialize API session
      setTimeout(() => window.location.reload(), 1500);
    } else {
      // Unknown client-side error
      alert("Unexpected error occurred. Please try again.");
    }
  }
};


  // ---------------------- Render Driver Info ----------------------
  const renderDriverInfo = () => (
    <div style={{ padding: '20px' }}>
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
                { key: "license_file", label: "License", expiry: "license_expiry_date", uploaded: "license_file_uploaded_at" },
                { key: "passport_photo", label: "Passport Photo", expiry: null, uploaded: "passport_photo_uploaded_at" },
                { key: "good_conduct_certificate", label: "Good Conduct Certificate", expiry: null, uploaded: "good_conduct_certificate_uploaded_at" },
                { key: "port_pass", label: "Port Pass", expiry: null, uploaded: "port_pass_uploaded_at" },
              ].map(doc => {
                const fileName = driverInfo[doc.key];
                const expiryDate = doc.expiry ? driverInfo[doc.expiry] : null;
                const uploadedDate = doc.uploaded ? driverInfo[doc.uploaded] : null;
                const { status, color } = checkStatus(fileName, expiryDate);

                return (
                  <tr key={doc.key} style={{ backgroundColor: color }}>
                    <td>{doc.label}</td>
                    <td title={fileName ? getUploadTooltip(uploadedDate) : "Not uploaded"}>
                      {fileName ? (
                        <a 
                          href={`http://localhost:5000/uploads/driver/${fileName}`} 
                          target="_blank" rel="noreferrer"
                        >
                          {doc.label} 📎
                        </a>
                      ) : "Not uploaded"}
                    </td>
                    <td title={expiryDate ? getExpiryTooltip(expiryDate) : ""}>{expiryDate || "N/A"}</td>
                    <td>
                      <input type="file" name={doc.key} onChange={handleFileChange} />
                      <button onClick={() => handleUpload(doc.key)} disabled={!files[doc.key]} style={{ marginLeft: 5 }}>
                        Upload
                      </button>
                    </td>
                    <td>{status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {driverInfo.license_expiry_date && (new Date(driverInfo.license_expiry_date) < new Date() ||
            (new Date(driverInfo.license_expiry_date) - new Date()) / (1000*60*60*24) <= 30) && (
            <div style={{ marginTop: 10 }}>
              <button 
                onClick={() => window.open('https://ntsa.go.ke/inspection-renewal', '_blank')}
                style={{ padding: '5px 10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: 3, cursor: 'pointer' }}
              >
                Renew License
              </button>
            </div>
          )}

          <div style={{ marginTop: 20 }}>
            <strong>Username: </strong> {driverInfo.username}
          </div>
          <div style={{ marginTop: 10 }}>
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

  // ---------------------- Render Assigned Orders ----------------------
  const renderAssignedOrders = () => {
    const getInsuranceStatus = (file, expiry) => {
      if (!file) return { status: "Missing", color: "gray" };
      if (!expiry) return { status: "Valid", color: "green" };
      const diffDays = Math.ceil((new Date(expiry) - new Date()) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) return { status: "Expired", color: "red" };
      if (diffDays <= 30) return { status: "Expiring Soon", color: "orange" };
      return { status: "Valid", color: "green" };
    };

    return (
      <div style={{ padding: '20px' }}>
        <h2>Assigned Orders</h2>
        {assignedOrders.length > 0 ? (
          <table border="1" cellPadding="5" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Pickup</th>
                <th>Destination</th>
                <th>Status</th>
                <th>Qty Loaded</th>
                <th>Qty Delivered</th>
                <th>Insurance</th>
                <th>Cash Spent</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignedOrders.map(order => {
                const {
                  id, customer_name, pickup, destination, status,
                  quantity_loaded, quantity_delivered, pod_file, cash_spent,
                  truck_id, trailer_id, truck_insurance_file, truck_insurance_expiry,
                  trailer_insurance_file, trailer_insurance_expiry
                } = order;

                const canLoadOrder = status === "assigned" && truck_id;
                const canStartJourney = status === "loaded" && truck_id && quantity_loaded > 0;
                const canLogFuel = status === "enroute";
                const canLogMileage = status === "enroute";
                const canUploadPOD = status === "enroute";
                const canLogCash = status === "enroute";
                const canMarkDelivered = status === "enroute" && pod_file;

                const qtyColor = quantity_delivered < quantity_loaded ? "red" : "black";

                const truckIns = getInsuranceStatus(truck_insurance_file, truck_insurance_expiry);
                const trailerIns = trailer_id ? getInsuranceStatus(trailer_insurance_file, trailer_insurance_expiry) : null;

                return (
                  <tr key={id}>
                    <td>{id}</td>
                    <td>{customer_name}</td>
                    <td>{pickup}</td>
                    <td>{destination}</td>
                    <td>{status}</td>
                    <td style={{ color: qtyColor }}>{quantity_loaded ?? 0}</td>
                    <td style={{ color: qtyColor }}>{quantity_delivered ?? 0}</td>
                    <td>
                      <div style={{ color: truckIns.color }}>
                        Truck: {truckIns.status}
                        {truck_insurance_file && <> | <a href={`/uploads/insurance/${truck_insurance_file}`} target="_blank" rel="noopener noreferrer" title={`Uploaded: ${new Date(order.truck_insurance_uploaded_at).toLocaleDateString()}`}>View</a></>}
                      </div>
                      {trailerIns && (
                        <div style={{ color: trailerIns.color }}>
                          Trailer: {trailerIns.status}
                          {trailer_insurance_file && <> | <a href={`/uploads/insurance/${trailer_insurance_file}`} target="_blank" rel="noopener noreferrer" title={`Uploaded: ${new Date(order.trailer_insurance_uploaded_at).toLocaleDateString()}`}>View</a></>}
                        </div>
                      )}
                    </td>
                    <td>{cash_spent ? `$${cash_spent}` : "$0"}</td>
                    <td>
                      {canLoadOrder && <button onClick={() => handleLoadOrder(id)}>Load Order</button>}
                      {canStartJourney && <button onClick={() => handleStartJourney(id)} style={{ marginLeft: 5 }}>Start Journey</button>}
                      {canLogFuel && <button onClick={() => navigate(`/fuel/${id}`)} style={{ marginLeft: 5 }}>Log Fuel</button>}
                      {canLogMileage && <button onClick={() => navigate(`/mileage/${id}`)} style={{ marginLeft: 5 }}>Log Mileage</button>}
                      {canUploadPOD && <button onClick={() => navigate(`/documents/${id}`)} style={{ marginLeft: 5 }}>Upload POD</button>}
                      {canLogCash && <button onClick={() => handleLogCash(id)} style={{ marginLeft: 5 }}>Log Cash</button>}
                      {canMarkDelivered && <button onClick={() => handleMarkDelivered(id)} style={{ marginLeft: 5 }}>Mark Delivered</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : <p>No assigned orders.</p>}
      </div>
    );
  };

  // ---------------------- Render Based on Sidebar Route ----------------------
  const path = window.location.pathname;
  if (path === "/dashboard") return renderAssignedOrders();
  if (path === "/driver") return renderDriverInfo();
  return <p>Page not found</p>;
}
