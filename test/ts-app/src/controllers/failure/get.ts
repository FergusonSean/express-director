import { DefaultController } from 'express-director';

const controller: DefaultController = {
  handler: () => { throw new Error('I suck'); },
};

export default controller;
