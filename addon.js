
const express = require('express');
const app = express();
const PORT = process.env.PORT || 7000;
const config = require('./config.json');
const { traktRequest } = require('./utils/trakt');
const { getImages } = require('./utils/tmdb');

function buildCatalogs() {
  const catalogs = [];
  // movies
  if (config.movies.trending) catalogs.push({ type: "movie", id: "movies_trending", name: "Trending Movies" });
  if (config.movies.popular) catalogs.push({ type: "movie", id: "movies_popular", name: "Popular Movies" });
  (config.movies.genres || []).forEach(genre => {
    catalogs.push({ type: "movie", id: `movies_genre_${genre}`, name: `Movies - ${genre}` });
  });
  if (config.movies.kdrama) catalogs.push({ type: "movie", id: "movies_kdrama", name: "K-Drama Movies" });
  if (config.movies.turkish_series) catalogs.push({ type: "movie", id: "movies_turkish", name: "Turkish Movies" });
  // shows
  if (config.shows.trending) catalogs.push({ type: "series", id: "shows_trending", name: "Trending Shows" });
  if (config.shows.popular) catalogs.push({ type: "series", id: "shows_popular", name: "Popular Shows" });
  (config.shows.genres || []).forEach(genre => {
    catalogs.push({ type: "series", id: `shows_genre_${genre}`, name: `Shows - ${genre}` });
  });
  if (config.shows.kdrama) catalogs.push({ type: "series", id: "shows_kdrama", name: "K-Drama Shows" });
  if (config.shows.turkish_series) catalogs.push({ type: "series", id: "shows_turkish", name: "Turkish Shows" });
  return catalogs;
}

app.get('/manifest.json', (req, res) => {
  res.json({
    id: "stremio-trakt-addon",
    version: "1.0.0",
    name: "Stremio Trakt+",
    description: "Catálogos automáticos de filmes e séries via Trakt + TMDB images",
    resources: ["catalog"],
    types: ["movie","series"],
    catalogs: buildCatalogs()
  });
});

// Stremio requests catalog routes ending with .json
app.get('/catalog/:type/:id.json', async (req, res) => {
  const { type, id } = req.params;
  const max = config.max_items || 100;

  // map stremio type to trakt type
  const traktType = type === 'series' ? 'shows' : 'movies';

  let items = [];
  try {
    if (id.includes('trending')) {
      items = await traktRequest(`/${traktType}/trending`, { limit: max });
    } else if (id.includes('popular')) {
      items = await traktRequest(`/${traktType}/popular`, { limit: max });
    } else if (id.includes('genre_')) {
      const genre = id.split('genre_')[1];
      items = await traktRequest(`/${traktType}/popular`, { genres: genre, limit: max });
    } else if (id.includes('kdrama')) {
      items = await traktRequest(`/${traktType}/popular`, { countries: 'kr', limit: max });
    } else if (id.includes('turkish')) {
      items = await traktRequest(`/${traktType}/popular`, { countries: 'tr', limit: max });
    } else {
      items = [];
    }
  } catch (err) {
    console.error('Error fetching from Trakt', err && err.message ? err.message : err);
    items = [];
  }

  // Normalize response: handle trending wrapper vs direct items
  const normalized = items.map(entry => {
    let obj = entry;
    if (entry.movie) obj = entry.movie;
    if (entry.show) obj = entry.show;
    return obj;
  }).slice(0, max);

  // Map to Stremio metas, fetching images from TMDB where possible
  const metas = await Promise.all(normalized.map(async i => {
    const traktIds = i.ids || {};
    const traktId = traktIds.trakt || traktIds.slug || traktIds.imdb || Math.random().toString(36).slice(2,9);
    const tmdbId = traktIds.tmdb;
    const mediaType = i.media_type || (i.title ? 'movie' : 'series'); // fallback

    let poster = '';
    let background = '';
    if (tmdbId && config.tmdb_api_key) {
      const imgs = await getImages(tmdbId, mediaType === 'series' ? 'tv' : 'movie');
      poster = imgs.poster || '';
      background = imgs.backdrop || '';
    }

    return {
      id: `trakt:${traktId}`,
      type: type === 'series' ? 'series' : 'movie',
      name: i.title || i.name || i.original_title,
      overview: i.overview || i.synopsis || '',
      poster: poster,
      background: background
    };
  }));

  res.json({ metas });
});

app.listen(PORT, () => {
  console.log(`Stremio Trakt+ addon running at http://localhost:${PORT}`);
});
