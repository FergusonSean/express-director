import { Router } from 'express';
import { PrepareRouterProcessor } from '../types'

const processor = <Controller extends PrepareRouterProcessor>({router, controller}: { router: Router, controller: Controller}) => {
  if (controller.prepareRouter) {
    controller.prepareRouter(router);
  }

  return { handlers: [], swagger: {}};
}

export default processor
