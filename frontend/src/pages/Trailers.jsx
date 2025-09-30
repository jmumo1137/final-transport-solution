import React, { useEffect, useState } from 'react';
import api from '../api/api';

export default function Trailers() {
    const [trailers, setTrailers] = useState([]);
    const [plateNumber, setPlateNumber] = useState('');

    const fetchTrailers = async () => {
        const res = await api.get('/trailers');
        setTrailers(res.data);
    };

    const addTrailer = async () => {
        await api.post('/trailers', { plate_number: plateNumber });
        setPlateNumber('');
        fetchTrailers();
    };

    useEffect(() => { fetchTrailers(); }, []);

    return (
        <div>
            <h2>Trailers</h2>
            <input placeholder="Trailer Plate Number" value={plateNumber} onChange={e => setPlateNumber(e.target.value)} />
            <button onClick={addTrailer}>Add Trailer</button>

            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Plate Number</th>
                    </tr>
                </thead>
                <tbody>
                    {trailers.map(tr => (
                        <tr key={tr.id}>
                            <td>{tr.id}</td>
                            <td>{tr.plate_number}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
