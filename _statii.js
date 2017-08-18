const request = require('request');
const fs = require('fs');
const get = require('get');
const async = require('async');
const shortid = require('shortid');
const _ = require('underscore');
const extend = require('extend');
const sizeOf = require('image-size');

const db = require(`${__dirname}/_includes/dbaws.js`);
const pagestoget = require(`${__dirname}/_includes/source_statii.json`);
const pages = require(`${__dirname}/_includes/pages.json`);
const promo = require(`${__dirname}/_includes/promo.js`);

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
      id: 'newsbg',
      limit: 20,
      gt: id,
    },
    (err, posts) => {
      db.get(id, (err, doc) => {
        async.each(
          _.shuffle(pages),
          (page, callbackx) => {
            const rid = _.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
            request.post(
              `https://graph.facebook.com/${page.id}/feed`,
              {
                form: {
                  published: process.env.PORT ? 1 : 0,
                  link: 'https://newsboy.fbook.space/',
                  child_attachments: [
                    {
                      description: posts.docs[0].description,
                      name: `[актуално от днес]: ${posts.docs[0].name}`,
                      link: `https://newsboy.fbook.space/${posts.docs[0].id}`,
                      picture: posts.docs[0].url_big,
                    },
                    {
                      description: posts.docs[rid[1]].description,
                      name: posts.docs[rid[1]].name,
                      link: `https://newsboy.fbook.space/${posts.docs[rid[1]].id}`,
                      picture: posts.docs[rid[1]].url_big,
                    },
                    {
                      description: posts.docs[rid[2]].description,
                      name: posts.docs[rid[2]].name,
                      link: `https://newsboy.fbook.space/${posts.docs[rid[2]].id}`,
                      picture: posts.docs[rid[2]].url_big,
                    },
                    {
                      description: posts.docs[rid[3]].description,
                      name: posts.docs[rid[3]].name,
                      link: `https://newsboy.fbook.space/${posts.docs[rid[3]].id}`,
                      picture: posts.docs[rid[3]].url_big,
                    },
                    {
                      description: posts.docs[rid[4]].description,
                      name: posts.docs[rid[4]].name,
                      link: `https://newsboy.fbook.space/${posts.docs[rid[4]].id}`,
                      picture: posts.docs[rid[4]].url_big,
                    },
                    {
                      description: posts.docs[rid[5]].description,
                      name: posts.docs[rid[5]].name,
                      link: `https://newsboy.fbook.space/${posts.docs[rid[5]].id}`,
                      picture: posts.docs[rid[5]].url_big,
                    },
                    {
                      description: posts.docs[rid[6]].description,
                      name: posts.docs[rid[6]].name,
                      link: `https://newsboy.fbook.space/${posts.docs[rid[6]].id}`,
                      picture: posts.docs[rid[6]].url_big,
                    },
                    {
                      description: posts.docs[rid[7]].description,
                      name: posts.docs[rid[7]].name,
                      link: `https://newsboy.fbook.space/${posts.docs[rid[7]].id}`,
                      picture: posts.docs[rid[7]].url_big,
                    },
                  ],
                  access_token: page.access_token,
                },
              },
              (error, response, body) => {
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
              `📘 posted to facebook pages news 🚨:${counterr} ✅:${count}`,
            );
            callback();
          },
        );
      });
    },
  );
}

function statii(lat, callback) {
  db.get(
    {
      id: 'newsbg',
      limit: 6,
    },
    (e, doc) => {
      promo.post(
        `newsb/${doc.docs[0].id}`,
        process.env.izvestie_token,
        doc.docs[0].title,
        'bgusers',
        () => {
          console.log(
            `posting scheduled promo last post statii "${doc.docs[0].title}" 1 times`,
          );
        },
      );
    },
  );

  async.each(
    pagestoget.rows,
    (itemx, callbackx) => {
      const rtoken =
        pages[Math.floor(Math.random() * pages.length + 0)].access_token;
      const url = `https://graph.facebook.com/${itemx.id}/feed?access_token=${rtoken}&fields=id,likes,type,full_picture&limit=1`;
      request(url, (error, response, body) => {
        const collect = [];
        if (!error && response.statusCode == 200) {
          async.each(
            JSON.parse(body).data,
            (item, callback1) => {
              if (item.likes && item.type === 'link') {
                request(
                  `https://graph.facebook.com/${item.id}?access_token=${rtoken}&fields=full_picture,message,link,name,created_time`,
                  (error, response, body) => {
                    const insertjson = JSON.parse(body);
                    insertjson.type = 'newsbg';
                    insertjson.title = insertjson.name;
                    insertjson.description = insertjson.message
                      ? insertjson.message
                      : undefined;
                    insertjson.url = insertjson.picture;
                    insertjson.provider = itemx.key;
                    insertjson.source = insertjson.link;
                    insertjson.url_big = insertjson.full_picture;
                    insertjson._id = `${new Date(insertjson.created_time).getTime()}_1`;

                    db.get(insertjson._id, (err, data) => {
                      if (err) {
                        db.put(insertjson, (err, zer) => {
                          post(insertjson._id, (zzmata) => {
                            callback1();
                          });
                        });
                      } else {
                        callback1();
                      }
                    });
                  },
                );
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
  statii('1', (data) => {
    console.log(data);
  });
}

module.exports = {
  statii,
};
//
