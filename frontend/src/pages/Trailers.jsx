import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import api from "../api/api";

export default function Trailers() {
  const [trailers, setTrailers] = useState([]);
  const [formData, setFormData] = useState({
    plate_number: "",
    insurance_expiry_date: "",
    insurance_file: null,
    comesa_number: "",
    comesa_expiry_date: "",
    inspection_expiry_date: "",
    inspection_file: null,
  });

  const tableRef = useRef(null);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const focusId = searchParams.get("id");
  const focusRef = searchParams.get("ref");
  const focusPlate = searchParams.get("plate");

  // === Fetch all trailers ===
  const fetchTrailers = async () => {
    try {
      const res = await api.get("/api/trailers");
      setTrailers(res.data);
    } catch (err) {
      console.error("❌ Error fetching trailers:", err);
    }
  };

  useEffect(() => {
    fetchTrailers();
  }, []);

  // === Scroll to and highlight focused trailer ===
  useEffect(() => {
    if (!trailers.length) return;

    const row =
      tableRef.current?.querySelector(
        `[data-id="${focusId}"], [data-plate="${focusRef}"], [data-plate="${focusPlate}"]`
      ) || null;

    if (row) {
      row.scrollIntoView({ behavior: "smooth", block: "center" });
      row.style.transition = "background-color 0.3s ease-in-out, outline 0.3s";
      row.style.outline = "3px solid #007bff";
      row.style.backgroundColor = "#e0f0ff";

      setTimeout(() => {
        row.style.outline = "none";
        row.style.backgroundColor = "";
      }, 2500);
    }
  }, [trailers, focusId, focusRef, focusPlate]);

  // === Handle Input Changes ===
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  // === Add Trailer ===
  const handleAddTrailer = async () => {
    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => data.append(key, formData[key]));

      await api.post("/api/trailers", data);
      alert("✅ Trailer added successfully!");
      setFormData({
        plate_number: "",
        insurance_expiry_date: "",
        insurance_file: null,
        comesa_number: "",
        comesa_expiry_date: "",
        inspection_expiry_date: "",
        inspection_file: null,
      });
      fetchTrailers();
    } catch (err) {
      console.error("❌ Error adding trailer:", err);
      alert(err.response?.data?.message || "Failed to add trailer");
    }
  };

  // === Status Logic ===
  const computeStatus = (t) => {
    const today = new Date();
    const soon = 30; // days
    const expired = (d) => d && new Date(d) < today;
    const soonExp = (d) =>
      d && (new Date(d) - today) / (1000 * 60 * 60 * 24) <= soon;

    if (
      expired(t.insurance_expiry_date) ||
      expired(t.comesa_expiry_date) ||
      expired(t.inspection_expiry_date)
    )
      return "Expired";
    if (
      soonExp(t.insurance_expiry_date) ||
      soonExp(t.comesa_expiry_date) ||
      soonExp(t.inspection_expiry_date)
    )
      return "Expiring Soon";
    return "Valid";
  };

  const getRowColor = (status) => {
    switch (status) {
      case "Expired":
        return "#f8d7da";
      case "Expiring Soon":
        return "#fff3cd";
      default:
        return "#d4edda";
    }
  };

  const expiryTooltip = (date) => {
    if (!date) return "";
    const diff = Math.ceil(
      (new Date(date) - new Date()) / (1000 * 60 * 60 * 24)
    );
    return diff >= 0
      ? `Expires in ${diff} day(s)`
      : `Expired ${Math.abs(diff)} day(s) ago`;
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>🚛 Trailer Management</h2>

      {/* === Add Trailer Section === */}
      <div
        style={{
          marginBottom: 20,
          padding: 15,
          border: "1px solid #ccc",
          borderRadius: 6,
          background: "#fafafa",
        }}
      >
        <h3>Add New Trailer</h3>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "15px",
            alignItems: "flex-end",
          }}
        >
          <div>
            <label>Plate Number:</label>
            <input
              name="plate_number"
              value={formData.plate_number}
              onChange={handleChange}
            />
          </div>

          <div>
            <label>Insurance Expiry:</label>
            <input
              type="date"
              name="insurance_expiry_date"
              value={formData.insurance_expiry_date}
              onChange={handleChange}
            />
          </div>

          <div>
            <label>Insurance File:</label>
            <input type="file" name="insurance_file" onChange={handleChange} />
          </div>

          <div>
            <label>COMESA Number:</label>
            <input
              name="comesa_number"
              value={formData.comesa_number}
              onChange={handleChange}
            />
          </div>

          <div>
            <label>COMESA Expiry:</label>
            <input
              type="date"
              name="comesa_expiry_date"
              value={formData.comesa_expiry_date}
              onChange={handleChange}
            />
          </div>

          <div>
            <label>Inspection Expiry:</label>
            <input
              type="date"
              name="inspection_expiry_date"
              value={formData.inspection_expiry_date}
              onChange={handleChange}
            />
          </div>

          <div>
            <label>Inspection File:</label>
            <input type="file" name="inspection_file" onChange={handleChange} />
          </div>

          <div>
            <button
              onClick={handleAddTrailer}
              style={{
                padding: "6px 15px",
                backgroundColor: "#007bff",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              Add Trailer
            </button>
          </div>
        </div>
      </div>

      {/* === Trailer Table === */}
      <table
        ref={tableRef}
        border="1"
        cellPadding="6"
        style={{ width: "100%", borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th>ID</th>
            <th>Plate Number</th>
            <th>Insurance Expiry</th>
            <th>COMESA Number</th>
            <th>COMESA Expiry</th>
            <th>Inspection Expiry</th>
            <th>Status</th>
            <th>Files</th>
          </tr>
        </thead>
        <tbody>
          {trailers.map((t) => {
            const status = computeStatus(t);
            return (
              <tr
                key={t.trailer_id}
                data-id={t.trailer_id}
                data-plate={t.plate_number}
                style={{
                  backgroundColor: getRowColor(status),
                  transition: "0.2s",
                }}
              >
                <td>{t.trailer_id}</td>
                <td>{t.plate_number}</td>
                <td title={expiryTooltip(t.insurance_expiry_date)}>
                  {t.insurance_expiry_date || "-"}
                </td>
                <td>{t.comesa_number || "-"}</td>
                <td title={expiryTooltip(t.comesa_expiry_date)}>
                  {t.comesa_expiry_date || "-"}
                </td>
                <td title={expiryTooltip(t.inspection_expiry_date)}>
                  {t.inspection_expiry_date || "-"}
                  {(status === "Expired" || status === "Expiring Soon") && (
                    <button
                      onClick={() =>
                        window.open("https://ntsa.go.ke/inspection-renewal")
                      }
                      style={{
                        marginLeft: 10,
                        padding: "3px 8px",
                        backgroundColor: "#007bff",
                        color: "#fff",
                        border: "none",
                        borderRadius: 3,
                        cursor: "pointer",
                      }}
                    >
                      Renew NTSA
                    </button>
                  )}
                </td>
                <td>{status}</td>
                <td>
                  {t.insurance_file && (
                    <a
                      href={`http://localhost:5000/uploads/trailers/${t.insurance_file}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Insurance 📎
                    </a>
                  )}
                  {"  "}
                  {t.inspection_file && (
                    <a
                      href={`http://localhost:5000/uploads/trailers/${t.inspection_file}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Inspection 📎
                    </a>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
