import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../api/api";
import "/src/styles.css"; 
import { useNavigate } from "react-router-dom";

export default function Fuel() {
  const { id } = useParams();
  const [fuelRecords, setFuelRecords] = useState([]);
  const [file, setFile] = useState(null);
  const [liters, setLiters] = useState("");
  const [cost, setCost] = useState("");
  const [cashSpent, setCashSpent] = useState("");
  const [loading, setLoading] = useState(false);
  const [hoverPreview, setHoverPreview] = useState(null);
  const navigate = useNavigate();

  // Fetch previous fuel records
  const fetchFuelRecords = async () => {
    try {
      const res = await api.get(`/api/fuel/${id}`);
      const records = (res.data.fuelRecords || []).map(r => ({
        ...r,
        receipt_url: r.file_path
          ? `http://localhost:5000${r.file_path}` // Ensure this points to your backend
          : null,
      }));
      setFuelRecords(records);
      setCashSpent(res.data.cashSpent || "");
    } catch (err) {
      console.error("Fetch fuel records error:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchFuelRecords();
  }, [id]);

  // Upload new fuel record
  const handleUpload = async () => {
    if (!file || !liters || !cost) return alert("File, liters, and cost are required!");

    const formData = new FormData();
    formData.append("fuel_receipt", file);
    formData.append("liters", liters);
    formData.append("cost", cost);
    if (cashSpent) formData.append("cash_spent", cashSpent);

    try {
      setLoading(true);
      await api.post(`/api/fuel/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFile(null);
      setLiters("");
      setCost("");
      setCashSpent("");
      fetchFuelRecords();
    } catch (err) {
      console.error("Upload error:", err.response?.data || err.message);
      alert(err.response?.data?.error || "Failed to upload fuel record");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Fuel — Order {id}</h1>
      <button onClick={() => navigate(-1)}style={{
    marginTop: 15,
    marginBottom: 15,
    backgroundColor: "blue",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    borderRadius: 6,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.3s ease",
  }}
  onMouseOver={(e) => (e.target.style.backgroundColor = "#5a6268")}
  onMouseOut={(e) => (e.target.style.backgroundColor = "blue")}> Back </button>

      {/* Upload Form */}
      <div style={{ marginBottom: 20 }}>
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        <span style={{ marginLeft: 5 }}>{file ? file.name : "No file chosen"}</span>
        <br />
        <input
          type="number"
          placeholder="Liters"
          value={liters}
          onChange={(e) => setLiters(e.target.value)}
          style={{ marginTop: 5 }}
        />
        <br />
        <input
          type="number"
          placeholder="Cost per Liter"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          style={{ marginTop: 5 }}
        />
        <br />
        <input
          type="number"
          placeholder="Cash Spent"
          value={cashSpent}
          onChange={(e) => setCashSpent(e.target.value)}
          style={{ marginTop: 5 }}
        />
        <br />
        <button onClick={handleUpload} disabled={loading} style={{ marginTop: 10, backgroundColor: "green", borderRadius: 20, padding: "8px 16px",color: "#fff"}}>
          {loading ? "Uploading..." : "Upload Fuel Record"}
        </button>
      </div>

      {/* Hover preview */}
      {hoverPreview && (
        <div
          style={{
            position: "absolute",
            border: "1px solid #ccc",
            padding: 5,
            background: "#fff",
            zIndex: 100,
          }}
        >
          <img src={hoverPreview} alt="Preview" style={{ maxWidth: 200, maxHeight: 200 }} />
        </div>
      )}

      {/* Previous Fuel Records */}
      <h3>Previous Fuel Records</h3>
      {fuelRecords.length === 0 ? (
        <p>No fuel records yet.</p>
      ) : (
        <table border="1" cellPadding="5" style={{ width: "100%", position: "relative" }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Receipt</th>
              <th>Liters</th>
              <th>Cost</th>
              <th>Uploaded At</th>
            </tr>
          </thead>
          <tbody>
            {fuelRecords.map((record) => (
              <tr key={record.id}>
                <td>{record.id}</td>
                <td>
                  {record.receipt_url ? (
                    <span
                      style={{ cursor: "pointer", fontSize: "18px" }}
                      onClick={() => window.open(record.receipt_url, "_blank")}
                      onMouseEnter={() => setHoverPreview(record.receipt_url)}
                      onMouseLeave={() => setHoverPreview(null)}
                      title="View Receipt"
                    >
                      📎
                    </span>
                  ) : (
                    "No file chosen"
                  )}
                </td>
                <td>{record.liters}</td>
                <td>{record.cost}</td>
                <td>{new Date(record.uploaded_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
