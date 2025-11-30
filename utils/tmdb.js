
const axios = require('axios');
const config = require('../config.json');
const TMDB_API = 'https://api.themoviedb.org/3';

async function getImages(tmdbId, type='movie') {
  try {
    if (!config.tmdb_api_key) return {};
    const res = await axios.get(`${TMDB_API}/${type}/${tmdbId}`, {
      params: { api_key: config.tmdb_api_key, language: 'en-US' }
    });
    const data = res.data || {};
    const poster = data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : '';
    const backdrop = data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : '';
    return { poster, backdrop };
  } catch (err) {
    console.error('TMDB fetch error:', err.response && err.response.status, err.message);
    return {};
  }
}

module.exports = { getImages };
