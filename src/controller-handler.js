import Ajv from 'ajv';

const ajv = new Ajv({ allErrors: true, useDefaults: true, coerceTypes: 'array' });

const getValidator = (c, field) => {
  if (!c[field]) return null;
  const schema = ajv.compile(c[field]);
  return async (req, res, next) => {
    try {
      const valid = schema(req[field]);
      if (valid) return next();

      return res.status(400).send({ [field]: { errors: schema.errors } });
    } catch (e) {
      return next(e);
    }
  };
};

export const controllerHandler = (router, f, c) => {
  const method = f.split('.').slice(0, -1).join('.');

  if (c.prepareRouter) {
    c.prepareRouter(router);
  }

  const handlers = ['query', 'body', 'params'].map((field) => getValidator(c, field)).filter((v) => !!v);

  if (c.handler) {
    handlers.push(
      async (req, res, next) => {
        try {
          const result = await c.handler(req, res, next);
          if (result && !res.headersSent) {
            res.send(result);
          }
        } catch (e) {
          next(e);
        }
      },
    );
  }

  if (handlers.length) {
    router[method]('/', handlers);
  }
};
