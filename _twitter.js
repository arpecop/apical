
const PouchDB = require('pouchdb');
const request = require('request');
const { exec } = require('child_process');
const async = require('async');
const levelup = require('levelup');
const leveldown = require('leveldown');
const md5 = require('md5');
const jsonizehtml = require('html2json').html2json;
const sanitizeHtml = require('sanitize-html');

const statii = require('./_statii.js');

const localdb = levelup(leveldown(process.env.PORT ? '/tmp/twitter' : `/tmp/${new Date()}`));
const db = new PouchDB('http://1:1@pouchdb.herokuapp.com/db');

function postDynamo(json, callback) {
  const options = {
    uri: 'https://0v1bbke6eh.execute-api.eu-central-1.amazonaws.com/latest/db/',
    method: 'POST',
    json,
  };

  request(options, (error, response, body) => {
    callback();
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
                  console.log(post);

                  const objectDefined = {
                    ...post,
                    sortable: [type],
                    time: Math.round(post.id),
                    id: undefined,
                  };

                  postDynamo(objectDefined, (params) => {
                    db.put(objectDefined, (err) => {
                    // console.log(err);

                      cb();
                      arr.push(objectDefined);
                    });
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
  console.log(user);
  return new Promise((resolve) => {
    if (user.length > 2) {
      exec(`./node_modules/scrape-twitter/bin/scrape-twitter.js search --query=${user} --count 2`, (err, stdout, stderr) => {
        if (err) {
          // node couldn't execute the command

          resolve();
        } else {
          resolve(JSON.parse(stdout));
        }

      // the *entire* stdout and stderr (buffered)
      });
    } else {
      resolve();
    }
  });
}
const timelinesArr = require(`${__dirname}/_includes/sources/twitter.js`);
async function gowork(params, callback) {
  const allBg = [].concat.apply(
    [],
    await Promise.all(timelinesArr.bgQueries.map(async q => await getTl(q, 'twitterbg'))),
  );
  // await getFreshOnes(allEn, 'twitteren');
  const freshBg = await getFreshOnes(allBg, 'twitterbg');
  console.log(freshBg);

  // await statii.postPages(freshBg);
  console.log('== D O N E   T W I T T E R ==');
  callback({});
}
if (!process.env.PORT) {
  // test();

  gowork(1, () => { });
  process.stdin.resume();
}

module.exports = {
  gowork,
};
