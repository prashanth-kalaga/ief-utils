/*jslint nomen: true*/
/*global _ */

var _ = require('lodash'),
    async = require('async'),
    jsonPath = require('JSONPath'),
    request = require('request'),
    logger = require('winston');

var HERCULES_BASE_URL = 'https://api.integrator.io';
if (process.env.NODE_ENV !== 'production') {
  //local testing of code
  HERCULES_BASE_URL = 'http://api.localhost.io:5000'
}

var createRecordsInOrder = function (recordarray, options, callback) {
    //the record should Directed Acyclic Graph
    if(!verifyACircular(recordarray)){
        return callback(new Error('The recordsArray has cyclic refreneces'));
    };
    //load all json data from filesystem into info variable
    var temprecord;
    for(temprecord in recordarray){
        //for each record load file from fs into variable info
        if(! (recordarray[temprecord].filelocation || recordarray[temprecord].isLoaded) ) {
            return callback(new Error('Config Error: no filelocation given in record : '+temprecord));
        }
        if(!recordarray[temprecord].isLoaded){
            recordarray[temprecord].info = require(recordarray[temprecord].filelocation);
            //add bearer token in info node
            recordarray[temprecord].info.bearerToken = options.bearerToken;
        }
    }
    //while every dependency is not resolved
    makeAsyncCalls(recordarray, callback);
},
    /**
    *   signature :
    *   options [{bearerToken, resourcetype, id, data}]
    *   callback
    */
    integratorRestClient = function (options, callback) {
      if(!options.resourcetype){
        logInSplunk('No resourcetype is given!');
        return callback(new Error('No resourcetype is given!'));
      }
      if(!options.bearerToken){
        logInSplunk('No Auth Token is given!');
        return callback(new Error('No Auth Token is given!'));
      }
      //console.log('calling integrator for '+options.resourcetype);
      var opts = {
        uri: HERCULES_BASE_URL + '/v1/' + options.resourcetype,
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + options.bearerToken,
          'Content-Type': 'application/json'
        },
        json: true
      };

      if(!!options.id){
        opts.uri = opts.uri + '/' + options.id;
        if(!!options.data){
          opts.method = 'PUT';
          opts.json = options.data;
        }
      }else if(!!options.data){
        opts.method = 'POST';
        opts.json = options.data;
        //if data cotains _id that means it is a put call
        if(options.data._id){
            opts.uri = opts.uri + '/' + options.data._id;
            opts.method = 'PUT';
        }
      }
      //logInSplunk('REST call : method|' + opts.method + ', uri|' + opts.uri);
      //logInSplunk('call : \n'+JSON.stringify(opts));
      request(opts, function(error, res, body) {
        return callback(error, res, body);
      });
    }
;

var verifyDependency = function (recordarray, record) {
        //logInSplunk('verifyDependency ');
        //get the dependency array and check if all are resolved in a loop
        var i;
        if(!recordarray[record].dependson || recordarray[record].dependson.length === 0){
            logInSplunk('verifyDependency : no depenedency')
            return true;
        }
        for (i = 0; i < recordarray[record].dependson.length; i = i + 1) {
            //logInSplunk('verifyDependency : i '+i)
            if (!recordarray[record].dependson[i].resolved) {
                return false;
            }
        }
        logInSplunk('verifyDependency : ready to resolve')
        if (!recordarray[record].info.jsonpath) {
            recordarray[record].info.jsonpath = [];
        }
//      sample jsonpath object
//      {
//            "record" : "connection-netsuite",
//            "readfrom" : "$._id",
//            "writeto"  : "_connectionId"
//             "writetopath" : "the json path to node where we want to add writeto"
//       }
        for (i = 0; i < recordarray[record].info.jsonpath.length; i = i + 1) {
            var temp = recordarray[record].info.jsonpath[i];
            //read the value of temprecord
            var tempvalue = jsonPath.eval(recordarray[temp.record]['info']['response'], temp.readfrom);
            if(tempvalue.length <= 0 ){
                throw new Error('Unable to find '+temp.readfrom+ ' in '+ JSON.stringify(recordarray[temp.record]['info']['response']));
            }
            tempvalue = tempvalue[0];
            //set in record
            //TODO: Add support for nested value writes
            //if it doesn't start with $ mean no need to run JSONPath eval on writeto
            var tempWriteto;
            if(temp.writetopath){
                tempWriteto = jsonPath.eval(recordarray[record].info.data, temp.writetopath);
                if(tempWriteto.length <= 0 ){
                    throw new Error('Unable to find jsonpath '+temp.writeto+ ' in '+ JSON.stringify(recordarray[record].info.data));
                }
                tempWriteto = tempWriteto[0];
            }else{
                tempWriteto = recordarray[record].info.data;
            }
            tempWriteto[temp.writeto] = tempvalue;
            logInSplunk('setting ' + temp.writeto + ' as ' + tempvalue );
        }
        //logInSplunk('After dependecy resolution record : ' + JSON.stringify(recordarray[record].info.data) );
        return true;
    },
    verifyACircular = function (graph) {
        var node, i;
        for (node in graph) {
            if (graph[node].dependson && _.isArray(graph[node].dependson) && graph[node].dependson.length > 0) {
                for (i = 0; i < graph[node].dependson.length; i = i + 1) {
                    if (typeof (graph[node].dependson[i]) === 'string') {
                        graph[node].dependson[i] = graph[graph[node].dependson[i]];
                    }
                }
            }
        }
        try {
            JSON.stringify(graph);
            return true;
        } catch (e) {
            return false;
        }
    },
    verifyAllResolved = function (graph) {
        var node;
        for (node in graph) {
            if (!graph[node].resolved) {
                return false;
            }
        }
        return true;
    },
    logInSplunk = function(logmessage){
      logstring = 'module="extensionUtils" message="';
      logger.info(logstring + logmessage + '"');
    },
    verifyResponse = function (response){
      if(response && response.statusCode && (response.statusCode >= 200 || response.statusCode < 400) ) {
        return true;
      }
      logInSplunk('Verification failed : '+response.statusCode);
      return false;
    },
    makeAsyncCalls = function(recordarray, callback){
        logInSplunk('Making Async calls');
        if(verifyAllResolved(recordarray)){
            logInSplunk('=================================All depenedency are resolved');
            return callback(null, {success:true});
        }
        var batch = [], tempnode;
        
        for ( tempnode in recordarray) {
            if (!recordarray[tempnode].resolved && verifyDependency(recordarray, tempnode)) {
               //logInSplunk('=== ::: pushing '+JSON.stringify(recordarray[tempnode]));
                batch.push(recordarray[tempnode]);
            }
        }
        //we have all non dependent record perform aysn calls here
        async.each(batch, function (record, cb) {
            //we got record meta, try loading the record
            //logInSplunk('record.info :'+ JSON.stringify(record.info));
            integratorRestClient(record.info, function( err, response, body ){
                //logInSplunk('Posting record : ' + JSON.stringify(body));
                if(err){
                    //logInSplunk('Error1 : ');
                    return cb(new Error('Error while connecting to Integrator.io'));
                }
                if(!verifyResponse(response)){
                    //logInSplunk('Error2 : ');
                    return cb(new Error('Unable to verify response'));
                }
                //this mean call was successful, now go and save the info at location info.response
                record.info.response = body;
                logInSplunk('record got created in ' + JSON.stringify(body));
                //mark as resolved
                record.resolved = true;
                return cb(null);
            });
            //make a call to Integrator
            //call integrator rest client with resourceType
            //and data
        }, function (err) {
            if(err){
                return callback(new Error(JSON.stringify(err)));
            }//everything is successful for this batch let create another
            //logInSplunk('calling async');
            makeAsyncCalls(recordarray, callback);
        })
    }
    ;

exports.createRecordsInOrder = createRecordsInOrder;
exports.integratorRestClient = integratorRestClient;

