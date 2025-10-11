const db = require('../db');

function dateIsExpired(dateStr) {
  if (!dateStr) return true;
  return new Date(dateStr) < new Date();
}

// 🧍 DRIVER COMPLIANCE
async function validateDriverCompliance(req, res, next) {
  try {
    const { driver_id } = req.body;
    const override = req.headers['x-override'] === 'true';
    const reasons = [];

    if (driver_id) {
      // ✅ correct column name: id (your users table uses `id`, not `driver_id`)
      const driver = await db('users').where({ id: driver_id }).first();

      if (!driver) {
        reasons.push('Driver not found');
      } else {
        if (!driver.license_file) reasons.push('Missing: driver license file');
        if (!driver.passport_photo) reasons.push('Missing: passport photo');
        if (!driver.good_conduct_certificate)
          reasons.push('Missing: certificate of good conduct');
        if (!driver.port_pass) reasons.push('Missing: port pass');

        if (
          driver.license_expiry_date &&
          dateIsExpired(driver.license_expiry_date)
        )
          reasons.push('Driver license expired');
      }
    } else {
      reasons.push('Driver ID missing in request');
    }

    if (reasons.length > 0 && !override) {
      return res.status(400).json({ allowed: false, reasons });
    }

    req.compliance = { reasons, overridden: override };
    next();
  } catch (err) {
    console.error('validateDriverCompliance error', err);
    res.status(500).json({ error: 'Driver compliance check failed' });
  }
}

// 🚛 TRUCK / 🚚 TRAILER COMPLIANCE (Fixed)
async function validateTruckTrailerCompliance(req, res, next) {
  try {
    const { truck_id, trailer_id } = req.body; // these are actually plate numbers
    const override = req.headers['x-override'] === 'true';
    const reasons = [];

    console.log('🚚 Incoming body:', req.body);

    // ---- TRUCK CHECK ----
    if (truck_id) {
      console.log('🔍 Checking truck plate:', truck_id);
      const truck = await db('trucks').where({ plate_number: truck_id }).first();
      console.log('✅ Truck fetched:', truck);

      if (!truck) {
        reasons.push(`Truck with plate ${truck_id} not found`);
      } else {
        if (!truck.insurance_expiry_date)
          reasons.push('Truck insurance expiry date not set');
        else if (dateIsExpired(truck.insurance_expiry_date))
          reasons.push('Truck insurance expired');

        if (truck.inspection_expiry_date && dateIsExpired(truck.inspection_expiry_date))
          reasons.push('Truck inspection expired');

        if (truck.comesa_expiry_date && dateIsExpired(truck.comesa_expiry_date))
          reasons.push('Truck COMESA expired');
      }
    }

    // ---- TRAILER CHECK ----
    if (trailer_id) {
      console.log('🔍 Checking trailer plate:', trailer_id);
      const trailer = await db('trailers').where({ plate_number: trailer_id }).first();
      console.log('✅ Trailer fetched:', trailer);

      if (!trailer) {
        reasons.push(`Trailer with plate ${trailer_id} not found`);
      } else {
        if (!trailer.insurance_expiry_date)
          reasons.push('Trailer insurance expiry date not set');
        else if (dateIsExpired(trailer.insurance_expiry_date))
          reasons.push('Trailer insurance expired');

        if (trailer.inspection_expiry_date && dateIsExpired(trailer.inspection_expiry_date))
          reasons.push('Trailer inspection expired');

        if (trailer.comesa_expiry_date && dateIsExpired(trailer.comesa_expiry_date))
          reasons.push('Trailer COMESA expired');
      }
    }

    // ---- DECISION ----
    if (reasons.length > 0 && !override) {
      console.log('❌ Compliance failed reasons:', reasons);
      return res.status(400).json({ allowed: false, reasons });
    }

    console.log('✅ Compliance passed');
    req.compliance = { reasons, overridden: override };
    next();
  } catch (err) {
    console.error('💥 validateTruckTrailerCompliance crash:', err);
    res.status(500).json({
      error: 'Truck/Trailer compliance check failed',
      message: err.message,
    });
  }
}



module.exports = { validateDriverCompliance, validateTruckTrailerCompliance };
