const app = require('./app');
const cron = require('node-cron');
const checkExpiries = require('./cron/alertsCron');

const port = process.env.PORT || 5000;
// Run compliance cron job every midnight
cron.schedule('0 0 * * *', () => {
  console.log('⏰ Running compliance alerts check...');
  checkExpiries();
});

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
