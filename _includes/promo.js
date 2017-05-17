const async = require('async');
const request = require('request');
const pouch = require(__dirname + '/pouch.js');
const console = require('better-console');
var _ = require('lodash');
var chunk = function(n) {
  if (!this.length) {
    return [];
  }
  return [this.slice(0, n)].concat(this.slice(n).chunk(n));
};


function post(url, token, title, db, callback) {
  let arr = [];
  pouch[db].get('count', function(e, count) {
    let rd = Math.floor(Math.random() * count.count) + 0;
    pouch[db].get('' + rd + '', function(err, docs) {
      async.eachSeries(docs.docs, function(fr, cb) {
        arr.push({
          "method": "POST",
          "relative_url": fr.id + "/notifications?href=" + url + "&template=" + title
        });
        arr.push({
          "method": "POST",
          "relative_url": fr.id + "/apprequests?href=" + url + "&message=" + title
        });
        cb();
      }, function done() {

        var count = 0;
        var counterr = 0;
        if (process.env['PORT']) {
          async.each(_.chunk(arr, 50), function(chunk, cb) {
            request.post({
              url: 'https://graph.facebook.com/',
              form: {
                access_token: token,
                batch: JSON.stringify(chunk)
              }
            }, function(err, httpResponse, body) {

              async.each(JSON.parse(body), function(ix, cbx) {

                if (JSON.parse(ix.body).error) {
                  counterr++;
                } else {
                  count++;
                }
                cbx();
              }, function done() {
                cb();
              });


            });
          }, function done() {
            console.info(' 👍:' + count + ' 🚨:' + counterr + ' 💾:' + db + '  http://fbook.space/' + url);
            callback();
          });
        } else {
          console.log('posting en posts on localhost ' + url + ',' + token + ',' + title + ', ' + db);
          callback();
        }
      });
    });
  });
}
module.exports = {
  post: post
}