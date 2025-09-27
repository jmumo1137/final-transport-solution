import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';

export default function Documents() {
  const { id } = useParams(); // order ID
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDocuments = async () => {
    try {
      const res = await api.get(`/api/documents/${id}`);
      setUploadedDocs(res.data || []);
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

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'pod'); // mark as POD

    try {
      setLoading(true);
      const res = await api.post(`/api/documents/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.ok) {
        alert('POD uploaded successfully!');
        setFile(null);
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

      <div style={{ marginTop: 20 }}>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          accept="image/*,application/pdf"
        />
        <button onClick={handleUpload} disabled={loading} style={{ marginLeft: 10 }}>
          {loading ? 'Uploading...' : 'Upload POD'}
        </button>
      </div>

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
                {doc.file_path.split('/').pop()} (Uploaded: {new Date(doc.uploaded_at).toLocaleString()})
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
