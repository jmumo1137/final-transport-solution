const knex = require('knex');

const env = process.env.NODE_ENV || 'development';

const dbConfig = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './data/transport.db',
    },
    useNullAsDefault: true,
    pool: {
      min: 1,
      max: 1,
      afterCreate: (conn, done) => {
        conn.run('PRAGMA busy_timeout = 5000', done);
        conn.run('PRAGMA foreign_keys = ON');
      },
    },
  },
  test: {
    client: 'sqlite3',
    connection: {
      filename: './data/transport_test.db', // separate test DB
    },
    useNullAsDefault: true,
    pool: {
      min: 1,
      max: 1,
      afterCreate: (conn, done) => {
        conn.run('PRAGMA busy_timeout = 5000', done);
        conn.run('PRAGMA foreign_keys = ON');
      },
    },
  },
};

const db = knex(dbConfig[env]);

module.exports = db;
