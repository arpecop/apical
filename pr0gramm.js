var request = require('request');
var async = require('async');
var fs = require('fs');
var Twitter = require('twitter');
var cheerio = require('cheerio');
var db = require('./kartinki/dbaws.js');
var get = require('get');
var restler = require('restler');
var slug = require('slug');
var md5 = require('md5');
const kartinki = require('./kartinki.js');
const kartinki_en = require('./kartinki_en.js');
const pouch = require('./pouch.js');
const cred = {
  "accessKeyId": process.env.awsuser,
  "secretAccessKey": process.env.awspass,
  "region": "eu-west-1"
}
const AWS = require('aws-sdk');

var app_token = '128280664728|3cdgcR4hHIeXxqVqqggOqFWuzcs'; //mystic box
var template = 'This picture is now popular';


var client = new Twitter({
  consumer_key: 'qKU7MNibOSLDMh8dNuuUHqxoM',
  consumer_secret: 'pnqxTQ30YSIKf6oKlHQYi8CPeQCPGRjJH6RzkMjb00Hep0Fb53',
  access_token_key: '25739013-arGt6s00JzgkM5nRMkZgGw4TvFXRNjZW25MqHzFR9',
  access_token_secret: '5VAk3V6RTMnx174YD1DfMPwGXsZdIeXJBIfMt8Ur0TlQJ'
});

var s3bucket = new AWS.S3({
  params: {
    Bucket: 'imgserve.izteglisi.com'
  }
});


//var
var post = async.queue(function (task, callback) {
  kartinki.downloadnprocess(task.imagex, 'enimages', function (shortie) {
    console.log(shortie);

    kartinki_en.post_promo('box/' + shortie, function (d) {
      callback();
    });
  });
}, 1);


function programm(ass, callbackyyy) {
  request('http://pr0gramm.com/api/items/get?flags=1&promoted=1', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var json = JSON.parse(body);
      var i = 0;
      async.eachSeries(json.items, function (item, callbackx) {
        item.location = i++;
        var checkmedia = item.image.split('.');
        if (checkmedia[1] === "jpg") {
          db.exist(item.id + 'x', function (err, doc) {
            if (err) {
              db.insert({
                _id: item.id + 'x'
              }, function (err, ass) {
                item.imagex = 'http://img.pr0gramm.com/' + item.image;
                post.push(item, function () {});
                callbackx();

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
      //	});
    }
  });

}



function ninegag(params, callback) {
  request.get('http://9gag.com/' + params, function (err, d, body) {
    let $ = cheerio.load(body)
    var arr = [];
    $('article').each(function (i, elem) {
      arr.push($(this).attr('data-entry-id'));
    });
    async.eachSeries(arr, function iteratee(item, cb) {
      db.insert({
        _id: item
      }, function (err, ass) {})
      db.exist(item, function (err, doc) {
        if (err) {
          request.get('http://img-9gag-fun.9cache.com/photo/' + item + '_700b.jpg', function (e, h, bodyx) {
            if (h.headers['content-type'] === 'image/jpeg') {

              post.push({
                imagex: 'http://img-9gag-fun.9cache.com/photo/' + item + '_700b.jpg'
              });
              cb();
            } else {
              cb();
            }
          });
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
  request.get('http://imgur.com/top', function (err, d, body) {
    let $ = cheerio.load(body)
    var arr = [];
    $('.cards .post a').each(function (i, elem) {
      arr.push($(this).attr('href').replace('/gallery/', ''));
    });


    async.eachSeries(arr, function (item, cb) {
      db.exist(item, function (err, doc) {
        if (err) {
          request.get('http://imgur.com/gallery/' + item, function (e, r, body) {
            db.insert({
              _id: item
            }, function (err, ass) {
              let $ = cheerio.load(body);
              var img = $('link[rel="image_src"]').attr('href');
              console.log(img)
              if (img) {
                request.get(img, function (e, h, bodyx) {
                  if (h.headers['content-type'] === 'image/jpeg') {
                    console.log(img);
                    post.push({
                      imagex: img
                    });
                  }
                  cb();
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
    }, function () {
      callback();
    })
  })
}


if (!process.env['PORT']) {
  programm('trending', function () {

  })
  kartinki_en.post_promo('box/', function (d) {
    console.log('DFONE');

  });
}


module.exports = {
  pr0gramm: programm,
  imgur: imgur,
  ninegag: ninegag
}