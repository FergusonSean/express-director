import { Controller } from 'express-director';

const controller: Controller = {
  handler: (_, res) => res.send({ route: true }),
};

export default controller;
