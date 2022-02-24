import { Router } from 'express';
import processSchemas from './processors/schemas';
import prepareRouter from './processors/prepare-router';
import processHandlerAndResponder from './processors/handler-responder'

import { DefaultController, ControllerProcessor } from './types'


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

export const controllerHandler = <Controller extends DefaultController>(router: Router, path: string, f: string, c: Controller) => {
  const method: typeof HandlerMethod[keyof typeof HandlerMethod] = HandlerMethod.find(e => e === (f.split('.').slice(0, -1).join('.')))!;

  const processors: ControllerProcessor<Controller>[] = [prepareRouter, processSchemas, processHandlerAndResponder]

  const results = processors.map(p => p({router, path, file: f, controller: c}));
  const handlers = results.flatMap(r => r.handlers);

  if (handlers.length) {
    router[method]('/', handlers);
  }

  const swaggerFields = results.reduce((m,r) => ({...m, ...r.swagger}), {})

  return { 
    [method]: {
      responses: {
        200: {}
      },
      ...swaggerFields,
      ...c.swagger,
    } as unknown,
  }

};
