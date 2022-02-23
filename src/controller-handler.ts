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

  const handlers = processors.flatMap(p => p({router, path, file: f, controller: c}));

  if (handlers.length) {
    router[method]('/', handlers);

    const params = [
      ...(Object.keys(c?.schemas?.params?.properties as unknown || {}).map((p: string) => ({
        in: 'path', 
        name: p,
        required: !!((c?.schemas?.params?.required as Array<string>)?.includes?.(p))
      })) || []),

      ...(Object.keys(c?.schemas?.query?.properties as unknown || {}).map((p: string) => ({
          in: 'query', 
          name: p,
          required: !!((c?.schemas?.params?.required as Array<string>)?.includes?.(p))
      })) || [])
    ]

    return { 
      [method]: {
        responses: {
          200: {}
        },
        ...(c?.schemas?.body ? {
          requestBody: {
            content: {
              'application/json': {
                schema: c?.schemas?.body
              }
            }
          }
        } : {}),
        ...(params.length ? {
          parameters: params
        } : {}),
        ...c.swagger,
      } as unknown,
    }
  }

  return {}
};
