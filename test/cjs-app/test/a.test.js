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

  it('CHECKOUT /all-methods', async () => {
    const response = await request(app).checkout('/all-methods').expect(200);
    expect(response.text).to.eql('checkout');
  });
  it('COPY /all-methods', async () => {
    const response = await request(app).copy('/all-methods').expect(200);
    expect(response.text).to.eql('copy');
  });
  it('DELETE /all-methods', async () => {
    const response = await request(app).delete('/all-methods').expect(200);
    expect(response.text).to.eql('delete');
  });
  it('GET /all-methods', async () => {
    const response = await request(app).get('/all-methods').expect(200);
    expect(response.text).to.eql('get');
  });
  it('HEAD /all-methods', async () => request(app).head('/all-methods').expect(200));
  it('LOCK /all-methods', async () => {
    const response = await request(app).lock('/all-methods').expect(200);
    expect(response.text).to.eql('lock');
  });
  it('M-SEARCH /all-methods', async () => {
    const response = await request(app)['m-search']('/all-methods').expect(200);
    expect(response.text).to.eql('m-search');
  });
  it('MERGE /all-methods', async () => {
    const response = await request(app).merge('/all-methods').expect(200);
    expect(response.text).to.eql('merge');
  });
  it('MKACTIVITY /all-methods', async () => {
    const response = await request(app).mkactivity('/all-methods').expect(200);
    expect(response.text).to.eql('mkactivity');
  });
  it('MKCOL /all-methods', async () => {
    const response = await request(app).mkcol('/all-methods').expect(200);
    expect(response.text).to.eql('mkcol');
  });
  it('MOVE /all-methods', async () => {
    const response = await request(app).move('/all-methods').expect(200);
    expect(response.text).to.eql('move');
  });
  it('NOTIFY /all-methods', async () => {
    const response = await request(app).notify('/all-methods').expect(200);
    expect(response.text).to.eql('notify');
  });
  it('OPTIONS /all-methods', async () => {
    const response = await request(app).options('/all-methods').expect(200);
    expect(response.text).to.eql('options');
  });
  it('PATCH /all-methods', async () => {
    const response = await request(app).patch('/all-methods').expect(200);
    expect(response.text).to.eql('patch');
  });
  it('POST /all-methods', async () => {
    const response = await request(app).post('/all-methods').expect(200);
    expect(response.text).to.eql('post');
  });
  it('PURGE /all-methods', async () => {
    const response = await request(app).purge('/all-methods').expect(200);
    expect(response.text).to.eql('purge');
  });
  it('PUT /all-methods', async () => {
    const response = await request(app).put('/all-methods').expect(200);
    expect(response.text).to.eql('put');
  });
  it('REPORT /all-methods', async () => {
    const response = await request(app).report('/all-methods').expect(200);
    expect(response.text).to.eql('report');
  });
  it('SEARCH /all-methods', async () => {
    const response = await request(app).search('/all-methods').expect(200);
    expect(response.text).to.eql('search');
  });
  it('SUBSCRIBE /all-methods', async () => {
    const response = await request(app).subscribe('/all-methods').expect(200);
    expect(response.text).to.eql('subscribe');
  });
  it('TRACE /all-methods', async () => {
    const response = await request(app).trace('/all-methods').expect(200);
    expect(response.text).to.eql('trace');
  });
  it('UNLOCK /all-methods', async () => {
    const response = await request(app).unlock('/all-methods').expect(200);
    expect(response.text).to.eql('unlock');
  });
  it('UNSUBSCRIBE /all-methods', async () => {
    const response = await request(app).unsubscribe('/all-methods').expect(200);
    expect(response.text).to.eql('unsubscribe');
  });
});
