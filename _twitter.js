const PouchDB = require('pouchdb');
const request1 = require('async-request');
const request = require('request');
const { exec } = require('child_process');
const async = require('async');
const levelup = require('levelup');
const _ = require('underscore');
const leveldown = require('leveldown');
const pages = require('./_includes/pages.json');

const localdb = levelup(
  leveldown(process.env.PORT ? '/tmp/twitter' : `/tmp/${new Date()}`),
);
const db = new PouchDB('http://1:1@pouchdb.herokuapp.com/db');

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
async function postPages() {
  const items = await request1('https://0v1bbke6eh.execute-api.eu-central-1.amazonaws.com/latest/db/q/twitterbg');


  return new Promise((resolve) => {
    async.eachSeries(
      _.shuffle(pages).slice(0, 5),
      (page, cb) => {
        // get links
        const item = _.shuffle(JSON.parse(items.body).docs)[0];

        const child_attachments = _.shuffle(JSON.parse(items.body).docs).map(xitem => ({ picture: xitem.image, name: xitem.title, link: `https://0v1bbke6eh.execute-api.eu-central-1.amazonaws.com/latest/twitterbg/${xitem._rev}` }));
        // console.log(child_attachments);


        const url = `https://0v1bbke6eh.execute-api.eu-central-1.amazonaws.com/latest/twitterbg/${item._rev}`;
        request.post(
          'https://graph.facebook.com/',
          {
            form: {
              access_token: page.access_token,
              id: url,
              scrape: true,
              published: !process.env.PORT,
            },
          },
          (error, d, body) => {
            request.post(
              'https://graph.facebook.com/me/feed',
              {
                form: {
                  child_attachments,
                  link: 'https://0v1bbke6eh.execute-api.eu-central-1.amazonaws.com/latest/twitterbg',
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
                        caption: item.title,
                        access_token: page.access_token,
                        url,
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
      },
      () => {
        resolve();
      },
    );
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
          populatedb(
            process.env.PORT ? post.id : new Date().getTime().toString(),
            (exist) => {
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
                      id: undefined,
                      title: post.text,
                      image: post.images ? post.images[0] : undefined,
                    };
                    db.put(objectDefined, (err) => {
                      if (objectDefined.image) {
                        postDynamo(objectDefined, (params) => {
                          cb();
                          arr.push(objectDefined);
                        });
                      } else {
                        cb();
                      }
                    });
                  },
                );
              } else {
                cb();
              }
            },
          );
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
const timelinesArr = require(`${__dirname}/_includes/sources/twitter.js`);
async function gowork(params, callback) {
  const allBg = [].concat.apply(
    [],
    await Promise.all(
      timelinesArr.bgQueries.map(async q => await getTl(q, 'twitterbg')),
    ),
  );
  // await getFreshOnes(allEn, 'twitteren');
  await postPages();
  const freshBg = await getFreshOnes(allBg, 'twitterbg');
  console.log(freshBg);

  // await statii.postPages(freshBg);
  console.log('== D O N E   T W I T T E R ==');
  callback({});
}
if (!process.env.PORT) {
  // test();
  postPages();
  // gowork(1, () => {});
  process.stdin.resume();
}

module.exports = {
  gowork,
};
