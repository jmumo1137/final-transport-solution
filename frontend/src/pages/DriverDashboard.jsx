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
  const [licenseExpiry, setLicenseExpiry] = useState("");
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [safetyGuidelinesAccepted, setSafetyGuidelinesAccepted] = useState(false);
  const role = useSelector(selectUserRole);
  const userId = useSelector(selectUserId);
  const navigate = useNavigate();

  // ---------------------- Fetch Driver Info ----------------------
  const fetchDriverInfo = async () => {
    try {
      const res = await api.get(`/api/drivers/${userId}`);
      setDriverInfo(res.data);
      setLicenseNumber(res.data.license_number || "");
      setPolicyAccepted(res.data.policy_accepted || false);
      setSafetyGuidelinesAccepted(res.data.safety_guidelines_accepted || false);
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
  const handleLicenseExpiryUpdate = async () => {
  if (!licenseExpiry) return alert("Please enter the license expiry date.");
  try {
    const res = await api.put(`/api/drivers/${userId}`, { license_expiry_date: licenseExpiry });
    alert("License expiry date updated successfully");
    setDriverInfo(res.data);
  } catch (err) {
    console.error("License expiry update error:", err.response?.data || err.message);
    alert("Failed to update license expiry date");
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
  if (!policyAccepted || !safetyGuidelinesAccepted) {
    return alert("You must accept the company policies and safety guidelines before loading any orders.");
  }

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
    fetchAssignedOrders();
  } catch (err) {
    console.error("handleLoadOrder error:", err.response?.data || err.message);
    alert(err.response?.data?.message || "Failed to mark order as loaded.");
  }
};

const handleStartJourney = async (orderId) => {
  if (!policyAccepted || !safetyGuidelinesAccepted) {
    return alert("You must accept the company policies and safety guidelines before starting the journey.");
  }

  try {
    const confirmStart = window.confirm("Start the journey for this order?");
    if (!confirmStart) return;

    const res = await api.post(`/api/orders/${orderId}/enroute`);

    alert(res.data.message || "Journey started successfully!");
    fetchAssignedOrders();
  } catch (err) {
    console.error("❌ handleStartJourney error:", err);

    if (err.response) {
      alert(err.response.data.message || "Failed to start journey.");
    } else if (err.request) {
      alert("Network error or server unavailable. Please check your connection.");
      setTimeout(() => window.location.reload(), 1500);
    } else {
      alert("Unexpected error occurred. Please try again.");
    }
  }
};

// ---------------------- Log Cash ----------------------
const handleLogCash = async (orderId) => {
  try {
    const cash = prompt("Enter cash spent (in KES):");
    if (!cash || isNaN(cash) || cash <= 0) {
      alert("Please enter a valid amount greater than zero.");
      return;
    }
    const res = await api.post(`/api/orders/${orderId}/cash`, { cash_spent: Number(cash) });
    alert(res.data.message || "Cash logged successfully!");
    fetchAssignedOrders();
  } catch (err) {
    console.error("handleLogCash error:", err.response?.data || err.message);
    alert(err.response?.data?.message || "Failed to log cash spent.");
  }
};

// ---------------------- Mark Delivered ----------------------
const handleMarkDelivered = async (orderId) => {
  try {
    const confirmDeliver = window.confirm("Mark this order as delivered?");
    if (!confirmDeliver) return;
    const res = await api.post(`/api/orders/${orderId}/delivered`);
    alert(res.data.message || "Order marked as delivered!");
    fetchAssignedOrders();
  } catch (err) {
    console.error("handleMarkDelivered error:", err.response?.data || err.message);
    alert(err.response?.data?.message || "Failed to mark as delivered.");
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
          <div style={{ marginTop: 10 }}>
  <label>
    License Expiry Date:
    <input 
      type="date" 
      value={licenseExpiry || (driverInfo?.license_expiry_date ? driverInfo.license_expiry_date.split('T')[0] : '')} 
      onChange={(e) => setLicenseExpiry(e.target.value)} 
      style={{ marginLeft: 5 }} 
    />
  </label>
  <button onClick={handleLicenseExpiryUpdate} style={{ marginLeft: 10 }}>
    Update Expiry Date
  </button>
</div>

{/* --- Personal Information Section --- */}
<div style={{ marginTop: 30 }}>
  <h3>Personal Information</h3>

  <div style={{ marginTop: 10 }}>
    <label>Full Name:</label>
    <input
      type="text"
      value={driverInfo.full_name || ""}
      onChange={(e) =>
        setDriverInfo({ ...driverInfo, full_name: e.target.value })
      }
      style={{ marginLeft: 10 }}
    />
  </div>

  <div style={{ marginTop: 10 }}>
    <label>ID Number:</label>
    <input
      type="text"
      value={driverInfo.id_number || ""}
      onChange={(e) =>
        setDriverInfo({ ...driverInfo, id_number: e.target.value })
      }
      style={{ marginLeft: 10 }}
    />
  </div>

  <div style={{ marginTop: 10 }}>
    <label>Phone Number:</label>
    <input
      type="text"
      value={driverInfo.phone_number || ""}
      onChange={(e) =>
        setDriverInfo({ ...driverInfo, phone_number: e.target.value })
      }
      style={{ marginLeft: 10 }}
    />
  </div>

  <div style={{ marginTop: 10 }}>
    <label>Email:</label>
    <input
      type="email"
      value={driverInfo.email || ""}
      onChange={(e) =>
        setDriverInfo({ ...driverInfo, email: e.target.value })
      }
      style={{ marginLeft: 10 }}
    />
  </div>

  <div style={{ marginTop: 10 }}>
    <label>Address:</label>
    <input
      type="text"
      value={driverInfo.address || ""}
      onChange={(e) =>
        setDriverInfo({ ...driverInfo, address: e.target.value })
      }
      style={{ marginLeft: 10 }}
    />
  </div>

  <button
    onClick={async () => {
      try {
        const payload = {
          full_name: driverInfo.full_name,
          id_number: driverInfo.id_number,
          phone_number: driverInfo.phone_number,
          email: driverInfo.email,
          address: driverInfo.address,
        };
        const res = await api.put(`/api/drivers/${userId}`, payload);
        alert("Personal information updated successfully!");
        setDriverInfo(res.data);
      } catch (err) {
        console.error("Personal info update error:", err);
        alert("Failed to update personal information");
      }
    }}
    style={{
      marginTop: 15,
      backgroundColor: "#007bff",
      color: "white",
      border: "none",
      padding: "6px 12px",
      borderRadius: 3,
      cursor: "pointer",
    }}
  >
    Save Personal Info
  </button>
</div>
{/* --- Policy Acceptance Section --- */}
          <div style={{ marginTop: 30 }}>
            <h3>Policy Acceptance</h3>

            <div style={{ marginTop: 10 }}>
              <label>
                <input
                  type="checkbox"
                  checked={policyAccepted}
                  onChange={(e) => setPolicyAccepted(e.target.checked)}
                  style={{ marginRight: 5 }}
                />
                I accept the company policies
              </label>
            </div>

            <div style={{ marginTop: 10 }}>
              <label>
                <input
                  type="checkbox"
                  checked={safetyGuidelinesAccepted}
                  onChange={(e) => setSafetyGuidelinesAccepted(e.target.checked)}
                  style={{ marginRight: 5 }}
                />
                I have read and agree to the safety guidelines
              </label>
            </div>

            <button
              onClick={async () => {
                try {
                  const payload = {
                   safety_policy_accepted: policyAccepted,
                   driver_policy_accepted: safetyGuidelinesAccepted,
                   company_policy_accepted: true,
                  };
                  const res = await api.put(`/api/drivers/${userId}/policies`, payload);
                  alert("Policy acceptance updated successfully!");
                  setDriverInfo(res.data);
                } catch (err) {
                  console.error("Policy update error:", err);
                  alert("Failed to update policy acceptance");
                }
              }}
              style={{
                marginTop: 15,
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                padding: "6px 12px",
                borderRadius: 3,
                cursor: "pointer",
              }}
            >
              Save Policy Acceptance
            </button>
          </div>

{/* --- Next of Kin & Referee Section --- */}
<div style={{ marginTop: 30 }}>
  <h3>Next of Kin & Referee Information</h3>

  <div style={{ marginTop: 10 }}>
    <label>Next of Kin Name:</label>
    <input
      type="text"
      value={driverInfo.next_of_kin_name || ""}
      onChange={(e) =>
        setDriverInfo({ ...driverInfo, next_of_kin_name: e.target.value })
      }
      style={{ marginLeft: 10 }}
    />
  </div>

  <div style={{ marginTop: 10 }}>
    <label>Next of Kin Phone:</label>
    <input
      type="text"
      value={driverInfo.next_of_kin_phone || ""}
      onChange={(e) =>
        setDriverInfo({ ...driverInfo, next_of_kin_phone: e.target.value })
      }
      style={{ marginLeft: 10 }}
    />
  </div>

  <div style={{ marginTop: 10 }}>
    <label>Referee Name:</label>
    <input
      type="text"
      value={driverInfo.referee_name || ""}
      onChange={(e) =>
        setDriverInfo({ ...driverInfo, referee_name: e.target.value })
      }
      style={{ marginLeft: 10 }}
    />
  </div>

  <div style={{ marginTop: 10 }}>
    <label>Referee Phone:</label>
    <input
      type="text"
      value={driverInfo.referee_phone || ""}
      onChange={(e) =>
        setDriverInfo({ ...driverInfo, referee_phone: e.target.value })
      }
      style={{ marginLeft: 10 }}
    />
  </div>

  <button
    onClick={async () => {
      try {
        const payload = {
          next_of_kin_name: driverInfo.next_of_kin_name,
          next_of_kin_phone: driverInfo.next_of_kin_phone,
          referee_name: driverInfo.referee_name,
          referee_phone: driverInfo.referee_phone,
        };
        const res = await api.put(`/api/drivers/${userId}`, payload);
        alert("Next of Kin & Referee info updated successfully!");
        setDriverInfo(res.data);
      } catch (err) {
        console.error("Kin/Referee update error:", err);
        alert("Failed to update Kin & Referee info");
      }
    }}
    style={{
      marginTop: 15,
      backgroundColor: "#007bff",
      color: "white",
      border: "none",
      padding: "6px 12px",
      borderRadius: 3,
      cursor: "pointer",
    }}
  >
    Save Information
  </button>
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
