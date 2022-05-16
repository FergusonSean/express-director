import express from 'express';
import { loadDirectory, defaultProcessors } from 'express-director';

export default async () => {
  const app = express();
  app.use(express.json());
  app.use(await loadDirectory({ 
    controllerPath: undefined,

    controllerProcessors: [ ({controller}) => ({
      handlers: [
        (_, res, next) => {
          if(controller.headers) res.set(controller.headers)
          next();
        }
      ]

    }), ...defaultProcessors],
    defaultControllerGenerator: () => ({
      renderer: ({ path, req, res, data }) => {
        res.send({ path, body: req.body, data });
      }
    })
  }));
  app.get('/', (_, res) => {
    res.send('hi');
  });
  return app;
};
