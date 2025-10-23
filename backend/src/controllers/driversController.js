const db = require('../db');
const path = require('path');
const Tesseract = require('tesseract.js');

// ----------------------------
// Helper: Parse boolean values safely
// ----------------------------
const parseBool = (val) => val === true || val === 'true' || val === '1' || val === 1 || val === 'on';

// ----------------------------
// Get all drivers (for dropdown)
// ----------------------------
async function getAllDrivers(req, res) {
  try {
    const drivers = await db('users')
      .where('role', 'driver')
      .select('id', 'username'); // only return what frontend needs
    res.json(drivers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
}

// ----------------------------
// Get single driver
// ----------------------------
async function getDriver(req, res) {
  try {
    const driverId = Number(req.params.id);
    const driver = await db('users').where('id', driverId).first();

    if (!driver || driver.role.toLowerCase() !== 'driver') {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json(driver);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch driver' });
  }
}

// ----------------------------
// OCR helper for license expiry
// ----------------------------
async function extractExpiryDateFromImage(imagePath) {
  try {
    const { data: { text } } = await Tesseract.recognize(imagePath, 'eng');
    const match = text.match(/(\d{2}\/\d{2}\/\d{4})|(\d{4}-\d{2}-\d{2})/);
    if (match) {
      const dateStr = match[0].includes('/')
        ? match[0].split('/').reverse().join('-')
        : match[0];
      return new Date(dateStr).toISOString();
    }
    return null;
  } catch (err) {
    console.error('OCR extraction failed:', err);
    return null;
  }
}

// ----------------------------
// Update full driver info
// ----------------------------
async function updateDriver(req, res) {
  try {
    const driverId = Number(req.params.id);
    const {
      license_number,
      license_expiry_date,
      username,
      full_name,
      id_number,
      phone_number,
      email,
      address,
      next_of_kin_name,
      next_of_kin_phone,
      referee_name,
      referee_phone,
      safety_policy_accepted,
      driver_policy_accepted,
      company_policy_accepted,
    } = req.body;

    const files = req.files;

    const currentDriver = await db('users')
      .where({ id: driverId, role: 'driver' })
      .first();

    if (!currentDriver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const updatedDriver = { updated_at: new Date().toISOString() };

    // ----------------------------
    // Basic Info
    // ----------------------------
    const basicFields = { license_number, license_expiry_date, username, full_name, id_number, phone_number, email, address };
    Object.entries(basicFields).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        updatedDriver[key] = key === 'license_expiry_date' ? new Date(value).toISOString() : value;
      }
    });

    // ----------------------------
    // Next of Kin
    // ----------------------------
    if (next_of_kin_name) updatedDriver.next_of_kin_name = next_of_kin_name;
    if (next_of_kin_phone) updatedDriver.next_of_kin_phone = next_of_kin_phone;

    // ----------------------------
    // Referee
    // ----------------------------
    if (referee_name) updatedDriver.referee_name = referee_name;
    if (referee_phone) updatedDriver.referee_phone = referee_phone;

    // ----------------------------
    // Policies
    // ----------------------------
    updatedDriver.safety_policy_accepted = parseBool(safety_policy_accepted);
    updatedDriver.driver_policy_accepted = parseBool(driver_policy_accepted);
    updatedDriver.company_policy_accepted = parseBool(company_policy_accepted);

    // ----------------------------
    // File uploads
    // ----------------------------
    if (files?.license_file) {
      const licenseFilePath = path.join(__dirname, '../uploads', files.license_file[0].filename);
      updatedDriver.license_file = files.license_file[0].filename;

      // OCR if expiry not provided
      if (!license_expiry_date) {
        const ocrDate = await extractExpiryDateFromImage(licenseFilePath);
        if (ocrDate) updatedDriver.license_expiry_date = ocrDate;
      }
    }
    if (files?.passport_photo) updatedDriver.passport_photo = files.passport_photo[0].filename;
    if (files?.good_conduct_certificate) updatedDriver.good_conduct_certificate = files.good_conduct_certificate[0].filename;
    if (files?.port_pass) updatedDriver.port_pass = files.port_pass[0].filename;

    // ----------------------------
    // Update DB
    // ----------------------------
    const result = await db('users')
      .where({ id: driverId, role: 'driver' })
      .update(updatedDriver);

    if (result === 0) return res.status(400).json({ error: 'No record updated. Check driver ID.' });

    const updatedRecord = await db('users').where({ id: driverId }).first();
    res.json(updatedRecord);

  } catch (err) {
    console.error('Update driver error:', err);
    res.status(500).json({ error: 'Failed to update driver' });
  }
}

// ----------------------------
// Update only driver policies
// ----------------------------
async function updateDriverPolicies(req, res) {
  try {
    const driverId = Number(req.params.id);
    const { safety_policy_accepted, driver_policy_accepted, company_policy_accepted } = req.body;

    const driver = await db('users').where({ id: driverId, role: 'driver' }).first();
    if (!driver) return res.status(404).json({ error: 'Driver not found' });

    const now = new Date().toISOString();
    const updatedPolicies = {
      safety_policy_accepted: parseBool(safety_policy_accepted),
      driver_policy_accepted: parseBool(driver_policy_accepted),
      company_policy_accepted: parseBool(company_policy_accepted),
    };

    // Update policy_accepted_at if any policy is accepted
    if (updatedPolicies.safety_policy_accepted || updatedPolicies.driver_policy_accepted || updatedPolicies.company_policy_accepted) {
      updatedPolicies.policy_accepted_at = now;
    }

    await db('users').where({ id: driverId }).update(updatedPolicies);

    const updatedRecord = await db('users').where({ id: driverId }).first();
    res.json(updatedRecord);

  } catch (err) {
    console.error('Update driver policies error:', err);
    res.status(500).json({ error: 'Failed to update policies' });
  }
}

module.exports = {
  getAllDrivers,
  getDriver,
  updateDriver,
  updateDriverPolicies,
};
