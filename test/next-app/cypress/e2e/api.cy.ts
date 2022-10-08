describe('next server custom processor', () => {
  it('GET /healthcheck', () => {
    cy.request('/healthcheck').should((response) => {
      expect(response.status).to.eql(200);
      expect(response.body).to.eql('healthy');
    })
  });

  it('GET /direct-return', () => {
    cy.request('/direct-return').should(response => {
      expect(response.status).to.eql(200);
      expect(response.body).to.eql({ hi: 5 });
      expect(response.headers.random).to.eql('hi');
    })
  });

  it('GET /nested/route', () => {
    cy.request('/nested/route').should(response => {
      expect(response.status).to.eql(200);
      expect(response.body).to.eql({ route: true });
    })
  });

  it('GET /nested/:param', () => {
    cy.request('/nested/hi').should(response => {
      expect(response.status).to.eql(200);
      expect(response.body).to.eql('hi');
    })
  });

  it('GET /nested', () => {
    cy.request('/nested').should(response => {
      expect(response.status).to.eql(200);
      expect(response.body).to.eql('nested');
    })
  });

  it('GET /failure', () => 
    cy.request({ 
      url: '/failure', 
      failOnStatusCode: false
    }).should(response => {
      expect(response.status).to.eql(500);
    })
  )

  describe('POST /schema/:id', () => {
    it('returns 200 on valid request', () => {
      cy.request({ 
        method: 'POST',
        url: '/schema/123456', 
        qs: { middleName: 'old' },
        body: { firstName: 'the', lastName: 'man' },
        failOnStatusCode: false
      }).should(response => {
        expect(response.body).to.eql({ 
          id: 123456, 
          firstName: 'the', 
          middleName: 'old', 
          lastName: 'man',
        });
        expect(response.status).to.eql(200);
      })
    });

    it('returns 400 on invalid body', () => {
      cy.request({ 
        method: 'POST',
        url: '/schema/123456', 
        qs: { middleName: 'old' },
        body: { lastName: 'man' },
        failOnStatusCode: false
      }).should(response => {
        expect(response.status).to.eql(400);
        expect(response.body.body.errors).to.exist;
      })
    });

    it('returns 400 on invalid query', () => {
      cy.request({ 
        method: 'POST',
        url: '/schema/123456', 
        body: { firstName: 'the', lastName: 'man' },
        failOnStatusCode: false
      }).should(response => {
        expect(response.status).to.eql(400);
        expect(response.body.query.errors).to.exist;
      })
    });

    it('returns 400 on invalid params', () => {
      cy.request({ 
        method: 'POST',
        url: '/schema/123', 
        qs: { middleName: 'old' },
        body: { firstName: 'the', lastName: 'man' },
        failOnStatusCode: false
      }).should(response => {
        expect(response.status).to.eql(400);
        expect(response.body.params.errors).to.exist;
      })
    });
  });
});

export {}
