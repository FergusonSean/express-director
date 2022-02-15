import Ajv, {JSONSchemaType} from 'ajv';
import { Router, Request, Response, NextFunction } from 'express';

interface EnhancedRequest<QueryType, BodyType, ParamsType> extends Request {
  validatedData: (QueryType & BodyType & ParamsType) extends null ? never : QueryType & BodyType & ParamsType;
}


export type Controller<QueryType = null, BodyType = null, ParamsType = null, HandlerResult = any> = {
  formatter?: (context: { req: Request, res: Response, path: string, data: HandlerResult}) => any,
  schemas?: {
    query?: JSONSchemaType<QueryType>,
    body?: JSONSchemaType<BodyType>,
    params?: JSONSchemaType<ParamsType>,
  },
  handler?: (req: EnhancedRequest<QueryType, BodyType, ParamsType>, res: Response, next: NextFunction) => HandlerResult
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

const ajv = new Ajv({
  allErrors: true, removeAdditional: 'all', useDefaults: true, coerceTypes: 'array',
});

const getValidator = (c: Controller<any,any,any>, field: 'query'| 'body' | 'params') => {
  const schema = ajv.compile(c.schemas![field]!);
  return (req: EnhancedRequest<any,any,any>, res: Response, next: NextFunction) => {
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

export const controllerHandler = (router: Router, path: string, f: string, c: Controller<any,any,any>) => {
  const method: typeof HandlerMethod[keyof typeof HandlerMethod] = HandlerMethod.find(e => e === (f.split('.').slice(0, -1).join('.')))!;

  if (c.prepareRouter) {
    c.prepareRouter(router);
  }

  const handlers = c.schemas ? Object.keys(c.schemas).map((field) => getValidator(c, (field as keyof typeof c.schemas))) : []

  if (c.handler) {
    handlers.push(
      async (req: EnhancedRequest<any,any,any>, res: Response, next: NextFunction) => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const data = await c.handler!(req, res, next);
          if (c.formatter && !res.headersSent) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            await c.formatter({req, res, path, data});
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
