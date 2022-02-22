import { DefaultController } from 'express-director';

const controller: DefaultController = {
  handler: (req, res) => res.send(req.params.param),
};

export default controller;
