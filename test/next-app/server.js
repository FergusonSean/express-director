const express = require('express')
const { loadDirectory, defaultProcessors } = require('express-director');

const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = 3000
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(async () => {
  const server = express()
  server.use(express.json());
  server.use(await loadDirectory({
    controllerProcessors: [ ({controller}) => ({
      handlers: [
        (_, res, next) => {
          if(controller.headers) res.set(controller.headers)
          next();
        }
      ]

    }), ...defaultProcessors],
  }));

  server.use((req, res) => {
    return handle(req, res)
  })

  server.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })
})


