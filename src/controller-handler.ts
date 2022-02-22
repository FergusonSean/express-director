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

export const controllerHandler = (router: Router, path: string, f: string, c: DefaultController<any,any,any>) => {
  const method: typeof HandlerMethod[keyof typeof HandlerMethod] = HandlerMethod.find(e => e === (f.split('.').slice(0, -1).join('.')))!;

  const processors: ControllerProcessor<DefaultController<any,any,any>>[] = [prepareRouter, processSchemas, processHandlerAndResponder]

  const handlers = processors.flatMap(p => p({router, path, file: f, controller: c}));

  if (handlers.length) {
    router[method]('/', handlers);
  }
};
