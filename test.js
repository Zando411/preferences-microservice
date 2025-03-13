require('dotenv').config();
const axios = require('axios');

const PORT = process.env.PORT || 3014;

async function getUserPreferences(id) {
  try {
    const response = await axios.get(
      `http://localhost:${PORT}/api/preferences/${id}`
    );

    console.log('User preferences retrieved');
    let preferencesData = response.data.data;
    printPreferences(preferencesData);
  } catch (error) {
    console.error('Error during get:', error.response.data.error);
  }
}

function printPreferences(preferences) {
  console.log('User Preferences printed: ', preferences);
  const age = preferences.age || 'no age';
  const sex = preferences.sex || 'no sex';
  const breed = preferences.breed || 'no breed';
  const color = preferences.color || 'no color';
  const radius = preferences.radius || 'no radius';

  console.log(age);
  console.log(sex);
  console.log(breed);
  console.log(color);
  console.log(radius);
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

const badUserID = 'baduser@example.com';
const goodUserID = 'zando@example.com';
const preferences = {
  color: 'Black',
  sex: null,
  age: {
    minAge: 2,
    maxAge: 5,
  },
  city: 'Corvallis',
  state: 'Oregon',
  radius: 100,
};

// const lessPreferences = {
//   color: 'White',
// };

async function main(userID, preferences) {
  await getUserPreferences(userID);
  await updateUserPreferences(userID, preferences);
  // await updateUserPreferences(userID, lessPreferences);
  // bad requests
  await getUserPreferences(badUserID);
  await updateUserPreferences(badUserID, preferences);
  //   await updateUserPreferences(userID, null);
}

main(goodUserID, preferences);
