// src/server.js
require("dotenv").config();
const app = require("./app");
const cron = require("node-cron");
const checkExpiries = require("./cron/alertsCron");

const port = process.env.PORT || 5000;

// === Schedule Compliance Check ===
// Runs every day at midnight server time (00:00)
cron.schedule("0 0 * * *", async () => {
  try {
    console.log("⏰ [CRON] Running daily compliance alerts check...");
    await checkExpiries();
    console.log("✅ [CRON] Compliance check completed successfully.");
  } catch (error) {
    console.error("❌ [CRON] Compliance check failed:", error.message);
  }
});

// === Start Express Server ===
app.listen(port, () => {
  console.log(`🚛 Backend listening on http://localhost:${port}`);
});
