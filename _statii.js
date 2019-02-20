const PouchDB = require('pouchdb');
const levelup = require('levelup');
const leveldown = require('leveldown');
const request = require('request');
const Twitter = require('twitter');
const get = require('request-promise');
const async = require('async');
const _ = require('underscore');
const AWS = require('aws-sdk');
const pages = require('./_includes/pages.json');

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

const tokens = [
  '210665145671703|2GFZgdD3y5uR2I-GfxvzIncSjRY',

  '767881309896992|QqTxcQFDCBx5KfE2Ap4EKZfYEsc',
  '127550380613969|eH3FkmqOZV8Y5HO12V1yU1wm63s',

  '925645240820290|QiKOZd7-6lSKZHB2KFeP1_BiM4E',
  '146470212065341|lj4ImMpgMkFzmkKN3rQWJU5cGB0',

  '177579968987113|m1mxZVGLJOSN8DxjnyotKakgKOs',
  '1803576159873324|EioW4GdMxJbBAHSrn-KhFana4eE',
  '260256070983293|2710385e8b869f36f79d3b0bc0d1df75',
];

function postDynamo(json, callback) {
  const options = {
    uri: 'https://0v1bbke6eh.execute-api.eu-central-1.amazonaws.com/latest/db/',
    method: 'POST',
    json,
  };

  request(options, () => {
    callback();
  });
}

const domains = [
  'https://arpecop.gitlab.io/izteglisi/post/',
  //'https://wt-rudix_lab-gmail_com-0.sandbox.auth0-extend.com/share/',
  // 'https://now-yjirixakkv.now.sh/',
  //'http://izteglisi.club/izteglisi/post/'
];
async function postPages() {
  let domain = _.shuffle(domains)[0];
  return new Promise(resolve => {
    const dx = Math.round(new Date().getHours()) + 2;
    const timeId = `bg${new Date().getDay()}-date:${new Date().getDate()}-hours:${new Date().getHours()}-${Math.round(
      new Date().getMinutes(),
    )}`;

    const mins = new Date().getMinutes();

    console.log('hours', dx, timeId);
    if (dx >= 7 || !process.env.PORT) {
      db.get(`${timeId}`, err => {
        if (
          !process.env.PORT ||
          mins === 5 ||
          mins === 07 ||
          mins === 10 ||
          mins === 12 ||
          mins === 15 ||
          mins === 17 ||
          mins === 20 ||
          mins === 22 ||
          mins === 25 ||
          mins === 27 ||
          mins === 30 ||
          mins === 32 ||
          mins === 35 ||
          mins === 37 ||
          mins === 40 ||
          mins === 42 ||
          mins === 45 ||
          mins === 47 ||
          mins === 50 ||
          mins === 55
        ) {
          db.put({ _id: timeId }, (err, ddd) => {
            console.log(err);
          });
          async.eachSeries(
            _.shuffle(pages),
            (page, cb) => {
              db.query('i/bgimgsx', {
                limit: 1,
                descending: true,
                include_docs: true,
                skip: Math.floor(Math.random() * 2689),
              }).then(doc => {
                request.post(
                  'https://graph.facebook.com/',
                  {
                    form: {
                      access_token: page.access_token,
                      id: `${domain}${doc.rows[0].id}`,
                      scrape: true,
                      published: process.env.PORT ? false : true,
                    },
                  },
                  (error, d, body) => {
                    request.post(
                      'https://graph.facebook.com/me/feed',
                      {
                        form: {
                          link: `${domain}${doc.rows[0].id}`,
                          access_token: page.access_token,
                        },
                      },
                      (e, m, body) => {
                        console.log(body);

                        if (JSON.parse(body).error) {
                          request.post(
                            'https://graph.facebook.com/me/photos',
                            {
                              form: {
                                caption: `${doc.rows[0].doc.title} : ${domain}${doc.rows[0].id}`,
                                access_token: page.access_token,
                                url: _.shuffle(doc.rows[0].doc.images)[0],
                              },
                            },
                            (e, m, bodyx) => {
                              console.log(bodyx);

                              cb();
                            },
                          );
                        } else {
                          cb();
                        }
                      },
                    );
                  },
                );
              });
            },
            () => {
              resolve();
            },
          );
        } else {
          console.log('too often');
          resolve();
        }
      });
    } else {
      console.log('its late in Bulgaria');
      resolve();
    }
  });
}

function populatedb(id, callback) {
  if (id) {
    localdb.get(id, err => {
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
  const pagesTokens = require(`${__dirname}/_includes/pages.json`);

  let arr = [];
  return new Promise(resolve => {
    async.each(
      pagestoget.rows,
      (itemx, cb) => {
        // /feed?access_token=${_.shuffle(tokens)[0]}&fields=id,type,attachment&limit=1
        request(
          `https://graph.facebook.com/${itemx.id}/feed?access_token=${
            _.shuffle(pagesTokens)[0].access_token
          }&fields=id,type,full_picture&limit=1`,
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
  return new Promise(resolve => {
    async.each(
      posts,
      (post, cb) => {
        if (post) {
          const checkId = process.env.PORT ? post.id : new Date().getTime().toString();
          console.log(checkId);

          populatedb(checkId, exist => {
            if (exist && post.type === type) {
              console.log(post);

              arr.push(post);
              cb();
            } else {
              cb();
            }
          });
        } else {
          cb();
        }
      },
      () => {
        resolve(arr);
      },
    );
  });
}

async function postAndInsertDbFresh(arr, collectiondb) {
  return new Promise(resolve => {
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

  console.log(step1x);

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
  console.log(getfresh);

  const ifarraypost = await postAndInsertDbFresh(getfresh, 'newsenglish');
  //const postfirstarritem = await tweet(ifarraypost);
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
  postDynamo,
};
// dasda
