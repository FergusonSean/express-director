import { Controller } from 'express-director';

const controller: Controller = {
  handler: (_, res) => res.send('nested'),
};

export default controller;
