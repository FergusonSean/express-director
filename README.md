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
  app.use(await loadDirectory({
    // these fields are optional as sane defaults are provided, but you must pass an object even if you are not overriding any of the defaults.
    controllerPath: path.join(process.cwd(), 'src', 'controllers'),
    defaultController: {
      renderer: ({res, data}) => res.send(data),
    }
  }));
  // add your favorite error handling middleware here
  return app;
};

startApp().then(app => app.listen(3000))
```

### Configuring loadDirectory

loadDirectory takes a context argument with several fields you can use to customize the behavior of express-director globally. Note that all of these are optional, but you must pass an object regardless of whether or not you intend to override anything.

#### controllerPath

This is the path to your controllers. Defaults to the current working directory/src/controllers. If your controller root is in a different location you should make sure that this is set to the absolute path of that directory.

#### defaultController

This is an object that will be shallowly merged with your controllers to set default values across all your controllers as necessary. For details on the shape of this object check out the controllers section below. Note that the actual controller will override any conflicting values set here.

#### controllerProcessors

This is an array of controller processors that produce express middlewares to handle the behavior you want out of your controllers. Note that this is very advanced usage and should rarely be needed. If you choose to override this behavior be sure to include the default processors in the list otherwise you controllers might be missing behavior described below.

##### Default Processors


###### prepareRouter

This Processor handles the prepareRouter key on controllers. See below for detailed documentation.

###### processSchemas

This Processor handles the schemas key on controllers. See below for detailed documentation.

###### processHandlerAndResponder

This Processor handles the handler and renderer key on controllers. See below for detailed documentation.

##### Creating custom processors

Example custom processor:

```js
// in a file called mermission-processor.js
const processor = ({path, controller}) => {
  if (controller.permission) {
    return [
      async (req, res, next) => {
        try {
          if(req.permissions.includes(controller.permission) {
            return next()
          }

          res.sendStatus(403)
        } catch (e) {
          next(e);
        }
      },
    ]
  }

  return [];
}

export default processor

// in your main file where express-directory is configured
import loadDirectory, { defaultProcessors } from 'express-directory';
import permissionProcessor from 'src/processors';
const startApp = async () => {
  const app = express();
  app.use(middlewareThatSetsRequestPermissions)
  app.use(await loadDirectory({
    controllerPath: path.join(process.cwd(), 'src', 'controllers'),
    defaultController: {
      renderer: ({res, data}) => res.send(data),
    },
    // note that if you do not include the default processors or include them out of order then YMMV with regards to the rest of the documentation. The only test case run as part of this project is to add new processors to the beginning of the config.
    controllerProcessors: [permissionProcessor, ...defaultProcessors]
  }));
  // add your favorite error handling middleware here
  return app;
};

startApp().then(app => app.listen(3000))


```

Adding your own custom processors allows you to extend the functionality of your controllers to support other nice opt in feature like authentication, logging, audit trail, permissions etc that the library does not yet support. Please feel free to add an issue to the repository if there is some controller key you would like to see added or a custom processor you think the community would benefit from.



### Defining Controllers

To add a route to your application simply add a file with the matching http verb as the name at the path you would like it to be served. So if you wanted to support a POST request to localhost:3000/widget you would create:

```
src/controllers/widget/post.js
```

It is worth noting here that the following keys and documentation relating to them only hold true if the configuration for loadDirectory includes all the default processors.

#### handler

A controller should export a handler function like so:

```js
export default {
  handler: (req, res, next) => {
    // do whatever you would do in a normal express handler here
    // but if you throw an exception it will be caught and forwarded to any error middleware you have defined
    // you can also return a value here and it will be passed to the renderer of the controller or default renderer from the global initialization.
    return { hello: 'world'};
    // by default the above is equivalent to:
    // res.send({hello: 'world'});
  }
}
```

#### renderer

In order to use a custom renderer you can add the renderer key to your controller. The renderer receives a context object that includes the result of your handler. These renderer allow you to standardize output formats by sharing renderer functions across multiple controllers. It is recommended that any custom renderer you write be placed in src/renderers, but this is not enforced by the library in any way.

```js
const controller = {
  handler: () => ({ hi: 5 }),
  // note here that the path here is the relative path from the cwd of the controller file this is useful if you want to grab related resources based on the path of the controller.
  renderer: ({req, res, path, data}) => res.send({ count: data.hi })
};

export default controller;
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

In order to facilitate good typing in projects using this package the DefaultController type is exported so that a file can opt in to typechecking in the following way. This will verify all controller keys being set correctly. Please note that if you overwrite the controllerProcessors config option you will have to build your own controller type based on the controller format expected by your list of processors. In order to simplify that process types are exported for each processor that you can combine to create a new controller type. but for most common usecases the DefaultController should suffice.

```js
import { DefaultController } from 'express-director';

const controller: DefaultController = {
  handler: () => ({ hi: 5 }),
};

export default controller;
```

If your endpoint is using schemas then you can pass the appropriate types for your schemas so that ajv typechecking is enabled for your schemas and the validatedData field is detected as the correct type.

```js
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
  // req.validatedData comes back as the merged type of your three schemas
  handler: (req) => req.validatedData.firstName,
};

export default controller;
```

If you are using a custom renderer it will take into account the data field being of your handler result type:

```js
import { DefaultController } from 'express-director';

type HandlerResult = {
  hi: number;
}

const controller: DefaultController<null,null,null, HandlerResult> = {
  handler: () => ({ hi: 5 }),
  renderer: ({res, data}) => res.send({data: { count: data.hi }})
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
