import { Controller } from 'express-director';

type HandlerResult = {
  hi: number;
}
const controller: Controller<null,null,null, HandlerResult> = {
  handler: () => ({ hi: 5 }),
  formatter: ({res, data}) => res.send({data: { count: data.hi }})
};

export default controller;
