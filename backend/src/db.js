const knex = require('knex');

const db = knex({
  client: 'sqlite3',
  connection: {
    filename: './data/transport.db', // your DB file
  },
  useNullAsDefault: true,
  pool: {
    min: 1,
    max: 1, // serialize all writes
    afterCreate: (conn, done) => {
      // Wait up to 5 seconds if DB is busy
      conn.run('PRAGMA busy_timeout = 5000', done);
      // Optional: enforce foreign keys
      conn.run('PRAGMA foreign_keys = ON');
    },
  },
});

module.exports = db;
