require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const app = express();
const cors = require('cors');
const axios = require('axios');

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

app.use(cors());
app.use(express.json());

const client = new MongoClient(MONGO_URI);

async function connectToDB() {
  try {
    await client.connect();
    console.log('Connected to MongoDB successfully');
  } catch (e) {
    console.error('Error connecting to the database', e);
    process.exit(1);
  }
}
connectToDB();

const db = client.db('preferencesDB');
const collection = db.collection('userPreferences');

async function checkUser(email) {
  try {
    const response = await axios.post(`http://localhost:3456/api/checkUser`, {
      email,
    });
    console.log(`User check for ${email}:`, response.data.message);
    if (response.data.message === 'User exists') {
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error checking user ${email}:`, error.response.data.message);
    return false;
  }
}

app.get('/api/preferences/:id', async (req, res) => {
  const userID = req.params.id;

  if (!userID) {
    return res.status(400).json({ error: 'Missing userID' });
  }

  try {
    let user = await collection.findOne({ _id: userID });

    if (!user) {
      //   check user exists from auth service TODO
      let goodUser = await checkUser(userID);

      if (!goodUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      await collection.insertOne({ _id: userID });
      user = await collection.findOne({ _id: userID });
    }

    res.json({ data: user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error getting favorites' });
  }
});

app.put('/api/preferences/:id', async (req, res) => {
  const userID = req.params.id;
  const preferences = req.body;

  if (!userID) {
    return res.status(400).json({ error: 'Missing userID' });
  }

  let goodUser = await checkUser(userID);
  if (!goodUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (!preferences) {
    return res.status(400).json({ error: 'Missing preferences' });
  }

  try {
    await collection.updateOne({ _id: userID }, { $set: preferences });
    const user = await collection.findOne({ _id: userID });

    res.json({ data: user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error updating favorites' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
