
const axios = require('axios');
const config = require('../config.json');
const TRAKT_API_URL = 'https://api.trakt.tv';

async function traktRequest(endpoint, params={}) {
  const headers = {
    'Content-Type': 'application/json',
    'trakt-api-version': '2',
    'trakt-api-key': config.client_id
  };
  try {
    const res = await axios.get(`${TRAKT_API_URL}${endpoint}`, { headers, params });
    return res.data;
  } catch (err) {
    console.error('Trakt API Error:', err.response && err.response.status, err.response && err.response.data ? JSON.stringify(err.response.data) : err.message);
    throw err;
  }
}

module.exports = { traktRequest };
