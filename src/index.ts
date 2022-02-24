import { Router, Response, Request, NextFunction } from 'express';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import fs from 'fs/promises';
import {HandlerMethod, controllerHandler } from './controller-handler';
import {DefaultController} from './types';

import processSchemas from './processors/schemas';
import processSwagger from './processors/swagger';
import prepareRouter from './processors/prepare-router';
import processHandlerAndResponder from './processors/handler-responder'

export { 
  processSchemas,
  prepareRouter,
  processSwagger,
  processHandlerAndResponder, 
}

export * from './types';

export const defaultProcessors = [prepareRouter, processSchemas, processSwagger, processHandlerAndResponder]

const ALLOWED_EXTENSIONS = ['js', 'mjs', 'cjs'];

const VALID_FILENAMES = HandlerMethod.flatMap((m) => ALLOWED_EXTENSIONS.map(e => `${m}.${e}`))

type LoadDirectoryConfig<Controller> = {
  controllerRoot?: string
  controllerPath?: string
  defaultController?: Controller
  swagger?: any 
}

type LoadDirectoryConfigRec<Controller> = {
  controllerRoot: string
  controllerPath: string
  defaultController: Controller
}

const loadDirectoryRec = async <Controller extends DefaultController>({
  controllerRoot,
  controllerPath,
  defaultController,
}: LoadDirectoryConfigRec<Controller>) => {
  const router: Router = Router({ mergeParams: true });
  const dirEntries = await fs.readdir(controllerPath, { withFileTypes: true });

  const files = dirEntries.filter(
    (d) => !d.isDirectory() && VALID_FILENAMES.includes(d.name),
  ).sort(
    (a, b) => VALID_FILENAMES.indexOf(a.name) - VALID_FILENAMES.indexOf(b.name),
    );

    const endpointEntries = await files.reduce(async (p, f) => {
      const entry = await p;
      // eslint-disable-next-line no-eval
      let c = await eval(`import("${path.join(controllerPath, f.name)}")`) as { default?: Controller};

      while(c.default) {
        c = c.default as { default?: Controller};
      }
      return { ...entry, ...controllerHandler(
        router, 
        path.relative('', path.join(controllerPath, f.name)), 
        f.name, 
        { 
          ...defaultController,
          ...c as Controller 
        })};
    }, Promise.resolve({}));

    const directories = dirEntries.filter((d) => d.isDirectory()).reverse();

    const directoryEntries: Record<string, unknown> = await directories.reduce(async (p, d) => {
      const swagger = await p;
      const [subRouter, nestedSwagger] = await loadDirectoryRec({ 
        controllerRoot, 
        controllerPath: path.join(controllerPath, d.name), 
        defaultController
      })
      router.use(`/${d.name}`, subRouter);

      return { ...swagger, ...nestedSwagger}
    }, Promise.resolve({}));

    return [
      router, 
      Object.keys(endpointEntries).length ? { 
        ...directoryEntries,
        [`/${path.relative(controllerRoot, controllerPath).replace(/:([^/]*)/, '{$1}')}`]: endpointEntries,
      }
        : directoryEntries
    ] as const;
};

export const loadDirectory = async <Controller extends DefaultController = DefaultController>({
  controllerPath = path.join(process.cwd(), 'src', 'controllers'),
    defaultController = {
    renderer: ({res, data}) => res.send(data), 
  } as Controller,
    swagger = {
      openapi: '3.0.0',
    },
}: LoadDirectoryConfig<Controller>) => {
  const [router, swaggerPaths] = await loadDirectoryRec({
    controllerRoot: controllerPath,
    controllerPath, 
    defaultController,
  })



  if(swagger) {
    router.use('/api-docs', (req: Request & { swaggerDoc: unknown }, _: Response, next: NextFunction) => {
      req.swaggerDoc = {
        ...swagger,
        servers: [
          {
            url: `${
              req.protocol}://${req.get('host')!}${req.originalUrl.replace(/\/api-docs.*/, '')}`,
          },
        ],
        paths: swaggerPaths,
      };
      next();
    }, swaggerUi.serve, swaggerUi.setup());
  }

  return router
}
