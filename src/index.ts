import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import {HandlerMethod, controllerHandler } from './controller-handler';
import {DefaultController} from './types';

import processSchemas from './processors/schemas';
import prepareRouter from './processors/prepare-router';
import processHandlerAndResponder from './processors/handler-responder'

export { 
  processSchemas,
  prepareRouter,
  processHandlerAndResponder, 
}

export * from './types';

export const defaultProcessors = [prepareRouter, processSchemas, processHandlerAndResponder]

const ALLOWED_EXTENSIONS = ['js', 'mjs', 'cjs'];

const VALID_FILENAMES = HandlerMethod.flatMap((m) => ALLOWED_EXTENSIONS.map(e => `${m}.${e}`))

type LoadDirectoryConfig = {
  controllerPath?: string;
  defaultRenderer?: (context: { 
    req: Request, 
    res: Response, 
    path: string, 
    data: any
  }) => any;
}

export const loadDirectory = async ({
  controllerPath = path.join(process.cwd(), 'src', 'controllers'),
  defaultRenderer = ({res, data}) => res.send(data), 
}: LoadDirectoryConfig) => {
  const router = Router({ mergeParams: true });
  const dirEntries = await fs.readdir(controllerPath, { withFileTypes: true });

  const files = dirEntries
    .filter(
      (d) => !d.isDirectory() && VALID_FILENAMES.includes(d.name),
    ).sort(
      (a, b) => VALID_FILENAMES.indexOf(a.name) - VALID_FILENAMES.indexOf(b.name),
    );

  await files.reduce(async (p, f) => {
    await p;
    // eslint-disable-next-line no-eval
    let c = await eval(`import("${path.join(controllerPath, f.name)}")`) as { default?: DefaultController<any, any, any>};

    while(c.default) {
      c = c.default as { default?: DefaultController<any, any, any>};
    }
    controllerHandler(
      router, 
      path.relative('', path.join(controllerPath, f.name)), 
      f.name, 
      { 
        renderer: defaultRenderer, 
        ...c 
      } as DefaultController<any, any, any>);
  }, Promise.resolve());

  const directories = dirEntries.filter((d) => d.isDirectory()).reverse();

  await directories.reduce(async (p, d) => {
    await p;
    router.use(`/${d.name}`, await loadDirectory({ controllerPath: path.join(controllerPath, d.name), defaultRenderer}));
  }, Promise.resolve());

  return router;
};
