const request = require('request');
const async = require('async');
const cheerio = require('cheerio');
const firedb = require('./_includes/firedb.js');

const downloadnprocess = require('./_includes/downloadandprocess.js');

function programm(ass, callbackyyy) {
  request(
    'http://pr0gramm.com/api/items/get?flags=1&promoted=1',
    (error, response, body) => {
      if (!error && response.statusCode == 200) {
        const json = JSON.parse(body);
        let i = 0;
        async.each(
          json.items,
          (item, callbackx) => {
            item.location = i++;
            const checkmedia = item.image.split('.');
            if (checkmedia[1] === 'jpg') {
              firedb.get(`${item.id}-pr0`, (d) => {
                if (d.err) {
                  firedb.put(`${item.id}-pr0`, () => {
                    downloadnprocess.go(
                      `http://img.pr0gramm.com/${item.image}`,
                      (shortie) => {
                        callbackx();
                      },
                    );
                  });
                } else {
                  callbackx();
                }
              }); // dsds
            } else {
              callbackx();
            }
          },
          () => {
            callbackyyy();
          },
        );
      }
    },
  );
}

function ninegag(params, callback) {
  request.get(`http://9gag.com/${params}`, (err, d, body) => {
    const $ = cheerio.load(body);
    const arr = [];
    $('article').each(function (i, elem) {
      arr.push($(this).attr('data-entry-id'));
    });

    async.each(
      arr,
      (item, cb) => {
        firedb.get(`${item}-9`, (doc) => {
          if (doc.err) {
            firedb.put(`${item}-9`, () => {
              request.get(
                `http://img-9gag-fun.9cache.com/photo/${item}_700b.jpg`,
                (e, h, bodyx) => {
                  if (h.headers['content-type'] === 'image/jpeg') {
                    downloadnprocess.go(
                      `http://img-9gag-fun.9cache.com/photo/${item}_700b.jpg`,
                      (shortie) => {
                        cb();
                      },
                    );
                  } else {
                    cb();
                  }
                },
              );
            });
          } else {
            cb();
          }
        });
      },
      () => {
        callback();
      },
    );
  });
}

function imgur(params, callback) {
  request.get(`http://imgur.com/${params}`, (err, d, body) => {
    const $ = cheerio.load(body);
    const arr = [];
    $('.cards .post a').each(function (i, elem) {
      arr.push($(this).attr('href').replace('/gallery/', ''));
    });

    async.each(
      arr, (item, cb) => {
        firedb.get(`${item}-ur`, (doc) => {
          if (doc.err) {
            firedb.put(`${item}-ur`, (err, ass) => {
              request.get(`http://imgur.com/gallery/${item}`, (e, r, body) => {
                const $ = cheerio.load(body);
                const img = $('link[rel="image_src"]').attr('href');
                if (img) {
                  downloadnprocess.go(img, (shortie) => {
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
      },
      () => {
        callback();
      },
    );
  });
}

module.exports = {
  programm,
  imgur,
  ninegag,
};
