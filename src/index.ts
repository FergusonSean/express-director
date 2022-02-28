import { Router, Response, Request, NextFunction, static as serveStatic } from 'express';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import fs from 'fs/promises';
import {Dirent} from 'fs';
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

const processFilesRecursively = async <Context, FolderResult, FileEntries extends object, DirEntries extends object>({
  rootFolder, 
  currentFolder = rootFolder,
  startFolder,
  endFolder,
  processFile,
  processDirectory,
}: {
  rootFolder: string,
  currentFolder?: string
  startFolder: (folderName: string) => Context,
    processFile: (memo: FileEntries | Promise<FileEntries>, v: Dirent, cf: string, context: Context) => FileEntries | Promise<FileEntries>,
  processDirectory: (memo: DirEntries | Promise<DirEntries>, v: Dirent, folderResult: FolderResult, cf: string, context: Context) => DirEntries | Promise<DirEntries>,
  endFolder: (folderName: string, context: Context, fileEntries: FileEntries, dirEntries: DirEntries) => FolderResult,
}) => {
  const context = startFolder(currentFolder)
  const d = await fs.readdir(currentFolder, { withFileTypes: true });
  const files = d.filter(
    (dirEnt) => !dirEnt.isDirectory()
  )

  const fileResult = await files.reduce(async (m, v) => processFile(m,v,currentFolder, context), Promise.resolve({} as FileEntries))

  const directories = d.filter((dirEnt) => dirEnt.isDirectory()).reverse();
  const dirEntries = await directories.reduce(async (m, v) => {
    const dirResult: FolderResult = await processFilesRecursively({
      rootFolder, 
      currentFolder: path.join(currentFolder, v.name), 
      startFolder,
      endFolder,
      processFile,
      processDirectory,
    })

    return processDirectory(m,v, dirResult,currentFolder, context)
  }, Promise.resolve({} as DirEntries))

  return endFolder(currentFolder, context, fileResult, dirEntries)
}

type LoadDirectoryConfig<Controller> = {
  controllerPath?: string
  partialPath?: string
  clientSourcePath?: string
  bundleRoute?: string
  defaultControllerGenerator?: (config: {controllerPath: string}) => Controller | Promise<Controller>
  swagger?: any 
}

export const loadDirectory = async <Controller extends DefaultController>({
  controllerPath = path.join(process.cwd(), 'src', 'controllers'),
  partialPath = path.join(process.cwd(), 'src', 'partials'),
  clientSourcePath = path.join(process.cwd(), 'src', 'client'),
  bundleRoute = '/bundle',
  defaultControllerGenerator = async ({controllerPath: cp}) => {
    try {
      // eslint-disable-next-line import/no-extraneous-dependencies
      const { default: Handlebars} = await eval(`import("handlebars")`);
      const parsedPath = path.parse(cp)
      const templatePath = path.join(parsedPath.dir,`${parsedPath.name}.handlebars`)
      const fileContent = await fs.readFile(templatePath)
      const template = Handlebars.compile(fileContent.toString())
      return {
        renderer: ({res, data }) => {
          res.send(template(data));
        }
      } as Controller
    } catch {
      return {
        renderer: ({res, data }) => {
          res.send(data);
        }
      } as Controller
    }
  },
  swagger = {
    openapi: '3.0.0',
  },
}: LoadDirectoryConfig<Controller>) => {
  try {
    // eslint-disable-next-line import/no-extraneous-dependencies
    const { default: Handlebars} = await eval(`import("handlebars")`);

    await processFilesRecursively({
      rootFolder: partialPath,
      startFolder: () => {},
      processFile: async (p, f, currentFolder) => {
        await p;
        if(!f.name.endsWith('.handlebars')) {
          return 
        }
        const fileContent = await fs.readFile(path.join(currentFolder, f.name))
        Handlebars.registerPartial(
          path.join(
            path.relative(
              partialPath,
              currentFolder
            ), path.parse(f.name).name
          ), 
          fileContent.toString()
        )
      },
      processDirectory: () => ({}),
      endFolder: () => ({}),
    });
  } catch(err) {
    console.warn('Unable to load partials')
  }

  const [router, swaggerPaths]: [Router, object] = await processFilesRecursively({
    rootFolder: controllerPath,
    startFolder: () => Router({ mergeParams: true }),
    processFile: async (p, f, cp, r) => {
      if(!VALID_FILENAMES.includes(f.name)) {
        return p;
      }
      const entry = await p;
      // eslint-disable-next-line no-eval
      let c = await eval(`import("${path.join(cp, f.name)}")`) as { default?: Controller};

      while(c.default) {
        c = c.default as { default?: Controller};
      }
      return { ...entry, ...controllerHandler(
        r, 
        path.relative('', path.join(cp, f.name)), 
        f.name, 
        { 
          ...await defaultControllerGenerator(
            { 
              controllerPath: path.relative('', path.join(cp, f.name)), 
            }
          ),
          ...c as Controller 
        }
      )} as object
    },
    processDirectory: async (p, d, result, _, r) => {
      const s = await p;
      const [subRouter, nestedSwagger] = result
      r.use(`/${d.name}`, subRouter);

      return { ...s, ...nestedSwagger}
    },
    endFolder: (currentControllerPath, r, endpointEntries, directoryEntries) => [
      r, 
      Object.keys(endpointEntries).length ? { 
        ...directoryEntries,
        [`/${path.relative(controllerPath, currentControllerPath).replace(/:([^/]*)/, '{$1}')}`]: endpointEntries,
      }
      : directoryEntries
    ],
  });

  try {
    // eslint-disable-next-line import/no-extraneous-dependencies
    const { Parcel } = await eval(`import("@parcel/core")`);
    const bundler = new Parcel({
      entries: [path.join(clientSourcePath, 'index.css'), path.join(clientSourcePath, 'index.js')],
      defaultConfig: '@parcel/config-default',
      targets: {
        main: {
          distDir: path.join(process.cwd(), "client-dist")
        }
      },
    });

    const {bundleGraph, buildTime} = await bundler.run();
    const bundles = bundleGraph.getBundles();
    console.log(`✨ Built ${bundles.length} bundles in ${buildTime}ms!`);

    router.use(bundleRoute, serveStatic(path.join(process.cwd(), "client-dist")))
  } catch(err) {
    console.warn('Unable to compile client assets')
    console.warn((err as { diagnostics?: object}).diagnostics)
  }

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
