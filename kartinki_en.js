"use strict";

const request = require('request');
const fs = require('fs');
const get = require('get');
const async = require('async');
const extend = require('extend');

//const pages = require('./pages_en.json');

const pagestoget = require('./kartinki/source_en.json');
const level = require('./level.js');

const kartinki = require('./kartinki.js');
const sizeOf = require('image-size');
const pouch = require('./pouch.js');

const min = 0;
const max = 1305454;

var shortid = require('shortid');
const cred = {
  "accessKeyId": process.env.awsuser,
  "secretAccessKey": process.env.awspass,
  "region": "eu-west-1"
}
const AWS = require('aws-sdk');
const md5 = require('md5');
const _ = require('underscore');
AWS
  .config
  .update(cred);
const gm = require('gm').subClass({
  imageMagick: true
});
const db = require('./kartinki/dbaws.js');

var s3bucket = new AWS.S3({
  params: {
    Bucket: 'imgserve.izteglisi.com'
  }
});

var app_token = process.env.mystbox_token; //mystic box
var template = 'over 30 👍 on this picture';

function post_promo(url, callback) {
  let arr = [];
  pouch.mystic.get('count', function (e, count) {
    let rd = Math.floor(Math.random() * count.count) + 0;
    pouch.mystic.get('' + rd + '', function (err, docs) {
      async.eachSeries(docs.docs, function (fr, cb) {
        arr.push({
          "method": "POST",
          "relative_url": fr.id + "/notifications?href=" + url + "&template=" + template
        });
        arr.push({
          "method": "POST",
          "relative_url": fr.id + "/apprequests?href=" + url + "&message=" + template
        });
        cb();
      }, function done() {
        callback();
        if (process.env['PORT']) {
          arr.chunk(50).forEach(function (chunk) {
            request.post({
              url: 'https://graph.facebook.com/',
              form: {
                access_token: app_token,
                batch: JSON.stringify(chunk)
              }
            }, function (err, httpResponse, body) {
              console.log(JSON.parse(body).length + 'ен posts');

            });
          });
        } else {
          console.log(arr);
          console.log('posting en posts on localhost');


        }
      });

    });
  });
}

//
function kartinki_en(lat, callback) {
  async.eachSeries(pagestoget.rows, function (item, callback) {
    var rtoken = Math.floor((Math.random() * 90) + 0);
    var url = 'https://graph.facebook.com/v2.6/' + item.id + '/feed?access_token=' + app_token + '&fields=id,likes,type,full_picture&limit=3'
    request(url, function (error, response, body) {
      var collect = [];
      if (!error && response.statusCode == 200) {
        async.each(JSON.parse(body).data, function (item, callback1) {
          if (item.likes && item.likes.data.length >= 10 && item.type === 'photo') {
            db.exist(item.id, function (err, data) {
              if (err) {
                db.put({
                  _id: item.id
                }, function (dsd, dsdsd) {
                  kartinki.downloadnprocess(item.full_picture, 'enimages', function (shortie) {
                    post_promo('box/' + shortie, function () {
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
  // kartinki_en('1', function () {})
}
module.exports = {
  kartinki_en: kartinki_en,
  post_promo: post_promo
}