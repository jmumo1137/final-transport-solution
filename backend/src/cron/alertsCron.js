const db = require("../db");
const nodemailer = require("nodemailer");
const cron = require("node-cron");
require("dotenv").config();

// === Email Transporter ===
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_EMAIL_PASS,
  },
});

// === HTML Email Template ===
function buildEmailTemplate({ title, entity, reference, expiryDate }) {
  return `
    <div style="font-family: Arial, sans-serif; background: #f6f8fa; padding: 20px;">
      <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden;">
        <div style="background: #0d6efd; color: #fff; padding: 15px 20px; font-size: 18px; font-weight: bold;">
          🚨 ${title}
        </div>
        <div style="padding: 20px; color: #333;">
          <p><b>Entity:</b> ${entity}</p>
          <p><b>Reference:</b> ${reference}</p>
          <p><b>Expiry Date:</b> <span style="color:#dc3545;">${expiryDate}</span></p>
          <p><b>Status:</b> <span style="color:#ffc107;">PENDING</span></p>
          <p style="margin-top: 20px;">Please take the necessary action to renew or update this compliance document.</p>
          <a href="http://localhost:5173"
            style="display:inline-block; margin-top:15px; background:#198754; color:#fff; padding:10px 18px; border-radius:5px; text-decoration:none;">
            View in Transport Portal
          </a>
        </div>
        <div style="background:#f1f1f1; padding:10px 20px; text-align:center; font-size:12px; color:#777;">
          © ${new Date().getFullYear()} Transport Portal — Automated Compliance Alerts
        </div>
      </div>
    </div>
  `;
}

// === Send Email ===
async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: `"Transport Portal Alerts" <${process.env.ADMIN_EMAIL}>`,
      to,
      subject,
      html,
    });
    console.log(`📧 Email sent: ${subject} -> ${to}`);
  } catch (err) {
    console.error("❌ Email send error:", err.message);
  }
}

// === Alert Handler ===
async function handleAlert(entityType, entityId, reference, expiryDate, label, alertType, adminEmail) {
  const exists = await db("alerts").where({ entity_type: entityType, entity_id: entityId, alert_type: alertType }).first();
  if (exists) return;

  await db("alerts").insert({
    entity_type: entityType,
    entity_id: entityId,
    alert_type: alertType,
    alert_date: expiryDate,
    status: "pending",
    admin_email: adminEmail,
    email_sent: 0,
  });

  const html = buildEmailTemplate({
    title: `${label} Alert – ${reference}`,
    entity: entityType.charAt(0).toUpperCase() + entityType.slice(1),
    reference,
    expiryDate,
  });

  await sendEmail(adminEmail, `🚨 ${label} – ${reference}`, html);

  await db("alerts")
    .where({ entity_type: entityType, entity_id: entityId, alert_type: alertType })
    .update({ email_sent: 1, notified_at: new Date().toISOString() });
}

// === Expiry Config ===
const expiryMapping = {
  driver: [{ column: "license_expiry_date", alertType: "license_expiry", label: "License Expiry" }],
  truck: [
    { column: "insurance_expiry_date", alertType: "insurance_expiry", label: "Insurance Expiry" },
    { column: "inspection_expiry_date", alertType: "inspection_expiry", label: "Inspection Expiry" },
    { column: "comesa_expiry_date", alertType: "comesa_expiry", label: "COMESA Expiry" },
  ],
  trailer: [
    { column: "insurance_expiry_date", alertType: "insurance_expiry", label: "Insurance Expiry" },
    { column: "inspection_expiry_date", alertType: "inspection_expiry", label: "Inspection Expiry" },
    { column: "comesa_expiry_date", alertType: "comesa_expiry", label: "COMESA Expiry" },
  ],
};

// === Entity Config ===
const entityConfigs = [
  { table: "users", idKey: "id", nameKey: "full_name", type: "driver", where: { role: "driver" } },
  { table: "trucks", idKey: "truck_id", nameKey: "plate_number", type: "truck" },
  { table: "trailers", idKey: "trailer_id", nameKey: "plate_number", type: "trailer" },
];

// === Main Compliance Checker ===
async function checkCompliance() {
  console.log("🚀 Starting compliance check...");

  const today = new Date();
  const upcomingLimit = new Date();
  upcomingLimit.setDate(today.getDate() + 30);

  const adminEmail = process.env.ALERT_RECIPIENT || process.env.ADMIN_EMAIL;

  // Auto-mark expired alerts
  await db("alerts")
    .where("alert_date", "<", today)
    .andWhere("status", "pending")
    .update({ status: "expired" });

  let totalAlerts = 0;

  for (const { table, idKey, nameKey, type, where } of entityConfigs) {
    const rows = where ? await db(table).where(where) : await db(table);
    const mappings = expiryMapping[type];

    for (const row of rows) {
      for (const { column, alertType, label } of mappings) {
        const expiryDate = row[column];
        if (!expiryDate) continue;

        if (new Date(expiryDate) <= upcomingLimit) {
          await handleAlert(type, row[idKey], row[nameKey], expiryDate, label, alertType, adminEmail);
          totalAlerts++;
        }
      }
    }
  }

  console.log(`✅ Compliance check complete — ${totalAlerts} alerts processed.`);
}

// === Schedule Daily Run ===
cron.schedule("0 8 * * *", async () => {
  console.log("⏰ Running daily compliance check...");
  await checkCompliance();
});

// === Run Manually if Called Directly ===
if (require.main === module) {
  checkCompliance();
}

module.exports = checkCompliance;
