const db = require('../db');
const path = require('path');
const fs = require('fs');

// -------- GET SINGLE DRIVER --------
async function getDriver(req, res) {
  try {
    const driverId = Number(req.params.id);

    const driver = await db('users')
      .where('id', driverId)
      .first();

    if (!driver || driver.role.toLowerCase() !== 'driver') {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json(driver);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch driver' });
  }
}

// -------- UPDATE DRIVER / UPLOAD FILES OR LICENSE NUMBER --------
async function updateDriver(req, res) {
  try {
    const driverId = Number(req.params.id);
    const { license_number } = req.body; // allow license number update
    const files = req.files;

    // Fetch current driver record first
    const currentDriver = await db('users').where({ id: driverId, role: 'driver' }).first();
    if (!currentDriver) return res.status(404).json({ error: 'Driver not found' });

    const updatedDriver = {
      updated_at: new Date().toISOString(),
    };

    // Update license number if provided
    if (license_number !== undefined) updatedDriver.license_number = license_number;

    // Update uploaded file if present
    if (files?.license_file) updatedDriver.license_file = files.license_file[0].filename;
    if (files?.passport_photo) updatedDriver.passport_photo = files.passport_photo[0].filename;
    if (files?.good_conduct_certificate) updatedDriver.good_conduct_certificate = files.good_conduct_certificate[0].filename;
    if (files?.port_pass) updatedDriver.port_pass = files.port_pass[0].filename;

    // Update the driver
    await db('users').where({ id: driverId, role: 'driver' }).update(updatedDriver);

    // Return updated record
    const updatedRecord = await db('users').where({ id: driverId }).first();
    res.json(updatedRecord);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update driver' });
  }
}

module.exports = {
  getDriver,
  updateDriver,
};
