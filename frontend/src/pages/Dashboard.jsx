import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import api from "../api/api";
import { selectUserRole } from "../features/auth/authSlice";
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";

// Export libs (require install if you want client-side export)
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function AdminDashboard() {
  const role = useSelector(selectUserRole);

  // data
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [trailers, setTrailers] = useState([]);
  const [alerts, setAlerts] = useState([]);

  // ui state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewOrderId, setViewOrderId] = useState(null);
  const [assignModalOrder, setAssignModalOrder] = useState(null); // order object
  const [assignPayload, setAssignPayload] = useState({ truck_id: "", trailer_id: "", driver_id: "", override: false });
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // fetchers
  useEffect(() => {
    fetchAll();
  }, [role]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchOrders(), fetchResources(), fetchAlerts()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await api.get("/api/orders");
      setOrders(res.data || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  const fetchResources = async () => {
    if (!["dispatcher", "admin"].includes(role)) return;
    try {
      const [driversRes, trucksRes, trailersRes] = await Promise.all([
        api.get("/api/users/drivers"),
        api.get("/api/trucks"),
        api.get("/api/trailers"),
      ]);
      setDrivers(driversRes.data || []);
      setTrucks(trucksRes.data || []);
      setTrailers(trailersRes.data || []);
    } catch (err) {
      console.error("Error fetching resources:", err);
    }
  };

const fetchAlerts = async () => {
  try {
    // ✅ Fetch directly from backend
    const res = await api.get("/api/alerts");
    setAlerts(res.data || []);
  } catch (err) {
    console.error("Error fetching alerts:", err);
    setAlerts([]); // fallback to avoid render crashes
  }
};

useEffect(() => {
  fetchAlerts();
}, []);
// 🔁 Auto-refresh alerts every 60 seconds
useEffect(() => {
  const interval = setInterval(() => {
    fetchAlerts();
  }, 60000); // 60,000 ms = 1 minute

  return () => clearInterval(interval); // cleanup when unmounted
}, []);


  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchAll();
    } finally {
      setRefreshing(false);
    }
  };

  // Utility helpers
  const daysUntil = (dateStr) => {
    if (!dateStr) return Infinity;
    const d = new Date(dateStr);
    const now = new Date();
    const diff = (d - now) / (1000 * 60 * 60 * 24);
    return Math.ceil(diff);
  };

  const isTruckCompliant = (truck) => {
    if (!truck) return false;
    // Example fields: insuranceExpiry, inspectionExpiry
    return daysUntil(truck.insuranceExpiry) > 0 && daysUntil(truck.inspectionExpiry) > 0;
  };

  const isTrailerCompliant = (trailer) => {
    if (!trailer) return true; // trailer optional
    return daysUntil(trailer.inspectionExpiry) > 0;
  };

  const isDriverCompliant = (driver) => {
    if (!driver) return false;
    return daysUntil(driver.licenseExpiry) > 0 && (!driver.medicalExpiry || daysUntil(driver.medicalExpiry) > 0);
  };

  // Given an order, check compliance for its assigned assets
  const isOrderCompliant = (order) => {
    // order may have driver_id, truck_id, trailer_id
    const truck = trucks.find((t) => `${t.truck_id}` === `${order.truck_id}`) || null;
    const trailer = trailers.find((tr) => `${tr.trailer_id}` === `${order.trailer_id}`) || null;
    const driver = drivers.find((d) => `${d.id}` === `${order.driver_id}`) || null;

    return isTruckCompliant(truck) && isTrailerCompliant(trailer) && isDriverCompliant(driver);
  };

  // Derived metrics
  const activeOrders = useMemo(
    () => orders.filter((o) => ["assigned", "loaded", "enroute"].includes((o.status || "").toLowerCase())),
    [orders]
  );

  const pendingOrders = useMemo(() => orders.filter((o) => (o.status || "").toLowerCase() === "created").length, [orders]);

  const recentDelivered = useMemo(
    () =>
      orders
        .filter((o) => ["delivered", "paid", "closed"].includes((o.status || "").toLowerCase()))
        .sort((a, b) => new Date(b.delivered_at || b.updated_at) - new Date(a.delivered_at || a.updated_at))
        .slice(0, 8),
    [orders]
  );

  const totalDrivers = drivers.length;
  const totalTrucks = trucks.length;

  // Alerts computed client-side
  const driverAlerts = drivers.filter((d) => daysUntil(d.licenseExpiry) <= 0 || (d.medicalExpiry && daysUntil(d.medicalExpiry) <= 0));
  const truckAlerts = trucks.filter((t) => daysUntil(t.insuranceExpiry) <= 0 || daysUntil(t.inspectionExpiry) <= 0);
  const expiringSoonTrucks = trucks.filter((t) => daysUntil(t.insuranceExpiry) > 0 && daysUntil(t.insuranceExpiry) <= 30);

  // Chart data
  const chartData = [
    { name: "Assigned", value: orders.filter((o) => (o.status || "").toLowerCase() === "assigned").length },
    { name: "Loaded", value: orders.filter((o) => (o.status || "").toLowerCase() === "loaded").length },
    { name: "Enroute", value: orders.filter((o) => (o.status || "").toLowerCase() === "enroute").length },
    { name: "Delivered", value: orders.filter((o) => (o.status || "").toLowerCase() === "delivered").length },
  ];
  const COLORS = ["#06b6d4", "#3b82f6", "#f97316", "#10b981"];

  // Filtering & search for Active Orders table
  const filteredActiveOrders = activeOrders.filter((o) => {
    const searchLower = search.trim().toLowerCase();
    const matchesSearch =
      !searchLower ||
      `${o.id}`.toLowerCase().includes(searchLower) ||
      (o.customer_name || "").toLowerCase().includes(searchLower) ||
      (o.pickup || "").toLowerCase().includes(searchLower) ||
      (o.destination || "").toLowerCase().includes(searchLower) ||
      (o.waybill || "").toLowerCase().includes(searchLower);

    if (!matchesSearch) return false;
    if (statusFilter === "all") return true;
    if (statusFilter === "expiring") {
      // show orders with any assigned asset expiring in 30 days
      const truck = trucks.find((t) => `${t.truck_id}` === `${o.truck_id}`) || null;
      const trailer = trailers.find((tr) => `${tr.trailer_id}` === `${o.trailer_id}`) || null;
      const driver = drivers.find((d) => `${d.id}` === `${o.driver_id}`) || null;
      const soon =
        (truck && daysUntil(truck.insuranceExpiry) > 0 && daysUntil(truck.insuranceExpiry) <= 30) ||
        (trailer && daysUntil(trailer.inspectionExpiry) > 0 && daysUntil(trailer.inspectionExpiry) <= 30) ||
        (driver && daysUntil(driver.licenseExpiry) > 0 && daysUntil(driver.licenseExpiry) <= 30);
      return soon;
    }
    if (statusFilter === "noncompliant") {
      return !isOrderCompliant(o);
    }
    // otherwise assume filtering by status string
    return (o.status || "").toLowerCase() === statusFilter;
  });

  // pagination
  const totalPages = Math.max(1, Math.ceil(filteredActiveOrders.length / PAGE_SIZE));
  const pageOrders = filteredActiveOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Next step handler - respects compliance unless override used on assign modal
  const handleNextStep = async (order) => {
    try {
      // Block if order not compliant and action would assign/advance assignment requiring compliance
      if (!isOrderCompliant(order)) {
        const confirmed = window.confirm(
          `This order has non-compliant assigned resources. Do you want to override and proceed with the next step?`
        );
        if (!confirmed) return; // do nothing
      }

      let res;
      const s = (order.status || "").toLowerCase();
      if (s === "assigned") res = await api.post(`/api/orders/${order.id}/loaded`);
      else if (s === "loaded") res = await api.post(`/api/orders/${order.id}/enroute`, { start_odometer: order.start_odometer || 0 });
      else if (s === "enroute") res = await api.post(`/api/orders/${order.id}/delivered`);
      else if (s === "delivered") res = await api.post(`/api/orders/${order.id}/awaiting-payment`);
      else if (s === "awaiting_payment") res = await api.post(`/api/orders/${order.id}/paid`);
      else if (s === "paid") res = await api.post(`/api/orders/${order.id}/close`);
      if (res?.data) fetchOrders();
    } catch (err) {
      console.error("Next step error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Failed to advance order.");
    }
  };

  // Open assign modal
  const openAssignModal = (order) => {
    setAssignModalOrder(order);
    setAssignPayload({
      truck_id: order.truck_id || "",
      trailer_id: order.trailer_id || "",
      driver_id: order.driver_id || "",
      override: false,
    });
  };

  // Assign API call
  const submitAssign = async () => {
    if (!assignModalOrder) return;
    try {
      const payload = { ...assignPayload };
      // backend should validate compliance and accept override flag
      const res = await api.post(`/api/orders/${assignModalOrder.id}/assign`, payload);
      if (res?.data) {
        setAssignModalOrder(null);
        fetchOrders();
        fetchResources();
      }
    } catch (err) {
      console.error("Assign error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Failed to assign resources.");
    }
  };

  // Export helpers (client-side)
const exportTrucksRenewalPDF = () => {
  const doc = new jsPDF();

  // ✅ Safety check
  const truckList = Array.isArray(trucks)
    ? trucks
    : trucks?.data && Array.isArray(trucks.data)
    ? trucks.data
    : [];

  if (truckList.length === 0) {
    alert("No truck data found to export.");
    return;
  }

  // 🧾 Header
  doc.setFontSize(14);
  doc.text("Truck Renewals Report", 14, 15);
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

  // ⏳ Helper: Days until expiry
  const daysUntil = (dateStr) => {
    if (!dateStr) return null;
    const today = new Date().setHours(0, 0, 0, 0);
    const expiry = new Date(dateStr).getTime();
    return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  };

  // 🧠 Compute compliance per truck
  const rows = truckList.map((truck) => {
    const insuranceDays = daysUntil(truck.insurance_expiry_date);
    const comesaDays = daysUntil(truck.comesa_expiry_date);
    const inspectionDays = daysUntil(truck.inspection_expiry_date);

    let compliance = "Compliant";

    if (
      (insuranceDays !== null && insuranceDays < 0) ||
      (comesaDays !== null && comesaDays < 0) ||
      (inspectionDays !== null && inspectionDays < 0)
    ) {
      compliance = "Expired";
    } else if (
      (insuranceDays !== null && insuranceDays <= 30) ||
      (comesaDays !== null && comesaDays <= 30) ||
      (inspectionDays !== null && inspectionDays <= 30)
    ) {
      compliance = "Expiring Soon";
    }

    return [
      truck.plate_number || "-",
      truck.insurance_expiry_date || "-",
      truck.comesa_expiry_date || "-",
      truck.inspection_expiry_date || "-",
      compliance,
    ];
  });

  // 🧩 Table columns
  const columns = [
    "Truck Plate",
    "Insurance Expiry",
    "Comesa Expiry",
    "Inspection Expiry",
    "Compliance",
  ];

  // 📊 Summary counts
  const total = rows.length;
  const expired = rows.filter((r) => r[4] === "Expired").length;
  const expiringSoon = rows.filter((r) => r[4] === "Expiring Soon").length;
  const compliant = rows.filter((r) => r[4] === "Compliant").length;

  doc.setFontSize(10);
  doc.text(
    `Summary: Total ${total} | Expired ${expired} | Expiring Soon ${expiringSoon} | Compliant ${compliant}`,
    14,
    28
  );

  // 🧾 Generate color-coded table
  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: 32,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [41, 128, 185] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    didParseCell: function (data) {
      if (data.section === "body" && data.column.index === 4) {
        const complianceText = data.cell.text[0];
        if (complianceText === "Expired") data.cell.styles.fillColor = [255, 204, 204]; // red
        else if (complianceText === "Expiring Soon") data.cell.styles.fillColor = [255, 255, 153]; // yellow
      }
    },
  });

  // 💾 Save PDF
  doc.save("TrucksRenewalReport.pdf");
};


const exportDriversRenewalPDF = () => {
  const doc = new jsPDF();

  // 🧾 Header
  doc.setFontSize(14);
  doc.text("Drivers Compliance & License Renewals", 14, 15);
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

  // ✅ Safety check
  const driverList = Array.isArray(drivers)
    ? drivers
    : drivers?.data && Array.isArray(drivers.data)
    ? drivers.data
    : [];

  if (driverList.length === 0) {
    alert("No driver data found to export.");
    return;
  }

  // ⏳ Helper: Days until expiry
  const daysUntil = (dateStr) => {
    if (!dateStr) return null;
    const today = new Date().setHours(0, 0, 0, 0);
    const expiry = new Date(dateStr).getTime();
    return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  };

  // 🧩 Table columns
  const columns = [
    "Driver Name",
    "Phone Number",
    "License Number",
    "License Expiry",
    "Address",
    "Next of Kin",
    "Compliance",
  ];

  // 🧠 Build table rows with compliance status
  const rows = driverList.map((d) => {
    const daysLeft = daysUntil(d.license_expiry_date);
    let compliance = "Expired";

    if (daysLeft !== null && daysLeft >= 0) {
      if (daysLeft <= 30) compliance = "Expiring Soon";
      else compliance = "Compliant";
    }

    return [
      d.full_name || d.username || "-",
      d.phone_number || "-",
      d.license_number || "-",
      d.license_expiry_date ? d.license_expiry_date.split("T")[0] : "-",
      d.address || "-",
      `${d.next_of_kin_name || "-"} (${d.next_of_kin_phone || "-"})`,
      compliance,
    ];
  });

  // 📊 Summary counts
  const compliantCount = rows.filter((r) => r[6] === "Compliant").length;
  const expiringCount = rows.filter((r) => r[6] === "Expiring Soon").length;
  const expiredCount = rows.filter((r) => r[6] === "Expired").length;

  // ✍️ Add summary line before table
  doc.setFontSize(11);
  doc.text(
    `Summary → Compliant: ${compliantCount} | Expiring Soon: ${expiringCount} | Expired: ${expiredCount}`,
    14,
    30
  );

  // 🧾 Generate color-coded table
  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: 35,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [41, 128, 185] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    didParseCell: function (data) {
      if (data.section === "body") {
        const driver = driverList[data.row.index];
        const daysLeft = daysUntil(driver?.license_expiry_date);

        if (daysLeft !== null) {
          if (daysLeft < 0) {
            // ❌ Expired
            data.cell.styles.fillColor = [255, 204, 204]; // Light red
          } else if (daysLeft <= 30) {
            // ⚠️ Expiring soon
            data.cell.styles.fillColor = [255, 255, 153]; // Light yellow
          } else {
            // ✅ Compliant
            data.cell.styles.fillColor = [204, 255, 204]; // Light green
          }
        }
      }
    },
  });

  // 💾 Save PDF file
  doc.save("DriversRenewalReport.pdf");
};

const exportTrailerCompliancePDF = () => {
  const doc = new jsPDF();

  // 🧾 Header
  doc.setFontSize(14);
  doc.text("Trailer Compliance & Registration Report", 14, 15);
  doc.setFontSize(10);
  const generatedDate = new Date();
  doc.text(`Generated on: ${generatedDate.toLocaleString()}`, 14, 22);

  // ✅ Safety check
  const trailerList = Array.isArray(trailers) ? trailers : trailers?.data || [];
  if (trailerList.length === 0) {
    alert("No trailer data found to export.");
    return;
  }

  // ⏳ Helper: Days until expiry
  const daysUntil = (dateStr) => {
    if (!dateStr) return null;
    const today = new Date().setHours(0, 0, 0, 0);
    const expiry = new Date(dateStr).getTime();
    return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  };

  // 🧠 Compute compliance and summary
  let compliantCount = 0,
      expiringCount = 0,
      expiredCount = 0;

  const rows = trailerList.map((t) => {
    const expiries = [
      t.insurance_expiry_date,
      t.inspection_expiry_date,
      t.comesa_expiry_date,
    ]
      .map(daysUntil)
      .filter((d) => d !== null);

    let compliance = "Compliant";
    const minDays = expiries.length ? Math.min(...expiries) : null;

    if (minDays !== null) {
      if (minDays < 0) {
        compliance = "Expired";
        expiredCount++;
      } else if (minDays <= 30) {
        compliance = "Expiring Soon";
        expiringCount++;
      } else {
        compliantCount++;
      }
    } else {
      compliantCount++;
    }

    return [
      t.plate_number || "-",
      t.insurance_expiry_date || "-",
      t.inspection_expiry_date || "-",
      t.comesa_expiry_date || "-",
      compliance,
    ];
  });

  // 📊 Summary at top
  doc.setFontSize(11);
  doc.text(
    `Summary: Total ${trailerList.length}, Compliant ${compliantCount}, Expiring Soon ${expiringCount}, Expired ${expiredCount}`,
    14,
    28
  );

  // 🧩 Table columns
  const columns = [
    "Trailer Plate",
    "Insurance Expiry",
    "Inspection Expiry",
    "COMESA Expiry",
    "Compliance",
  ];

  // 🧾 Generate table with color for compliance
  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: 34, // leave space for summary
    styles: { fontSize: 9 },
    headStyles: { fillColor: [41, 128, 185] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    didParseCell: function (data) {
      if (data.section === "body" && data.column.index === 4) {
        const text = data.cell.raw;
        if (text === "Expired") data.cell.styles.fillColor = [255, 204, 204]; // light red
        else if (text === "Expiring Soon") data.cell.styles.fillColor = [255, 255, 153]; // light yellow
      }
    },
  });

  // 💾 Save PDF file
  doc.save("TrailerComplianceReport.pdf");
};

// const exportDriversComplianceExcel = () => {
//   const data = drivers.map((d) => ({
//     "Driver Name": d.full_name || d.username || "-",
//     "Phone Number": d.phone_number || "-",
//     "License Number": d.license_number || "-",
//     "License Expiry": d.license_expiry_date || "-",
//     "Address": d.address || "-",
//     "Next of Kin": `${d.next_of_kin_name || "-"} (${d.next_of_kin_phone || "-"})`,
//   }));

//   const ws = XLSX.utils.json_to_sheet(data);
//   const wb = XLSX.utils.book_new();
//   XLSX.utils.book_append_sheet(wb, ws, "Drivers");
//   const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
//   saveAs(new Blob([wbout], { type: "application/octet-stream" }), "DriversCompliance.xlsx");
// };
//  <button onClick={exportDriversComplianceExcel} style={secondaryButtonStyle}>
//               Export Drivers XLSX
//             </button>

const exportAlertsPDF = async () => {
  try {
    // 1️⃣ Fetch alerts
    const response = await api.get("/api/alerts");
    const alerts = response.data;

    if (!alerts || alerts.length === 0) {
      alert("No alerts found to export.");
      return;
    }

    // 2️⃣ Create PDF
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("System Alerts Report", 14, 20);

    // 3️⃣ Table columns
    const tableColumn = [
      "ID",
      "Entity Type",
      "Entity ID",
      "Alert Type",
      "Alert Date",
      "Status",
      "Admin Email",
      "Email Sent",
    ];

    // 4️⃣ Table rows
    const tableRows = alerts.map((alert) => [
      alert.alert_id,
      alert.entity_type,
      alert.entity_id,
      alert.alert_type,
      alert.alert_date,
      alert.status,
      alert.admin_email || "-",
      alert.email_sent ? "Yes" : "No",
    ]);

    // 5️⃣ Generate table
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      theme: "grid",
      headStyles: { fillColor: [22, 160, 133] },
      styles: {
        fontSize: 10,
        cellPadding: 2,
        overflow: "linebreak",
      },
      columnStyles: {
        3: { cellWidth: 35 }, // widen alert type column
        6: { cellWidth: 35 }, // widen admin email column
      },
    });

    // 6️⃣ Save PDF
    doc.save("system_alerts.pdf");
  } catch (error) {
    console.error(error);
    alert("Failed to export alerts.");
  }
};

  // Render helpers
  const getNextStepLabel = (status) => {
    switch ((status || "").toLowerCase()) {
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

  // Small loader
  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Admin Dashboard</h2>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <h2 style={{ margin: 0, color: "#0f172a" }}>Admin Dashboard</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleRefresh} disabled={refreshing} style={buttonStyle}>
            {refreshing ? "Refreshing..." : "🔄 Refresh Data"}
          </button>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={exportTrucksRenewalPDF} style={secondaryButtonStyle}>
              Export trucks PDF
            </button>
            <button onClick={exportTrailerCompliancePDF} style={secondaryButtonStyle}>
            Export Trailers PDF
           </button>
            <button onClick={exportDriversRenewalPDF} style={secondaryButtonStyle}>
            Export Drivers PDF
           </button>
           <button onClick={exportAlertsPDF} style={secondaryButtonStyle} >
            Export Alerts PDF
           </button>
           
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
        {[
          { title: "Active Orders", value: activeOrders.length },
          { title: "Pending Orders", value: pendingOrders },
          { title: "Drivers", value: totalDrivers },
          { title: "Trucks", value: totalTrucks },
        ].map((card, i) => (
          <div key={i} style={kpiStyle}>
            <div style={{ color: "#334155", fontSize: 14 }}>{card.title}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#1e40af" }}>{card.value}</div>
          </div>
        ))}
        {/* quick chart small */}
        <div style={{ ...kpiStyle, minWidth: 280 }}>
          <div style={{ color: "#334155", fontSize: 14 }}>Orders Status</div>
          <div style={{ height: 120 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={18} outerRadius={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      {/* Alerts Section */}
<div className="bg-gray-800 rounded-2xl p-5 shadow-lg mt-6">
  <div className="flex justify-between items-center mb-4">
    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
      ⚠️ System Alerts
    </h3>
    <button
      onClick={fetchAlerts}
      className="text-sm text-gray-300 hover:text-white transition"
    >
      🔄 Refresh
    </button>
  </div>

  {alerts.length === 0 ? (
    <p className="text-gray-400">All systems normal 🚀</p>
  ) : (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
      {alerts.slice(0, 6).map((alert, index) => {
        // Choose icon based on entity type
        const entityIcon =
          alert.entity_type === "truck"
            ? "🚛"
            : alert.entity_type === "driver"
            ? "🧍‍♂️"
            : alert.entity_type === "trailer"
            ? "🚚"
            : "⚠️";

        return (
          <div
            key={index}
            className="bg-red-700/20 border border-red-600/40 rounded-xl p-3 hover:bg-red-700/30 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-white font-medium text-sm capitalize flex items-center gap-1">
                {entityIcon} {alert.alert_type.replace(/_/g, " ")}
              </span>
            </div>

            <div className="text-gray-300 text-xs mt-1">
              Ref: <span className="text-white font-medium">{alert.reference}</span>
            </div>

            {alert.alert_date && (
              <div className="text-gray-400 text-xs mt-1">
                Expiry: {new Date(alert.alert_date).toLocaleDateString()}
              </div>
            )}
          </div>
        );
      })}
    </div>
  )}

  {alerts.length > 6 && (
    <div className="text-right mt-3">
      <a
        href="/alerts"
        className="text-sm text-blue-400 hover:text-blue-300 transition"
      >
        View all alerts →
      </a>
    </div>
  )}
</div>


      {/* Filters for orders */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
        <input
          placeholder="Search orders by ID, customer, pickup, destination, waybill..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{ padding: 8, width: 420, borderRadius: 6, border: "1px solid #e2e8f0" }}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: 8, borderRadius: 6 }}>
          <option value="all">All statuses</option>
          <option value="assigned">Assigned</option>
          <option value="loaded">Loaded</option>
          <option value="enroute">Enroute</option>
          <option value="delivered">Delivered</option>
          <option value="noncompliant">Has Non-compliant Resources</option>
          <option value="expiring">Resources Expiring Soon</option>
        </select>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={() => { setSearch(""); setStatusFilter("all"); setPage(1); }} style={secondaryButtonStyle}>
            Reset
          </button>
        </div>
      </div>

      {/* Active Orders Table */}
      <div style={{ marginBottom: 30 }}>
        <h3 style={{ color: "#0f172a" }}>Active Orders ({filteredActiveOrders.length})</h3>
        {filteredActiveOrders.length === 0 ? (
          <p>No active orders.</p>
        ) : (
          <div style={{ overflowX: "auto", borderRadius: 8 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
              <thead style={{ background: "#f1f5f9", color: "#0f172a" }}>
                <tr>
                  {["ID", "Customer", "Pickup", "Destination", "Waybill", "Status", "Resources", "Action"].map((h, i) => (
                    <th key={i} style={{ padding: 12, textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageOrders.map((order) => {
                  const compliant = isOrderCompliant(order);
                  const truck = trucks.find((t) => `${t.truck_id}` === `${order.truck_id}`) || null;
                  const trailer = trailers.find((tr) => `${tr.trailer_id}` === `${order.trailer_id}`) || null;
                  const driver = drivers.find((d) => `${d.id}` === `${order.driver_id}`) || null;
                  return (
                    <tr key={order.id} style={{ borderBottom: "1px solid #e6eef6" }}>
                      <td style={{ padding: 10 }}>{order.id}</td>
                      <td style={{ padding: 10 }}>{order.customer_name}</td>
                      <td style={{ padding: 10 }}>{order.pickup}</td>
                      <td style={{ padding: 10 }}>{order.destination}</td>
                      <td style={{ padding: 10 }}>{order.waybill || "-"}</td>
                      <td style={{ padding: 10, textTransform: "capitalize" }}>{order.status}</td>
                      <td style={{ padding: 10 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                          <span style={{ fontSize: 13 }}>{truck ? `Truck: ${truck.plate_number}` : "Truck: - "}</span>
                          <span style={{ fontSize: 13 }}>{trailer ? `Trailer: ${trailer.plate_number}` : "Trailer: - "}</span>
                          <span style={{ fontSize: 13 }}>{driver ? `Driver: ${driver.username || driver.name}` : "Driver: - "}</span>
                          {!compliant && <span style={{ color: "#dc2626", fontSize: 12, marginLeft: 6 }}>⚠ Non-compliant</span>}
                          {order.override && <span style={{ color: "#b45309", fontSize: 12, marginLeft: 6 }}>⚠ Override used</span>}
                        </div>
                      </td>
                      <td style={{ padding: 10, textAlign: "center" }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center" }}>
                          {["dispatcher", "admin"].includes(role) ? (
                            <>
                             
                              <button
                                onClick={() => { setViewOrderId(order.id); }}
                                style={{ ...smallBtn, background: "#10b981" }}
                                title="View details"
                              >
                                View
                              </button>
                            </>
                          ) : (
                            <span style={{ color: "#64748b" }}>No actions</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {/* Pagination */}
            <div style={{ display: "flex", justifyContent: "space-between", padding: 8, alignItems: "center" }}>
              <div>
                <small>Page {page} / {totalPages}</small>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} style={smallPageBtn}>Prev</button>
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} style={smallPageBtn}>Next</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Deliveries */}
      <div style={{ marginBottom: 30 }}>
        <h3 style={{ color: "#0f172a" }}>Recent Deliveries</h3>
        {recentDelivered.length === 0 ? (
          <p>No recent deliveries.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 8 }}>
            <thead style={{ background: "#f1f5f9", color: "#0f172a" }}>
              <tr>
                {["ID", "Customer", "Delivered At", "Waybill", "Action"].map((h, i) => (
                  <th key={i} style={{ padding: 12, textAlign: "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentDelivered.map((order) => (
                <tr key={order.id} style={{ borderBottom: "1px solid #e6eef6" }}>
                  <td style={{ padding: 10 }}>{order.id}</td>
                  <td style={{ padding: 10 }}>{order.customer_name}</td>
                  <td style={{ padding: 10 }}>{order.delivered_at ? new Date(order.delivered_at).toLocaleString() : "-"}</td>
                  <td style={{ padding: 10 }}>{order.waybill || "-"}</td>
                  <td style={{ padding: 10 }}>
                    <button onClick={() => setViewOrderId(order.id)} style={{ ...smallBtn, background: "#2563eb" }}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* View Order Modal */}
      {viewOrderId && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3 style={{ color: "#0f172a" }}>Order #{viewOrderId}</h3>
            {(() => {
              const order = orders.find((o) => `${o.id}` === `${viewOrderId}`);
              if (!order) return <p>Loading...</p>;
              const truck = trucks.find((t) => `${t.truck_id}` === `${order.truck_id}`) || null;
              const trailer = trailers.find((tr) => `${tr.trailer_id}` === `${order.trailer_id}`) || null;
              const driver = drivers.find((d) => `${d.id}` === `${order.driver_id}`) || null;
              return (
                <div>
                  <p><strong>Customer:</strong> {order.customer_name}</p>
                  <p><strong>Pickup:</strong> {order.pickup}</p>
                  <p><strong>Destination:</strong> {order.destination}</p>
                  <p><strong>Waybill:</strong> {order.waybill || "-"}</p>
                  <p><strong>Status:</strong> {order.status}</p>
                  <p><strong>Truck:</strong> {truck ? truck.plate_number : order.truck_id || "-"}</p>
                  <p><strong>Trailer:</strong> {trailer ? trailer.plate_number : order.trailer_id || "-"}</p>
                  <p><strong>Driver:</strong> {driver ? driver.username || driver.name : order.driver_id || "-"}</p>
                </div>
              );
            })()}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
              <button onClick={() => setViewOrderId(null)} style={{ ...smallBtn, background: "#ef4444" }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {assignModalOrder && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3 style={{ color: "#0f172a" }}>Assign Resources - Order #{assignModalOrder.id}</h3>
            <div style={{ display: "grid", gap: 8 }}>
              <label>
                Truck
                <select
                  value={assignPayload.truck_id || ""}
                  onChange={(e) => setAssignPayload((p) => ({ ...p, truck_id: e.target.value }))}
                  style={{ padding: 8, width: "100%", borderRadius: 6, marginTop: 6 }}
                >
                  <option value="">-- Select Truck --</option>
                  {trucks.map((t) => (
                    <option key={t.truck_id} value={t.truck_id}>
                      {t.plate_number} {daysUntil(t.insuranceExpiry) <= 30 ? `(exp ${daysUntil(t.insuranceExpiry)}d)` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Trailer
                <select
                  value={assignPayload.trailer_id || ""}
                  onChange={(e) => setAssignPayload((p) => ({ ...p, trailer_id: e.target.value }))}
                  style={{ padding: 8, width: "100%", borderRadius: 6, marginTop: 6 }}
                >
                  <option value="">-- Select Trailer (optional) --</option>
                  {trailers.map((tr) => (
                    <option key={tr.trailer_id} value={tr.trailer_id}>
                      {tr.plate_number} {daysUntil(tr.inspectionExpiry) <= 30 ? `(exp ${daysUntil(tr.inspectionExpiry)}d)` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Driver
                <select
                  value={assignPayload.driver_id || ""}
                  onChange={(e) => setAssignPayload((p) => ({ ...p, driver_id: e.target.value }))}
                  style={{ padding: 8, width: "100%", borderRadius: 6, marginTop: 6 }}
                >
                  <option value="">-- Select Driver --</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.username || d.name} {daysUntil(d.licenseExpiry) <= 30 ? `(exp ${daysUntil(d.licenseExpiry)}d)` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={assignPayload.override}
                  onChange={(e) => setAssignPayload((p) => ({ ...p, override: e.target.checked }))}
                />
                <small>Allow override (force assign even if resources non-compliant)</small>
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
              <button onClick={() => setAssignModalOrder(null)} style={{ ...smallBtn, background: "#ef4444" }}>Cancel</button>
              <button onClick={submitAssign} style={{ ...smallBtn, background: "#059669" }}>Submit Assign</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Styles ---------- */

const kpiStyle = {
  background: "#fff",
  padding: 14,
  borderRadius: 10,
  minWidth: 160,
  boxShadow: "0 2px 6px rgba(2,6,23,0.04)",
  border: "1px solid #e6eef6",
};

const buttonStyle = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
  background: "#0f172a",
  color: "#fff",
  fontWeight: 600,
};

const secondaryButtonStyle = {
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #e6eef6",
  background: "#fff",
  cursor: "pointer",
};

const smallBtn = {
  padding: "6px 10px",
  borderRadius: 6,
  color: "#fff",
  border: "none",
  cursor: "pointer",
  fontSize: 13,
};

const smallPageBtn = {
  padding: "6px 8px",
  borderRadius: 6,
  border: "1px solid #e6eef6",
  background: "#fff",
  cursor: "pointer",
};

const modalOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(2,6,23,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1200,
};

const modalBox = {
  width: "95%",
  maxWidth: 700,
  background: "#fff",
  padding: 20,
  borderRadius: 10,
  boxShadow: "0 8px 30px rgba(2,6,23,0.2)",
};
