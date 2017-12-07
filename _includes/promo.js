const async = require('async');
const request = require('request');

const pouch = require(`${__dirname}/pouch.js`);

const _ = require('lodash');
//


const PouchDB = require('pouchdb');

const db = new PouchDB('http://pouchdb.herokuapp.com/api');
const db1 = new PouchDB('http://pouchdb.herokuapp.com/db');
function post(json, callback) {
  const arr = [];
  pouch.gimmethousend(json.app, (docs) => {
    async.each(
      docs,
      (fr, cb) => {
        const item = _.shuffle(json.latest)[0];
        console.log(item);
        if (item.value.title.length > 5) {
          arr.push({
            method: 'POST',
            relative_url: `${fr}/notifications?href=${json.url}${item.id}&template=${item.value.title} ${item.value.desc ? item.value.desc : ''}`,
          });
          arr.push({
            method: 'POST',
            relative_url: `${fr}/apprequests?message=${item.value.title} ${item.value.desc ? item.value.desc : ''}`,
          });

          cb();
        } else {
          console.log(item.value.title);
          cb();
        }
      },
      () => {
        let count = 0;
        let counterr = 0;
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
                JSON.parse(body).forEach((item) => {
                  if (item.body === '{"success":true}') {
                    count++;
                  } else {
                    counterr++;
                  }
                });
                cb();
              },
            );
          },
          () => {
            console.log(` 👍:${count} 🚨:${counterr} 💾:${json.db} `);
            callback();
          },
        );
      },
    );
  });
}

function scheduled_post(json, callback) {
  // dbx, preurl, token, usersdb

  db1
    .query(`i/${json.db}`, {
      limit: 100,
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
    }).catch((err) => {
      callback(err);
    });
}
module.exports = {
  scheduled_post,
  post,
};
