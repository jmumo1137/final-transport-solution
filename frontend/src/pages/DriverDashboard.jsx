import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import api from "../api/api";
import { selectUserId, selectUserRole } from "../features/auth/authSlice";

export default function DriverDashboard() {
  const [driverInfo, setDriverInfo] = useState(null);
  const [files, setFiles] = useState({});
  const role = useSelector(selectUserRole);
  const userId = useSelector(selectUserId);

  // Fetch driver info
  const fetchDriverInfo = async () => {
    try {
      const res = await api.get(`/api/drivers/${userId}`);
      setDriverInfo(res.data);
    } catch (err) {
      console.error("fetchDriverInfo error:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    if (role === "driver") fetchDriverInfo();
  }, [role, userId]);

  // Handle file selection
  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    setFiles(prev => ({ ...prev, [name]: selectedFiles[0] }));
  };

  // Upload handler
  const handleUpload = async (docType) => {
    if (!files[docType]) return;

    const formData = new FormData();
    formData.append(docType, files[docType]);

    try {
      const res = await api.put(`/api/drivers/${userId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert(`${docType} uploaded successfully`);
      setFiles(prev => ({ ...prev, [docType]: null }));
      setDriverInfo(res.data); // instantly update frontend without fetch
    } catch (err) {
      console.error("Upload error:", err.response?.data || err.message);
      alert("Upload failed");
    }
  };

  // Expiry/status checker
  const checkExpiry = (dateStr) => {
    if (!dateStr) return { status: "Missing", color: "gray" };
    const today = new Date();
    const expiry = new Date(dateStr);
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { status: "Expired", color: "red" };
    if (diffDays <= 30) return { status: "Expiring Soon", color: "orange" };
    return { status: "Valid", color: "green" };
  };

  // Render Driver Info / Uploads
  const renderDriverTab = () => (
    <div>
      <h2>Driver Info & Compliance</h2>
      {driverInfo ? (
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
              const { status, color } = checkExpiry(expiryDate);

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
                    <button
                      onClick={() => handleUpload(doc.key)}
                      disabled={!files[doc.key]}
                      style={{ marginLeft: 5 }}
                    >
                      Upload
                    </button>
                  </td>
                  <td style={{ color }}>{status}</td>
                </tr>
              );
            })}
            <tr>
              <td colSpan="5">
                <strong>Username: </strong> {driverInfo.username}
              </td>
            </tr>
          </tbody>
        </table>
      ) : (
        <p>No driver info found</p>
      )}
    </div>
  );

  return <div style={{ padding: 20 }}>{role === "driver" && renderDriverTab()}</div>;
}
