const PouchDB = require('pouchdb');
const levelup = require('levelup');
const leveldown = require('leveldown');
const request = require('request');
const Twitter = require('twitter');
const get = require('request-promise');
const async = require('async');
const _ = require('underscore');
const AWS = require('aws-sdk');
const pages = require('./_includes/sources/all_pages.json');

const s3 = new AWS.S3({
  endpoint: new AWS.Endpoint('nyc3.digitaloceanspaces.com'),
  accessKeyId: process.env.s31,
  secretAccessKey: process.env.s32,
});

const localdb = levelup(leveldown('/tmp/localx1'));

const db = new PouchDB('http://1:1@pouchdb.herokuapp.com/db');
// const db = require('nano')('http://pouchdb.herokuapp.com/api/');

// const pagestoget = require (`${__dirname}/_includes/source.json`);
// const pages = require(`${__dirname}/_includes/pages.json`);
// const promo = require(`${__dirname}/_includes/promo.js`);

const clientcred = process.env.twitter.split(',');

const client = new Twitter({
  consumer_key: clientcred[0],
  consumer_secret: clientcred[1],
  access_token_key: clientcred[2],
  access_token_secret: clientcred[3],
});

const tokens = [
  '210665145671703|2GFZgdD3y5uR2I-GfxvzIncSjRY',
  '1776695622588995|k60zRml6f3HxHufsUzGCnGX1m2U',
  '767881309896992|QqTxcQFDCBx5KfE2Ap4EKZfYEsc',
  '127550380613969|eH3FkmqOZV8Y5HO12V1yU1wm63s',
  '1626293370948828|UZw8jNqS7NSFYpape_fR2xjx1K4',
  '925645240820290|QiKOZd7-6lSKZHB2KFeP1_BiM4E',
  '146470212065341|lj4ImMpgMkFzmkKN3rQWJU5cGB0',
  '368897760172030|K9B3e77oCGfnYG6_k_txCfcUBG8',
  '646098862244678|4WrxTQays9OoJa2PmVaiN3e-tyg',
  '177579968987113|m1mxZVGLJOSN8DxjnyotKakgKOs',
  '1803576159873324|EioW4GdMxJbBAHSrn-KhFana4eE',
  '260256070983293|2710385e8b869f36f79d3b0bc0d1df75',
];

async function tweet(arritem) {
  return new Promise((resolve) => {
    if (arritem[0]) {
      client
        .post('statuses/update', {
          status: `https://box.netlify.com/app/news/${arritem[0]._id} ${arritem[0].title}`,
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

async function postPages() {
  return new Promise((resolve) => {
    const timeId = `bg${new Date().getDay()}${new Date().getDate()}${Math.round(new Date().getMinutes() / 5)}${new Date().getHours()}`;
    localdb.get(timeId, (err) => {
      if (err) {
        localdb.put(`${timeId}`, 'c', (err, ddd) => {});

        async.eachSeries(
          _.shuffle(pages),
          (page, cb) => {
            db
              .query('i/bgimgsx', {
                limit: 1,
                descending: true,
                include_docs: true,
                skip: Math.floor(Math.random() * 1400),
              })
              .then((doc) => {
                request.post(
                  'https://graph.facebook.com/me/photos',
                  {
                    form: {
                      caption: `${doc.rows[0].value.title} https://apps.facebook.com/izvestie/g/pix/${doc.rows[0].id}`,
                      url: `http://pouch.nyc3.digitaloceanspaces.com/db/${_.shuffle(doc.rows[0].doc.images)[0]}`,
                      access_token: page.access_token,
                    },
                  },
                  (e, m, body) => {
                    console.log(body);
                    cb();
                  }
                );
              });
          }, () => {
            resolve();
          }
        );
      } else {
        console.log('too often');
        resolve();
      }
    });
  });
}
postPages();

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
        // /feed?access_token=${_.shuffle(tokens)[0]}&fields=id,type,attachment&limit=1
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
          console.log(arr);

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
            if (!exist && post.type === type) { // fix on production
              get({
                uri: `https://graph.facebook.com/${post.id}?access_token=${_.shuffle(tokens)[0]}`,
                transform(body) {
                  return JSON.parse(body);
                },
              })
                .then((data) => {
                  s3.putObject({
                    Body: JSON.stringify(data),
                    Bucket: 'pouch',
                    ACL: 'public-read-write',
                    Key: `db/${data.id}`,
                    ContentType: 'application/json',
                  }, () => {
                    arr.push(data);
                    cb();
                  });
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
            console.log(insertjson);

            db.put(insertjson, (err, nonerr) => {
              cb();
            });
          } else if (item.type === 'photo') {
            const insertjson = item;
            insertjson.type = collectiondb;
            insertjson._id = `${new Date(insertjson.created_time).getTime()}_1`;
            console.log(insertjson);
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

  await postPages();

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
  get_pages,
  postPages,
  get_fresh_ones,
  tweet,
};
// dasda
