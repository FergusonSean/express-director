import { DefaultController } from 'express-director';

type HandlerResult = {
  hi: number;
}
const controller: DefaultController<null,null,null, HandlerResult> = {
  handler: () => ({ hi: 5 }),
  renderer: ({res, data}) => res.send({data: { count: data.hi }})
};

export default controller;
