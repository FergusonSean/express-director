import { Router, Response, Request, NextFunction } from 'express';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import fs from 'fs/promises';
import {Dirent} from 'fs';
import {HandlerMethod, controllerHandler } from './controller-handler';
import {DefaultController, ControllerProcessor} from './types';

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
  defaultControllerGenerator?: (config: {controllerPath: string}) => Controller | Promise<Controller>
  controllerProcessors?: ControllerProcessor<Controller>[]
  swagger?: any 
}

export const loadDirectory = async <Controller extends DefaultController>({
  controllerPath = path.join(process.cwd(), 'src', 'controllers'),
  defaultControllerGenerator = async ({controllerPath: cp}) => {
    try {
      // eslint-disable-next-line no-eval, @typescript-eslint/no-unsafe-assignment
      const { default: Handlebars } = await eval(`import("handlebars")`);
      const parsedPath = path.parse(cp)
      const templatePath = path.join(parsedPath.dir,`${parsedPath.name}.handlebars`)
      const fileContent = await fs.readFile(templatePath)
      // eslint-disable-next-line
      const template = Handlebars.compile(fileContent.toString())
      return {
        renderer: ({res, data }) => {
          // eslint-disable-next-line
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
  controllerProcessors = defaultProcessors,
  swagger = {
    openapi: '3.0.0',
  },
}: LoadDirectoryConfig<Controller>) => {
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
        },
        controllerProcessors
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
