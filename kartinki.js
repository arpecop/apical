"use strict";

const request = require('request');
const fs = require('fs');
const get = require('get');
const async = require('async');
const extend = require('extend');
const pages = require('./pages.json');
const sizeOf = require('image-size');
const pouch = require('./pouch.js');
const shortid = require('shortid');
const AWS = require('aws-sdk');
const md5 = require('md5');
const _ = require('underscore');
const db = require('./kartinki/dbaws.js');


const cred = {
  "accessKeyId": process.env.awsuser,
  "secretAccessKey": process.env.awspass,
  "region": "eu-west-1"
}

AWS.config.update(cred);
const gm = require('gm').subClass({
  imageMagick: true
});


var s3bucket = new AWS.S3({
  params: {
    Bucket: 'imgserve.izteglisi.com'
  }
});

var app_token = process.env.izvestie_token;
var template = 'над 30 👍 на тази снимка';

const pagestoget = require('./kartinki/source.json');

function datex(prefix) {
  var coeff = 1000 * 60 * 3;
  var date = new Date(); //or use any other date
  var rounded = new Date(Math.round(date.getTime() / coeff) * coeff)
  var d = date.getDate();
  var m = date.getMonth();
  var h = date.getHours();
  var m1 = date.getMinutes();
  var y = date.getFullYear();
  return (prefix + '' + y + '' + m + '' + d + '' + h + '' + m1);
}

Array.prototype.chunk = function (n) {
  if (!this.length) {
    return [];
  }
  return [this.slice(0, n)].concat(this.slice(n).chunk(n));
};



function post_promo(url, callback) {
  let arr = [];
  let arr2x = [];
  pouch.users.get('count', function (e, count) {
    let rd = Math.floor(Math.random() * count.count) + 0;
    pouch.users.get('' + rd + '', function (err, docs) {
      async.eachSeries(docs.docs, function (fr, cb) {
        arr.push({
          "method": "POST",
          "relative_url": fr.id + "/notifications?href=" + url + "&template=" + template
        });
        arr2x.push({
          "method": "POST",
          "relative_url": fr.id + "/apprequests?href=" + url + "&message=" + template
        });
        cb();
      }, function done() {
        var count = 0;
        if (process.env['PORT']) {
          async.eachSeries(arr.chunk(50), function (chunk, cb) {
            request.post({
              url: 'https://graph.facebook.com/',
              form: {
                access_token: app_token,
                batch: JSON.stringify(chunk)
              }
            }, function (err, httpResponse, body) {
              count = Math.round(count + JSON.parse(body).length);
              cb();
            });
          }, function done() {
            console.log('🚨' + count + ' posted ' + url);

          });
          callback();
        } else {
          console.log('posting bg posts on localhost');
          callback();
        }
      });
    });
  });
}

//post_notification('pix/B1FEG3WYg')

function post_img(page, callback) {
  request.post('https://graph.facebook.com/' + page.id + '/photos', {
    form: {
      url: 'http://socketserve.herokuapp.com/image/' + page.hid + '.jpg',
      access_token: page.access_token
    }
  }, function (error, response, body) {
    console.log(body);
    callback();
  });
}

function post(id, callback) {
  console.log('posting ' + id);
  post_promo('pix/' + id)

  async.eachSeries(_.shuffle(pages), function (page, callbackx) {
    request
      .post('https://graph.facebook.com/' + page.id + '/feed', {
        form: {
          published: process.env.PORT ?
            1 : 0,
          link: 'https://pix.fbook.space/' + id,
          access_token: page.access_token
        }
      }, function (error, response, body) {
        let resp = JSON.parse(body);
        console.log(resp);
        if (resp.error) {
          post_img(extend({
            hid: id
          }, page), function (zdd) {})
        }
        callbackx();
      });

  }, function done() {
    callback()
  })
}

var downloadnprocess = function (id, stack, callback) {
  var dl = get(id);
  var shortie = shortid.generate();
  var file = '/tmp/' + shortie + '.jpg';
  dl.toDisk(file, function (err, filename) {
    fs.readFile(file, function (err, filedata) {
      db.exist(md5(filedata), function (err, sox) {
        if (err) {
          sizeOf(file, function (err, dimensions) {
            db.put({
              kofa: 'imgserve.izteglisi.com',
              dir: 'fb',
              date: new Date(),
              _id: shortie,
              w: dimensions.width,
              h: dimensions.height,
              ext: 'jpg'
            }, function (err, ass) {
              //   db.put({ _id: md5(filedata) }, function () { })
              db.put({
                arr: true,
                kofa: 'imgserve.izteglisi.com',
                dir: 'fb',
                id: shortie,
                w: dimensions.width,
                h: dimensions.height,
                ext: 'jpg',
                _id: stack
              }, function (err, ass) {
                s3bucket.upload({
                  Key: 'fb/' + shortie + '.jpg',
                  Body: filedata,
                  ContentType: 'image/jpeg'
                }, function (err, dataxssss) {
                  callback(shortie)
                });
              });
            });
          });
        } else {
          callback(shortie)
        }
      })
    });
  });
}
//
function kartinki(lat, callback) {
  async.eachSeries(pagestoget.rows, function (item, callback) {
    var rtoken = Math.floor((Math.random() * 90) + 0);
    var url = 'https://graph.facebook.com/v2.6/' + item.id + '/feed?access_token=' + app_token + '&fields=id,likes,type,full_picture&limit=3'
    request(url, function (error, response, body) {
      var collect = [];
      if (!error && response.statusCode == 200) {
        async.eachSeries(JSON.parse(body).data, function (item, callback1) {
          if (item.likes && item.likes.data.length >= 10 && item.type === 'photo') {
            db.exist(item.id, function (err, data) {
              if (err) {
                db.put({
                  _id: item.id
                }, function (dsd, dsdsd) {
                  downloadnprocess(item.full_picture, 'bgimages', function (shortie) {
                    post(shortie, function (zzmata) {
                      callback1();
                    });
                  });
                });
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

module.exports = {
  kartinki: kartinki,
  downloadnprocess: downloadnprocess
}