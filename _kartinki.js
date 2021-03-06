const async = require('async');
const _ = require('underscore');
const request = require('request');
const axios = require('axios');

const md5 = require('md5');
const statcore = require('./_statii.js');
const pages = require('./_includes/pages.json');

const db = require('nano')('http://1:1@pouchdb.herokuapp.com/db');

function sortByKey(array, key) {
     return array.sort((a, b) => {
          let x = a[key];
          let y = b[key];

          if (typeof x === 'string') {
               x = x.toLowerCase();
          }
          if (typeof y === 'string') {
               y = y.toLowerCase();
          }
          return x < y ? -1 : x > y ? 1 : 0;
     });
}

async function post_to_bg(arritem) {
     return new Promise(resolve => {
          if (arritem) {
               db.get(md5(arritem.full_picture), err => {
                    if (err) {
                         db.insert({ _id: md5(arritem) }, () => {
                              async.each(_.shuffle(pages), (page, callbackx) => {
                                   request.post(
                                        `https://graph.facebook.com/${page.id}/photos`,
                                        {
                                             form: {
                                                  caption: `😂😂😂 https://www.facebook.com/${page.id}/app/181361935494/ 😂😂😂`,
                                                  url: arritem.full_picture,
                                                  access_token: page.access_token,
                                             },
                                        },
                                        (e, m, body) => {
                                             callbackx();
                                        }
                                   );
                              });
                         });
                    } else {
                         resolve();
                    }
               });
          } else {
               resolve();
          }
     });
}
async function postAndInsertDbFresh(arr, db) {
     console.log(arr);
     return new Promise((resolve, reject) => {
          async.eachSeries(
               arr,
               (i, callback) => {
                    console.log({ image: i.full_picture, title: '' });
                    callback();
               },
               err => {
                    resolve();
               }
          );
     });
}
async function kartinkiBg(params, callback) {
     const step1 = await statcore.get_pages('source_kartinki_bg');
     const getfresh = await statcore.get_fresh_ones(step1, 'photo');
     await postAndInsertDbFresh(getfresh, 'twitterbg'); // const ifarraypost = await postAndInsertDbFresh(getfresh, 'twitterbg'); // const postfirstarritem = await post_to_bg(ifarraypost[0]);
     console.log('== D O N E  K A R T I N K I   B G ==');
     callback();
}
async function kartinkiEn(params, callback) {
     const step1 = await statcore.get_pages('en_source_kartinki');
     await statcore.get_fresh_ones(step1, 'photo'); // await postAndInsertDbFresh(getfresh, 'twitterbg');
     console.log('== D O N E  K A R T I N K I   E N ==');
     callback();
}
if (!process.env.PORT) {
     kartinkiBg('1', () => {});
     process.stdin.resume();
}
module.exports = { kartinkiBg, kartinkiEn };
