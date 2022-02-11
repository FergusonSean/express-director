import { Controller } from 'express-director';

const controller: Controller = {
  handler: (req, res) => res.send(req.params.param),
};

export default controller;
