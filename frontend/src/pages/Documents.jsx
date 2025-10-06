import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';

export default function Documents() {
  const { id } = useParams(); // order ID
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [quantityDelivered, setQuantityDelivered] = useState('');
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalDelivered, setTotalDelivered] = useState(0); // NEW

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

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file to upload!');
      return;
    }
    if (!quantityDelivered || isNaN(quantityDelivered) || quantityDelivered <= 0) {
      alert('Please enter a valid quantity delivered!');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'pod'); // mark as POD
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

  return (
    <div style={{ padding: 20 }}>
      <h1>Upload POD - Order {id}</h1>
      <button onClick={() => navigate(-1)}>Back</button>

      <div style={{ marginTop: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          accept="image/*,application/pdf"
        />
        <input
          type="number"
          placeholder="Quantity Delivered"
          value={quantityDelivered}
          onChange={(e) => setQuantityDelivered(e.target.value)}
          style={{ padding: 5, width: 150 }}
        />
        <button onClick={handleUpload} disabled={loading}>
          {loading ? 'Uploading...' : 'Upload POD'}
        </button>
      </div>

      <h3 style={{ marginTop: 20 }}>Total Quantity Delivered: {totalDelivered}</h3>

      <h3 style={{ marginTop: 30 }}>Uploaded PODs:</h3>
      {uploadedDocs.length === 0 ? (
        <p>No PODs uploaded yet.</p>
      ) : (
        <ul>
          {uploadedDocs.map((doc) => (
            <li key={doc.id}>
              <a
                href={`http://localhost:5000/${doc.file_path}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {doc.file_path.split('/').pop()} (Quantity: {doc.quantity_delivered || '-'}, Uploaded: {new Date(doc.uploaded_at).toLocaleString()})
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
