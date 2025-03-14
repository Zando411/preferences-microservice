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

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getCoordinates(city, state) {
  console.log('Geocoding:', city, state);
  await wait(2000); // rate limit the geocoding API

  try {
    const response = await axios.get(
      'https://nominatim.openstreetmap.org/search',
      {
        params: { q: `${city}, ${state}`, format: 'json', limit: 1 },
        headers: { 'User-Agent': 'CatCall' },
      }
    );

    if (response.data.length > 0) {
      const location = response.data[0];
      return {
        latitude: parseFloat(location.lat),
        longitude: parseFloat(location.lon),
      };
    } else {
      throw new Error('Location not found');
    }
  } catch (error) {
    console.error('Geocoding error:', error.message);
    return null; // Handle missing location gracefully
  }
}

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

    res.json(user);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error getting favorites' });
  }
});

app.put('/api/preferences/:id', async (req, res) => {
  const userID = req.params.id;
  const preferences = req.body;

  console.log(req.body);

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
    let user = await collection.findOne({ _id: userID });
    if (
      preferences.city &&
      preferences.state &&
      (user.city !== preferences.city || user.state !== preferences.state)
    ) {
      const coordinates = await getCoordinates(
        preferences.city,
        preferences.state
      );
      if (!coordinates) {
        return res.status(400).json({ error: 'Invalid location' });
      }
      preferences.location = coordinates;
    }

    if (preferences.city === '' || preferences.state === '') {
      preferences.location = null;
    }

    await collection.updateOne({ _id: userID }, { $set: preferences });
    res.json({ message: 'Preferences updated' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error updating favorites' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
