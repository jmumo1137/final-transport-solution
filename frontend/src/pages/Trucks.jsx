import React, { useEffect, useState } from 'react';
import api from '../api/api'; // your axios instance

export default function Trucks() {
    const [trucks, setTrucks] = useState([]);
    const [plateNumber, setPlateNumber] = useState('');
    const [insuranceExpiry, setInsuranceExpiry] = useState('');
    const [comesaNumber, setComesaNumber] = useState('');

    const fetchTrucks = async () => {
        const res = await api.get('/trucks');
        setTrucks(res.data);
    };

    const addTruck = async () => {
        await api.post('/trucks', {
            plate_number: plateNumber,
            insurance_expiry_date: insuranceExpiry,
            comesa_number: comesaNumber
        });
        setPlateNumber('');
        setInsuranceExpiry('');
        setComesaNumber('');
        fetchTrucks();
    };

    useEffect(() => { fetchTrucks(); }, []);

    return (
        <div>
            <h2>Trucks</h2>
            <div>
                <input placeholder="Plate Number" value={plateNumber} onChange={e => setPlateNumber(e.target.value)} />
                <input type="date" placeholder="Insurance Expiry" value={insuranceExpiry} onChange={e => setInsuranceExpiry(e.target.value)} />
                <input placeholder="COMESA Number" value={comesaNumber} onChange={e => setComesaNumber(e.target.value)} />
                <button onClick={addTruck}>Add Truck</button>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Plate Number</th>
                        <th>Insurance Expiry</th>
                        <th>COMESA Number</th>
                    </tr>
                </thead>
                <tbody>
                    {trucks.map(t => (
                        <tr key={t.id}>
                            <td>{t.id}</td>
                            <td>{t.plate_number}</td>
                            <td>{t.insurance_expiry_date}</td>
                            <td>{t.comesa_number}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
