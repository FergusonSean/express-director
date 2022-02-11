import { Controller } from 'express-director';

const controller: Controller = {
  handler: (_, res) => res.send('healthy'),
};

export default controller;
