const levelup = require('levelup');
const leveldown = require('leveldown');
const request = require('request');

const async = require('async');
const _ = require('underscore');
// const AWS = require('aws-sdk');
const db = require('nano')('http://1:1@pouchdb.herokuapp.com/chetiva');
const pages = require('./_includes/pages.json');

// const s3 = new AWS.S3({
// endpoint: new AWS.Endpoint('nyc3.digitaloceanspaces.com'),
// accessKeyId: process.env.s31,
// secretAccessKey: process.env.s32
// });

const localdb = levelup(leveldown('/tmp/localx1'));

function postDynamo(json, callback) {
  const options = {
    uri: 'https://0v1bbke6eh.execute-api.eu-central-1.amazonaws.com/latest/db/',
    method: 'POST',
    json
  };

  request(options, () => {
    callback();
  });
}

async function postPages() {
  return new Promise(resolve => {
    const dx = Math.round(new Date().getHours()) + 2;
    const timeId = `bg${new Date().getDay()}-date:${new Date().getDate()}-hours:${new Date().getHours()}-${Math.round(
      new Date().getMinutes()
    )}`;

    const mins = new Date().getMinutes();

    console.log('hours', dx, timeId);
    if (dx >= 7 || !process.env.PORT) {
      db.get(`${timeId}`, () => {
        if (
          !process.env.PORT ||
          mins === 5 ||
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
          db.insert({ _id: timeId }, () => {});
          async.eachLimit(
            _.shuffle(pages),
            1,
            (page, cb) => {
              request.get(
                'https://pouchdb.herokuapp.com/chetiva/_design/i/_view/News?limit=20&descending=false',
                (ex, xx, doc1) => {
                  const doc = JSON.parse(doc1);
                  request.post(
                    'https://graph.facebook.com/',
                    {
                      form: {
                        access_token: page.access_token,
                        id: `https://novinata.netlify.com/${doc.rows[0].id}`,
                        scrape: true,
                        published: !process.env.PORT
                      }
                    },
                    // eslint-disable-next-line no-unused-vars
                    (_error, d, body1) => {
                      request.post(
                        'https://graph.facebook.com/me/feed',
                        {
                          form: {
                            link: `https://novinata.netlify.com/${
                              doc.rows[0].id
                            }`,
                            access_token: page.access_token
                          }
                        },
                        (e, m, body) => {
                          console.log(body);

                          if (JSON.parse(body).error) {
                            request.post(
                              'https://graph.facebook.com/me/photos',
                              {
                                form: {
                                  caption: `${
                                    doc.rows[0].value.title
                                  } : https://novinata.netlify.com/${
                                    doc.rows[0].id
                                  }`,
                                  access_token: page.access_token,
                                  url: doc.rows[0].value.image
                                }
                              },
                              (e1, m1, bodyx) => {
                                console.log(bodyx);
                                cb();
                              }
                            );
                          } else {
                            console.log(body);
                            cb();
                          }
                        }
                      );
                    }
                  );
                }
              );
            },
            () => {
              resolve();
            }
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
async function getPages(file) {
  const pagestoget = require(`./_includes/sources/${file}.json`);
  const pagesTokens = require('./_includes/pages.json');

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
          }
        );
      },
      () => {
        if (arr.length < 5) {
          resolve({ err: 'something wrong' });
        } else {
          resolve(arr);
        }
      }
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
          const checkId = process.env.PORT
            ? post.id
            : new Date().getTime().toString();
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
      }
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
            insertjson.description = insertjson.message
              ? insertjson.message
              : ' ';
            insertjson.url = insertjson.picture;
            insertjson.provider = insertjson.link.split('/')[2];
            insertjson.source = insertjson.link;
            insertjson.url_big = insertjson.full_picture
              ? decodeURIComponent(
                  insertjson.full_picture.split('url=')[1].split('&')[0]
                )
              : '';
            insertjson._id = `${new Date(insertjson.created_time).getTime()}_1`;
            console.log(insertjson);

            db.insert(insertjson, () => {
              cb();
            });
          } else if (item.type === 'photo') {
            const insertjson = item;
            insertjson.type = collectiondb;
            insertjson._id = `${new Date(insertjson.created_time).getTime()}_1`;
            console.log(insertjson);
            db.insert(insertjson, () => {
              cb();
            });
          } else {
            cb();
          }
        },
        () => {
          resolve(arr);
        }
      );
    } else {
      resolve([]);
    }
  });
}

async function statiiBg(params, callback) {
  const step1x = await getPages('source_kartinki_bg');

  console.log(step1x);

  const getfreshx = await get_fresh_ones(step1x, 'link');
  const ifarraypostx = await postAndInsertDbFresh(getfreshx, 'newsbg');
  await postPages();
  callback(ifarraypostx.length);
  console.log(`== D O N E   N E W S   B G ==${ifarraypostx.length}`);
}

// statii
async function statiiEn(params, callback) {
  const step1 = await getPages('en_source_statii');
  const getfresh = await get_fresh_ones(step1, 'link');
  console.log(getfresh);

  const ifarraypost = await postAndInsertDbFresh(getfresh, 'newsenglish');
  // const postfirstarritem = await tweet(ifarraypost);
  callback(ifarraypost.length);
  console.log(`== D O N E   N E W S   E N ==${ifarraypost.length}`);
}

if (!process.env.PORT) {
  statiiBg();
}
// dsadasdasddadsadsd

module.exports = {
  statiiBg,
  statiiEn,
  postAndInsertDbFresh,
  getPages,
  postPages,
  get_fresh_ones,
  postDynamo
};
// dasda
