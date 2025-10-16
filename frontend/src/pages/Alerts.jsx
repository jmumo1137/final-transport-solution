import React, { useEffect, useState } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';
import { Tooltip } from 'react-tooltip';
import { FileWarning, Search, IdCard, AlertTriangle } from 'lucide-react';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/alerts');
      setAlerts(res.data || []);
    } catch (err) {
      console.error('❌ Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return a.status === 'pending';
    if (filter === 'expired') return a.status === 'expired';
    return true;
  });

  const handleEntityClick = (alert) => {
    const { entity_type, reference_name, reference, entity_id } = alert;
    const ref = reference_name || reference || entity_id;

    if (!entity_type) return;
    const lowerType = entity_type.toLowerCase();

    if (lowerType.includes('driver')) {
      navigate(`/drivers?ref=${encodeURIComponent(ref)}`);
    } else if (lowerType.includes('truck')) {
      navigate(`/trucks?ref=${encodeURIComponent(ref)}`);
    } else if (lowerType.includes('trailer')) {
      navigate(`/trailers?ref=${encodeURIComponent(ref)}`);
    } else {
      alert(`Unknown entity type: ${entity_type}`);
    }
  };

  const handleResendEmail = async (alertId) => {
    if (!window.confirm('Resend alert email to admin?')) return;

    try {
      await api.post(`/api/alerts/${alertId}/resend-email`);
      alert('✅ Email resent successfully!');
      fetchAlerts();
    } catch (err) {
      console.error('❌ Failed to resend email:', err);
      alert('⚠️ Failed to resend email.');
    }
  };

  // Pick icon based on alert type
  const getIconForType = (type = '') => {
    const lower = type.toLowerCase();
    if (lower.includes('comesa') || lower.includes('insurance')) return <FileWarning className="w-5 h-5 text-yellow-600" />;
    if (lower.includes('inspection')) return <Search className="w-5 h-5 text-blue-600" />;
    if (lower.includes('license')) return <IdCard className="w-5 h-5 text-green-600" />;
    return <AlertTriangle className="w-5 h-5 text-red-600" />;
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <AlertTriangle className="w-6 h-6 text-red-600" />
        Compliance Alerts
      </h2>

      {/* Filter Buttons */}
      <div className="flex gap-3 mb-4">
        {['all', 'upcoming', 'expired'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded capitalize transition ${
              filter === type
                ? type === 'expired'
                  ? 'bg-red-500 text-white'
                  : type === 'upcoming'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-blue-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Alerts Table */}
      <table className="w-full border-collapse rounded-lg shadow-sm overflow-hidden">
        <thead>
          <tr className="bg-gray-100 text-left border-b">
            <th className="p-3">Type</th>
            <th className="p-3">Reference</th>
            <th className="p-3">Expiry Date</th>
            <th className="p-3">Status</th>
            <th className="p-3">Email</th>
            <th className="p-3 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="6" className="p-4 text-center text-gray-500">
                Loading alerts...
              </td>
            </tr>
          ) : filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert, idx) => (
              <tr key={idx} className="border-b hover:bg-gray-50 transition" data-tooltip-id={`alert-${idx}`}>
                {/* Type with icon */}
                <td className="p-3 capitalize flex items-center gap-2">
                  {getIconForType(alert.alert_type)}
                  {alert.alert_type?.replace('_', ' ') || '—'}
                </td>

                {/* Reference clickable */}
                <td
                  className="p-3 text-blue-600 cursor-pointer underline"
                  onClick={() => handleEntityClick(alert)}
                >
                  {alert.reference_name || alert.reference || 'N/A'}
                </td>

                {/* Expiry */}
                <td className="p-3">
                  {alert.alert_date ? new Date(alert.alert_date).toLocaleDateString() : '—'}
                </td>

                {/* Status */}
                <td
                  className={`p-3 font-semibold ${
                    alert.status === 'expired'
                      ? 'text-red-500'
                      : alert.status === 'pending'
                      ? 'text-yellow-600'
                      : 'text-green-600'
                  }`}
                >
                  {alert.status || '—'}
                </td>

                {/* Email status */}
                <td className="p-3">
                  {alert.email_sent === 1 ? (
                    <span className="text-green-600 font-semibold">📧 Sent</span>
                  ) : (
                    <span className="text-gray-500">⌛ Pending</span>
                  )}
                </td>

                {/* Actions */}
                <td className="p-3 text-center">
                  <button
                    onClick={() => handleResendEmail(alert.alert_id)}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  >
                    Resend Email
                  </button>
                </td>

                {/* Tooltip */}
                <Tooltip
                  id={`alert-${idx}`}
                  place="top"
                  style={{ backgroundColor: '#1f2937', color: '#fff' }}
                >
                  <div>
                    <strong>{alert.alert_type?.replace('_', ' ').toUpperCase()}</strong>
                    <br />
                    Entity: {alert.entity_type}
                    <br />
                    Ref: {alert.reference_name || alert.reference || alert.entity_id}
                    <br />
                    Expiry: {alert.alert_date}
                    <br />
                    Status: {alert.status}
                    <br />
                    Email:{' '}
                    {alert.email_sent === 1
                      ? `✅ Sent (${alert.notified_at || 'N/A'})`
                      : '⌛ Pending'}
                  </div>
                </Tooltip>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="p-4 text-center text-gray-500">
                No alerts found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
