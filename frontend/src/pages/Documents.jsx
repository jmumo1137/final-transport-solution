import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';

export default function Documents() {
  const { id } = useParams(); // order ID
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [quantityDelivered, setQuantityDelivered] = useState('');
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [totalDelivered, setTotalDelivered] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hoverPreview, setHoverPreview] = useState(null);

  // Fetch uploaded documents
  const fetchDocuments = async () => {
    try {
      const res = await api.get(`/api/documents/${id}`);
      const docs = res.data || [];
      setUploadedDocs(docs);

      // Calculate total quantity delivered
      const total = docs.reduce((sum, doc) => sum + (Number(doc.quantity_delivered) || 0), 0);
      setTotalDelivered(total);
    } catch (err) {
      console.error('fetchDocuments error:', err.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [id]);

  // Upload POD
  const handleUpload = async () => {
    if (!file) return alert('Please select a file!');
    if (!quantityDelivered || isNaN(quantityDelivered) || quantityDelivered <= 0)
      return alert('Enter a valid quantity delivered!');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'pod');
    formData.append('quantity_delivered', quantityDelivered);

    try {
      setLoading(true);
      const res = await api.post(`/api/documents/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.ok) {
        alert('POD uploaded successfully!');
        setFile(null);
        setQuantityDelivered('');
        fetchDocuments();
      }
    } catch (err) {
      console.error('Upload error:', err.response?.data || err.message);
      alert(err.response?.data?.error || 'Failed to upload POD');
    } finally {
      setLoading(false);
    }
  };

  // Helper to generate file URL with spaces handled
  const getFileUrl = (filePath) =>
    `http://localhost:5000/${encodeURI(filePath.replace(/^\/+/, ''))}`;

  const isImageFile = (filename) => /\.(jpe?g|png|gif|bmp|webp)$/i.test(filename);

  return (
    <div style={{ padding: 20, position: 'relative' }}>
      <h1>Upload POD - Order {id}</h1>
      <button onClick={() => navigate(-1)}style={{
    marginTop: 15,
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
  onMouseOut={(e) => (e.target.style.backgroundColor = "blue")}>Back</button>

      {/* Upload Form */}
      <div style={{ marginTop: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <input
          type="number"
          placeholder="Quantity Delivered"
          value={quantityDelivered}
          onChange={(e) => setQuantityDelivered(e.target.value)}
          style={{ padding: 5, width: 150 }}
        />
        <button onClick={handleUpload} disabled={loading}  style={{ marginTop: 10, backgroundColor: "green", borderRadius: 20, padding: "8px 16px",color: "#fff"}}
 >
          {loading ? 'Uploading...' : 'Upload POD'}
        </button>
      </div>

      {/* Total Delivered */}
      <h3 style={{ marginTop: 20 }}>Total Quantity Delivered: {totalDelivered}</h3>

      {/* Uploaded PODs */}
      <h3 style={{ marginTop: 30 }}>Uploaded PODs:</h3>
      {uploadedDocs.length === 0 ? (
        <p>No PODs uploaded yet.</p>
      ) : (
        <ul>
          {uploadedDocs.map((doc) => {
            const url = getFileUrl(doc.file_path);
            const isImage = isImageFile(doc.file_path);

            return (
              <li key={doc.id} style={{ marginBottom: 5 }}>
                <span
                  style={{ cursor: 'pointer', textDecoration: 'underline', color: 'blue' }}
                  onClick={() => window.open(url, '_blank')}
                  onMouseEnter={() => isImage && setHoverPreview(url)}
                  onMouseLeave={() => setHoverPreview(null)}
                  title="Click to view"
                >
                  {doc.file_path.split('/').pop()} (Qty: {doc.quantity_delivered || '-'}, Uploaded: {new Date(doc.uploaded_at).toLocaleString()})
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {/* Hover Preview */}
      {hoverPreview && (
        <div
          style={{
            position: 'absolute',
            top: 100,
            left: 50,
            border: '1px solid #ccc',
            padding: 5,
            background: '#fff',
            zIndex: 100,
          }}
        >
          <img src={hoverPreview} alt="Preview" style={{ maxWidth: 200, maxHeight: 200 }} />
        </div>
      )}
    </div>
  );
}
