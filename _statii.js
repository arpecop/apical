const PouchDB = require('pouchdb');
const levelup = require('levelup');
const leveldown = require('leveldown');
const request = require('request');
const Twitter = require('twitter');
const fs = require('await-fs');
const get = require('request-promise');
const async = require('async');

const _ = require('underscore');


const localdb = levelup(leveldown('/tmp/localx'));

const db = new PouchDB('http://1:1@pouchdb.herokuapp.com/db');
// const pagestoget = require (`${__dirname}/_includes/source.json`);
const pages = require(`${__dirname}/_includes/pages.json`);
const promo = require(`${__dirname}/_includes/promo.js`);

const clientcred = process.env.twitter.split(',');

const client = new Twitter({
  consumer_key: clientcred[0],
  consumer_secret: clientcred[1],
  access_token_key: clientcred[2],
  access_token_secret: clientcred[3],
});

async function tweet(arritem) {
  return new Promise((resolve) => {
    if (arritem[0]) {
      client
        .post('statuses/update', {
          status: `https://fbook.netlify.com/app/news/${arritem[0].id} ${arritem[0].name}`,
        }).then((tweet) => {
          console.log('posted');
          resolve();
        }).catch((error) => {
          throw error;
          resolve();
        });
    } else {
      resolve();
    }
  });
}

function scheduled_post(dbx, preurl, token, usersdb, callback) {
  db
    .query(`i/${dbx}`, {
      limit: 100,
      descending: true,
    })
    .then((doc) => {
      if (doc.total_rows > 2) {
        promo.post(
          doc.rows,
          preurl,
          token,
          usersdb,
          () => {
            console.log(`posting scheduled promo last post statii "${doc.rows[0].value.title}" 1 times`);
            callback('posting scheduled promo notification');
          },
        );
      } else {
        callback('not enough posts');
      }
    })
    .catch((err) => {
      callback(err);
    });
}

function populatedb(id, callback) {
  if (id) {
    localdb.get(id, (err) => {
      if (err) {
        localdb.put(id, 'c', () => {
          callback(true);
        });
      } else {
        callback(false);
      }
    });
  } else {
    callback(false);
  }
}
async function get_pages(file) {
  const pagestoget = require(`${__dirname}/_includes/sources/${file}.json`);
  // console.log(pagestoget);

  let arr = [];
  return new Promise((resolve) => {
    async.each(
      pagestoget.rows,
      (itemx, cb) => {
        request(`http://sharlem.herokuapp.com/fbfeed/${itemx.id}`, (error, response, body) => {
          if (!error && response.statusCode === 200) {
            arr = arr.concat(JSON.parse(body).data);
            cb();
          } else {
            cb();
          }
        });
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
// ddd
async function get_fresh_ones(posts, type) {
  const arr = [];
  return new Promise((resolve) => {
    async.each(
      posts,
      (post, cb) => {
        if (post) {
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
        } else {
          cb();
        }
      },
      () => {
        resolve(_.shuffle(arr).slice(0, 49));
      },
    );
  });
}

async function postAndInsertDbFresh(arr, collectiondb) {
  return new Promise((resolve) => {
    if (arr[1]) {
      async.each(
        arr,
        (item, cb) => {
          if (item.type === 'link') {
            const insertjson = item;
            insertjson.type = collectiondb;
            insertjson.title = insertjson.name;
            insertjson.description = insertjson.message ? insertjson.message : ' ';
            insertjson.url = insertjson.picture;
            insertjson.provider = insertjson.link.split('/')[2];
            insertjson.source = insertjson.link;
            insertjson.url_big = insertjson.full_picture
              ? decodeURIComponent(insertjson.full_picture.split('url=')[1].split('&')[0])
              : '';
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
              cb();
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

async function statiiBg(params, callback) {
  const step1x = await get_pages('source_kartinki_bg');
  const getfreshx = await get_fresh_ones(step1x, 'link');
  const ifarraypostx = await postAndInsertDbFresh(getfreshx, 'newsbg');
  const postfirstarritem = await tweet(ifarraypostx);

  callback(ifarraypostx.length);
  console.log(`== D O N E   N E W S   B G ==${ifarraypostx.length}`);
}

// statii
async function statiiEn(params, callback) {
  const step1 = await get_pages('en_source_statii');
  const getfresh = await get_fresh_ones(step1, 'link');

  const ifarraypost = await postAndInsertDbFresh(getfresh, 'newsenglish');
  const postfirstarritem = await tweet(ifarraypost);
  callback(ifarraypost.length);
  console.log(`== D O N E   N E W S   E N ==${ifarraypost.length}`);
}

// dsadasdasddadsadsd


module.exports = {
  statiiBg,
  statiiEn,
  postAndInsertDbFresh,
  scheduled_post,
  get_pages,
  get_fresh_ones,
};
// dasda
