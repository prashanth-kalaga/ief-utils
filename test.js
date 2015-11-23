"use strict"
var sinon = require('sinon')
  , logger = require('winston')
  , assert = require('assert')
  , mockery = require('mockery')
  , _ = require('lodash')
  , request = require('request')
  , nock = require('nock')
  , http = require('http')
mockery.enable({
    warnOnReplace: false
    , warnOnUnregistered: false
    , useCleanCache: true
});

var utils = require('./utils.js')

describe('utils.js integratorRestClient function unit test cases', function() {
  it('should throw no auth token error', function(done) {
    utils.integratorRestClient({
      bearerToken: "",
      resourcetype: 'integrations'
    }, function(err, response, body) {
      if (err) {
        assert.equal(err.message, 'No Auth Token is given!')
        done()
      }
    })
  })
  it('should throw no resourceType error', function(done) {
    utils.integratorRestClient({
      bearerToken: 'TestToken',
      resourcetype: ''
    }, function(err, response, body) {
      if(err) {
        assert.equal(err.message, 'No resourcetype is given!')
        done()
      }
    }
  )})
  it('should use GET if no id and data is provided', function(done) {
    var api = nock("http://api.localhost.io:5000")
          .get("/v1/integrations")
          .reply(200, "GET http method has been used used.");
    utils.integratorRestClient({
            bearerToken: "dkskwqyei8767876",
            resourcetype: 'integrations'
          }, function(err, response, body) {
            assert.equal(body, "GET http method has been used used.")
            done()
          })
  })
  it('should use POST if no id and but data is provided', function(done) {
    var api = nock("http://api.localhost.io:5000")
          .post("/v1/integrations")
          .reply(200, "POST http method has been used used.");
    utils.integratorRestClient({
            bearerToken: "dkskwqyei8767876",
            resourcetype: 'integrations',
            data: "sample Data"
          }, function(err, response, body) {
            assert.equal(body, "POST http method has been used used.")
            done()
          })
  })
  it('should use PUT if id(externally) but no data is provided', function(done) {
    var api = nock("http://api.localhost.io:5000")
          .put("/v1/integrations/4389578hi8443jhj4")
          .reply(200, "PUT http method has been used.");
    utils.integratorRestClient({
            bearerToken: "dkskwqyei8767876",
            resourcetype: 'integrations',
            id: "4389578hi8443jhj4",
            data: {}
          }, function(err, response, body) {
            assert.equal(body, "PUT http method has been used.")
            done()
          })
  })
  it('should use PUT if id(internally) but no data is provided', function(done) {
    var api = nock("http://api.localhost.io:5000")
          .put("/v1/integrations/4389578hi8443jhj4")
          .reply(200, "PUT http method has been used.");
    utils.integratorRestClient({
            bearerToken: "dkskwqyei8767876",
            resourcetype: 'integrations',
            data: {"data" : "dummy data",
                   "_id" : "4389578hi8443jhj4"
                  }
          }, function(err, response, body) {
            assert.equal(body, "PUT http method has been used.")
            done()
          })
  })
  it('distributed should be added to url , with http method GET ', function(done) {
    var api = nock("http://api.localhost.io:5000")
          .get("/v1/integrations/4389578hi8443jhj4/distributed")
          .reply(200, "distributed has been added to url");
    utils.integratorRestClient({
            bearerToken: "dkskwqyei8767876",
            resourcetype: 'integrations',
            id: "4389578hi8443jhj4",
            distributed: true
          }, function(err, response, body) {
            assert.equal(body, "distributed has been added to url")
            done()
          })
  })
  it('distributed should be added to url , with http method PUT, with id provided externally', function(done) {
    var api = nock("http://api.localhost.io:5000")
          .put("/v1/integrations/4389578hi8443jhj41/distributed")
          .reply(200, "distributed has been added to url");
    utils.integratorRestClient({
            bearerToken: "dkskwqyei8767876",
            resourcetype: 'integrations',
            id: "4389578hi8443jhj41",
            distributed: true,
            data: "sample data"
          }, function(err, response, body) {
            assert.equal(body, "distributed has been added to url")
            done()
          })
  })
  it('distributed should be added to url , with http method PUT, with id provided internally', function(done) {
    var api = nock("http://api.localhost.io:5000")
          .put("/v1/integrations/4389578hi8443jhj42/distributed")
          .reply(200, "distributed has been added to url");
    utils.integratorRestClient({
            bearerToken: "dkskwqyei8767876",
            resourcetype: 'integrations',
            distributed: true,
            data: {"data" : "sample data",
                   "_id" : "4389578hi8443jhj42"}
          }, function(err, response, body) {
            assert.equal(body, "distributed has been added to url")
            done()
          })
  })
  it('distributed should be added to url , with http method POST, with no id', function(done) {
    var api = nock("http://api.localhost.io:5000")
          .post("/v1/integrations/distributed")
          .reply(200, "distributed has been added to url");
    utils.integratorRestClient({
            bearerToken: "dkskwqyei8767876",
            resourcetype: 'integrations',
            distributed: true,
            data: {"data" : "sample data"}
          }, function(err, response, body) {
            assert.equal(body, "distributed has been added to url")
            done()
          })
  })
  it('should return incorrect response error!', function(done) {

    var api = nock("http://api.localhost.io:5000")
          .get("/v1/integrations")
          .reply(401, "Hello World");

    utils.integratorRestClient({
      bearerToken: "dkskwqyei8767876",
      resourcetype: 'integrations'
    }, function(err, response, body) {
      if (err) {
        assert.equal(err.message, 'Unable to verify response')
        done()
      }
    })
  })
  it('should not return incorrect response error!', function(done) {
    var api = nock("http://api.localhost.io:5000")
          .get("/v1/integrations")
          .reply(201, "Hello World");

    utils.integratorRestClient({
      bearerToken: "dkskwqyei8767876",
      resourcetype: 'integrations'
    }, function(err, response, body) {
      if (err) {
        if(err.message !== 'Unable to verify response')
        done()
      }
      else {
        done()
      }
    })
   })
})
describe('integratorApiIdentifierClient function unit test cases!', function() {
  beforeEach(function() {
  })
  afterEach(function() {
  })
  it('should throw no auth token error', function(done) {
    utils.integratorApiIdentifierClient({
      bearerToken: "",
      apiIdentifier: 'brv75984365865'
    }, function(err, response, body) {
      if (err) {
        assert.equal(err.message, 'No Auth Token was provided!')
        done()
      }
    })
  })
  it('should throw no apiIdentifier error', function(done) {
    utils.integratorApiIdentifierClient({
      bearerToken: "kdjfk85748kjkjfjk84n",
      apiIdentifier: ""
    }, function(err, response, body) {
      if (err) {
        assert.equal(err.message, 'No apiIdentifier was provided!')
        done()
      }
    })
  })
})
describe('createRecordsInOrder function unit test cases!', function() {
  it('loadJSON has been called once', function(done) {
    var metaData = require('./testData/allrecordsmeta.json')
    try {
    utils.createRecordsInOrder(metaData, { bearerToken : 'jshdkjsdh7567djd68b'}, function(error, success) {

    }) }catch(e) {
      assert.equal(e.code, "MODULE_NOT_FOUND")
      done()
    }
  })
  it('should return true since all dependencies are marked resolved', function(done) {
    var metaData = require('./testData/allrecordsmeta.json')
    _.each(metaData, function(record) {
      record.resolved = true,
      record.isLoaded = true
    })
    utils.createRecordsInOrder(metaData, { bearerToken : 'jshdkjsdh7567djd68b'}, function(error, success) {
    assert.equal(error, null)
    done()
    })
  })
  it('should throw cyclic dependency error!', function(done) {
    var circularJson = require('./testData/allRecordsMetaDataCircular.json')
    utils.createRecordsInOrder(circularJson, null, function(error, succss) {
      if(error) {
        assert.equal(error.message, 'The recordsArray has cyclic refreneces')
        done()
      }
    })
  })
  it('should throw no location error !', function(done) {
    var noLocationJson = require('./testData/allRecordsMetaDataNoLocation.json')
    utils.createRecordsInOrder(noLocationJson, null, function(error, success) {
      if(error) {
        var index = (error.message).search('Config Error: no filelocation given in record : ');
        assert.notEqual(index, -1)
        done()
      }
    })
  })
})
describe('loadJSON function test cases!', function() {
  it('should throw MODULE_NOT_FOUND error', function(done) {
    try {
      utils.loadJSON('./testData/allrecordsmeta.json')
    } catch (e) {
    assert.equal(e.code, "MODULE_NOT_FOUND")
    done()
   }
  })
  //TODO: need to do proper mocking for require statement
  it.skip('should not throw MODULE_NOT_FOUND error if already loaded', function(done) {
    console.log(require.cache[require.resolve('./testData/allrecordsmeta.json')])
    if(utils.loadJSON('./testData/allrecordsmeta.json') !== undefined)
    done()
  })
})
describe('makeAsyncCalls function unit test cases.', function(){
  it('if make async calls has been called', function(done){
    var api = nock("http://api.localhost.io:5000")
          .post("/jhdjhs7dh67db6")
          .reply(402, "POST http method has been used.");
    var metaData = require('./testData/allrecordsmeta.json')
    _.each(metaData, function(record) {
      record.isLoaded = true,
      record.resolved = false,
      record.info = {"apiIdentifier" : true},
      record.info.data = { "apiIdentifier" : "jhdjhs7dh67db6",
                           "bearerToken" : "jshdkjsdh7567djd68b"},
      record.info.bearerToken = "jshdkjsdh7567djd68b"
    })

    utils.createRecordsInOrder(metaData, { bearerToken : 'jshdkjsdh7567djd68b'}, function(error, success) {
      if(error) {
        console.log(error)
        assert.equal(error.message, 'Unable to verify response')
        done()
      } else {
        console.log('no error!')
      }
    })
  })

  it('second block in makeAsyncCalls(integratorRestClient call)', function(done){
    var api = nock("http://api.localhost.io:5000")
          .get("/v1/connections")
          .reply(402, "Hello World");
   var metaData = require('./testData/allrecordsmeta.json')
   _.each(metaData, function(record) {
     record.isLoaded = true,
     record.resolved = false,
     record.info = {"resourcetype" : "connections",
                    "bearerToken": "dkskwqyei8767876"}
   })
    utils.createRecordsInOrder(metaData, { bearerToken : 'dkskwqyei8767876'}, function(error, success) {
      if(error) {
        console.log(error)
        assert.equal(error.message, 'Unable to verify response')
        done()
      } else {
        console.log('no error!')
      }
    })
  })
  it('should get ** The method is set GET but there is no _id in data** error', function(done){
    var metaData = require('./testData/allrecordsmeta.json')
    _.each(metaData, function(record) {
      record.isLoaded = true,
      record.resolved = false,
      record.info = { "apiIdentifier1" : false,
                      "method" : "GET"},
      record.info.data = { "bearerToken" : "jshdkjsdh7567djd68b"},
      record.info.bearerToken = "jshdkjsdh7567djd68b"
    })
    utils.createRecordsInOrder(metaData, { bearerToken : 'jshdkjsdh7567djd68b'}, function(error, success) {
      if(error) {
        assert.equal(error.message, 'The method is set GET but there is no _id in data')
        done()
      } else {
        console.log('no error!')
      }
    })
  })
})
