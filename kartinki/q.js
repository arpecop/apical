var async = require('async');
var facebook = require('./facebook.js')
var q = {};

q.processpage = async.queue(function(id, callback) {

  facebook.page({
    "id": id + "/photos/uploaded"
  }, function(doc) {

    if (!doc.error) {
      callback(null, doc);
    } else {

      callback({
        'error': 'happens',
        'reason':'cant get page /photos/uploaded'
      });
    }
  });
}, 1);

q.processimage = async.queue(function(id, callback) {
  facebook.image({
    "id": id + ""
  }, function(doc) {
 
    if (!doc.error) {
      callback(null, doc);
    } else {
      callback({
        'error': 'happens1'
      });
    }
  });
}, 1);
module.exports = q;
