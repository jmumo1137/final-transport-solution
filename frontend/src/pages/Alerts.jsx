import React, { useEffect, useState } from 'react';
import api from '../api/api';

export default function Alerts() {
    const [alerts, setAlerts] = useState([]);

    const fetchAlerts = async () => {
        const res = await api.get('/alerts');
        setAlerts(res.data);
    };

    const resolveAlert = async (id) => {
        await api.put(`/alerts/${id}/resolve`);
        fetchAlerts();
    };

    useEffect(() => { fetchAlerts(); }, []);

    return (
        <div>
            <h2>Alerts</h2>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Entity Type</th>
                        <th>Entity ID</th>
                        <th>Alert Type</th>
                        <th>Alert Date</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {alerts.map(a => (
                        <tr key={a.id}>
                            <td>{a.id}</td>
                            <td>{a.entity_type}</td>
                            <td>{a.entity_id}</td>
                            <td>{a.alert_type}</td>
                            <td>{a.alert_date}</td>
                            <td>{a.status}</td>
                            <td>
                                {a.status === 'pending' && <button onClick={() => resolveAlert(a.id)}>Resolve</button>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
