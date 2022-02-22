import { DefaultController } from 'express-director';

const controller: DefaultController = {
  handler: (_, res) => res.send('nested'),
};

export default controller;
