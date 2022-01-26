const express = require('express');
const { loadDirectory } = require('express-director');

const createApp = async () => {
  const app = express();
  app.use(await loadDirectory());
  app.get('/', (_, res) => {
    res.send('hi');
  });
  return app;
};

module.exports = createApp;
