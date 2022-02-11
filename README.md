[![npm version](https://img.shields.io/npm/v/express-director.svg?style=flat)](https://www.npmjs.com/package/express-director)

# Express Director

> Express director is a simple npm package to enable loading a directory as express routes.

## Prerequisites

This project requires NodeJS (version 14 or later) and NPM.
[Node](http://nodejs.org/) and [NPM](https://npmjs.org/) are really easy to install.
To make sure you have them available on your machine,
try running the following command.

```sh
$ npm -v && node -v
7.24.0
v16.10.0
```

## Table of contents

  - [Express Director](#express-director)
  - [Prerequisites](#prerequisites)
  - [Table of contents](#table-of-contents)
  - [Installation](#installation)
  - [Usage](#usage)
  - [Contributing](#contributing)
  - [Versioning](#versioning)
  - [Authors](#authors)
  - [License](#license)

## Installation

To install:

```sh
$ npm install --save express-director
```

Or if you prefer using Yarn:

```sh
$ yarn add express-director
```

## Usage

For example usage check out the tests for an example cjs and mjs application.

In your app.js

```js
const startApp = async () => {
  const app = express();
  // add your favorite pre request middleware here
  app.use(await loadDirectory());
  // or if you prefer to load a different folder than src/controllers
  app.use(await loadDirectory('/absolute/path/to/your/contollers/here'));
  // add your favorite error handling middleware here
  return app;
};

startApp().then(app => app.listen(3000))
```

### Defining Controllers

To add a route to your application simply add a file with the matching http verb as the name at the path you would like it to be served. So if you wanted to support a POST request to localhost:3000/widget you would create:

```
src/controllers/widget/post.js
```


#### handler

A controller should export a handler function like so:

```js
export default {
  handler: (req, res, next) => {
    // do whatever you would do in a normal express handler here
    // but if you throw an exception it will be caught and forwarded to any error middleware you have defined
    // you can also return a value here and that is the same as calling res.send with it
    // res.send({hello: 'world'}) is the same as:
    return { hello: 'world'};
  }
}
```

#### schemas

In order to validate your input params you can use the schemas key to apply a JSON schema to the body, params, or query object. The server will return a 400 error with the ajv errors object if the request does not match any of your schemas.

It's worth noting that if you aren't using some form of body parser the body schema might have unpredictable effects as validation is applied to the field on the express request object and not the base data.

```js
export default {
  schemas: {
    body: ajvSchemaForBody,
    params: ajvSchemaForParams,
    query: ajvSchemaForQuery,
  },
  // handler etc goes here
}
```

Using a schema will strip any extra fields from the relevant key on the request object and so you should make sure to add complete schemas for your controllers

If you do specify schemas then the request.validatedData object will be available with an object containing the merged content of your schema fields.

#### prepareRouter

Setting middleware on a path and it's children can be done using the prepareRouter key on an exported controller:

```js
// all.js
export default {
  prepareRouter: (r) => {
    r.use((req, res, next) => {
      res.append('nonsense', 'true');
      next();
    });
  },
};
```

Some caveats to this approach are that in express the order that middleware is added is very important. It is recommended that you set any middleware that you intend to use in the all.js file as it will be the first thing loaded. This way middleware applies to everything below it without weird edge cases. However if your folder contains only one file it may be easier to read with all configuration in the same file, so it is an option to configure the router from any controller.

For clarification if load order is causing problems your files in a particular folder are processed in the following order:

1. All .js files in the directory in lexical order
2. All folders in reverse lexical order depth first


### Typescript types

In order to facilitate good typing in projects using this package the Controller type is exported so that a file can opt in to typechecking in the following way. This will verify all controller keys being set correctly.

```js
import { Controller } from 'express-director';

const controller: Controller = {
  handler: () => ({ hi: 5 }),
};

export default controller;
```

If your endpoint is using schemas then you can pass the appropriate types for your schemas so that ajv typechecking is enabled for your schemas and the validatedData field is detected as the correct type.

```js
import { Controller } from 'express-director';

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

const controller: Controller<Query,Body,Params> = {
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
  // req.validatedData comes back as the merged type of your three schemas
  handler: (req) => req.validatedData.firstName,
};

export default controller;
```



## Contributing

1.  Fork it!
2.  Create your feature branch: `git checkout -b my-new-feature`
3.  Add your changes: `git add .`
4.  Commit your changes: `git commit -am 'Add some feature'`
5.  Push to the branch: `git push origin my-new-feature`
6.  Submit a pull request :sunglasses:

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags).

## Authors

* **Sean Ferguson** - *Initial work* - [Sean Ferguson](https://github.com/FergusonSean)

See also the list of [contributors](https://github.com/FergusonSean/express-director/contributors) who participated in this project.

## License

[MIT License](https://andreasonny.mit-license.org/2019) © Sean Ferguson
