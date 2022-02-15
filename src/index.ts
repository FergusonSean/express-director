import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import {HandlerMethod, Controller, controllerHandler } from './controller-handler';

export { Controller } from './controller-handler';

const ALLOWED_EXTENSIONS = ['js', 'mjs', 'cjs'];

const VALID_FILENAMES = HandlerMethod.flatMap((m) => ALLOWED_EXTENSIONS.map(e => `${m}.${e}`))

type LoadDirectoryConfig = {
  controllerPath?: string;
  defaultFormatter?: (context: { 
    req: Request, 
    res: Response, 
    path: string, 
    data: any
  }) => any;
}

export const loadDirectory = async ({
  controllerPath = path.join(process.cwd(), 'src', 'controllers'),
  defaultFormatter = ({res, data}) => res.send(data), 
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
    let c = await eval(`import("${path.join(controllerPath, f.name)}")`) as { default?: Controller<any, any, any>};

    while(c.default) {
      c = c.default as { default?: Controller<any, any, any>};
    }
    controllerHandler(
      router, 
      path.relative('', path.join(controllerPath, f.name)), 
      f.name, 
      { 
        formatter: defaultFormatter, 
        ...c 
      } as Controller<any, any, any>);
  }, Promise.resolve());

  const directories = dirEntries.filter((d) => d.isDirectory()).reverse();

  await directories.reduce(async (p, d) => {
    await p;
    router.use(`/${d.name}`, await loadDirectory({ controllerPath: path.join(controllerPath, d.name), defaultFormatter}));
  }, Promise.resolve());

  return router;
};
