import { Request, Response, NextFunction } from 'express';
import get from "lodash.get"

const processor = (keyPath: string, controllerKey: string = keyPath) => 
({controller}: { controller: Record<string, any>}) => {
    if((controller[controllerKey])){
      return {
        handlers: [
          (req: Request, res: Response, next: NextFunction) => {
            const value: any[] = (Array.isArray(get(req, keyPath)) ? get(req, keyPath) as any[]: [get(req, keyPath)])
            if(!value.includes(controller[controllerKey])) {
              res.sendStatus(403);
            } else {
              next()
            }
          }
        ],
        swagger: {}
      }
    }
      return {
        handlers: [],
        swagger: {}
      }
  }



export default processor
