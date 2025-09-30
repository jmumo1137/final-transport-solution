import React, { useEffect, useState } from 'react';
import api from '../api/api';

export default function Assignments() {
    const [assignments, setAssignments] = useState([]);
    const [trucks, setTrucks] = useState([]);
    const [trailers, setTrailers] = useState([]);
    const [selectedTruck, setSelectedTruck] = useState('');
    const [selectedTrailer, setSelectedTrailer] = useState('');

    const fetchData = async () => {
        const [trucksRes, trailersRes, assignmentsRes] = await Promise.all([
            api.get('/trucks'),
            api.get('/trailers'),
            api.get('/assignments')
        ]);
        setTrucks(trucksRes.data);
        setTrailers(trailersRes.data);
        setAssignments(assignmentsRes.data);
    };

    const assignTrailer = async () => {
        await api.post('/assignments', { truck_id: selectedTruck, trailer_id: selectedTrailer });
        setSelectedTruck('');
        setSelectedTrailer('');
        fetchData();
    };

    const unassignTrailer = async (id) => {
        await api.put(`/assignments/${id}/unassign`);
        fetchData();
    };

    useEffect(() => { fetchData(); }, []);

    return (
        <div>
            <h2>Truck-Trailer Assignments</h2>
            <div>
                <select value={selectedTruck} onChange={e => setSelectedTruck(e.target.value)}>
                    <option value="">Select Truck</option>
                    {trucks.map(t => <option key={t.id} value={t.id}>{t.plate_number}</option>)}
                </select>
                <select value={selectedTrailer} onChange={e => setSelectedTrailer(e.target.value)}>
                    <option value="">Select Trailer</option>
                    {trailers.map(tr => <option key={tr.id} value={tr.id}>{tr.plate_number}</option>)}
                </select>
                <button onClick={assignTrailer}>Assign Trailer</button>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Truck</th>
                        <th>Trailer</th>
                        <th>Assigned Date</th>
                        <th>Unassigned Date</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {assignments.map(a => (
                        <tr key={a.id}>
                            <td>{a.id}</td>
                            <td>{a.truck_plate}</td>
                            <td>{a.trailer_plate}</td>
                            <td>{a.assigned_date}</td>
                            <td>{a.unassigned_date || '-'}</td>
                            <td>
                                {!a.unassigned_date && <button onClick={() => unassignTrailer(a.id)}>Unassign</button>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
