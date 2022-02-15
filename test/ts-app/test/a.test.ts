import request from 'supertest';
import {Application} from 'express'
import * as http from 'http';
import { expect } from 'chai';
import createApp from '../src';

let app: Application;
let server: http.Server;

describe('ts server', () => {
  before(async () => {
    app = await createApp();
    server = app.listen(0);
  });

  after(() => server.close());

  it('GET /healthcheck', async () => {
    const response = await request(app).get('/healthcheck').expect(200);
    expect(response.text).to.eql('healthy');
  });

  it('GET /direct-return', async () => {
    const response = await request(app).get('/direct-return').expect(200);
    expect(response.body).to.eql({ hi: 5 });
  });

  it('GET /custom-formatter', async () => {
    const response = await request(app).get('/custom-formatter').expect(200);
    expect(response.body).to.eql({ data: { count: 5 }});
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
        id: 123456, firstName: 'the', middleName: 'old', lastName: 'man',
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
});
