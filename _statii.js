const PouchDB = require('pouchdb');

const levelup = require('levelup');
const leveldown = require('leveldown');

const request = require('request');

const fs = require('await-fs');
const get = require('request-promise');
const async = require('async');
const shortid = require('shortid');
const _ = require('underscore');
const extend = require('extend');
const sizeOf = require('image-size');
const md5 = require('md5');
const downloadnprocess = require('./_includes/downloadandprocess.js');

const localdb = levelup(leveldown(`/tmp/${new Date().getHours()}`));

const db = new PouchDB('http://1:1@pouchdb.herokuapp.com/db');
// const pagestoget = require (`${__dirname}/_includes/source.json`);
const pages = require(`${__dirname}/_includes/pages.json`);
const promo = require(`${__dirname}/_includes/promo.js`);

async function post_to_bg(arritem) {
  return new Promise((resolve) => {
    if (arritem) {
      db.get(md5(arritem.full_picture), (err) => {
        if (err) {
          db.put({ _id: md5(arritem) }, () => {
            async.eachSeries(_.shuffle(pages), (page, callbackx) => {
              request.post(
                `https://graph.facebook.com/${page.id}/feed`,
                {
                  form: {
                    link: `https://izteglisi.com/app/newsboy/${arritem.id}`,
                    access_token: page.access_token,
                  },
                },
                (e, m, body) => {
                  console.log(body);

                  callbackx();
                },
              );
            });
          });
        } else {
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}

function scheduled_post(dbx, preurl, token, usersdb, callback) {
  db
    .query(`i/${dbx}`, {
      limit: 10,
      descending: true,
    })
    .then((doc, doc2) => {
      if (doc.total_rows > 2) {
        promo.post(
          `${preurl}/${doc.rows[0].value.id}`,
          token,
          doc.rows[0].value.title,
          usersdb,
          () => {
            console.log(
              `posting scheduled promo last post statii "${doc.rows[0].value.title}" 1 times`,
            );
            callback('posting scheduled promo notification');
          },
        );
      } else {
        resolve('not enough posts');
      }
    })
    .catch((err) => {
      console.log(err);

      callback(err);
    });
}

function populatedb(id, callback) {
  localdb.get(id, (err) => {
    if (err) {
      localdb.put(id, 'c', () => {
        callback(true);
      });
    } else {
      callback(false);
    }
  });
}
async function get_pages(file) {
  const pagestoget = require(`${__dirname}/_includes/sources/${file}.json`);
  // console.log(pagestoget);

  let arr = [];
  return new Promise((resolve) => {
    async.each(
      pagestoget.rows,
      (itemx, cb) => {
        request(
          `http://sharlem.herokuapp.com/fbfeed/${itemx.id}`,
          (error, response, body) => {
            if (!error && response.statusCode === 200) {
              arr = arr.concat(JSON.parse(body).data);

              cb();
            } else {
              cb();
            }
          },
        );
      },
      () => {
        if (arr.length < 5) {
          resolve({ err: 'something wrong' });
        } else {
          resolve(arr);
        }
      },
    );
  });
}

async function get_fresh_ones(posts, type) {
  const arr = [];
  return new Promise((resolve) => {
    async.each(
      posts,
      (post, cb) => {
        populatedb(post.id, (exist) => {
          if (exist && post.type === type) {
            get({
              uri: `http://sharlem.herokuapp.com/fb/${post.id}`,
              transform(body) {
                return JSON.parse(body);
              },
            })
              .then((data) => {
                arr.push(data);
                cb();
              })
              .catch((err) => {
                cb();
              });
          } else {
            cb();
          }
        });
      },
      () => {
        resolve(_.shuffle(arr).slice(0, 49));
      },
    );
  });
}

async function post_and_insert_db_fresh(arr, collectiondb) {
  return new Promise((resolve) => {
    if (arr[1]) {
      async.each(
        arr,
        (item, cb) => {
          if (item.type === 'link') {
            const insertjson = item;
            insertjson.type = collectiondb;
            insertjson.title = insertjson.name;
            insertjson.description = insertjson.message
              ? insertjson.message
              : ' ';
            insertjson.url = insertjson.picture;
            insertjson.provider = insertjson.link.split('/')[2];
            insertjson.source = insertjson.link;
            insertjson.url_big = insertjson.full_picture;
            insertjson._id = `${new Date(insertjson.created_time).getTime()}_1`;

            db.put(insertjson, (err, nonerr) => {
              // post (insertjson._id, zzmata => {
              cb();
              // });
            });
          } else if (item.type === 'photo') {
            const insertjson = item;
            insertjson.type = collectiondb;
            insertjson._id = `${new Date(insertjson.created_time).getTime()}_1`;
            db.put(insertjson, (err, nonerr) => {
              // post (insertjson._id, zzmata => {
              cb();
              // });
            });
          } else {
            cb();
          }
        },
        () => {
          resolve(arr);
        },
      );
    } else {
      resolve([]);
    }
  });
}

async function statii_bg(params, callback) {
  const step1 = await get_pages('source_statii');

  const get_fresh = await get_fresh_ones(step1, 'link');

  const ifarraypost = await post_and_insert_db_fresh(get_fresh, 'newsbg');
  // get from kartinki

  const step1x = await get_pages('source_kartinki_bg');
  const get_freshx = await get_fresh_ones(step1x, 'link');

  const ifarraypostx = await post_and_insert_db_fresh(get_freshx, 'newsbg');
  const postfirstarritem = await post_to_bg(ifarraypost[0]);
  //
  callback(ifarraypostx);

  console.log(`== D O N E   N E W S   B G ==${ifarraypost.length}`);
}
async function statii_en(params, callback) {
  const step1 = await get_pages('en_source_statii');
  const get_fresh = await get_fresh_ones(step1, 'link');

  const ifarraypost = await post_and_insert_db_fresh(get_fresh, 'newsenglish');

  callback(ifarraypost);
  console.log(`== D O N E   N E W S   E N ==${ifarraypost.length}`);
}

// dsadasdasddadsadsd

module.exports = {
  statii_bg,
  statii_en,
  post_and_insert_db_fresh,
  scheduled_post,
  get_pages,
  get_fresh_ones,
};
// dasda
