import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaPlus, FaSyncAlt } from "react-icons/fa";
import { useSelector } from "react-redux";
import { selectUsername } from "../features/auth/authSlice";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [formData, setFormData] = useState({ pickup: "", destination: "" });
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");
  const username = useSelector(selectUsername);

  // Fetch orders for logged-in customer ONLY
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const customerOrders = res.data.filter(
        (order) => order.customer_name === username
      );

      setOrders(customerOrders);
    } catch (err) {
      console.error("Fetch error:", err);
      alert("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (e) => {
    e.preventDefault();
    if (!formData.pickup || !formData.destination) {
      alert("Pickup and Destination are required");
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        "/api/orders",
        { ...formData, customer_name: username },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFormData({ pickup: "", destination: "" });
      await fetchOrders();
      alert("✅ Order created successfully");
    } catch (err) {
      console.error("Create order error:", err);
      alert("Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, action) => {
    try {
      await axios.post(`/api/orders/${orderId}/${action}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchOrders();
    } catch (err) {
      console.error(`${action} error:`, err);
      alert("Action failed");
    }
  };

  const requestPayment = (orderId) => {
    if (!window.confirm("Proceed to request payment for this order?")) return;
    updateStatus(orderId, "awaiting-payment");
    alert("Payment request sent successfully");
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="orders-page p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">My Orders</h2>
        <button
          onClick={fetchOrders}
          className="bg-gray-200 px-3 py-2 rounded-md flex items-center gap-2 hover:bg-gray-300"
        >
          <FaSyncAlt /> Refresh
        </button>
      </div>

      {/* Create Order Form */}
      <form
        onSubmit={createOrder}
        className="bg-white shadow rounded-lg p-4 mb-6 flex flex-wrap gap-4"
      >
        <input
          type="text"
          value={username}
          disabled
          className="border p-2 rounded w-full md:w-1/4 bg-gray-100 cursor-not-allowed"
        />
        <input
          type="text"
          placeholder="Pickup Location"
          value={formData.pickup}
          onChange={(e) => setFormData({ ...formData, pickup: e.target.value })}
          className="border p-2 rounded w-full md:w-1/4"
        />
        <input
          type="text"
          placeholder="Destination"
          value={formData.destination}
          onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
          className="border p-2 rounded w-full md:w-1/4"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
        >
          <FaPlus /> {loading ? "Creating..." : "Create Order"}
        </button>
      </form>

      {/* Orders Table */}
      <div className="overflow-x-auto bg-white shadow rounded-lg">
        <table className="min-w-full border">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-2 border">#</th>
              <th className="p-2 border">Pickup</th>
              <th className="p-2 border">Destination</th>
              <th className="p-2 border">Waybill</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length > 0 ? (
              orders.map((order, index) => (
                <tr key={order.id} className="border-t">
                  <td className="p-2 border">{index + 1}</td>
                  <td className="p-2 border">{order.pickup}</td>
                  <td className="p-2 border">{order.destination}</td>
                  <td className="p-2 border">{order.waybill || "-"}</td>
                  <td className="p-2 border capitalize">{order.status}</td>
                  <td className="p-2 border flex flex-wrap gap-2">
                    {order.status === "created" && (
                      <button
                        onClick={() => updateStatus(order.id, "cancel")}
                        className="bg-red-500 text-white px-2 py-1 rounded"
                      >
                        Cancel
                      </button>
                    )}
                    {order.status === "delivered" && order.payment_status === "none" && (
                      <button
                        onClick={() => requestPayment(order.id)}
                        className="bg-orange-500 text-white px-2 py-1 rounded"
                      >
                        Request Payment
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center p-4">
                  {loading ? "Loading orders..." : "No orders found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
