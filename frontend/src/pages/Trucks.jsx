import React, { useEffect, useState } from 'react';
import api from '../api/api';

export default function Trucks() {
  const [trucks, setTrucks] = useState([]);

  // Add Truck form state
  const [plateNumber, setPlateNumber] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [insuranceFile, setInsuranceFile] = useState(null);
  const [comesaNumber, setComesaNumber] = useState('');
  const [comesaExpiry, setComesaExpiry] = useState('');
  const [inspectionExpiry, setInspectionExpiry] = useState('');
  const [inspectionFile, setInspectionFile] = useState(null);

  // Fetch trucks from backend
  const fetchTrucks = async () => {
    try {
      const res = await api.get('/api/trucks');
      setTrucks(res.data);
    } catch (err) {
      console.error('Fetch trucks error:', err);
    }
  };

  useEffect(() => { fetchTrucks(); }, []);

  // Add new truck
  const addTruck = async () => {
    try {
      const formData = new FormData();
      formData.append('plate_number', plateNumber);
      formData.append('insurance_expiry_date', insuranceExpiry);
      formData.append('insurance_file', insuranceFile);
      formData.append('comesa_number', comesaNumber);
      formData.append('comesa_expiry_date', comesaExpiry);
      formData.append('inspection_expiry_date', inspectionExpiry);
      formData.append('inspection_file', inspectionFile);

      await api.post('/api/trucks', formData);

      // Reset form
      setPlateNumber('');
      setInsuranceExpiry('');
      setInsuranceFile(null);
      setComesaNumber('');
      setComesaExpiry('');
      setInspectionExpiry('');
      setInspectionFile(null);

      fetchTrucks();
    } catch (err) {
      console.error('Add truck error:', err);
      alert(err.response?.data?.message || 'Failed to add truck');
    }
  };

  // Compute truck status
  const getTruckStatus = (truck) => {
    const today = new Date();
    const expiringSoonDays = 30;

    const isExpired = (date) => !date ? false : new Date(date) < today;
    const isExpiringSoon = (date) => !date ? false : ((new Date(date) - today)/(1000*60*60*24)) <= expiringSoonDays;

    if (isExpired(truck.insurance_expiry_date) || isExpired(truck.comesa_expiry_date) || isExpired(truck.inspection_expiry_date)) return 'Expired';
    if (isExpiringSoon(truck.insurance_expiry_date) || isExpiringSoon(truck.comesa_expiry_date) || isExpiringSoon(truck.inspection_expiry_date)) return 'Expiring Soon';
    return 'Valid';
  };

  const getRowColor = (status) => {
    if (status === 'Valid') return '#d4edda';
    if (status === 'Expiring Soon') return '#fff3cd';
    if (status === 'Expired') return '#f8d7da';
    return '#ffffff';
  };

  const getExpiryTooltip = (date) => {
    if (!date) return '';
    const today = new Date();
    const expDate = new Date(date);
    const diffDays = Math.ceil((expDate - today) / (1000*60*60*24));
    return diffDays >= 0 ? `Expires in ${diffDays} day(s)` : `Expired ${Math.abs(diffDays)} day(s) ago`;
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Trucks</h2>

      {/* Add Truck Form */}
      <div style={{ marginBottom: '20px', border: '1px solid #ccc', padding: 10, borderRadius: 5 }}>
        <h3>Add Truck</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'flex-end' }}>
          <div>
            <label>Plate Number:</label><br/>
            <input value={plateNumber} onChange={e => setPlateNumber(e.target.value)} />
          </div>

          <div>
            <label>Insurance Expiry:</label><br/>
            <input type="date" value={insuranceExpiry} onChange={e => setInsuranceExpiry(e.target.value)} />
          </div>

          <div>
            <label>Insurance File:</label><br/>
            <input type="file" onChange={e => setInsuranceFile(e.target.files[0])} />
          </div>

          <div>
            <label>COMESA Number:</label><br/>
            <input value={comesaNumber} onChange={e => setComesaNumber(e.target.value)} />
          </div>

          <div>
            <label>COMESA Expiry:</label><br/>
            <input type="date" value={comesaExpiry} onChange={e => setComesaExpiry(e.target.value)} />
          </div>

          <div>
            <label>Inspection Expiry:</label><br/>
            <input type="date" value={inspectionExpiry} onChange={e => setInspectionExpiry(e.target.value)} />
          </div>

          <div>
            <label>Inspection File:</label><br/>
            <input type="file" onChange={e => setInspectionFile(e.target.files[0])} />
          </div>

          <div>
            <button onClick={addTruck} style={{ padding: '5px 15px', marginTop: 18 }}>Add Truck</button>
          </div>
        </div>
      </div>

      {/* Trucks Table */}
      <table border="1" cellPadding="5" style={{ width: '100%' }}>
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
          {trucks.map(truck => {
            const status = getTruckStatus(truck);
            return (
              <tr key={truck.truck_id} style={{ backgroundColor: getRowColor(status) }}>
                <td>{truck.truck_id}</td>
                <td>{truck.plate_number}</td>
                <td title={getExpiryTooltip(truck.insurance_expiry_date)}>
                  {truck.insurance_expiry_date}
                </td>
                <td>{truck.comesa_number || '-'}</td>
                <td title={getExpiryTooltip(truck.comesa_expiry_date)}>
                  {truck.comesa_expiry_date || '-'}
                </td>
                <td title={getExpiryTooltip(truck.inspection_expiry_date)}>
                  {truck.inspection_expiry_date}

                  {/* NTSA button for Expired or Expiring Soon */}
                  {(status === 'Expired' || status === 'Expiring Soon') && (
                    <button
                      onClick={() => window.open('https://ntsa.go.ke/inspection-renewal', '_blank')}
                      style={{
                        marginLeft: 8,
                        padding: '3px 8px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: 3,
                        cursor: 'pointer'
                      }}
                      title="Go to NTSA Inspection Renewal"
                    >
                      Renew NTSA
                    </button>
                  )}
                </td>
                <td>{status}</td>
                <td>
                  {truck.insurance_file && (
                    <a 
                      href={`http://localhost:5000/uploads/trucks/${truck.insurance_file}`} 
                      target="_blank" rel="noreferrer"
                      title="View Insurance Document"
                    >
                      Insurance 📎
                    </a>
                  )}
                  {' '}
                  {truck.inspection_file && (
                    <a 
                      href={`http://localhost:5000/uploads/trucks/${truck.inspection_file}`} 
                      target="_blank" rel="noreferrer"
                      title="View Inspection Document"
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
