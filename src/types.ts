import {JSONSchemaType} from 'ajv';
import { Router, Request, Response, NextFunction } from 'express';

export type SwaggerProcessor = {
  swagger?: any
}

export type HandlerResponderProcessor<HandlerResult = any> = {
  handler?: (req: Request, res: Response, next: NextFunction) => HandlerResult
  renderer?: (context: { req: Request, res: Response, path: string, data: HandlerResult}) => any,
}

export type PrepareRouterProcessor = {
  prepareRouter?: (router: Router) => void
}

export type SchemasProcessor<QueryType = null, BodyType = null, ParamsType = null> = {
  schemas?: {
    query?: JSONSchemaType<QueryType>,
    body?: JSONSchemaType<BodyType>,
    params?: JSONSchemaType<ParamsType>,
  },
}

export type DefaultController<QueryType = null, BodyType = null, ParamsType = null, HandlerResult = any> = 
  Omit<(PrepareRouterProcessor & 
  SchemasProcessor<QueryType, BodyType, ParamsType> & 
  HandlerResponderProcessor<HandlerResult> & SwaggerProcessor), 'handler'> & 
  {
    handler?: (
      req: Request & { 
        validatedData: (QueryType & BodyType & ParamsType) extends null ? never : QueryType & BodyType & ParamsType,
      }, 
      res: Response, 
      next: NextFunction
    ) => HandlerResult
  }

export type ControllerProcessor<Controller = DefaultController, Handler = DefaultController['handler']> = (context: { router: Router, file: string, path: string, controller: Controller}) => Handler[]
