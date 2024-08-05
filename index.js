const express = require('express');
const { createPool } = require('./db');

const app = express();
const port = process.env.PORT || 8080;

let pool;

createPool()
  .then((p) => {
    pool = p;
    console.log('Connected to Cloud SQL');
  })
  .catch((err) => {
    console.error('Failed to create pool:', err);
  });

app.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT NOW() AS now');
    res.json(rows);
  } catch (err) {
    console.error('Failed to query:', err);
    res.status(500).send('Failed to query database');
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

