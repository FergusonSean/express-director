import { Router } from 'express';
import path from 'path';
import fs from 'fs/promises';

const VALID_FILENAMES = [
  'all.js',
  'checkout.js',
  'copy.js',
  'delete.js',
  'get.js',
  'head.js',
  'lock.js',
  'm-search.js',
  'merge.js',
  'mkactivity.js',
  'mkcol.js',
  'move.js',
  'notify.js',
  'options.js',
  'patch.js',
  'post.js',
  'purge.js',
  'put.js',
  'report.js',
  'search.js',
  'subscribe.js',
  'trace.js',
  'unlock.js',
  'unsubscribe.js',
];

const controllerHandler = (router, f, c) => {
  const method = f.split('.').slice(0, -1).join('.');

  if (c.prepareRouter) {
    c.prepareRouter(router);
  }

  if (c.handler) {
    router[method]('/', async (req, res, next) => {
      try {
        const result = await c.handler(req, res, next);
        if (result && !res.headersSent) {
          res.send(result);
        }
      } catch (e) {
        next(e);
      }
    });
  }
};

export const loadDirectory = async (basePath = path.join(process.cwd(), 'src', 'controllers')) => {
  const router = new Router({ mergeParams: true });
  const dirEntries = await fs.readdir(basePath, { withFileTypes: true });

  const files = dirEntries
    .filter(
      (d) => !d.isDirectory() && VALID_FILENAMES.includes(d.name),
    ).sort(
      (a, b) => VALID_FILENAMES.indexOf(a.name) - VALID_FILENAMES.indexOf(b.name),
    );

  await files.reduce(async (p, f) => {
    await p;
    const c = await import(path.join(basePath, f.name));

    controllerHandler(router, f.name, c.default || c);
  }, Promise.resolve());

  const directories = dirEntries.filter((d) => d.isDirectory()).reverse();

  await directories.reduce(async (p, d) => {
    await p;
    router.use(`/${d.name}`, await loadDirectory(path.join(basePath, d.name)));
  }, Promise.resolve());

  return router;
};
