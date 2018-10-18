
const PouchDB = require('pouchdb');
const request = require('request');
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

function html2json(html, callback) {
  // console.log(jsonizehtml(`<ul ${arr[1]}`).child);
  const clean = jsonizehtml(sanitizeHtml(html, {
    allowedTags: ['img', 'li', 'a', 'ol'],
    allowedAttributes: {
      a: ['href', 'class'],
      img: ['data-*', 'src'],
      ol: ['class'],
      li: ['class'],
    },
    selfClosing: ['img'],
  }));
  // ds
  const arr = [];

  async.each(
    clean.child[5].child,
    (file, cb) => {
      if (file.tag === 'li') {
        const text = [];

        const tid = [];
        let image = null;
        let description = null;

        const tidkey = ['x', 'username', 'hashtag', 'id', 'url', 'photo'];

        file.child.map((item) => {
          if (item.child && item.child[0].attr) {
            image = item.child[0].attr['data-srcset'];
          } else if (
            item.tag === 'a'
            && item.attr
            && item.attr.class
            && item.attr.class[0]
            && item.attr.class[0] === 'js-openLink'
          ) {
            image = item.child[1] ? item.child[1].attr.src : null;
            description = item.child[2] ? item.child[2].text : null;
            return {};
          } else if (item.text) {
            text.push(item.text);
            return {};
          } else if (item.attr.href) {
            const itemx = item.attr.href.replace('https://twitter.com/', '');
            tid.push({
              [tidkey[itemx.split('/').length]]: itemx,
            });

            return {};
          }
          return item;
        });

        const tweet = text.join(' ').replace(/&quot;/g, '"');
        if (tweet.length > 15 && image) {
          // ...doubles,
          // ...tid,
          const tweet1 = {
            tweet,
            title: tweet,
            image,
            description,
          };


          arr.push(tweet1);

          cb();
        } else {
          cb();
        }
      } else {
        cb();
      }
    },
    () => {
      callback(arr);
    },
  );
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
                  _id: md5(post.title),
                },
                () => {
                  const objectDefined = {
                    ...post,
                    _id: md5(post.title),
                    sortable: [type],
                    type,
                  };
                  console.log(objectDefined);
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
  return new Promise((resolve) => {
    request.get(
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Safari/604.1.38',
        },
        url: `https://syndication.twitter.com/timeline/profile?callback=__twttrf.callback&dnt=false&screen_name=${user}&suppress_response_codes=true&lang=en&limit=en&rnd=${Math.random()}`,
      },
      (err, res, datax) => {
        if (err || res.statusCode !== 200 || datax.length < 1000) {
          resolve(err);
        } else {
          const body = JSON.parse(datax.split('callback(')[1].slice(0, -2))
            .body.replace(/(?:\r\n|\r|\n)/g, '')
            .replace(/\s\s+/g, ' ');
          html2json(body, (clean) => {
            resolve(clean);
          });
        }
      },
    );
  });
}
const timelinesArr = require(`${__dirname}/_includes/sources/twitter.js`);
async function gowork(params, callback) {
  const allEn = [].concat.apply(
    [],
    await Promise.all(timelinesArr.en.map(async name => await getTl(name))),
  );
  const allBg = [].concat.apply(
    [],
    await Promise.all(timelinesArr.bg.map(async name => await getTl(name))),
  );
  await getFreshOnes(allEn, 'twitteren');
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
