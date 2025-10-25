// src/routes/alerts.js
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

// === Styled HTML Template (same as cron alerts) ===
function buildStyledAlertEmail({ title, entity, reference, expiryDate, status }) {
  return `
    <div style="font-family: Arial, sans-serif; background: #f6f8fa; padding: 20px;">
      <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); overflow: hidden;">
        <div style="background: #0d6efd; color: #fff; padding: 15px 20px; font-size: 18px; font-weight: bold;">
          ${title}
        </div>
        <div style="padding: 20px; color: #333;">
          <p><b>Entity:</b> ${entity}</p>
          <p><b>Reference:</b> ${reference}</p>
          <p><b>Expiry Date:</b> <span style="color:#dc3545;">${expiryDate}</span></p>
          <p><b>Status:</b> <span style="color:#ffc107;">${status.toUpperCase()}</span></p>
          <p style="margin-top: 20px;">Please take the necessary action or view details below.</p>
          <a href="${process.env.PORTAL_URL || 'http://localhost:5173'}/alerts"
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
      return trailer ? trailer.plate_number : 'N/A';
    }
    return 'N/A';
  } catch (err) {
    console.error('Reference lookup error:', err);
    return 'N/A';
  }
}

// === GET all alerts (adds computed status) ===
router.get('/', async (req, res) => {
  try {
    const alerts = await db('alerts').orderBy('created_at', 'desc');
    const today = new Date().toISOString().split('T')[0];

    const enriched = await Promise.all(
      alerts.map(async (a) => {
        const reference = await resolveReference(a.entity_type, a.entity_id);
        const alertDate = a.alert_date ? new Date(a.alert_date).toISOString().split('T')[0] : null;

        // ✅ Compute dynamic status
        let computedStatus = a.status || 'pending';
        if (alertDate && alertDate < today) computedStatus = 'expired';
        else if (alertDate && alertDate >= today && computedStatus !== 'resolved') computedStatus = 'pending';

        return {
          ...a,
          reference,
          computed_status: computedStatus,
        };
      })
    );

    res.json(enriched);
  } catch (err) {
    console.error('❌ Error fetching alerts:', err);
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
      .update({ 
        status, 
        updated_at: new Date().toISOString(),
        notified_at: new Date().toISOString(),
        email_sent: 1
      });

    const alert = await db('alerts').where({ alert_id: id }).first();
    if (!alert) return res.status(404).json({ error: 'Alert not found' });

    const reference = await resolveReference(alert.entity_type, alert.entity_id);

    const title = status === 'resolved'
      ? `✅ Resolved Alert – ${reference}`
      : `⚠️ Dismissed Alert – ${reference}`;

    const html = buildStyledAlertEmail({
      title,
      entity: alert.entity_type,
      reference,
      expiryDate: alert.alert_date,
      status
    });

    await sendAdminEmail(title, html);
    res.json({ message: 'Alert updated and styled email sent.' });
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
    const title = `🚨 ${alert.alert_type.replace('_', ' ').toUpperCase()} – ${reference}`;

    const html = buildStyledAlertEmail({
      title,
      entity: alert.entity_type,
      reference,
      expiryDate: alert.alert_date,
      status: alert.status
    });

    await sendAdminEmail(title, html);
    await db('alerts')
      .where({ alert_id: id })
      .update({ email_sent: 1, notified_at: new Date().toISOString() });

    res.json({ success: true, message: 'Styled alert email resent to admin.' });
  } catch (err) {
    console.error('❌ Resend email error:', err);
    res.status(500).json({ error: 'Failed to resend alert email' });
  }
});
// === DELETE: Purge all alerts ===
router.delete('/purge', async (req, res) => {
  try {
    const deleted = await db('alerts').del();
    console.log(`🧹 Purged ${deleted} alerts from database.`);
    res.json({ success: true, message: `Purged ${deleted} alerts successfully.` });
  } catch (err) {
    console.error('❌ Failed to purge alerts:', err);
    res.status(500).json({ error: 'Failed to purge alerts.' });
  }
});


module.exports = router;
