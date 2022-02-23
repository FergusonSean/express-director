import { DefaultController } from 'express-director';

const controller: DefaultController = {
  handler: (_, res) => res.send({ route: true }),
  swagger: {
    summary: "I have done some summarizing!"
  }
};

export default controller;
