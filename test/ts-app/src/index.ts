import express from 'express';
import { loadDirectory } from 'express-director';

export default async () => {
  const app = express();
  app.use(express.json());
  app.use(await loadDirectory({}));
  app.get('/', (_, res) => {
    res.send('hi');
  });
  return app;
};
