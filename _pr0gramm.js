var request = require('request');
var async = require('async');
var fs = require('fs');
var Twitter = require('twitter');
var cheerio = require('cheerio');
var db = require('./_includes/dbaws.js');
var get = require('get');
var restler = require('restler');
var slug = require('slug');
var md5 = require('md5');
const promo = require('./_includes/promo.js');
const downloadnprocess = require('./_includes/downloadandprocess.js');
var template = '🔥 this picture friend uploaded is getting popular.';

var post = function(task, callback) {

  downloadnprocess.go(task.imagex, 'enimgsx', function(shortie) {

    promo.post(shortie, process.env.mystbox_token, template, 'mystbox', function() {
      callback();
    });
  });
}


function programm(ass, callbackyyy) {
  request('http://pr0gramm.com/api/items/get?flags=1&promoted=1', function(error, response, body) {
    if (!error && response.statusCode == 200) {
      var json = JSON.parse(body);
      var i = 0;
      async.eachSeries(json.items, function(item, callbackx) {
        item.location = i++;
        var checkmedia = item.image.split('.');
        if (checkmedia[1] === "jpg") {
          db.db1.get(item.id + 'x', function(err, doc) {
            if (err) {
              db.db1.put({
                _id: item.id + 'x'
              }, function(err, ass) {
                item.imagex = 'http://img.pr0gramm.com/' + item.image;
                post(item, function() {
                  callbackx();
                });

              })
            } else {
              //console.log('exist');
              callbackx();
            }
          }); //dsds
        } else {
          callbackx();
        }
      }, function done() {
        callbackyyy();
      });

    }
  });

}



function ninegag(params, callback) {
  request.get('http://9gag.com/' + params, function(err, d, body) {
    let $ = cheerio.load(body)
    var arr = [];
    $('article').each(function(i, elem) {
      arr.push($(this).attr('data-entry-id'));
    });
    async.eachSeries(arr, function iteratee(item, cb) {

      db.db1.get(item, function(err, doc) {
        if (err) {
          db.db1.put({
            _id: item
          }, function() {
            request.get('http://img-9gag-fun.9cache.com/photo/' + item + '_700b.jpg', function(e, h, bodyx) {
              if (h.headers['content-type'] === 'image/jpeg') {
                post({
                  imagex: 'http://img-9gag-fun.9cache.com/photo/' + item + '_700b.jpg'
                }, () => {
                  cb();
                });

              } else {
                cb();
              }
            });
          })
        } else {
          cb()
        }
      })

    }, function done() {
      callback();
    });
  });

}


function imgur(params, callback) {
  request.get('http://imgur.com/' + params, function(err, d, body) {
    let $ = cheerio.load(body)
    var arr = [];
    $('.cards .post a').each(function(i, elem) {
      arr.push($(this).attr('href').replace('/gallery/', ''));
    });
    async.eachSeries(arr, function(item, cb) {
      console.log(item)
      db.db1.get(item, function(err, doc) {
        if (err) {
          request.get('http://imgur.com/gallery/' + item, function(e, r, body) {
            db.db1.put({
              _id: item
            }, function(err, ass) {
              let $ = cheerio.load(body);
              var img = $('link[rel="image_src"]').attr('href');
              if (img) {
                request.get(img, function(e, h, bodyx) {
                  if (h.headers['content-type'] === 'image/jpeg') {
                    console.log(img)
                    post({
                      imagex: img
                    }, () => {
                      cb();
                    });
                  } else {
                    cb();
                  }

                });
              } else {
                cb();
              }
            });
          });
        } else {
          cb();
        }
      });
    }, function() {
      callback();
    })
  })
}


if (!process.env.PORT) {
  imgur('new/time', () => {
    console.log('done');

  });

}


module.exports = {
  pr0gramm: programm,
  imgur: imgur,
  ninegag: ninegag
}