const request = require('request');
const fs = require('fs');
const get = require('get');
const async = require('async');
const shortid = require('shortid');
const _ = require('underscore');
const extend = require('extend');
const sizeOf = require('image-size');

const db = require(`${__dirname}/_includes/dbaws.js`);
const pagestoget = require(`${__dirname}/_includes/source.json`);
const pages = require(`${__dirname}/_includes/pages.json`);

const downloadnprocess = require(`${__dirname}/_includes/downloadandprocess.js`);
const promo = require(`${__dirname}/_includes/promo.js`);

const template = 'тази снимка от приятел става популярна.';

function datex(prefix) {
  const coeff = 1000 * 60 * 3;
  const date = new Date(); // or use any other date
  const rounded = new Date(Math.round(date.getTime() / coeff) * coeff);
  const d = date.getDate();
  const m = date.getMonth();
  const h = date.getHours();
  const m1 = date.getMinutes();
  const y = date.getFullYear();
  return `${prefix}${y}${m}${d}${h}${m1}`;
}
//
Array.prototype.chunk = function (n) {
  if (!this.length) {
    return [];
  }
  return [this.slice(0, n)].concat(this.slice(n).chunk(n));
};

function post(id, callback) {
  count = 0;
  counterr = 0;

  db.get(
    {
      id: 'bgimgsx',
      limit: 4,
    },
    (e, doc_old) => {
      db.db2.get(id, (err, doc) => {
        async.each(
          _.shuffle(pages),
          (page, callbackx) => {
            request.post(
              `https://graph.facebook.com/${page.id}/feed`,
              {
                form: {
                  published: process.env.PORT ? 1 : 0,
                  link: `http://pix.fbook.space/${id}`,
                  child_attachments: [
                    {
                      link: `https://pix.fbook.space/${id}`,
                      picture: `https://s-media-cache-ak0.pinimg.com/400x/${doc.img}`,
                    },
                    {
                      link: `https://pix.fbook.space/${doc_old.docs[2]._id}`,
                      picture: `https://s-media-cache-ak0.pinimg.com/400x/${doc_old.docs[2].img}`,
                    },
                  ],
                  access_token: page.access_token,
                },
              },
              (error, response, body) => {
                console.log(body);

                const resp = JSON.parse(body);
                if (resp.error) {
                  counterr++;
                } else {
                  count++;
                }
                callbackx();
              },
            );
          },
          () => {
            console.log(
              `📘 posted to facebook pages 🚨:${counterr} ✅:${count}`,
            );
            callback();
          },
        );
        // });
      });
    },
  );
}

function kartinki(lat, callback) {
  async.each(
    pagestoget.rows,
    (item, callbackx) => {
      const rtoken =
        pages[Math.floor(Math.random() * pages.length + 0)].access_token;
      // var rtoken = process.env.izvestie_token;
      const url = `https://graph.facebook.com/v2.6/${item.id}/feed?access_token=${rtoken}&fields=id,likes,type,full_picture&limit=1`;
      request(url, (error, response, body) => {
        const collect = [];
        if (!error && response.statusCode == 200) {
          async.each(
            JSON.parse(body).data,
            (item, callback1) => {
              if (
                item.likes &&
                item.likes.data.length >= 10 &&
                item.type === 'photo'
              ) {
                db.db2.get(item.id, (err, data) => {
                  if (err) {
                    db.put(
                      {
                        _id: item.id,
                      },
                      (err, zer) => {
                        downloadnprocess.go(
                          item.full_picture,
                          'bgimgsx',
                          (shortie) => {
                            post(shortie, (zzmata) => {
                              callback1();
                            });
                          },
                        );
                      },
                    );
                  } else {
                    callback1();
                  }
                });
              } else {
                callback1();
              }
            },
            () => {
              callbackx();
            },
          );
        } else {
          callbackx();
        }
      });
    },
    () => {
      callback();
    },
  );
}

if (!process.env.PORT) {
  kartinki('1', (data) => {
    console.log(data); // dsad
  });
}

module.exports = {
  kartinki,
};
//
