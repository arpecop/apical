const request = require('request');
const async = require('async');
const fs = require('fs');
const Twitter = require('twitter');
const cheerio = require('cheerio');
const db = require('./_includes/dbaws.js');
const get = require('get');
const restler = require('restler');
const slug = require('slug');
const md5 = require('md5');
const promo = require('./_includes/promo.js');
const downloadnprocess = require('./_includes/downloadandprocess.js');

const template = '🔥 a friend uploaded hot picture';

const post = function(task, callback) {
  downloadnprocess
    .go(task.imagex, 'enimgsx', (shortie) => {
      callback();
    });
};

function programm(ass, callbackyyy) {
  request('http://pr0gramm.com/api/items/get?flags=1&promoted=1', (error, response, body) => {
    if (!error && response.statusCode == 200) {
      const json = JSON.parse(body);
      let i = 0;
      async.each(json.items, (item, callbackx) => {
        console.log(item);

        item.location = i++;
        const checkmedia = item
          .image
          .split('.');
        if (checkmedia[1] === 'jpg') {
          db
            .db1
            .get(`${item.id}x1`, (err, doc) => {
              if (err) {
                db
                  .db1
                  .put({
                    _id: `${item.id}x`,
                  }, (err, ass) => {
                    item.imagex = `http://img.pr0gramm.com/${item.image}`;
                    post(item, () => {
                      callbackx();
                    });
                  });
              } else {
                // console.log('exist');
                callbackx();
              }
            }); // dsds
        } else {
          callbackx();
        }
      }, () => {
        callbackyyy();
      });
    }
  });
}

function ninegag(params, callback) {
  request
    .get(`http://9gag.com/${params}`, (err, d, body) => {
      const $ = cheerio.load(body);
      const arr = [];
      $('article').each(function(i, elem) {
        arr.push($(this).attr('data-entry-id'));
      });
      async.each(arr, (item, cb) => {
        db
          .db1
          .get(item, (err, doc) => {
            if (err) {
              db.db1
                .put({
                  _id: item,
                }, () => {
                  request
                    .get(`http://img-9gag-fun.9cache.com/photo/${item}_700b.jpg`, (e, h, bodyx) => {
                      if (h.headers['content-type'] === 'image/jpeg') {
                        post({
                          imagex: `http://img-9gag-fun.9cache.com/photo/${item}_700b.jpg`,
                        }, () => {
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
      }, () => {
        callback();
      });
    });
}

function imgur(params, callback) {
  request
    .get(`http://imgur.com/${params}`, (err, d, body) => {
      const $ = cheerio.load(body);
      const arr = [];
      $('.cards .post a').each(function(i, elem) {
        arr.push($(this).attr('href').replace('/gallery/', ''));
      });
      async.each(arr, (item, cb) => {
        db
          .db1
          .get(item, (err, doc) => {
            if (err) {
              request
                .get(`http://imgur.com/gallery/${item}`, (e, r, body) => {
                  db
                    .db1
                    .put({
                      _id: item,
                    }, (err, ass) => {
                      const $ = cheerio.load(body);
                      const img = $('link[rel="image_src"]').attr('href');
                      if (img) {
                        request
                          .get(img, (e, h, bodyx) => {
                            if (h.headers['content-type'] === 'image/jpeg') {
                              post({
                                imagex: img,
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
      }, () => {
        callback();
      });
    });
}

if (!process.env.PORT) {
  programm('1', (data) => {
  });
}

module.exports = {
  pr0gramm: programm,
  imgur,
  ninegag,
};
