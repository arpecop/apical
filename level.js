 const fs = require('fs');
 const md5 = require('md5');

 function get(keyname, callback) {
   fs.readFile('/tmp/' + md5(keyname) + '.json', function (err, data) {
     if (err) {
       callback()
     } else {
       callback(JSON.parse(data))
     }
   })
 }

 function put(keyname, data, callback) {
   let key = (typeof keyname === 'object') ? keyname._id : keyname;
   let val = (typeof keyname === 'object') ? JSON.stringify(keyname) : JSON.stringify(data);
   fs.writeFile('/tmp/' + md5(key) + '.json', val, function (
     err) {
     if (err) throw err;
     if (callback !== undefined) callback(err);
   });
 }

 module.exports = {
   get: get,
   put: put,
   insert: put
 }