const request = require('request');
const fs = require('fs');
const get = require('get');
const async = require('async');
const shortid = require('shortid');
const _ = require('underscore');
const extend = require('extend');
const sizeOf = require('image-size');

const db = require(__dirname + '/_includes/dbaws.js');
const pagestoget = require(__dirname + '/_includes/source.json');
const pages = require(__dirname + '/_includes/pages.json');

const downloadnprocess = require(__dirname + '/_includes/downloadandprocess.js');
const promo = require(__dirname + '/_includes/promo.js');

var template = 'тази снимка получи над 30 харесвания.';



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


function post_img(page, callback) {
  request.post('https://graph.facebook.com/' + page.id + '/photos', {
    form: {
      url: 'http://db2.arpecop.com/cdn/' + page.hid + '/f.jpg',
      access_token: page.access_token
    }
  }, function (error, response, body) {
    console.log(body);
    callback();
  });
}

function post(id, callback) {
  console.log('posting ' + id);
  //function post(url, token, title, db, callback) {
  promo.post(id, process.env.izvestie_token, template, 'bgusers', function () {
    async.eachSeries(_.shuffle(pages), function (page, callbackx) {
      request.post('https://graph.facebook.com/' + page.id + '/feed', {
        form: {
          published: process.env.PORT ?
            1 : 0,
          link: 'http://db.arpecop.com/share/' + id + '',
          access_token: page.access_token
        }
      }, function (error, response, body) {
        let resp = JSON.parse(body);
        console.log(resp);
        if (resp.error) {
          post_img(extend({
            hid: id
          }, page), function (zdd) { })
        }
        callbackx();
      });

    }, function done() {
      callback()
    })
  })
}

function kartinki(lat, callback) {
  db.get({
    'id': 'bgimgsx',
    'limit': 1
  }, function (e, doc) {
    promo.post(doc.docs[0].id, process.env.izvestie_token, template, 'bgusers', function () { })
  })

  async.eachSeries(pagestoget.rows, function (item, callbackx) {
    var rtoken = Math.floor((Math.random() * 90) + 0);
    var url = 'https://graph.facebook.com/v2.6/' + item.id + '/feed?access_token=' + process.env.izvestie_token + '&fields=id,likes,type,full_picture&limit=3'
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
                  downloadnprocess.go(item.full_picture, 'bgimgsx', function (shortie) {
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
          callbackx()
        });
      } else {
        callbackx()
      }
    });
  }, function done() {
    callback()
  });
}

if (!process.env.PORT) {
  kartinki('1', () => { })
}

module.exports = {
  kartinki: kartinki
}