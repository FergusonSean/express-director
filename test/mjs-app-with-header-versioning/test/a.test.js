import request from 'supertest';
import { expect } from 'chai';
import createApp from '../src/index.js';

let app;
let server;

describe('mjs server', () => {
  before(async () => {
    app = await createApp();
    server = app.listen(0);
  });

  after(() => server.close());

  it('GET /healthcheck', async () => {
    const response = await request(server).get('/healthcheck').expect(200);
    expect(response.text).to.eql('healthy');
  });

  it('GET /direct-return', async () => {
    const response = await request(app).get('/direct-return').expect(200);
    expect(response.body).to.eql({ body: {}, path: 'src/controllers/direct-return/get.js', data: { hi: 5 }});
  });

  it('GET /nested/route', async () => {
    const response = await request(app).get('/nested/route').expect(200);
    expect(response.body).to.eql({ route: true });
  });

  it('GET /nested/:param', async () => {
    const response = await request(app).get('/nested/hi').expect(200);
    expect(response.text).to.eql('hi');
  });

  it('GET /nested', async () => {
    const response = await request(app).get('/nested').expect(200);
    expect(response.text).to.eql('nested');
  });

  it('GET /failure', () => request(app).get('/failure').expect(500));

  describe('POST /schema/:id', () => {
    it('returns 200 on valid request', async () => {
      const response = await request(app).post('/schema/123456?middleName=old').send({ firstName: 'the', lastName: 'man' }).expect(200);
      expect(response.body).to.eql({ 
        path: 'src/controllers/schema/:id/post.js',
        data: {
          id: 123456, 
          firstName: 'the', 
          middleName: 'old', 
          lastName: 'man',
        }, 
        body: { firstName: 'the', lastName: 'man' }
      });
    });

    it('returns 400 on invalid body', async () => {
      const response = await request(app).post('/schema/123456?middleName=old').send({ lastName: 'man' }).expect(400);
      return expect(response.body.body.errors).to.exist;
    });

    it('returns 400 on invalid query', async () => {
      const response = await request(app).post('/schema/123456').send({ firstName: 'the', lastName: 'man' }).expect(400);
      return expect(response.body.query.errors).to.exist;
    });

    it('returns 400 on invalid params', async () => {
      const response = await request(app).post('/schema/123?middleName=old').send({ firstName: 'the', lastName: 'man' }).expect(400);
      return expect(response.body.params.errors).to.exist;
    });
  });

  it('GET /version 1', async () => {
    const response = await request(app).get('/version').set({ "X-API-VERSION": "v1"}).expect(200);
    expect(response.text).to.eql("Used version 1");
  })

  it('GET /version 2', async () => {
    const response = await request(app).get('/version').set({ "X-API-VERSION": "v2"}).expect(200);
    expect(response.text).to.eql("Used version 2");
  })

  it('GET /version unknown', async () => {
    await request(app).get('/version').set({ "X-API-VERSION": "unknown"}).expect(404);
  })
});
