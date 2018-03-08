const PouchDB = require('pouchdb');
const request = require('request');
const async = require('async');
const levelup = require('levelup');
const leveldown = require('leveldown');
const md5 = require('md5');
const statii = require('./_statii.js');
const jsonizehtml = require('html2json').html2json;
const sanitizeHtml = require('sanitize-html');

const localdb = levelup(leveldown(process.env.PORT ? '/tmp/twitter' : `/tmp/${new Date()}`));
const db = new PouchDB('http://1:1@pouchdb.herokuapp.com/db');

const params = {
  id: '210462857140252672',
};

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

        const doubles = file.child.map((item, i) => {
          if (item.child && item.child[0].attr) {
            image = item.child[0].attr['data-srcset'];
          } else if (
            item.tag === 'a' &&
            item.attr &&
            item.attr.class &&
            item.attr.class[0] &&
            item.attr.class[0] === 'js-openLink'
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

        const tweet = text.join(' ');
        if (tweet.length > 15) {
          arr.push(Object.assign(...doubles, ...tid, {
            tweet: text.join(' '),
            title: text.join(' '),
            image,
            description,
          }));
          cb();
        } else {
          cb();
        }
      } else {
        cb();
      }
    },
    (err) => {
      callback(arr);
    },
  );
}

//
// http://maps.googleapis.com/maps/api/geocode/json?address=dobrich&sensor=false
async function get_fresh_ones(posts, type) {
  const arr = [];
  return new Promise((resolve) => {
    async.each(
      posts,
      (post, cb) => {
        populatedb(post.id, (exist) => {
          if (exist) {
            // exist only
            db.put(
              {
                _id: md5(post.id),
              },
              (errx) => {
                if (!errx && post.url) {
                  // !errx EDIT
                  const objectDefined = Object.assign(post, {
                    _id: `${post.id.split('/')[2]}_t`,
                    created_time: post.id.split('/')[2],
                    tid: post.id.split('/')[2],
                    type,
                  });

                  db.put(objectDefined, (err, nonerr) => {
                    cb();
                  });
                  // request.get(post.url, (err, x, h) => { if (x.statusCode === 200) { const $ = cheerio.load(h);

                  arr.push(objectDefined);
                } else {
                  cb();
                }
              },
            );
          } else {
            cb();
          }
        });
      },
      () => {
        resolve(arr);
      },
    );
  });
}

async function getTl(user) {
  return new Promise((resolve, reject) => {
    request.get(
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Safari/604.1.38',
        },
        url: `https://syndication.twitter.com/timeline/profile?callback=__twttrf.callback&dnt=false&screen_name=${user}&suppress_response_codes=true&lang=en&limit=en&rnd=${Math.random()}`,
      },
      (err, res, datax) => {
        if (err || res.statusCode !== 200) {
          reject(err);
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

async function gowork(params, callback) {
  const timelinesArr = require(`${__dirname}/_includes/sources/twitter.js`);
  const allEn = [].concat.apply(
    [],
    await Promise.all(timelinesArr.en.map(async name => await getTl(name))),
  );
  const allBg = [].concat.apply(
    [],
    await Promise.all(timelinesArr.bg.map(async name => await getTl(name))),
  );
  const freshEn = await get_fresh_ones(allEn, 'twitteren');
  const freshBg = await get_fresh_ones(allBg, 'twitterbg');
  //  await statii.tweet(freshEn);
  // /await statii.tweet(freshBg);
  await statii.postPages(freshBg);
  console.log('== D O N E   T W I T T E R ==');
  callback({});
}
if (!process.env.PORT) {
  // test();

  gowork(1, () => {});
}

module.exports = {
  gowork,
};
