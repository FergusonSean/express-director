import { Router } from 'express';
import path from 'path';
import fs from 'fs/promises';

const VALID_FILENAMES = [
  // 'configure.js',
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

  const files = dirEntries
    .filter(
      (d) => !d.isDirectory() && VALID_FILENAMES.includes(d.name),
    ).sort(
      (a, b) => VALID_FILENAMES.indexOf(a.name) - VALID_FILENAMES.indexOf(b.name),
    );

  const directories = dirEntries.filter((d) => d.isDirectory()).reverse();

  await directories.reduce(async (p, d) => {
    await p;
    router.use(`/${d.name}`, await loadDirectory(path.join(basePath, d.name)));
  }, Promise.resolve());

  await files.reduce(async (p, f) => {
    await p;
    const method = f.name.split('.').slice(0, -1).join('.');
    const c = await import(path.join(basePath, f.name));

    router[method]('/', controllerHandler(c.default || c));
  }, Promise.resolve());

  return router;
};
