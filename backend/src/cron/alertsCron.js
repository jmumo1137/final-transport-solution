const db = require('../db');
const nodemailer = require('nodemailer');

// Configure email transport (update this to your credentials)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'admin@example.com', // change to your admin email
    pass: 'your-app-password'  // Gmail App Password
  }
});

async function sendEmail(to, subject, message) {
  try {
    await transporter.sendMail({
      from: '"Transport Portal Alerts" <admin@example.com>',
      to,
      subject,
      html: message
    });
  } catch (err) {
    console.error('❌ Email send error:', err);
  }
}

async function checkCompliance() {
  const today = new Date();
  const upcomingLimit = new Date();
  upcomingLimit.setDate(today.getDate() + 30);

  const adminEmail = 'admin@example.com'; // update this

  // Check driver licenses
  const drivers = await db('users')
    .where('role', 'driver')
    .select('id', 'username', 'license_expiry');

  for (const d of drivers) {
    if (!d.license_expiry) continue;
    const expiry = new Date(d.license_expiry);

    if (expiry <= upcomingLimit) {
      await db('compliance_alerts').insert({
        type: 'license expiry',
        reference: d.username,
        expiry_date: d.license_expiry,
        status: 'pending',
        email: adminEmail
      });

      await sendEmail(
        adminEmail,
        `Driver License Expiry Alert: ${d.username}`,
        `<p>The license for driver <b>${d.username}</b> expires on <b>${d.license_expiry}</b>.</p>`
      );
    }
  }

  // Check trucks (insurance + inspection)
  const trucks = await db('trucks').select('id', 'plate_number', 'insurance_expiry', 'inspection_expiry', 'comesa_expiry');
  for (const t of trucks) {
    for (const [type, date] of [
      ['insurance expiry', t.insurance_expiry],
      ['inspection expiry', t.inspection_expiry],
      ['comesa expiry', t.comesa_expiry]
    ]) {
      if (!date) continue;
      const expiry = new Date(date);
      if (expiry <= upcomingLimit) {
        await db('compliance_alerts').insert({
          type,
          reference: t.plate_number,
          expiry_date: date,
          status: 'pending',
          email: adminEmail
        });

        await sendEmail(
          adminEmail,
          `Truck ${t.plate_number} ${type}`,
          `<p>The <b>${type}</b> for truck <b>${t.plate_number}</b> expires on <b>${date}</b>.</p>`
        );
      }
    }
  }

  // Check trailers (insurance + inspection)
  const trailers = await db('trailers').select('id', 'trailer_number', 'insurance_expiry', 'inspection_expiry');
  for (const tr of trailers) {
    for (const [type, date] of [
      ['insurance expiry', tr.insurance_expiry],
      ['inspection expiry', tr.inspection_expiry]
    ]) {
      if (!date) continue;
      const expiry = new Date(date);
      if (expiry <= upcomingLimit) {
        await db('compliance_alerts').insert({
          type,
          reference: tr.trailer_number,
          expiry_date: date,
          status: 'pending',
          email: adminEmail
        });

        await sendEmail(
          adminEmail,
          `Trailer ${tr.trailer_number} ${type}`,
          `<p>The <b>${type}</b> for trailer <b>${tr.trailer_number}</b> expires on <b>${date}</b>.</p>`
        );
      }
    }
  }

  console.log('✅ Compliance check complete.');
}

module.exports = checkCompliance;
