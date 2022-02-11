import { Controller } from 'express-director';

const controller: Controller = {
  handler: () => { throw new Error('I suck'); },
};

export default controller;
