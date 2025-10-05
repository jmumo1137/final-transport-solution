const db = require('../db');
const path = require('path');
const fs = require('fs');

// Get all drivers (needed for dropdown)
async function getAllDrivers(req, res) {
  try {
    const drivers = await db('users')
      .where('role', 'driver')
      .select('id', 'username'); // only return what front end needs
    res.json(drivers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
}

// Get single driver
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

// Update driver
async function updateDriver(req, res) {
  try {
    const driverId = Number(req.params.id);
    const { license_number } = req.body;
    const files = req.files;

    const currentDriver = await db('users').where({ id: driverId, role: 'driver' }).first();
    if (!currentDriver) return res.status(404).json({ error: 'Driver not found' });

    const updatedDriver = { updated_at: new Date().toISOString() };

    if (license_number !== undefined) updatedDriver.license_number = license_number;

    if (files?.license_file) updatedDriver.license_file = files.license_file[0].filename;
    if (files?.passport_photo) updatedDriver.passport_photo = files.passport_photo[0].filename;
    if (files?.good_conduct_certificate) updatedDriver.good_conduct_certificate = files.good_conduct_certificate[0].filename;
    if (files?.port_pass) updatedDriver.port_pass = files.port_pass[0].filename;

    await db('users').where({ id: driverId, role: 'driver' }).update(updatedDriver);

    const updatedRecord = await db('users').where({ id: driverId }).first();
    res.json(updatedRecord);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update driver' });
  }
}

module.exports = {
  getAllDrivers,
  getDriver,
  updateDriver,
};
