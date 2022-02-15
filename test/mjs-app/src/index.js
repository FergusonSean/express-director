import express from 'express';
import { loadDirectory } from 'express-director';

export default async () => {
  const app = express();
  app.use(express.json());
  app.use(await loadDirectory({ 
    controllerPath: undefined,
    defaultFormatter: ({ path, req, res, data }) => {
      res.send({ path, body: req.body, data });
    }
  }));
  app.get('/', (_, res) => {
    res.send('hi');
  });
  return app;
};
