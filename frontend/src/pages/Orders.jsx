import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaPlus, FaSyncAlt } from "react-icons/fa";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [formData, setFormData] = useState({
    customer_name: "",
    pickup: "",
    destination: "",
  });
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");

  // ✅ Fetch all orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data);
    } catch (err) {
      console.error("Fetch error:", err);
      alert("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Create new order
  const createOrder = async (e) => {
    e.preventDefault();
    if (!formData.customer_name || !formData.pickup || !formData.destination) {
      alert("All fields are required");
      return;
    }

    try {
      setLoading(true);
      await axios.post("/api/orders", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFormData({ customer_name: "", pickup: "", destination: "" });
      await fetchOrders();
      alert("✅ Order created successfully");
    } catch (err) {
      console.error("Create order error:", err);
      alert("Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Status update actions
  const updateStatus = async (orderId, endpoint) => {
    try {
      await axios.post(`/api/orders/${orderId}/${endpoint}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchOrders();
    } catch (err) {
      console.error(`Update ${endpoint} error:`, err);
      alert("Action failed");
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="orders-page p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Orders</h2>
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
          placeholder="Customer Name"
          value={formData.customer_name}
          onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
          className="border p-2 rounded w-full md:w-1/4"
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
              <th className="p-2 border">Customer</th>
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
                  <td className="p-2 border">{order.customer_name}</td>
                  <td className="p-2 border">{order.pickup}</td>
                  <td className="p-2 border">{order.destination}</td>
                  <td className="p-2 border">{order.waybill || "-"}</td>
                  <td className="p-2 border capitalize">{order.status}</td>
                  <td className="p-2 border">
                    {order.status === "created" && (
                      <button
                        onClick={() => updateStatus(order.id, "assign")}
                        className="bg-yellow-500 text-white px-2 py-1 rounded mr-2"
                      >
                        Assign
                      </button>
                    )}
                    {order.status === "assigned" && (
                      <button
                        onClick={() => updateStatus(order.id, "loaded")}
                        className="bg-blue-500 text-white px-2 py-1 rounded mr-2"
                      >
                        Mark Loaded
                      </button>
                    )}
                    {order.status === "loaded" && (
                      <button
                        onClick={() => updateStatus(order.id, "enroute")}
                        className="bg-indigo-500 text-white px-2 py-1 rounded mr-2"
                      >
                        Start Trip
                      </button>
                    )}
                    {order.status === "enroute" && (
                      <button
                        onClick={() => updateStatus(order.id, "delivered")}
                        className="bg-green-600 text-white px-2 py-1 rounded mr-2"
                      >
                        Mark Delivered
                      </button>
                    )}
                    {order.status === "delivered" && (
                      <button
                        onClick={() => updateStatus(order.id, "awaiting-payment")}
                        className="bg-orange-500 text-white px-2 py-1 rounded mr-2"
                      >
                        Request Payment
                      </button>
                    )}
                    {order.status === "awaiting_payment" && (
                      <button
                        onClick={() => updateStatus(order.id, "paid")}
                        className="bg-green-700 text-white px-2 py-1 rounded mr-2"
                      >
                        Confirm Paid
                      </button>
                    )}
                    {order.status === "paid" && (
                      <button
                        onClick={() => updateStatus(order.id, "close")}
                        className="bg-gray-700 text-white px-2 py-1 rounded"
                      >
                        Close Order
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center p-4">
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
