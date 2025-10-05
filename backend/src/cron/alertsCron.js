const db = require('../db');

async function insertAlert(entityType, entityId, alertType, alertDate) {
  // Prevent duplicate alerts for same entity + type + date
  const existing = await db('alerts')
    .where({ entity_type: entityType, entity_id: entityId, alert_type: alertType })
    .andWhere('alert_date', alertDate)
    .first();

  if (!existing) {
    await db('alerts').insert({
      entity_type: entityType,
      entity_id: entityId,
      alert_type: alertType,
      alert_date: alertDate,
      status: 'pending'
    });
  }
}

async function checkExpiries() {
  try {
    const today = new Date();
    const thirtyDays = new Date();
    thirtyDays.setDate(today.getDate() + 30);

    const todayStr = today.toISOString().split('T')[0];
    const thirtyStr = thirtyDays.toISOString().split('T')[0];

    // ⚠️ Drivers (license expiry)
    const expiringDrivers = await db('drivers')
      .whereBetween('license_expiry_date', [todayStr, thirtyStr])
      .select('driver_id', 'full_name', 'license_expiry_date');

    for (const d of expiringDrivers) {
      await insertAlert('driver', d.driver_id, 'license_expiry', d.license_expiry_date);
    }

    // ⚠️ Trucks (insurance expiry)
    const expiringTrucks = await db('trucks')
      .whereBetween('insurance_expiry_date', [todayStr, thirtyStr])
      .select('truck_id', 'plate_number', 'insurance_expiry_date');

    for (const t of expiringTrucks) {
      await insertAlert('truck', t.truck_id, 'insurance_expiry', t.insurance_expiry_date);
    }

    // ⚠️ Trucks (inspection expiry)
    const trucksInspection = await db('trucks')
      .whereBetween('inspection_expiry_date', [todayStr, thirtyStr])
      .select('truck_id', 'plate_number', 'inspection_expiry_date');

    for (const t of trucksInspection) {
      await insertAlert('truck', t.truck_id, 'inspection_expiry', t.inspection_expiry_date);
    }

    // ⚠️ Trailers (insurance expiry)
    const expiringTrailers = await db('trailers')
      .whereBetween('insurance_expiry_date', [todayStr, thirtyStr])
      .select('trailer_id', 'plate_number', 'insurance_expiry_date');

    for (const tr of expiringTrailers) {
      await insertAlert('trailer', tr.trailer_id, 'insurance_expiry', tr.insurance_expiry_date);
    }

    // ⚠️ Trailers (inspection expiry)
    const trailerInspection = await db('trailers')
      .whereBetween('inspection_expiry_date', [todayStr, thirtyStr])
      .select('trailer_id', 'plate_number', 'inspection_expiry_date');

    for (const tr of trailerInspection) {
      await insertAlert('trailer', tr.trailer_id, 'inspection_expiry', tr.inspection_expiry_date);
    }

    console.log('✅ Alerts check complete');
  } catch (err) {
    console.error('Cron job error:', err);
  }
}

module.exports = checkExpiries;
