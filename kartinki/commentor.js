var nano = require('nano')('http://db.arpecop.com/');
var alice = nano.db.use('images');
var facebook = require(__dirname + '/facebook.js');
var request = require('request');
var q = require(__dirname + '/q.js');
var counter = 0;
alice.gett = function (query, callback) {
  request('http://db.arpecop.com/' + query, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      callback(JSON.parse(body));
    } else {
      callback({
        'error': 'happens'
      });
    }
  });
};


alice.gett('images/_design/pages/_view/all?limit=1000', function (doc) {
  if (!doc.error) {
    doc.rows.forEach(function (valx, index) {
      q.processpage.push(valx.id, function (err, doc) {

        if (!err) {
          doc.data.forEach(function (val, index) {

            if (val.likes && val.likes.data.length >= 25) {
              console.log(val.likes.data.length);
              request.post({
                url: 'https://graph.facebook.com/' + valx.id +
                '/links/',
                form: {
                  access_token: 'dasd',
                  link: 'http://www.google.com/'
                }
              }, function (err, httpResponse, body) {
                console.log(body);


              })


            }
          });
        }
      });
    });

  }
});
