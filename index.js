const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');
const { createPool } = require('./db');

const app = express();
app.use(bodyParser.json());
// app.use(express.urlencoded({ extended: true }));
// Parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
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
  
  app.use(async (req, res, next) => {
    if (!pool) {
      try {
        pool = await createPool();
        console.log('Reconnected to Cloud SQL');
      } catch (err) {
        console.error('Failed to reconnect:', err);
        return res.status(500).send('Database connection error');
      }
    }
    next();
  });

app.get('/', async (req, res) => {
  try {
    // const [rows] = await pool.query('SELECT NOW() AS now');
    res.json({msg: "connect successfully!"});
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
        const { ids, fields } = req.query; // Expecting a comma-separated list of IDs
        // const tutorIds = ids ? ids.split(',').map(id => parseInt(id)) : [];
        let query = 'SELECT * FROM tutors';
        let params = [];
        
        // Handle the `fields` parameter
      if (fields) {
        const selectedFields = fields.split(',');
        query = `SELECT ${selectedFields.join(', ')} FROM tutors`;
      }
        // Handle the `ids` parameter
    if (ids) {
      const idList = ids.split(',').map(id => parseInt(id));
      if (fields) {
        query += ' WHERE tutorId IN (?)';
      } else {
        query = `SELECT * FROM tutors WHERE tutorId IN (?)`;
      }
      params.push(idList);
    }

      const [result] = await pool.query(query, params);
      res.status(200).json(result);

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // 2. Get Suburbs
  app.get('/api/suburbs', async (req, res) => {
    try {
      const { ids, fields } = req.query; 
      const suburbIds = ids ? ids.split(',').map(id => parseInt(id)) : [];
      let query = 'SELECT * FROM suburbs';
      const queryParams = [];
      
       // Handle the `fields` parameter
       if (fields) {
        const selectedFields = fields.split(',');
        query = `SELECT ${selectedFields.join(', ')} FROM suburbs`;
      }

      if (suburbIds.length) {
        query += ' WHERE suburbId IN (?)';
        queryParams.push(suburbIds);
      }

      const [rows] = await pool.query(query, queryParams);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // 3. Get Tutors in a Suburb
  app.get('/api/suburb_tutors', async (req, res) => {
    try {
      const { suburbId, fields } = req.query;
      let query = 'SELECT * FROM tutors';
      const params = suburbId? [suburbId]:[];
  
      // Handle the `fields` parameter
      if (fields) {
        const selectedFields = fields.split(',').map(field => field.trim());
        query = `SELECT ${selectedFields.join(', ')} FROM tutors`;
      }
  
      // Add the `WHERE` clause for the `suburbId` parameter
      query += ' WHERE primarySuburb IN (?)';
  
      const [rows] = await pool.query(query, params);
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

       const tutorId = req.body.tutorId ? req.body.tutorId: ''
       const name = req.body.name ? req.body.name : ''
       const regDate = req.body.regDate? new Date(req.body.regDate) : new Date()
       const primarySuburb = req.body.primarySuburb
       const suburbs= req.body.suburbs ? req.body.suburbs : ''
       const summary = req.body.summary ? req.body.summary : ''
       const  exp1 = req.body.exp1 ? req.body.exp1 : 0
       const  exp2= req.body.exp2 ? req.body.exp2 : 0
       const  exp3 = req.body.exp3 ? req.body.exp3 : 0
       const  expSummary = req.body.expSummary ? req.body.expSummary: 0
       const  highlights = req.body.highlights? req.body.highlights : ''
       const  experience = req.body.experience ? req.body.experience: ''
       const  education = req.body.education ? req.body.education : ''
       const  skills =  req.body.skills ? req.body.skills : ''
       const  languages = req.body.languages ? req.body.languages : ''

        if (tutorId) {
            // Update existing tutor
            await pool.query(
                'UPDATE tutors SET name = ?, regDate = ?, primarySuburb = ?, suburbs = ?, summary = ?, exp1 = ?, exp2 = ?, exp3 = ?, expSummary = ?, highlights = ?, experience = ?, education = ?, skills = ?, languages = ? WHERE tutorId = ?',
                [name, regDate, primarySuburb, suburbs, summary, exp1, exp2, exp3, expSummary, highlights, experience, education, skills, languages]
            );
        } else {
            // Add new tutor
            const [result] = await pool.query(
                'INSERT INTO tutors (name, regDate, primarySuburb, suburbs, summary, exp1, exp2, exp3, expSummary, highlights, experience, education, skills, languages) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [name, regDate, primarySuburb, suburbs, summary, exp1, exp2, exp3, expSummary, highlights, experience, education, skills, languages]
            );
        }

        // Fetch and return the updated list of tutors
        const [updatedTutors] = await pool.query('SELECT * FROM tutors');
        res.status(201).json(updatedTutors);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
  
  // 2. Add/Update Suburbs
  app.post('/api/suburbs', async (req, res) => {
    try {
      let { suburbId, suburbName, state, description, rank1, rank2, tutors1, tutors2, data1, featuredTutor, summaryHighlights, lessonNotes, imageUrl } = req.body; // Expecting an array of suburb objects
       suburbId  =  suburbId || '',
       suburbName = suburbName || '',
       state=state ||'', 
       description = description || '', 
       rank1 = rank1 || 0, 
       rank2 = rank2 || 0, 
       tutors1 = tutors1 || 0, 
       tutors2 = tutors2 || 0, 
       data1 =  data1 || '', 
       featuredTutor = featuredTutor, 
       summaryHighlights = summaryHighlights || '', 
       lessonNotes = lessonNotes || '', 
       imageUrl = imageUrl || ''

         if (suburbId) {
                // Update existing suburb
                await pool.query(
                    'UPDATE suburbs SET suburbName = ?, state = ?, description = ?, rank1 = ?, rank2 = ?, tutors1 = ?, tutors2 = ?, data1 = ?, featuredTutor = ?, summaryHighlights = ?, lessonNotes = ?, imageUrl = ? WHERE suburbId = ?',
                    [suburbName, state, description, rank1, rank2, tutors1, tutors2, data1, featuredTutor, summaryHighlights, lessonNotes, imageUrl, suburbId]
                );

            } else {
                // Add new suburb
                const [result] = await pool.query(
                    'INSERT INTO suburbs (suburbName, state, description, rank1, rank2, tutors1, tutors2, data1, featuredTutor, summaryHighlights, lessonNotes, imageUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [suburbName, state, description, rank1, rank2, tutors1, tutors2, data1, featuredTutor, summaryHighlights, lessonNotes, imageUrl]
                );
            }

        // Fetch and return the updated list of suburbs
        const [updatedSuburbs] = await pool.query('SELECT * FROM suburbs');
        res.status(201).json(updatedSuburbs);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.delete('/api/tutors/:tutorId', async (req, res) => {
  try {
    const tutorId = parseInt(req.params.tutorId);

    if (isNaN(tutorId)) {
      return res.status(400).json({ error: "Invalid Tutor ID" });
    }

    // Use a parameterized query to prevent SQL injection
    const query = 'DELETE FROM tutors WHERE tutorId = ?';

    // Execute the delete query with the provided tutorId
    const [result] = await pool.query(query, [tutorId]);

    if (result.affectedRows > 0) {
      res.status(200).json({ message: `Tutor with ID ${tutorId} deleted successfully` });
    } else {
      res.status(404).json({ message: "Tutor not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Delete a single suburb
app.delete('/api/suburbs/:suburbId', async (req, res) => {
  try {
    const suburbId = parseInt(req.params.suburbId);

    if (isNaN(suburbId)) {
      return res.status(400).json({ error: "Invalid suburb ID" });
    }

    // Use a parameterized query to prevent SQL injection
    const query = 'DELETE FROM suburbs WHERE suburbId = ?';

    // Execute the delete query with the provided suburbId
    const [result] = await pool.query(query, [suburbId]);

    if (result.affectedRows > 0) {
      res.status(200).json({ message: `Suburb with ID ${suburbId} deleted successfully` });
    } else {
      res.status(404).json({ message: "Suburb not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

