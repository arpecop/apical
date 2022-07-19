const async = require('async');
const request = require('request');

const _ = require('lodash');
//

const pouch = require('./pouch.js');

const db1 = require('nano')('http://1:1@pouchdb.herokuapp.com/db');

function post(json, callback) {
     const arr = [];
     pouch.gimmethousend(json.app, docs => {
          docs.push(process.env.PORT ? '5435' : '572383379');
          async.each(
               docs,
               (fr, cb) => {
                    if (json.title.length > 3) {
                         arr.push({
                              method: 'POST',
                              relative_url: `${fr}/notifications?href=${json.url}&template=${json.title}`,
                         });

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
                                             JSON.parse(body).forEach(item => {
                                                  if (item.body === '{"success":true}') {
                                                       count++;
                                                  } else {
                                                       counterr++;
                                                  }
                                             });
                                        }
                                        cb();
                                   }
                              );
                         },
                         () => {
                              console.log(` 👍:${count} 🚨:${counterr} 💾:${json.title} `);
                              callback();
                         }
                    );
               }
          );
     });
}
module.exports = { post };
