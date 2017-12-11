const PouchDB = require('pouchdb');
const request = require('request');
const async = require('async');
const levelup = require('levelup');
const leveldown = require('leveldown');
const md5 = require('md5');

const jsonizehtml = require('html2json').html2json;
const sanitizeHtml = require('sanitize-html');

const localdb = levelup(leveldown('/tmp/twitterx'));
const db = new PouchDB('http://1:1@pouchdb.herokuapp.com/db');


const Twitter = require('twitter');

const tCred = process.env.twitter.split(',');


const client = new Twitter({
  consumer_key: tCred[0],
  consumer_secret: tCred[1],
  access_token_key: tCred[2],
  access_token_secret: tCred[3],
});

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
  async.each(clean.child[5].child, (file, cb) => {
    if (file.tag === 'li') {
      const text = [];

      const tid = [];
      let image = null;
      let description = null;

      const tidkey = ['x', 'username', 'hashtag', 'id', 'url', 'photo'];
      const doubles = file.child.map((item) => {
        if (item.child && item.child[0].attr) {
          image = item.child[0].attr['data-srcset'];
          return {};
        } else if (item.child && item.child[0].text && !item.child[0].text.includes('http') && item.child[0].text.length > 40) {
          description = item.child[0].text;
          return {};
        } else if (item.text) {
          text.push(item.text);
          return {};
        } else if (item.node.element) {
          tid.push(item.attr.attr);
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
          image: image ? decodeURIComponent(image[0]) : null,
          description,
        }));
        cb();
      } else {
        cb();
      }
    } else {
      cb();
    }
  }, (err) => {
    callback(arr);
  });
}

//
// http://maps.googleapis.com/maps/api/geocode/json?address=dobrich&sensor=false
async function get_fresh_ones(posts, type) {
  posts.forEach((element) => {
    if (element.description) {
      console.log(element);
    }
  });
  const arr = [];
  return new Promise((resolve) => {
    async.eachSeries(
      posts,
      (post, cb) => {
        populatedb(post.id, (exist) => {
          if (exist) { // exist only
            db.put({
              _id: md5(post.id),
            }, (errx) => {
              if (!errx) {
                request.post('http://grafix.herokuapp.com/tw/', {
                  form: {
                    id: post.id.split('/')[2],
                    text: post.tweet,
                  },
                }, (error, b, body) => {
                  db.put(Object.assign(post, {
                    _id: `${post.id.split('/')[2]}_t`,
                    created_time: new Date().getTime(),
                    tid: post.id.split('/')[2],
                    type,
                  }), (err, nonerr) => {
                    cb();
                  });
                });
              } else {
                cb();
              }
            });
          } else {
            cb();
          }
        });
      },
      () => {
        resolve();
      },
    );
  });
}


async function getTl(user) {
  return new Promise((resolve, reject) => {
    request.get(
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Safari/604.1.38',
        },
        url: `https://syndication.twitter.com/timeline/profile?callback=__twttrf.callback&dnt=false&screen_name=${user}&suppress_response_codes=true&lang=en&limit=en&rnd=${Math.random()}`,
      },
      (err, res, datax) => {
        if (err || res.statusCode !== 200) {
          reject(err);
        } else {
          const body = JSON.parse(datax.split('callback(')[1].slice(0, -2)).body.replace(/(?:\r\n|\r|\n)/g, '').replace(/\s\s+/g, ' ');
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
  const allEn = [].concat.apply([], await Promise.all(timelinesArr.en.map(async name => await getTl(name))));
  const allBg = [].concat.apply([], await Promise.all(timelinesArr.bg.map(async name => await getTl(name))));
  await get_fresh_ones(allEn, 'twitteren');
  await get_fresh_ones(allBg, 'twitterbg');
  callback({});
}
if (!process.env.PORT) {
  // test();
  gowork(1, () => {});
}

module.exports = {
  gowork,
};
