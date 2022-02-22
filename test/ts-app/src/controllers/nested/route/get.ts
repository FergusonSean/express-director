import { DefaultController } from 'express-director';

const controller: DefaultController = {
  handler: (_, res) => res.send({ route: true }),
};

export default controller;
