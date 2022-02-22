import { DefaultController } from 'express-director';

type Params = {
  id: number;
}

type Body = {
  firstName: string;
  lastName: string;
}

type Query = {
  middleName: string;
}

const controller: DefaultController<Query,Body,Params> = {
  schemas: {
    params:  {
      type: 'object',
      properties: {
        id: { type: 'number', minimum: 100000 },
      },
      required: ['id'] as const,
    },
    query: {
      type: 'object',
      properties: {
        middleName: { type: 'string', minimum: 1 },
      },
      required: ['middleName'],
    },
    body: {
      type: 'object',
      required: ['firstName', 'lastName'],
      properties: {
        firstName: { type: 'string', minimum: 1 },
        lastName: { type: 'string', minimum: 1 },
      },
    },
  },
  handler: (req) => req.validatedData,
};

export default controller;
