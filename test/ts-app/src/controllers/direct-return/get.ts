import { DefaultController } from 'express-director';

const controller: DefaultController = {
  handler: () => ({ hi: 5 }),
};

export default controller;
