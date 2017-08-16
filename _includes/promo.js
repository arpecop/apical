const async = require('async');
const request = require('request');

const pouch = require(`${__dirname}/pouch.js`);
const console = require('better-console');
const _ = require('lodash');

const chunk = function (n) {
  if (!this.length) {
    return [];
  }
  return [this.slice(0, n)].concat(this.slice(n).chunk(n));
};
// dsad
function IsJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

function post(url, token, title, db, callback) {
  const logx = {
    url,
    token,
    title,
    db,
  };
  console.log(logx);

  const arr = [];
  pouch.gimmethousend(db, (docs) => {
    async
      .eachSeries(docs, (fr, cb) => {
        arr.push({
          method: 'POST',
          relative_url: `${fr}/notifications?href=${url}&template=${title}`,
        });

        cb();
      }, () => {
        let count = 0;
        let counterr = 0;
        if (process.env.PORT) {
          async
            .each(_.chunk(arr, 50), (chunk, cb) => {
              request
                .post({
                  url: 'https://graph.facebook.com/',
                  form: {
                    access_token: token,
                    batch: JSON.stringify(chunk),
                  },
                }, (err, httpResponse, body) => {
                  async
                    .each(JSON.parse(body), (ix, cbx) => {
                      if (err || !IsJsonString(ix.body)) {
                        console.log(ix.body);
                        counterr++;
                      } else {
                        count++;
                      }
                      cbx();
                    }, () => {
                      cb();
                    });
                });
            }, () => {
              console.info(` 👍:${count} 🚨:${counterr} 💾:${db}  http://fbook.space/${url}`);
              callback();
            });
        } else {
          console.log(`posting en posts on localhost ${url},${token},${title}, ${db}`);
          callback();
        }
      });
  });
}
module.exports = {
  post,
};
