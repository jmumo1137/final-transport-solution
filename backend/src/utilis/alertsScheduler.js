// src/utils/alertScheduler.js
const db = require('../db');

async function generateDriverAlerts() {
  const today = new Date().toISOString().split('T')[0];
  const drivers = await db('drivers');

  for (const driver of drivers) {
    const missingDocs = [];
    if (!driver.license_file) missingDocs.push('license_file');
    if (!driver.passport_photo) missingDocs.push('passport_photo');
    if (!driver.good_conduct_certificate) missingDocs.push('good_conduct_certificate');
    if (!driver.port_pass) missingDocs.push('port_pass');

    if (driver.license_expiry_date < today || missingDocs.length > 0) {
      const exists = await db('alerts')
        .where({ entity_type: 'driver', entity_id: driver.driver_id, status: 'pending' })
        .first();

      if (!exists) {
        await db('alerts').insert({
          entity_type: 'driver',
          entity_id: driver.driver_id,
          alert_type: 'license_expiry',
          alert_date: today
        });
      }
    }
  }
}

module.exports = { generateDriverAlerts };
