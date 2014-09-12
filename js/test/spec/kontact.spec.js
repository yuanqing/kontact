/* globals kontact, describe, beforeEach, afterEach, it, expect, $, jasmine, loadFixtures, sinon */
'use strict';

var fixture = 'fixture.html';

jasmine.getFixtures().fixturesPath = 'base/test/fixture/';
jasmine.getFixtures().preload(fixture);

describe('kontact(form, cb)', function() {

  var server, cb, form, submit;

  beforeEach(function() {

    loadFixtures('fixture.html');

    server = sinon.fakeServer.create();
    cb = sinon.spy();
    form = $('.kontact')[0];
    submit = $('.submit');

  });

  afterEach(function() {

    server.restore();

  });

  it('`cb` is passed the JSON response on submitting the `form`', function() {

    var response = {
      err: 0,
      data: {
        foo: 'bar'
      }
    };

    kontact(form, cb);

    server.respondWith(
      'POST',
      '/foo',
      [ 200, { 'Content-Type': 'application/json' }, JSON.stringify(response) ]
    );
    submit.click();
    server.respond();

    expect(cb.calledOnce).toBe(true);
    expect(cb.args[0]).toEqual([response.err, response.data]);

  });

});
