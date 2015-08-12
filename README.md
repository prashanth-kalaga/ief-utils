# ief-utils

A utility wrapper for various tasks on Integrator.IO.

[![NPM](https://nodei.co/npm/ief-utils.png)](https://www.npmjs.com/package/ief-utils)

## Install

Add dependency in package.json or Install via command line
```js
npm install ief-utils

package.json
{
    ...,
    "ief-utils" : "0.0.1"
}
```
## API
    There are currently two methods available in the utils:
# integratorRestClient( requestOptions, callback)
## requestOptions
    requestoption must have these values
### 1. bearerToken : [Your Token from IntegratorIO account]
### 2. resourcetype : 
    Sample values :
    integratios, connections, expoerts, imports, flows
### 3. id
    Give id for the resource
### 4. data
    This contains the JSON that you want to put/post to the resource.
### Use
    Based on the above four paramteres the API will determine whether it is get, post or put call.The delete operation is not supported for now.
```js
util = require('ief-utils')
util.integratorRestClient( requestOptions, function(err, response, body){
    //do next processing 
})  
```