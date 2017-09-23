const async = require('async');
const request = require('request');

const pouch = require(`${__dirname}/pouch.js`);

const _ = require('lodash');

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
    async.eachSeries(
      docs,
      (fr, cb) => {
        arr.push({
          method: 'POST',
          relative_url: `${fr}/notifications?href=${url.replace('/', '')}&template=${title}`,
        });

        cb();
      },
      () => {
        let count = 0;
        let counterr = 0;
        if (process.env.PORT) {
          async.each(
            _.chunk(arr, 50),
            (chunk, cb) => {
              request.post(
                {
                  url: 'https://graph.facebook.com/',
                  form: {
                    access_token: token,
                    batch: JSON.stringify(chunk),
                  },
                },
                (err, httpResponse, body) => {
                  async.each(
                    JSON.parse(body),
                    (ix, cbx) => {
                      if (httpResponse.statusCode === 200) {
                        count++;
                      } else {
                        console.log(body);
                        counterr++;
                      }
                      cbx();
                    },
                    () => {
                      cb();
                    },
                  );
                },
              );
            },
            () => {
              console.log(
                ` 👍:${count} 🚨:${counterr} 💾:${db}  http://fbook.space/${url}`,
              );
              callback();
            },
          );
        } else {
          console.log(
            `posting en posts on localhost ${url},${token},${title}, ${db}`,
          );
          callback();
        }
      },
    );
  });
}
module.exports = {
  post,
};
