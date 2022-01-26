const request = require('supertest');
const { expect } = require('chai');
const createApp = require('../src/index');

let app;
let server;

describe('mjs server', () => {
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
});
