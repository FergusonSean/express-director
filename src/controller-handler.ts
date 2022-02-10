import Ajv, {JSONSchemaType} from 'ajv';
import { Router, Request, Response, NextFunction, Send } from 'express';


export interface Controller {
  schemas?: {
    query?: JSONSchemaType<any>,
    body?: JSONSchemaType<any>,
    params?: JSONSchemaType<any>,
  },
  handler?: (req: Request, res: Response, next: NextFunction) => (Promise<Send> | void)
  prepareRouter?: (router: Router) => void
}

export const HandlerMethod = [
  'all',
  'checkout',
  'copy',
  'delete',
  'get',
  'head',
  'lock',
  'm-search',
  'merge',
  'mkactivity',
  'mkcol',
  'move',
  'notify',
  'options',
  'patch',
  'post',
  'purge',
  'put',
  'report',
  'search',
  'subscribe',
  'trace',
  'unlock',
  'unsubscribe'
] as const;

declare global {
  // eslint-disable-next-line
  namespace Express {
    // eslint-disable-next-line
    interface Request {
      validatedData: any
    }
  }
}

const ajv = new Ajv({
  allErrors: true, removeAdditional: 'all', useDefaults: true, coerceTypes: 'array',
});

const getValidator = (c: Controller, field: 'query'| 'body' | 'params') => {
  const schema = ajv.compile(c.schemas![field]!);
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const valid = schema(req[field]);
      if (valid) {
        req.validatedData ||= {};
        Object.assign(req.validatedData, req[field]);
        next();
        return;
      }

      res.status(400).send({ [field]: { errors: schema.errors } });
    } catch (e) {
      next(e);
    }
  };
};

export const controllerHandler = (router: Router, f: string, c: Controller) => {
  const method: typeof HandlerMethod[keyof typeof HandlerMethod] = HandlerMethod.find(e => e === (f.split('.').slice(0, -1).join('.')))!;

  if (c.prepareRouter) {
    c.prepareRouter(router);
  }

  const handlers = c.schemas ? Object.keys(c.schemas).map((field) => getValidator(c, (field as keyof typeof c.schemas))) : []

  if (c.handler) {
    handlers.push(
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          const result = await c.handler!(req, res, next);
          if (result && !res.headersSent) {
            res.send(result);
          }
        } catch (e) {
          next(e);
        }
      },
    );
  }

  if (handlers.length) {
    router[method]('/', handlers);
  }
};
