const PouchDB = require('pouchdb');

const { exec } = require('child_process');
const async = require('async');
const levelup = require('levelup');

const leveldown = require('leveldown');

const localdb = levelup(leveldown(process.env.PORT ? '/tmp/twitter' : `/tmp/${new Date()}`));
const db = new PouchDB('http://1:1@pouchdb.herokuapp.com/twitter');
const dbX = new PouchDB('https://1:1@b1mr8p25ec0zgu1f.v1.p.beameio.net/twitter');
// dsds

dbX.replicate
  .from(db)
  .on('complete', () => {
    console.log('SYNc completed');
  })
  .on('error', (err) => {
    console.log('SYNc compleDEAD');
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
        `./node_modules/scrape-twitter/bin/scrape-twitter.js search --query="${user}" --count 5  --type latest`,
        (err, stdout, stderr) => {
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
  return new Promise((resolve, reject) => {
    async.eachLimit(
      quries,
      3,
      (q, callback) => {
        getTl(q, type).then(() => callback());
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
