require('dotenv').config();
const axios = require('axios');

const PORT = process.env.PORT || 3014;

async function getUserPreferences(id) {
  try {
    const response = await axios.get(
      `http://localhost:${PORT}/api/preferences/${id}`
    );

    console.log('User preferences retrieved:', response.data);
  } catch (error) {
    console.error('Error during get:', error.response.data.error);
  }
}

async function updateUserPreferences(id, preferences) {
  try {
    const response = await axios.put(
      `http://localhost:${PORT}/api/preferences/${id}`,
      preferences
    );
    console.log('User preferences updated:', response.data);
  } catch (error) {
    console.error('Error during put:', error.response.data.error);
  }
}

const userID = 'test';
const preferences = {
  color: 'Black',
  sex: 'Male',
  age: '6',
};

async function main(userID, preferences) {
  await getUserPreferences(userID);
  await updateUserPreferences(userID, preferences);
}

main(userID, preferences);
