const async = require('async');
const request = require('request');


const _ = require('lodash');
//

const PouchDB = require('pouchdb');
const pouch = require('./pouch.js');

const db1 = new PouchDB('http://pouchdb.herokuapp.com/db');
function post(json, callback) {
  const arr = [];
  pouch.gimmethousend(json.app, (docs) => {
    docs.push(process.env.PORT ? '5435' : '572383379');
    async.each(
      docs,
      (fr, cb) => {
        if (json.title.length > 3) {
          arr.push({
            method: 'POST',
            relative_url: `${fr}/notifications?href=${json.url}&template=${json.title}`,
          });
          // arr.push({method: 'POST',relative_url: `${fr}/apprequests?message=${item.value.title} ${item.value.desc ? item.value.desc : ''}`,});

          cb();
        } else {
          cb();
        }
      },
      () => {
        let count = 0;
        let counterr = 0;
        console.log(arr[0]);
        async.each(
          _.chunk(arr, 50),
          (chunk, cb) => {
            request.post(
              {
                url: 'https://graph.facebook.com/',
                form: {
                  access_token: json.tok,
                  batch: JSON.stringify(chunk),
                },
              },
              (err, httpResponse, body) => {
                if (body) {
                  JSON.parse(body).forEach((item) => {
                    if (item.body === '{"success":true}') {
                      count++;
                    } else {
                      counterr++;
                    }
                  });
                }
                cb();
              },
            );
          },
          () => {
            console.log(` 👍:${count} 🚨:${counterr} 💾:${json.title} `);
            callback();
          },
        );
      },
    );
  });
}

function scheduled_post(json, callback) {
  db1
    .query(`i/${json.db}`, {
      limit: json.limit,
      descending: true,
    })
    .then((doc) => {
      if (doc.total_rows > 2) {
        post(Object.assign({ latest: doc.rows }, json), () => {
          callback('posting scheduled promo notification');
        });
      } else {
        callback('not enough posts');
      }
    })
    .catch((err) => {
      callback(err);
    });
}

if (!process.env.PORT) {
  console.log(process.env);

  post({
    tok: process.env.article_token || '181361935494|iii2yPaq_2q9kUKy1RWcM27d0n4',
    url: '#chat',
    title: 'Каня те в общия чат',
    app: 'bgusers',
  }, () => {});
  process.stdin.resume();
}
module.exports = {
  scheduled_post,
  post,
};
