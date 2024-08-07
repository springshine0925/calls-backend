const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');
const { createPool } = require('./db');

const app = express();
app.use(bodyParser.json());
// Automatically allow cross-origin requests
app.use(cors({ origin: true }));
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
    res.json({msg: "connect successfully!", rows});
  } catch (err) {
    console.error('Failed to query:', err);
    res.status(500).send('Failed to query database');
  }
});
//endpoint
// GET Endpoints

// 1. Get Tutors
app.get('/api/tutors', async (req, res) => {
    // const ids = req.query.ids.split(','); // Expecting ids in a comma-separated format
    // const queryStr = 'SELECT * FROM tutors WHERE id IN (?)';
    try {
      // const tutors = await query(queryStr, [ids]);
      // res.json(tutors);
        const { ids } = req.query; // Expecting a comma-separated list of IDs
        const tutorIds = ids ? ids.split(',').map(id => parseInt(id)) : [];
        let query = 'SELECT * FROM tutors';
        const queryParams = [];

        if (tutorIds.length) {
            query += ' WHERE id IN (?)';
            queryParams.push([tutorIds]);
        }

        const [rows] = await pool.query(query, queryParams);
        res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // 2. Get Suburbs
  app.get('/api/suburbs', async (req, res) => {
    const ids = req.query.ids.split(',');
    const queryStr = 'SELECT * FROM suburbs WHERE id IN (?)';
    try {
      const suburbs = await query(queryStr, [ids]);
      res.json(suburbs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // 3. Get Tutors in a Suburb
  app.get('/api/suburb_tutors', async (req, res) => {
    const { suburb_id } = req.query;
    const queryStr = 'SELECT * FROM tutors WHERE suburb_id = ?';
    try {
      const tutors = await query(queryStr, [suburb_id]);
      res.json(tutors);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // 4. Get Tutor Properties
  app.get('/api/tutor_properties', async (req, res) => {
    const { ids, properties } = req.query;
    const idList = ids.split(',');
    const propList = properties.split(',');
    
    // Build the query dynamically based on properties
    const conditions = propList.map(prop => `property_name = '${prop}'`).join(' OR ');
    const queryStr = `
      SELECT t.id, t.name, tp.property_name, tp.property_value
      FROM tutors t
      JOIN tutor_properties tp ON t.id = tp.tutor_id
      WHERE t.id IN (?) AND (${conditions})
    `;
    
    try {
      const results = await query(queryStr, [idList]);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // POST Endpoints
  
  // 1. Add/Update Tutors
  app.post('/api/tutors', async (req, res) => {
    const tutors = req.body;
    try {
      for (const tutor of tutors) {
        if (tutor.id) {
          // Update existing tutor
          await query('UPDATE tutors SET name = ?, suburb_id = ? WHERE id = ?', [tutor.name, tutor.suburb_id, tutor.id]);
        } else {
          // Insert new tutor
          await query('INSERT INTO tutors (name, suburb_id) VALUES (?, ?)', [tutor.name, tutor.suburb_id]);
        }
      }
      res.status(200).json({ message: 'Tutors added/updated successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // 2. Add/Update Suburbs
  app.post('/api/suburbs', async (req, res) => {
    const suburbs = req.body;
    try {
      for (const suburb of suburbs) {
        if (suburb.id) {
          // Update existing suburb
          await query('UPDATE suburbs SET name = ? WHERE id = ?', [suburb.name, suburb.id]);
        } else {
          // Insert new suburb
          await query('INSERT INTO suburbs (name) VALUES (?)', [suburb.name]);
        }
      }
      res.status(200).json({ message: 'Suburbs added/updated successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

