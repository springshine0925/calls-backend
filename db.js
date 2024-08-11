const { Connector } = require('@google-cloud/cloud-sql-connector');
const mysql = require('mysql2/promise');  // Using the promise-based interface of mysql2

const connector = new Connector();

// Replace these variables with your instance connection details
const instanceConnectionName = 'keen-boulder-410610:us-central1:calls';
const dbUser = 'callsdb';
const dbPassword = 'callsdb';
const dbName = 'callsdb';

async function createPool() {
const clientOpts = await connector.getOptions({
    instanceConnectionName: 'keen-boulder-410610:us-central1:calls',
    ipType: 'PUBLIC',
  });
  const pool = await mysql.createPool({
    ...clientOpts,
    user: 'callsdb',
    password: 'callsdb',
    database: 'callsdb',
    keepAliveInitialDelay: 10000, // 0 by default.
    enableKeepAlive: true, // false by default.
    // socketPath: '/cloudsql/keen-boulder-410610:us-central1:calls',
    waitForConnections: true,
    // connectTimeout: 5000
  });
  const poolConnect = await pool.getConnection();
  return poolConnect;
}

module.exports = { createPool };
