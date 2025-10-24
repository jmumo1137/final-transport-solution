import React, { useEffect, useState } from "react";
import api from "../api/api";
import { useSelector } from "react-redux";
import { selectUserRole } from "../features/auth/authSlice";
import { Navigate } from "react-router-dom";

export default function CustomerDashboard() {
  const token = useSelector((state) => state.auth.token);
  const role = useSelector(selectUserRole);
  const user = useSelector((state) => state.auth.user);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔄 Fetch orders (backend auto-filters for consignee)
  useEffect(() => {
    if (token && role === "consignee") {
      fetchOrders();
    }
  }, [token, role]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data || []);
    } catch (err) {
      console.error("❌ Error fetching consignee orders:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // 🚫 Restrict unauthorized access
  if (role !== "consignee") return <Navigate to="/" replace />;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-extrabold mb-2 text-blue-800">
        Consignee Dashboard
      </h2>
      <h3 className="text-xl font-semibold mb-6 text-gray-700">
        Active Orders
      </h3>

      {loading ? (
        <p className="text-gray-600">Loading your orders...</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-500 italic">No active orders found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full border border-gray-200 rounded-lg bg-white">
            <thead className="bg-blue-100">
              <tr>
                <th className="py-2 px-4 border text-left">ID</th>
                <th className="py-2 px-4 border text-left">Pickup</th>
                <th className="py-2 px-4 border text-left">Destination</th>
                <th className="py-2 px-4 border text-center">Status</th>
                <th className="py-2 px-4 border text-center">Waybill</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border">{order.id}</td>
                  <td className="py-2 px-4 border">{order.pickup}</td>
                  <td className="py-2 px-4 border">{order.destination}</td>
                  <td className="py-2 px-4 border text-center font-semibold text-blue-600">
                    {order.status}
                  </td>
                  <td className="py-2 px-4 border text-center">
                    {order.waybill || <span className="text-gray-400">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
