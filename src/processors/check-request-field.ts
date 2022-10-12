import { Request, Response, NextFunction } from 'express';
import get from "lodash.get"

const processor = (keyPath: string, controllerKey: string = keyPath) => 
({controller}: { controller: Record<string, any>}) => {
    if((controller[controllerKey])){
      return {
        handlers: [
          (req: Request, res: Response, next: NextFunction) => {
            if(!(get(req, keyPath) === controller[controllerKey])) {
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
