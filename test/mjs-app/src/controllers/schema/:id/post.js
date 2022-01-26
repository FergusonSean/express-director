export default {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'number', minimum: 100000 },
    },
  },
  query: {
    type: 'object',
    required: ['middleName'],
    properties: {
      middleName: { type: 'string', minimum: 1 },
    },
  },
  body: {
    type: 'object',
    required: ['firstName', 'lastName'],
    properties: {
      firstName: { type: 'string', minimum: 1 },
      lastName: { type: 'string', minimum: 1 },
    },
  },
  handler: (req) => req.validatedData,
};
