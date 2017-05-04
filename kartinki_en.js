const request = require('request');
const fs = require('fs');
const get = require('get');
const async = require('async');
const extend = require('extend');

const promo = require(__dirname + '/_includes/promo.js');

const pagestoget = require(__dirname + '/kartinki/source_en.json');
const downloadnprocess = require(__dirname + '/_includes/downloadandprocess.js');

const sizeOf = require('image-size');


var shortid = require('shortid');
const cred = {
  "accessKeyId": process.env.awsuser,
  "secretAccessKey": process.env.awspass,
  "region": "eu-west-1"
}

const _ = require('underscore');
const db = require(__dirname + '/_includes/dbaws.js');
var template = 'this image collected more than 30 likes.';

function kartinki_en(lat, callback) {
  db.get({
    'id': 'enimgsx',
    'limit': 1
  }, function (e, doc) {
    promo.post(doc.docs[0].id, process.env.mystbox_token, template, 'mystbox', function () { });
  })


  async.eachSeries(pagestoget.rows, function (item, callback) {
    var rtoken = Math.floor((Math.random() * 90) + 0);
    var url = 'https://graph.facebook.com/v2.6/' + item.id + '/feed?access_token=' + process.env.mystbox_token + '&fields=id,likes,type,full_picture&limit=3'
    request(url, function (error, response, body) {
      var collect = [];
      if (!error && response.statusCode == 200) {
        async.each(JSON.parse(body).data, function (item, callback1) {
          if (item.likes && item.likes.data.length >= 3 && item.type === 'photo') {
            db.exist(item.id, function (err, data) {
              if (err) {
                db.put({
                  _id: item.id
                }, function (dsd, dsdsd) {
                  console.log(item.full_picture);
                  downloadnprocess.go(item.full_picture, 'enimgsx', function (shortie) {
                    promo.post(shortie, process.env.mystbox_token, template, 'mystbox', function () {
                      callback1();
                    })
                  })
                })
              } else {
                callback1();
              }
            })
          } else {
            callback1()
          }
        }, function done() {
          callback()
        });
      } else {
        callback()
      }
    });
  }, function done() {
    callback('done')
  });
}
if (!process.env.PORT) {
  // kartinki_en('1', function () { })
}
module.exports = {
  kartinki_en: kartinki_en
}