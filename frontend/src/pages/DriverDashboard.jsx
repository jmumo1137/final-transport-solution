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

  // ---------------------- Journey Actions ----------------------
  const handleLoadOrder = async (orderId) => {
    const qtyInput = prompt("Enter quantity loaded for this order:");
    if (qtyInput === null) return;
    const quantity_loaded = parseInt(qtyInput, 10);

    if (isNaN(quantity_loaded) || quantity_loaded < 0) {
      return alert("Invalid quantity. Please enter a number >= 0.");
    }

    try {
      await api.put(`/api/orders/${orderId}/load`, { quantity_loaded });
      alert("Order loaded successfully. You can now start the journey.");
      fetchAssignedOrders();
    } catch (err) {
      console.error("Load Order error:", err.response?.data || err.message);
      alert("Failed to load order. Try again.");
    }
  };

  const handleStartJourney = async (orderId) => {
    try {
      await api.post(`/api/orders/${orderId}/enroute`);
      fetchAssignedOrders();
    } catch (err) {
      console.error("Start Journey error:", err.response?.data || err.message);
      alert("Failed to start journey");
    }
  };

  const handleMarkDelivered = async (orderId) => {
    try {
      await api.post(`/api/orders/${orderId}/delivered`);
      fetchAssignedOrders();
    } catch (err) {
      console.error("Mark Delivered error:", err.response?.data || err.message);
      alert("Failed to mark delivered");
    }
  };

  // ---------------------- Document Status ----------------------
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

  // ---------------------- Render Driver Info ----------------------
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

  // ---------------------- Render Assigned Orders ----------------------
  const renderAssignedOrders = () => {
    const getInsuranceStatus = (file, expiry) => {
      if (!expiry) return { status: "Missing", color: "gray" };
      const today = new Date();
      const diffDays = Math.ceil((new Date(expiry) - today) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) return { status: "Expired", color: "red" };
      if (diffDays <= 30) return { status: "Expiring Soon", color: "orange" };
      return { status: "Valid", color: "green" };
    };

    return (
      <div>
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
                  status,
                  quantity_loaded,
                  quantity_delivered,
                  pod_file,
                  cash_spent,
                  truck_insurance_file,
                  truck_insurance_expiry,
                  trailer_insurance_file,
                  trailer_insurance_expiry
                } = order;

                const canLoadOrder = status === "assigned";
                const canStartJourney = status === "loaded";
                const canLogFuel = status === "enroute";
                const canLogMileage = status === "enroute";
                const canUploadPOD = status === "enroute";
                const canMarkDelivered = status === "enroute" && pod_file;

                const qtyColor = quantity_delivered < quantity_loaded ? "red" : "black";

                const truckIns = getInsuranceStatus(truck_insurance_file, truck_insurance_expiry);
                const trailerIns = getInsuranceStatus(trailer_insurance_file, trailer_insurance_expiry);

                return (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.customer_name}</td>
                    <td>{order.pickup}</td>
                    <td>{order.destination}</td>
                    <td>{status}</td>
                    <td style={{ color: qtyColor }}>{quantity_loaded ?? 0}</td>
                    <td style={{ color: qtyColor }}>{quantity_delivered ?? 0}</td>
                    <td>
                      <div style={{ color: truckIns.color }}>
                        Truck: {truckIns.status}
                        {truck_insurance_file && <> | <a href={`/uploads/insurance/${truck_insurance_file}`} target="_blank" rel="noopener noreferrer">View</a></>}
                      </div>
                      <div style={{ color: trailerIns.color }}>
                        Trailer: {trailerIns.status}
                        {trailer_insurance_file && <> | <a href={`/uploads/insurance/${trailer_insurance_file}`} target="_blank" rel="noopener noreferrer">View</a></>}
                      </div>
                    </td>
                    <td>{cash_spent ? `$${cash_spent}` : "$0"}</td>
                    <td>
                      {canLoadOrder && <button onClick={() => handleLoadOrder(order.id)}>Load Order</button>}
                      {canStartJourney && <button onClick={() => handleStartJourney(order.id)} style={{ marginLeft: 5 }}>Start Journey</button>}
                      {canLogFuel && <button onClick={() => navigate(`/fuel/${order.id}`)} style={{ marginLeft: 5 }}>Log Fuel</button>}
                      {canLogMileage && <button onClick={() => navigate(`/mileage/${order.id}`)} style={{ marginLeft: 5 }}>Log Mileage</button>}
                      {canUploadPOD && <button onClick={() => navigate(`/documents/${order.id}`)} style={{ marginLeft: 5 }}>Upload POD</button>}
                      {canMarkDelivered && <button onClick={() => handleMarkDelivered(order.id)} style={{ marginLeft: 5 }}>Mark Delivered</button>}
                      <button onClick={() => navigate(`/expenses/${order.id}`)} style={{ marginLeft: 5 }}>Log Expenses</button>
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
