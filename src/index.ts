import { Router } from 'express';
import path from 'path';
import fs from 'fs/promises';
import {HandlerMethod, Controller, controllerHandler } from './controller-handler';

export { Controller } from './controller-handler';

const VALID_FILENAMES = HandlerMethod.map((m) => `${m}.js`)

export const loadDirectory = async (basePath = path.join(process.cwd(), 'src', 'controllers')) => {
  const router = Router({ mergeParams: true });
  const dirEntries = await fs.readdir(basePath, { withFileTypes: true });

  const files = dirEntries
    .filter(
      (d) => !d.isDirectory() && VALID_FILENAMES.includes(d.name),
    ).sort(
      (a, b) => VALID_FILENAMES.indexOf(a.name) - VALID_FILENAMES.indexOf(b.name),
    );

  await files.reduce(async (p, f) => {
    await p;
    // eslint-disable-next-line no-eval
    const c = await eval(`import("${path.join(basePath, f.name)}")`) as { default?: Controller};

    controllerHandler(router, f.name, (c.default || c) as Controller);
  }, Promise.resolve());

  const directories = dirEntries.filter((d) => d.isDirectory()).reverse();

  await directories.reduce(async (p, d) => {
    await p;
    router.use(`/${d.name}`, await loadDirectory(path.join(basePath, d.name)));
  }, Promise.resolve());

  return router;
};
