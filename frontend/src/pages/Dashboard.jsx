// src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import api from "../api/api";
import { selectUserRole } from "../features/auth/authSlice";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [trailers, setTrailers] = useState([]);
  const [loading, setLoading] = useState(true);

  const role = useSelector(selectUserRole);

  useEffect(() => {
    fetchOrders();
    if (["dispatcher", "admin"].includes(role)) fetchResources();
  }, [role]);

  const fetchOrders = async () => {
    try {
      const res = await api.get("/api/orders");
      setOrders(res.data);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchResources = async () => {
    try {
      const [driversRes, trucksRes, trailersRes] = await Promise.all([
        api.get("/api/users/drivers"),
        api.get("/api/trucks/available"),
        api.get("/api/trailers/available"),
      ]);
      setDrivers(driversRes.data);
      setTrucks(trucksRes.data);
      setTrailers(trailersRes.data);
    } catch (err) {
      console.error("Error fetching resources:", err);
    }
  };

  const handleNextStep = async (order) => {
    try {
      let res;
      switch (order.status.toLowerCase()) {
        case "assigned":
          res = await api.post(`/api/orders/${order.id}/loaded`);
          break;
        case "loaded":
          res = await api.post(`/api/orders/${order.id}/enroute`, { start_odometer: 0 });
          break;
        case "enroute":
          res = await api.post(`/api/orders/${order.id}/delivered`);
          break;
        case "delivered":
          res = await api.post(`/api/orders/${order.id}/awaiting-payment`);
          break;
        case "awaiting_payment":
          res = await api.post(`/api/orders/${order.id}/paid`);
          break;
        case "paid":
          res = await api.post(`/api/orders/${order.id}/close`);
          break;
        default:
          return;
      }
      if (res?.data) fetchOrders();
    } catch (err) {
      console.error("Next step error:", err.response?.data || err.message);
    }
  };

  const getNextStepLabel = (status) => {
    switch (status.toLowerCase()) {
      case "assigned":
        return "Mark Loaded";
      case "loaded":
        return "Mark Enroute";
      case "enroute":
        return "Mark Delivered";
      case "delivered":
        return "Request Payment";
      case "awaiting_payment":
        return "Mark Paid";
      case "paid":
        return "Close Order";
      default:
        return "—";
    }
  };

  if (loading) return <p>Loading dashboard...</p>;

  // 🔹 Data calculations
  const activeOrders = orders.filter((o) =>
    ["assigned", "loaded", "enroute"].includes(o.status?.toLowerCase())
  );
  const totalDrivers = drivers.length;
  const totalTrucks = trucks.length;
  const pendingOrders = orders.filter((o) => o.status === "created").length;

  // 🔹 Chart data
  const chartData = [
    { name: "Assigned", value: orders.filter((o) => o.status === "assigned").length },
    { name: "Loaded", value: orders.filter((o) => o.status === "loaded").length },
    { name: "Enroute", value: orders.filter((o) => o.status === "enroute").length },
  ];
  const COLORS = ["#00C49F", "#0088FE", "#FF8042"];

  const driverAlerts = drivers.filter((d) => new Date(d.licenseExpiry) < new Date());
  const truckAlerts = trucks.filter((t) => new Date(t.insuranceExpiry) < new Date());

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ marginBottom: "20px", color: "#1e293b" }}>Admin Dashboard</h2>

      {/* 🔹 Top Summary + Chart Row */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "20px",
          alignItems: "stretch",
          marginBottom: "30px",
        }}
      >
        {/* Summary Cards */}
        <div
          style={{
            display: "flex",
            flex: "2",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          {[
            { title: "Active Orders", value: activeOrders.length },
            { title: "Pending Orders", value: pendingOrders },
            { title: "Drivers", value: totalDrivers },
            { title: "Trucks", value: totalTrucks },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                flex: "1",
                minWidth: "180px",
                background: "#f9fafb",
                borderRadius: "10px",
                padding: "20px",
                textAlign: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                border: "1px solid #e5e7eb",
              }}
            >
              <h4 style={{ margin: 0, color: "#475569" }}>{item.title}</h4>
              <p
                style={{
                  margin: 0,
                  fontSize: "26px",
                  fontWeight: "700",
                  color: "#2563eb",
                }}
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* Orders Status Chart */}
        <div
          style={{
            flex: "1",
            minWidth: "300px",
            background: "#ffffff",
            borderRadius: "10px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            padding: "20px",
            textAlign: "center",
          }}
        >
          <h4 style={{ color: "#475569", marginBottom: "10px" }}>Orders Status</h4>
          <PieChart width={250} height={250}>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>
      </div>

      {/* 🔹 Alerts */}
      <div style={{ marginBottom: "30px" }}>
        <h3 style={{ color: "#1e293b" }}>Alerts</h3>
        {driverAlerts.length === 0 && truckAlerts.length === 0 ? (
          <p>No alerts 🚀</p>
        ) : (
          <ul style={{ paddingLeft: "20px" }}>
            {driverAlerts.map((d) => (
              <li key={d.id} style={{ color: "#dc2626" }}>
                ⚠️ Driver {d.username} license expired
              </li>
            ))}
            {truckAlerts.map((t) => (
              <li key={t.truck_id} style={{ color: "#f97316" }}>
                ⚠️ Truck {t.plate_number} insurance expired
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 🔹 Active Orders Table */}
      <div>
        <h3 style={{ color: "#1e293b" }}>Active Orders</h3>
        {activeOrders.length === 0 ? (
          <p>No active orders.</p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              background: "#fff",
              borderRadius: "8px",
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <thead style={{ background: "#f1f5f9", color: "#1e293b" }}>
              <tr>
                {["ID", "Customer", "Pickup", "Destination", "Waybill", "Status", "Action"].map(
                  (h, i) => (
                    <th key={i} style={{ padding: "10px", textAlign: "left" }}>
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {activeOrders.map((order) => (
                <tr key={order.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "10px" }}>{order.id}</td>
                  <td style={{ padding: "10px" }}>{order.customer_name}</td>
                  <td style={{ padding: "10px" }}>{order.pickup}</td>
                  <td style={{ padding: "10px" }}>{order.destination}</td>
                  <td style={{ padding: "10px" }}>{order.waybill || "-"}</td>
                  <td style={{ padding: "10px", textTransform: "capitalize" }}>{order.status}</td>
                  <td style={{ textAlign: "center" }}>
                    {["dispatcher", "admin"].includes(role) && order.status !== "closed" ? (
                      <button
                        onClick={() => handleNextStep(order)}
                        style={{
                          background: "#2563eb",
                          color: "white",
                          border: "none",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontWeight: 500,
                          transition: "background 0.2s ease",
                        }}
                        onMouseOver={(e) => (e.target.style.background = "#1d4ed8")}
                        onMouseOut={(e) => (e.target.style.background = "#2563eb")}
                      >
                        {getNextStepLabel(order.status)}
                      </button>
                    ) : (
                      <span style={{ color: "#64748b" }}>Closed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 🔹 Recent Deliveries Table */}
      <div style={{ marginTop: "40px" }}>
        <h3 style={{ color: "#1e293b" }}>Recent Deliveries</h3>

        {/* Quick Stats */}
        <div
          style={{
            display: "flex",
            gap: "20px",
            flexWrap: "wrap",
            marginBottom: "15px",
          }}
        >
          <div
            style={{
              flex: "1",
              minWidth: "180px",
              background: "#f9fafb",
              borderRadius: "10px",
              padding: "15px",
              textAlign: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              border: "1px solid #e5e7eb",
            }}
          >
            <h4 style={{ margin: 0, color: "#475569" }}>Total Delivered</h4>
            <p
              style={{
                margin: 0,
                fontSize: "24px",
                fontWeight: 700,
                color: "#10b981",
              }}
            >
              {orders.filter(o => o.status.toLowerCase() === "closed").length}
            </p>
          </div>
        </div>

        {orders.filter(o => o.status.toLowerCase() === "closed").length === 0 ? (
          <p>No recent deliveries.</p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              background: "#fff",
              borderRadius: "8px",
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <thead style={{ background: "#f1f5f9", color: "#1e293b" }}>
              <tr>
                {["ID", "Customer", "Pickup", "Destination", "Waybill", "Delivered On"].map(
                  (h, i) => (
                    <th key={i} style={{ padding: "10px", textAlign: "left" }}>
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {orders
                .filter(o => o.status.toLowerCase() === "closed")
                .sort((a, b) => new Date(b.delivered_at) - new Date(a.delivered_at))
                .slice(0, 5)
                .map((order) => (
                  <tr key={order.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "10px" }}>{order.id}</td>
                    <td style={{ padding: "10px" }}>{order.customer_name}</td>
                    <td style={{ padding: "10px" }}>{order.pickup}</td>
                    <td style={{ padding: "10px" }}>{order.destination}</td>
                    <td style={{ padding: "10px" }}>{order.waybill || "-"}</td>
                    <td style={{ padding: "10px" }}>
                      {new Date(order.delivered_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
