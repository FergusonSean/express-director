import Ajv from 'ajv';
import { Request, Response, NextFunction } from 'express';
import { SchemasProcessor } from '../types'


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

const processor = <Controller extends SchemasProcessor>({controller}: { controller: Controller}) =>
  controller.schemas ? Object.keys(controller.schemas).map((field) => getValidator(controller, (field as keyof typeof controller.schemas))) : []

export default processor
