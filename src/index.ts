import { Router, Response } from 'express';
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

type LoadDirectoryConfig<Controller> = {
  controllerPath?: string;
  defaultController?: Controller
}

export const loadDirectory = async <Controller extends { 
  renderer?: (ctx: {res: Response, data: any}) => any
} = DefaultController>({
  controllerPath = path.join(process.cwd(), 'src', 'controllers'),
  defaultController = {
    renderer: ({res, data}) => res.send(data), 
  } as Controller,
}: LoadDirectoryConfig<Controller>) => {
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
    let c = await eval(`import("${path.join(controllerPath, f.name)}")`) as { default?: Controller};

    while(c.default) {
      c = c.default as { default?: Controller};
    }
    controllerHandler(
      router, 
      path.relative('', path.join(controllerPath, f.name)), 
      f.name, 
      { 
        ...defaultController,
        ...c as Controller 
      });
  }, Promise.resolve());

  const directories = dirEntries.filter((d) => d.isDirectory()).reverse();

  await directories.reduce(async (p, d) => {
    await p;
    router.use(`/${d.name}`, await loadDirectory({ controllerPath: path.join(controllerPath, d.name), defaultController}));
  }, Promise.resolve());

  return router;
};
