const request = require('request');

const PouchDB = require('pouchdb');

const { exec } = require('child_process');
const async = require('async');
const levelup = require('levelup');

const leveldown = require('leveldown');

const localdb = levelup(leveldown(process.env.PORT ? '/tmp/twitter' : `/tmp/${new Date()}`));
const urlx = 'https://arpecop.serveo.net/twitter';
const rdburl = 'https://1:1@arpecop.serveo.net/twitter';

const db = new PouchDB('http://1:1@pouchdb.herokuapp.com/twitter');
const dbX = new PouchDB(rdburl);
// dsds

request.get(`${urlx}/_design/api/_view/bg?limit=1&reduce=false&update=true`, () => {});
request.get(`${urlx}/_design/api/_view/en?limit=1&reduce=false&update=true`, () => {});
request.get(`${urlx}/_design/api/_view/tags?limit=1&reduce=false&update=true`, () => {});
request.get(`${urlx}/_design/api/_view/u?limit=1&reduce=false&update=true`, () => {});
request.get(`${urlx}/_design/api/_view/read?limit=1&reduce=false&update=true`, () => {});
dbX.replicate
  .from(db)
  .on('complete', () => {
    console.log('SYNc completed');
  })
  .on('error', (err) => {
    console.log('SYNc compleDEAD', err);
  });

function postDynamo(json, callback) {
  console.log(json);
  db.put();
  callback();
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

async function getFreshOnes(posts, type) {
  const arr = [];
  return new Promise((resolve) => {
    async.each(
      posts,
      (post, cb) => {
        if (post) {
          populatedb(process.env.PORT ? post.id : new Date().getTime().toString(), (exist) => {
            if (exist) {
              db.put(
                {
                  _id: post.id,
                },
                () => {
                  const objectDefined = {
                    ...post,
                    sortable: [type],
                    time: Math.round(post.id),
                    _id: Math.round(post.id).toString(),
                    id: undefined,
                    title: post.text,
                    text: null,
                    date: new Date().getTime().toString(),
                    image: post.images ? post.images[0] : undefined,
                  };
                  db.put(objectDefined, (err) => {
                    cb();
                  });
                },
              );
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

async function getTl(user) {
  return new Promise((resolve) => {
    if (user.length > 2) {
      exec(
        `./node_modules/scrape-twitter/bin/scrape-twitter.js search --query="${user}" --count 20  --type latest`,
        (err, stdout) => {
          if (err) {
            resolve();
          } else {
            resolve(JSON.parse(stdout));
          }
        },
      );
    } else {
      resolve();
    }
  });
}
const { bgQueries, enQueries } = require(`${__dirname}/_includes/sources/twitter.js`);
async function queries(quries, type) {
  return new Promise((resolve) => {
    async.eachLimit(
      quries,
      5,
      (q, callback) => {
        getTl(q, type).then((data) => {
          getFreshOnes(data, type).then(() => callback());
        });
      },
      () => {
        resolve({});
      },
    );
  });
}
async function gowork(params, callback) {
  await queries(bgQueries, 'twitterbg');
  await queries(enQueries, 'twitteren');
  console.log('== D O N E   T W I T T E R ==');
  callback({});
}

if (!process.env.PORT) {
  gowork(1, () => {});

  process.stdin.resume();
}
// dasd
module.exports = {
  gowork,
  postDynamo,
};
