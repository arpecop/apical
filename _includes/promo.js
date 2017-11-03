const async = require('async');
const request = require('request');

const pouch = require(`${__dirname}/pouch.js`);

const _ = require('lodash');
//
function post(latest, preurl, token, db, callback) {
  const logx = {
    latest,
    token,
    db,
  };


  const arr = [];
  pouch.gimmethousend(db, (docs) => {
    async.each(
      docs,
      (fr, cb) => {
        const item = _.shuffle(latest)[0];


        arr.push({
          method: 'POST',
          relative_url: `${fr}/notifications?href=${preurl}/${item.value.id}&template=${item.value.title}`,
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
                      if (ix.body) {
                        if (ix.code === 200) {
                          count++;
                        } else {
                          counterr++;
                        }
                        cbx();
                      } else {
                        counterr++;
                        cbx();
                      }
                    },
                    () => {
                      cb();
                    },
                  );
                },
              );
            },
            () => {
              console.log(` 👍:${count} 🚨:${counterr} 💾:${db} `, );
              callback();
            },
          );
        } else {
          console.log(`posting en posts on localhost ${url},${token},  ${db}  `, );
          callback();
        }
      },
    );
  });
}
module.exports = {
  post,
};
