import { CloudSQLConnector } from '@google-cloud/cloud-sql-connector';
import mysql from 'mysql2/promise'; // Assuming you are using MySQL

const connector = new CloudSQLConnector();

// Replace these variables with your instance connection details
const instanceConnectionName = 'YOUR_PROJECT:YOUR_REGION:YOUR_INSTANCE';
const dbUser = 'YOUR_DB_USER';
const dbPassword = 'YOUR_DB_PASSWORD';
const dbName = 'YOUR_DB_NAME';

async function createPool() {
  const client = await connector.getClient({
    instanceConnectionName,
    dbUser,
    dbPassword,
    dbName,
  });

  return mysql.createPool({
    user: dbUser,
    password: dbPassword,
    database: dbName,
    stream: client,
  });
}

module.exports = { createPool };
