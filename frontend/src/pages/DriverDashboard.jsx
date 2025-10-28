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
  const [safetyPolicyAccepted, setSafetyPolicyAccepted] = useState(false);
  const [driverPolicyAccepted, setDriverPolicyAccepted] = useState(false);
  const [companyPolicyAccepted, setCompanyPolicyAccepted] = useState(false);

  const [activeTab, setActiveTab] = useState("documents"); // internal tabs

  const role = useSelector(selectUserRole);
  const userId = useSelector(selectUserId);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

// ---------------------- Fetch Driver Info ----------------------
const fetchDriverInfo = async () => {
  try {
    const res = await api.get(`/api/drivers/${userId}`);
    const u = res.data; 
    setDriverInfo(u);
    setLicenseNumber(u.license_number || "");
    setSafetyPolicyAccepted(u.safety_policy_accepted || false);
    setDriverPolicyAccepted(u.driver_policy_accepted || false);
    setCompanyPolicyAccepted(u.company_policy_accepted || false);
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

  // ---------------------- License Updates ----------------------
  const handleLicenseUpdate = async (newLicenseNumber) => {
    if (!newLicenseNumber) return alert("License number cannot be empty.");
    try {
      const res = await api.put(`/api/drivers/${userId}`, { license_number: newLicenseNumber });
      alert("License number updated successfully");
      setDriverInfo(res.data);
      setLicenseNumber(newLicenseNumber);
    } catch (err) {
      console.error("License update error:", err.response?.data || err.message);
      alert("Failed to update license number");
    }
  };

  const handleLicenseExpiryUpdate = async (newLicenseExpiry) => {
    if (!newLicenseExpiry) return alert("Please enter the license expiry date.");
    try {
      const res = await api.put(`/api/drivers/${userId}`, { license_expiry_date: newLicenseExpiry });
      alert("License expiry date updated successfully");
      setDriverInfo(res.data);
      setLicenseExpiry(newLicenseExpiry)
    } catch (err) {
      console.error("License expiry update error:", err.response?.data || err.message);
      alert("Failed to update license expiry date");
    }
  };

  // ---------------------- Document Status Helpers ----------------------
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

  // ---------------------- Order Actions ----------------------
  const handleLoadOrder = async (orderId) => {
    if (!safetyPolicyAccepted || !driverPolicyAccepted || !companyPolicyAccepted) return alert("You must accept the policies before loading any orders.");
    try {
      const quantity = prompt("Enter quantity loaded (in tons or liters):");
      if (!quantity || isNaN(quantity) || quantity <= 0) return alert("Please enter a valid quantity greater than zero.");
      const res = await api.post(`/api/orders/${orderId}/loaded`, { quantity_loaded: Number(quantity) });
      alert(res.data.message || "Order marked as loaded!");
      fetchAssignedOrders();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to mark order as loaded.");
    }
  };

  const handleStartJourney = async (orderId) => {
    if (!safetyPolicyAccepted || !driverPolicyAccepted || !companyPolicyAccepted) return alert("You must accept the policies before starting the journey.");
    try {
      if (!window.confirm("Start the journey for this order?")) return;
      const res = await api.post(`/api/orders/${orderId}/enroute`);
      alert(res.data.message || "Journey started successfully!");
      fetchAssignedOrders();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to start journey.");
    }
  };

  const handleLogCash = async (orderId) => {
    try {
      const cash = prompt("Enter cash spent (in KES):");
      if (!cash || isNaN(cash) || cash <= 0) return alert("Please enter a valid amount greater than zero.");
      const res = await api.post(`/api/orders/${orderId}/cash`, { cash_spent: Number(cash) });
      alert(res.data.message || "Cash logged successfully!");
      fetchAssignedOrders();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to log cash spent.");
    }
  };

  const handleMarkDelivered = async (orderId) => {
    try {
      if (!window.confirm("Mark this order as delivered?")) return;
      const res = await api.post(`/api/orders/${orderId}/delivered`);
      alert(res.data.message || "Order marked as delivered!");
      fetchAssignedOrders();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to mark as delivered.");
    }
  };
 const totalPages = Math.ceil(assignedOrders.length / ordersPerPage);
 const indexOfLast = currentPage * ordersPerPage;
 const indexOfFirst = indexOfLast - ordersPerPage;
 const currentOrders = assignedOrders.slice(indexOfFirst, indexOfLast);


  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };
  // ---------------------- Internal Tabs ----------------------
const DocumentsTab = ({
  driverInfo,
  files,
  setFiles,
  handleUpload,
  handleLicenseUpdate,
  handleLicenseExpiryUpdate
}) => {
  if (!driverInfo) return <p>Loading driver info...</p>;

  // Local state for smooth typing
  const [localLicenseNumber, setLocalLicenseNumber] = useState(driverInfo.license_number || "");
  const [localLicenseExpiry, setLocalLicenseExpiry] = useState(driverInfo.license_expiry_date || "");

  // Keep local state in sync if driverInfo updates
  useEffect(() => {
    setLocalLicenseNumber(driverInfo.license_number || "");
    setLocalLicenseExpiry(driverInfo.license_expiry_date || "");
  }, [driverInfo]);

  const handleFileChangeLocal = (e) => {
    const { name, files: selectedFiles } = e.target;
    setFiles(prev => ({ ...prev, [name]: selectedFiles[0] }));
  };

  const documents = [
    { key: "license_file", label: "License", expiry: "license_expiry_date", uploaded: "license_file_uploaded_at" },
    { key: "passport_photo", label: "Passport Photo", expiry: null, uploaded: "passport_photo_uploaded_at" },
    { key: "good_conduct_certificate", label: "Good Conduct Certificate", expiry: null, uploaded: "good_conduct_certificate_uploaded_at" },
    { key: "port_pass", label: "Port Pass", expiry: null, uploaded: "port_pass_uploaded_at" },
  ];

  const getExpiryTooltip = (date) => {
    if (!date) return '';
    const diffDays = Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? `Expires in ${diffDays} day(s)` : `Expired ${Math.abs(diffDays)} day(s) ago`;
  };

  const getUploadTooltip = (date) => {
    if (!date) return '';
    return `Uploaded: ${new Date(date).toLocaleDateString()}`;
  };

  const checkStatus = (fileName, expiryDate = null) => {
    if (!fileName) return { status: "Missing", color: "#f8f9fa" };
    if (expiryDate) {
      const diffDays = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) return { status: "Expired", color: "#f8d7da" };
      if (diffDays <= 30) return { status: "Expiring Soon", color: "#fff3cd" };
    }
    return { status: "Valid", color: "#d4edda" };
  };

  return (
    <div>
      <h3>Documents</h3>
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
          {documents.map(doc => {
            const fileName = driverInfo?.[doc.key] || null;
            const expiryDate = doc.expiry ? driverInfo?.[doc.expiry] : null;
            const uploadedDate = doc.uploaded ? driverInfo?.[doc.uploaded] : null;
            const { status, color } = checkStatus(fileName, expiryDate);

            return (
              <tr key={doc.key} style={{ backgroundColor: color }}>
                <td>{doc.label}</td>
                <td title={fileName ? getUploadTooltip(uploadedDate) : "Not uploaded"}>
                  {fileName ? (
                    <a href={`http://localhost:5000/uploads/driver/${fileName}`} target="_blank" rel="noreferrer">
                      {doc.label} 📎
                    </a>
                  ) : "Not uploaded"}
                </td>
                <td title={expiryDate ? getExpiryTooltip(expiryDate) : ""}>{expiryDate || "N/A"}</td>
                <td>
                  <input key={files[doc.key] ? files[doc.key].name : "empty"} type="file" name={doc.key} onChange={handleFileChangeLocal} style={{ marginRight: 5 }} />
                  {files[doc.key] && <span>{files[doc.key].name}</span>}
                  <button
                    onClick={() => handleUpload(doc.key)}
                    disabled={!files[doc.key]}
                    style={{ marginLeft: 5, backgroundColor: "#007bff", color: "#fff", border: "none", padding: "5px 10px", borderRadius: 3 }}
                  >
                    Upload
                  </button>
                </td>
                <td>{status}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* ------------------ License Updates ------------------ */}
<div style={{ marginTop: 20 }}>
  <label>
    License Number:
    <input
      type="text"
      value={localLicenseNumber}                  // local state
      onChange={(e) => setLocalLicenseNumber(e.target.value)}
      style={{ marginLeft: 5 }}
    />
  </label>
  <button
    onClick={() => handleLicenseUpdate(localLicenseNumber)}  // send local to parent
    style={{ marginLeft: 10, backgroundColor: "green", color: "#fff", border: "none", padding: "5px 10px", borderRadius: 3 }}
  >
    Update License
  </button>
</div>

<div style={{ marginTop: 10 }}>
  <label>
    License Expiry:
    <input
      type="date"
      value={localLicenseExpiry}  
      onChange={(e) => setLocalLicenseExpiry(e.target.value)}
      style={{ marginLeft: 5 }}
    />
  </label>
  <button
    onClick={() => handleLicenseExpiryUpdate(localLicenseExpiry)} 
    style={{ marginLeft: 10, backgroundColor: "orange", color: "#fff", border: "none", padding: "5px 10px", borderRadius: 3 }}
  >
    Update Expiry
  </button>
</div>

    </div>
  );
};


  // PersonalInfoTab, NextOfKinTab, PolicyTab remain exactly as your previous code
  const PersonalInfoTab = () => {
  // Local states for each field
  const [fullName, setFullName] = useState(driverInfo.full_name || "");
  const [idNumber, setIdNumber] = useState(driverInfo.id_number || "");
  const [phoneNumber, setPhoneNumber] = useState(driverInfo.phone_number || "");
  const [email, setEmail] = useState(driverInfo.email || "");
  const [residence, setResidence] = useState(driverInfo.residence || "");
  const [kraPin, setKraPin] = useState(driverInfo.kra_pin || "");
  const [nssfNumber, setNssfNumber] = useState(driverInfo.nssf_number || "");
  const [nhifNumber, setNhifNumber] = useState(driverInfo.nhif_number || "");

  // Keep local states in sync if driverInfo changes (on first load or after save)
  useEffect(() => {
    if (!driverInfo) return;
    setFullName(driverInfo.full_name || "");
    setIdNumber(driverInfo.id_number || "");
    setPhoneNumber(driverInfo.phone_number || "");
    setEmail(driverInfo.email || "");
    setResidence(driverInfo.residence || "");
    setKraPin(driverInfo.kra_pin || "");
    setNssfNumber(driverInfo.nssf_number || "");
    setNhifNumber(driverInfo.nhif_number || "");
  }, [driverInfo]);

  const handleSave = async () => {
    try {
      const payload = {
        full_name: fullName,
        id_number: idNumber,
        phone_number: phoneNumber,
        email,
        residence,
        kra_pin: kraPin,
        nssf_number: nssfNumber,
        nhif_number: nhifNumber,
      };
      const res = await api.put(`/api/drivers/${userId}`, payload);
      alert("Personal information updated successfully!");
      setDriverInfo(res.data); // sync backend response
    } catch (err) {
      console.error(err);
      alert("Failed to update personal information");
    }
  };

  return (
    <div>
      <h3>Personal Information</h3>
      {[
        { label: "Full Name", value: fullName, setter: setFullName },
        { label: "ID Number", value: idNumber, setter: setIdNumber },
        { label: "Phone Number", value: phoneNumber, setter: setPhoneNumber },
        { label: "Email", value: email, setter: setEmail },
        { label: "Residence", value: residence, setter: setResidence },
        { label: "KRA PIN", value: kraPin, setter: setKraPin },
        { label: "NSSF Number", value: nssfNumber, setter: setNssfNumber },
        { label: "NHIF Number", value: nhifNumber, setter: setNhifNumber },
      ].map(field => (
        <div key={field.label} style={{ marginTop: 10 }}>
          <label>{field.label}:</label>
          <input
            type="text"
            value={field.value}
            onChange={(e) => field.setter(e.target.value)}
            style={{ marginLeft: 10 }}
          />
        </div>
      ))}
      <button
        onClick={handleSave}
        style={{
          marginTop: 15,
          backgroundColor: "#17a2b8",
          color: "#fff",
          border: "none",
          padding: "5px 10px",
          borderRadius: 3
        }}
      >
        Save Personal Info
      </button>
    </div>
  );
};
const NextOfKinTab = () => {
  // Local states for smooth typing
  const [kinName, setKinName] = useState(driverInfo.next_of_kin_name || "");
  const [kinPhone, setKinPhone] = useState(driverInfo.next_of_kin_phone || "");
  const [kinRelationship, setKinRelationship] = useState(driverInfo.next_of_kin_relationship || "");

  useEffect(() => {
    if (!driverInfo) return;
    setKinName(driverInfo.next_of_kin_name || "");
    setKinPhone(driverInfo.next_of_kin_phone || "");
    setKinRelationship(driverInfo.next_of_kin_relationship || "");
  }, [driverInfo]);

  const handleKinSave = async () => {
    try {
      const payload = {
        next_of_kin_name: kinName,
        next_of_kin_phone: kinPhone,
        next_of_kin_relationship: kinRelationship,
      };
      const res = await api.put(`/api/drivers/${userId}`, payload);
      alert("Next of Kin info updated successfully!");
      setDriverInfo(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to update Next of Kin info");
    }
  };

  return (
    <div>
      <h3>Next of Kin</h3>
      <div style={{ marginTop: 10 }}>
        <label>Name:</label>
        <input type="text" value={kinName} onChange={(e) => setKinName(e.target.value)} style={{ marginLeft: 10 }} />
      </div>
      <div style={{ marginTop: 10 }}>
        <label>Phone:</label>
        <input type="text" value={kinPhone} onChange={(e) => setKinPhone(e.target.value)} style={{ marginLeft: 10 }} />
      </div>
      <div style={{ marginTop: 10 }}>
        <label>Relationship:</label>
        <input type="text" value={kinRelationship} onChange={(e) => setKinRelationship(e.target.value)} style={{ marginLeft: 10 }} />
      </div>
      <button
        onClick={handleKinSave}
        style={{
          marginTop: 15,
          backgroundColor: "#ffc107",
          color: "#000",
          border: "none",
          padding: "5px 10px",
          borderRadius: 3,
        }}
      >
        Save Next of Kin Info
      </button>
    </div>
  );
};
 

 const PolicyTab = () => (
  <div>
    <h3 className="text-lg font-semibold mb-2">Policy Acceptance</h3>

    {/* Company Policy */}
    <div className="mb-3">
      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={companyPolicyAccepted}
          onChange={(e) => setCompanyPolicyAccepted(e.target.checked)}
        />
        <span>I accept the company policies</span>
      </label>
    </div>

    {/* Safety Policy */}
    <div className="mb-3">
      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={safetyPolicyAccepted}
          onChange={(e) => setSafetyPolicyAccepted(e.target.checked)}
        />
        <span>I have read and agree to the safety guidelines</span>
      </label>
    </div>

    {/* Driver Policy */}
    <div className="mb-3">
      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={driverPolicyAccepted}
          onChange={(e) => setDriverPolicyAccepted(e.target.checked)}
        />
        <span>I agree to follow driver operational policies</span>
      </label>
    </div>

    {/* Save Button */}
    <button
      onClick={async () => {
        try {
          const payload = {
            safety_policy_accepted: safetyPolicyAccepted,
            driver_policy_accepted: driverPolicyAccepted,
            company_policy_accepted: companyPolicyAccepted,
          };
          const res = await api.put(`/api/drivers/${userId}/policies`, payload);
          alert("Policy acceptance updated successfully!");
          setDriverInfo(res.data);
        } catch (err) {
          console.error(err);
          alert("Failed to update policy acceptance");
        }
      }}style={{
    marginTop: 15,
    backgroundColor: "#ffc107",
    color: "green",
    border: "none",
    padding: "8px 16px",
    borderRadius: 6,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.3s ease",
  }}
  onMouseOver={(e) => (e.target.style.backgroundColor = "#e0a800")}
  onMouseOut={(e) => (e.target.style.backgroundColor = "#ffc107")}
    >
      Save Policy Acceptance
    </button>
  </div>
);


  const renderTabsHeader = () => (
    <div style={{ display: "flex", gap: 20, borderBottom: "1px solid #ccc", marginBottom: 20 }}>
      {["documents", "personal", "nextOfKin", "policy"].map(tab => (
        <div key={tab} onClick={() => setActiveTab(tab)}
          style={{
            cursor: "pointer",
            paddingBottom: 5,
            borderBottom: activeTab === tab ? "2px solid #007bff" : "none"
          }}>
          {tab === "documents" ? "Documents" :
           tab === "personal" ? "Personal Info" :
           tab === "nextOfKin" ? "Next of Kin" :
           "Policy Acceptance"}
        </div>
      ))}
    </div>
  );

  const renderActiveTab = () => {
  if (!driverInfo) return <p>Loading driver info...</p>;
  switch(activeTab) {
    case "documents":
      return (
        <DocumentsTab
          driverInfo={driverInfo}
          files={files}
          setFiles={setFiles}
          licenseNumber={licenseNumber}
          setLicenseNumber={setLicenseNumber}
          licenseExpiry={licenseExpiry}
          setLicenseExpiry={setLicenseExpiry}
          handleUpload={handleUpload}
          handleLicenseUpdate={handleLicenseUpdate}
          handleLicenseExpiryUpdate={handleLicenseExpiryUpdate}
        />
      );
    case "personal":
      return <PersonalInfoTab driverInfo={driverInfo} />;
    case "nextOfKin":
      return <NextOfKinTab driverInfo={driverInfo} />;
    case "policy":
      return <PolicyTab />;
    default:
      return null;
  }
};


  const renderDriverTab = () => (
    <div style={{ padding: 20 }}>
      {renderTabsHeader()}
      {renderActiveTab()}
    </div>
  );

  // ---------------------- Render Assigned Orders ----------------------
  const renderAssignedOrders = () => {
  if (!assignedOrders.length) return <p style={{ padding: 20 }}>No assigned orders.</p>;

  const getInsuranceStatus = (file, expiry) => {
    if (!file) return { status: "Missing", color: "gray" };
    if (!expiry) return { status: "Valid", color: "green" };
    const diffDays = Math.ceil((new Date(expiry) - new Date()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { status: "Expired", color: "red" };
    if (diffDays <= 30) return { status: "Expiring Soon", color: "orange" };
    return { status: "Valid", color: "green" };
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Assigned Orders</h2>
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
          {currentOrders.map(order => {
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
            const canMarkDelivered = status === "pod_uploaded";

            const qtyColor = quantity_delivered < quantity_loaded ? "red" : "black";

            const truckIns = getInsuranceStatus(truck_insurance_file, truck_insurance_expiry);
            const trailerIns = trailer_id ? getInsuranceStatus(trailer_insurance_file, trailer_insurance_expiry) : null;

            return (
              <tr key={id}>
                <td>{id}</td>
                <td>{customer_name}</td>
                <td>{pickup}</td>
                <td>{destination}</td>
                <td style={{ fontWeight: "bold", color:
                  status === "assigned" ? "blue" :
                  status === "loaded" ? "orange" :
                  status === "enroute" ? "green" :
                  status === "delivered" ? "gray" :
                  status === "closed" ? "darkgray" :
                  status === "paid" ? "purple" : "black"
                }}>{status}</td>
                <td style={{ color: qtyColor }}>{quantity_loaded ?? 0}</td>
                <td style={{ color: qtyColor }}>{quantity_delivered ?? 0}</td>
                <td>
                  <div style={{ color: truckIns.color }}>
                    Truck: {truckIns.status}
                    {truck_insurance_file && <> | <a href={`/uploads/insurance/${truck_insurance_file}`} target="_blank" rel="noopener noreferrer">View</a></>}
                  </div>
                  {trailerIns && (
                    <div style={{ color: trailerIns.color }}>
                      Trailer: {trailerIns.status}
                      {trailer_insurance_file && <> | <a href={`/uploads/insurance/${trailer_insurance_file}`} target="_blank" rel="noopener noreferrer">View</a></>}
                    </div>
                  )}
                </td>
                <td>{cash_spent ? `${cash_spent} KES` : "0 KES"}</td>
                <td>
                  {canLoadOrder && <button onClick={() => handleLoadOrder(id)}>Load</button>}
                  {canStartJourney && <button onClick={() => handleStartJourney(id)} style={{ marginLeft: 5 }}>Start</button>}
                  {canLogFuel && <button onClick={() => navigate(`/fuel/${id}`)} style={{ marginLeft: 5 }}>Fuel</button>}
                  {canLogMileage && <button onClick={() => navigate(`/mileage/${id}`)} style={{ marginLeft: 5 }}>Mileage</button>}
                  {canUploadPOD && <button onClick={() => navigate(`/documents/${id}`)} style={{ marginLeft: 5 }}>POD</button>}
                  {canLogCash && <button onClick={() => handleLogCash(id)} style={{ marginLeft: 5 }}>Cash</button>}
                  {canMarkDelivered && <button onClick={() => handleMarkDelivered(id)} style={{ marginLeft: 5 }}>Deliver</button>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{ marginTop: 10, textAlign: "center" }}>
  <button onClick={prevPage} disabled={currentPage === 1}>Previous</button>
  <span style={{ margin: "0 10px" }}>
    Page {currentPage} of {totalPages || 1}
  </span>
  <button onClick={nextPage} disabled={currentPage === totalPages}>Next</button>
</div>

    </div>
  );
};

  // ---------------------- Render Based on Sidebar Route ----------------------
  const path = window.location.pathname;
  if (path === "/dashboard") return renderAssignedOrders();
  if (path === "/driver") return renderDriverTab();
  return <p>Page not found</p>;
}
