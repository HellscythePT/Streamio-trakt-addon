const express = require('express');
const app = express();
const port = process.env.PORT || 7000;
const config = require('./config.json');
const { traktRequest } = require('./utils/trakt');

app.get('/manifest.json', (req, res) => {
  res.json({
    id: "stremio-trakt-addon",
    version: "1.0.0",
    name: "Stremio Trakt+",
    description: "Catálogos automáticos de filmes e séries via Trakt",
    resources: ["catalog"],
    types: ["movie","series"],
    catalogs: buildCatalogs(),
    id: "stremio-trakt-addon"
  });
});

const buildCatalogs = () => {
  const catalogs = [];
  if(config.movies.trending) catalogs.push({ type: "movie", id: "movies_trending", name: "Trending Movies" });
  if(config.movies.popular) catalogs.push({ type: "movie", id: "movies_popular", name: "Popular Movies" });
  config.movies.genres.forEach(genre => {
    catalogs.push({ type: "movie", id: `movies_genre_${genre}`, name: `Movies - ${genre}` });
  });
  if(config.movies.kdrama) catalogs.push({ type: "movie", id: "movies_kdrama", name: "K-Drama Movies" });
  if(config.movies.turkish_series) catalogs.push({ type: "movie", id: "movies_turkish", name: "Turkish Movies" });
  if(config.shows.trending) catalogs.push({ type: "series", id: "shows_trending", name: "Trending Shows" });
  if(config.shows.popular) catalogs.push({ type: "series", id: "shows_popular", name: "Popular Shows" });
  config.shows.genres.forEach(genre => {
    catalogs.push({ type: "series", id: `shows_genre_${genre}`, name: `Shows - ${genre}` });
  });
  if(config.shows.kdrama) catalogs.push({ type: "series", id: "shows_kdrama", name: "K-Drama Shows" });
  if(config.shows.turkish_series) catalogs.push({ type: "series", id: "shows_turkish", name: "Turkish Shows" });
  return catalogs;
};

app.get('/catalog/:type/:id', async (req,res) => {
  const { type, id } = req.params;
  let items = [];
  if(id.includes('trending')) items = await traktRequest(`/${type}/trending?limit=${config.max_items}`);
  else if(id.includes('popular')) items = await traktRequest(`/${type}/popular?limit=${config.max_items}`);
  else if(id.includes('genre_')) {
    const genre = id.split('genre_')[1];
    items = await traktRequest(`/${type}/popular?genres=${genre}&limit=${config.max_items}`);
  }
  else if(id.includes('kdrama')) items = await traktRequest(`/${type}/popular?countries=kr&limit=${config.max_items}`);
  else if(id.includes('turkish')) items = await traktRequest(`/${type}/popular?countries=tr&limit=${config.max_items}`);

  const metas = items.map(i => ({
    id: `${type}-${i.ids.trakt}`,
    type: type,
    name: i.title || i.name,
    overview: i.overview,
    poster: i.images?.poster?.full || '',
    background: i.images?.fanart?.full || ''
  }));

  res.json({ metas });
});

app.listen(port, () => {
  console.log(`Stremio Trakt+ addon running at http://localhost:${port}`);
});