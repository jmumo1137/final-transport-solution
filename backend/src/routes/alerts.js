// routes/alerts.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const nodemailer = require('nodemailer');

// === Email Transporter ===
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_EMAIL_PASS,
  },
});

// === Helper: Send Admin Email ===
async function sendAdminEmail(subject, htmlBody) {
  try {
    await transporter.sendMail({
      from: `"Transport Portal Alerts" <${process.env.ADMIN_EMAIL}>`,
      to: process.env.ALERT_RECIPIENT || process.env.ADMIN_EMAIL,
      subject,
      html: htmlBody,
    });
    console.log('📧 Admin alert email sent successfully.');
  } catch (err) {
    console.error('❌ Failed to send email:', err.message);
  }
}

// === Helper: Resolve Entity Reference ===
async function resolveReference(entity_type, entity_id) {
  try {
    if (entity_type === 'driver') {
      const driver = await db('users').where({ id: entity_id }).first();
      return driver ? driver.username : 'N/A';
    } else if (entity_type === 'truck') {
      const truck = await db('trucks').where({ truck_id: entity_id }).first();
      return truck ? truck.plate_number : 'N/A';
    } else if (entity_type === 'trailer') {
      const trailer = await db('trailers').where({ trailer_id: entity_id }).first();
      return trailer ? trailer.trailer_number : 'N/A';
    }
    return 'N/A';
  } catch (err) {
    console.error('Reference lookup error:', err);
    return 'N/A';
  }
}

// === GET all alerts (with resolved references) ===
router.get('/', async (req, res) => {
  try {
    const alerts = await db('alerts').orderBy('created_at', 'desc');

    const enriched = await Promise.all(
      alerts.map(async (a) => ({
        ...a,
        reference: await resolveReference(a.entity_type, a.entity_id),
      }))
    );

    res.json(enriched);
  } catch (err) {
    console.error('❌ Error fetching alerts:', err);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// === GET alerts by entity ===
router.get('/:entity_type/:entity_id', async (req, res) => {
  try {
    const { entity_type, entity_id } = req.params;
    const alerts = await db('alerts')
      .where({ entity_type, entity_id })
      .orderBy('created_at', 'desc');

    const enriched = await Promise.all(
      alerts.map(async (a) => ({
        ...a,
        reference: await resolveReference(a.entity_type, a.entity_id),
      }))
    );

    res.json(enriched);
  } catch (err) {
    console.error('❌ Error fetching entity alerts:', err);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// === PUT: Update alert status (resolve/dismiss) ===
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status update' });
    }

    await db('alerts')
      .where({ alert_id: id })
      .update({ status, updated_at: new Date().toISOString() });

    const alert = await db('alerts').where({ alert_id: id }).first();
    if (!alert) return res.status(404).json({ error: 'Alert not found' });

    const reference = await resolveReference(alert.entity_type, alert.entity_id);

    const subject =
      status === 'resolved'
        ? `✅ Resolved: ${alert.alert_type.replace('_', ' ')} (${reference})`
        : `⚠️ Dismissed: ${alert.alert_type.replace('_', ' ')} (${reference})`;

    const html = `
      <h3>${subject}</h3>
      <p>
        <strong>Type:</strong> ${alert.alert_type.replace('_', ' ')}<br/>
        <strong>Entity:</strong> ${alert.entity_type}<br/>
        <strong>Reference:</strong> ${reference}<br/>
        <strong>Expiry Date:</strong> ${alert.alert_date}<br/>
        <strong>Status:</strong> ${status.toUpperCase()}
      </p>
      <p>Updated on: ${new Date().toLocaleString()}</p>
      <a href="${process.env.PORTAL_URL || 'https://portal.yourcompany.com'}/alerts">
        Open in Portal
      </a>
    `;

    await sendAdminEmail(subject, html);
    res.json({ message: 'Alert updated and email sent.' });
  } catch (err) {
    console.error('❌ Update alert error:', err);
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

// === POST: Resend alert email manually ===
router.post('/:id/resend-email', async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await db('alerts').where({ alert_id: id }).first();
    if (!alert) return res.status(404).json({ error: 'Alert not found' });

    const reference = await resolveReference(alert.entity_type, alert.entity_id);

    const subject = `🚨 ${alert.alert_type.toUpperCase()} ALERT – ${reference}`;
    const html = `
      <h3>${subject}</h3>
      <p>
        <strong>Entity:</strong> ${alert.entity_type}<br/>
        <strong>Reference:</strong> ${reference}<br/>
        <strong>Expiry Date:</strong> ${alert.alert_date}<br/>
        <strong>Status:</strong> ${alert.status.toUpperCase()}
      </p>
      <a href="${process.env.PORTAL_URL || 'https://portal.yourcompany.com'}/alerts">
        View in Portal
      </a>
    `;

    await sendAdminEmail(subject, html);
    await db('alerts').where({ alert_id: id }).update({ email_sent: 1 });

    res.json({ success: true, message: 'Alert email resent to admin.' });
  } catch (err) {
    console.error('❌ Resend email error:', err);
    res.status(500).json({ error: 'Failed to resend alert email' });
  }
});

module.exports = router;
