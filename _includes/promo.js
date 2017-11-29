const async = require('async');
const request = require('request');

const pouch = require(`${__dirname}/pouch.js`);

const _ = require('lodash');
//


const PouchDB = require('pouchdb');

const db = new PouchDB('http://pouchdb.herokuapp.com/api');

function post(json, callback) {
  const arr = [];
  pouch.gimmethousend(json.app, (docs) => {
    async.each(
      docs,
      (fr, cb) => {
        const item = _.shuffle(json.latest)[0];

        if (item.value.title.length > 5) {
          arr.push({
            method: 'POST',
            relative_url: `${fr}/notifications?href=${json.url}${item.value.id}&template=${item.value.title} ${item.value.desc ? item.value.desc : ''}`,
          });

          cb();
        } else {
          console.log(item.value.title);
          cb();
        }
      },
      () => {
        const count = 0;
        const counterr = 0;
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
                console.log(JSON.parse(body).data);
                cb();
              },
            );
          },
          () => {
            console.log(` 👍:${count} 🚨:${counterr} 💾:${db} `);
            callback();
          },
        );
      },
    );
  });
}

function scheduled_post(json, callback) {
  // dbx, preurl, token, usersdb

  db
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
