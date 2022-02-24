import { Request, Response, NextFunction } from 'express';
import { HandlerResponderProcessor } from '../types'

const processor = <Controller extends HandlerResponderProcessor>({path, controller}: { path: string, controller: Controller}) => {
  if (controller.handler) {
    return {
      handlers: [
        async (req: Request, res: Response, next: NextFunction) => {
          try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const data = await controller.handler!(req, res, next);
            if (controller.renderer && !res.headersSent) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              await controller.renderer({req, res, path, data});
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
