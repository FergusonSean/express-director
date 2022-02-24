import Ajv from 'ajv';
import { Request, Response, NextFunction } from 'express';
import { SchemasProcessor, ControllerProcessor } from '../types'


const ajv = new Ajv({
  allErrors: true, removeAdditional: 'all', useDefaults: true, coerceTypes: 'array',
});

const getValidator = <Controller extends SchemasProcessor>(c: Controller, field: 'query'| 'body' | 'params') => {
  const schema = ajv.compile(c.schemas![field]!);
  return (req: Request & { validatedData: any}, res: Response, next: NextFunction) => {
    try {
      const valid = schema(req[field]);
      if (valid) {
        req.validatedData ||= {};
        Object.assign(req.validatedData, req[field]);
        next();
        return;
      }

      res.status(400).send({ [field]: { errors: schema.errors } });
    } catch (e) {
      next(e);
    }
  };
};

const processor: ControllerProcessor<SchemasProcessor> = ({controller}) => {
    const params = [
      ...(Object.keys(controller?.schemas?.params?.properties as object || {}).map((p: string) => ({
        in: 'path', 
        name: p,
        required: !!((controller?.schemas?.params?.required as Array<string>)?.includes?.(p))
      })) || []),

      ...(Object.keys(controller?.schemas?.query?.properties as object || {}).map((p: string) => ({
          in: 'query', 
          name: p,
          required: !!((controller?.schemas?.params?.required as Array<string>)?.includes?.(p))
      })) || [])
    ]

  return {
    handlers: controller.schemas ?  Object.keys(controller.schemas).map(
      (field) => getValidator(controller, (field as keyof typeof controller.schemas))
    ) : [],
    swagger: {
      ...(controller?.schemas?.body ? {
        requestBody: {
          content: {
            'application/json': {
              schema: controller?.schemas?.body
            }
          }
        }
      } : {}),
      ...(params.length ? {
        parameters: params
      } : {})
    },
  }
}

export default processor
