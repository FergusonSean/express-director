import { Router } from 'express';
import path from 'path';
import fs from 'fs/promises';

export const sum = (a, b) => a + b;

const controllerHandler = (c) => async (req, res, next) => {
  try {
    const result = await c.handler(req, res, next);
    if (result && !res.headersSent) {
      res.send(result);
    }
  } catch (e) {
    next(e);
  }
};

export const loadDirectory = async (basePath = path.join(process.cwd(), 'src', 'controllers')) => {
  const router = new Router({ mergeParams: true });
  const dirEntries = await fs.readdir(basePath, { withFileTypes: true });

  const files = dirEntries.filter((d) => !d.isDirectory());
  const directories = dirEntries.filter((d) => d.isDirectory()).reverse();

  await directories.reduce(async (p, d) => {
    await p;
    router.use(`/${d.name}`, await loadDirectory(path.join(basePath, d.name)));
  }, Promise.resolve());

  await files.reduce(async (p, f) => {
    await p;
    const c = await import(path.join(basePath, f.name));
    const method = f.name.split('.').slice(0, -1).join('.');

    router[method]('/', controllerHandler(c.default || c));
  }, Promise.resolve());

  return router;
};
