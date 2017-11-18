const async = require('async');
const request = require('request');

const pouch = require(`${__dirname}/pouch.js`);

const _ = require('lodash');
//


const PouchDB = require('pouchdb');

const db = new PouchDB('http://1:1@pouchdb.herokuapp.com/db');

function post(latest, preurl, token, db, callback) {
  const logx = {

    token,
    db,
  };
  console.log(logx);

  const arr = [];
  pouch.gimmethousend(db, (docs) => {
    async.each(
      docs,
      (fr, cb) => {
        const item = _.shuffle(latest)[0];
        if (item.value.title > 20) {
          arr.push({
            method: 'POST',
            relative_url: `${fr}/notifications?href=${preurl}${item.value.id}&template=${item.value.title} ${item.value.desc ? item.value.desc : ''}`,
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
            console.log(` 👍:${count} 🚨:${counterr} 💾:${db} `,);
            callback();
          },
        );
      },
    );
  });
}

function scheduled_post(dbx, preurl, token, usersdb, callback) {
  db
    .query(`i/${dbx}`, {
      limit: 100,
      descending: true,
    })
    .then((doc) => {
      if (doc.total_rows > 2) {
        post(
          doc.rows,
          preurl,
          token,
          usersdb,
          () => {
            callback('posting scheduled promo notification');
          },
        );
      } else {
        callback('not enough posts');
      }
    }).catch((err) => {
      callback(err);
    });
}
if (!process.env.PORT) {
  console.log('trying the shit');
  scheduled_post('newsen', '', process.env.izvestie_token, 'bgusers', () => {});
}


module.exports = {
  scheduled_post,
  post,
};
