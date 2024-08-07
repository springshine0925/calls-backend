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
   
    try {
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
    // const ids = req.query.ids.split(',');
    // const queryStr = 'SELECT * FROM suburbs WHERE id IN (?)';
    try {
      const { ids } = req.query; 
      const suburbIds = ids ? ids.split(',').map(id => parseInt(id)) : [];
      let query = 'SELECT * FROM suburbs';
      const queryParams = [];

      if (suburbIds.length) {
          query += ' WHERE id IN (?)';
          queryParams.push([suburbIds]);
      }

      const [rows] = await pool.query(query, queryParams);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // 3. Get Tutors in a Suburb
  app.get('/api/suburb_tutors', async (req, res) => {
    // const { suburb_id } = req.query;
    // const queryStr = 'SELECT * FROM tutors WHERE suburb_id = ?';
    try {
      const { suburbId } = req.query;
      const query = 'SELECT * FROM tutors WHERE suburbId = ?';
      const [rows] = await pool.query(query, [suburbId]);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // 4. Get Tutor Properties
  app.get('/api/tutor_properties', async (req, res) => {
    try {
      const { ids, properties } = req.query; 
      const tutorIds = ids ? ids.split(',').map(id => parseInt(id)) : [];
      const selectedProperties = properties ? properties.split(',').join(', ') : '*';
      let query = `SELECT ${selectedProperties} FROM tutors`;
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
  
  // POST Endpoints
  
  // 1. Add/Update Tutors
  app.post('/api/tutors', async (req, res) => {
    try {
      const newTutors = req.body; // Expecting an array of tutor objects
      for (const newTutor of newTutors) {
          const { id, name, suburbId, properties } = newTutor;
          if (id) {
              // Update existing tutor
              await pool.query('UPDATE tutors SET name = ?, suburbId = ?, properties = ? WHERE id = ?', [name, suburbId, properties, id]);
          } else {
              // Add new tutor
              await pool.query('INSERT INTO tutors (name, suburbId, properties) VALUES (?, ?, ?)', [name, suburbId, properties]);
          }
      }
      const [updatedTutors] = await pool.query('SELECT * FROM tutors');
      res.status(201).json(updatedTutors);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
  });
  
  // 2. Add/Update Suburbs
  app.post('/api/suburbs', async (req, res) => {
    try {
      const newSuburbs = req.body; // Expecting an array of suburb objects
      for (const newSuburb of newSuburbs) {
          const { id, name } = newSuburb;
          if (id) {
              // Update existing suburb
              await pool.query('UPDATE suburbs SET name = ? WHERE id = ?', [name, id]);
          } else {
              // Add new suburb
              await pool.query('INSERT INTO suburbs (name) VALUES (?)', [name]);
          }
      }
      const [updatedSuburbs] = await pool.query('SELECT * FROM suburbs');
      res.status(201).json(updatedSuburbs);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
  });

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

