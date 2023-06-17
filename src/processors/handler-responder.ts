import { Request, Response, NextFunction } from 'express';
import { HandlerResponderProcessor } from '../types'

const processor = <Controller extends HandlerResponderProcessor>({path, controller}: { path: string, controller: Controller}) => {
  if (controller.handler || (controller.versionBy && controller.versions)) {
    return {
      handlers: [
        async (req: Request, res: Response, next: NextFunction) => {
          try {
            let usedController: Controller = controller;
            if(controller.versionBy) {
              const version = await controller.versionBy(req)
              console.log("Checking for version", req.headers, version)
              usedController = { ...usedController, ...controller.versions?.[version]}
              
            }
            if(!usedController.handler) {
              next();
            } else {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              const data = await usedController.handler(req, res, next);
              if (usedController.renderer && !res.headersSent) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                await usedController.renderer({req, res, path, data});
              }
            }
          } catch (e) {
            next(e);
          }
        },
      ], 
      swagger: {}
    }
  }

  return { handlers: [], swagger: {}};
}

export default processor
