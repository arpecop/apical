const request = require ('request');

const fs = require ('fs');
const get = require ('request-promise');
const async = require ('async');
const shortid = require ('shortid');
const _ = require ('underscore');
const extend = require ('extend');
const sizeOf = require ('image-size');
const downloadnprocess = require ('./_includes/downloadandprocess.js');
const doken = '122683342943|i6JbMuSGKjhZnt3piT-nSOJNNao';
//const db = require (`${__dirname}/_includes/dbaws.js`);
const PouchDB = require ('pouchdb');
const localdb = new PouchDB ('/tmp/'+new Date().getHours());
const db = new PouchDB ('http://1:1@pouchdb.herokuapp.com/db');
//const pagestoget = require (`${__dirname}/_includes/source.json`);
const pages = require (`${__dirname}/_includes/pages.json`);
const promo = require (`${__dirname}/_includes/promo.js`);

function post (id, callback) {
  count = 0;
  counterr = 0;

  db.get (
    {
      id: 'newsbg',
      limit: 20,
    },
    (err, posts) => {
      async.each (
        _.shuffle (pages),
        (page, callbackx) => {
          const rid = _.shuffle ([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

          request.post (
            `https://graph.facebook.com/${page.id}/feed`,
            {
              form: {
                published: process.env.PORT ? 1 : 0,
                link: 'https://newsboy.fbook.space/',
                child_attachments: [
                  {
                    description: posts.docs[0].description,
                    name: `[актуално от днес]: ${posts.docs[0].name}`,
                    link: `https://newsboy.fbook.space/${posts.docs[0].value.id}`,
                    picture: posts.docs[0].url_big,
                  },
                  {
                    description: posts.docs[rid[1]].description,
                    name: posts.docs[rid[1]].name,
                    link: `https://newsboy.fbook.space/${posts.docs[rid[1]].value.id}`,
                    picture: posts.docs[rid[1]].url_big,
                  },
                ],
                access_token: page.access_token,
              },
            },
            (error, response, body) => {
              // const resp = JSON.parse (body);
              if (response && response.statusCode === 200) {
                counterr++;
              } else {
                count++;
              }
              callbackx ();
            }
          );
        },
        () => {
          console.log (
            `📘 posted to facebook pages news 🚨:${counterr} ✅:${count}`
          );
          callback ();
        }
      );
    }
  );
}

function scheduled_post (dbx, preurl, token, usersdb) {
  return new Promise (resolve => {
    db
      .query ('i/' + dbx, {
        limit: 10,
        descending: true,
      })
      .then (function (doc, doc2) {
        if (doc.total_rows > 2) {
          promo.post (
            preurl + '' + doc.rows[0].value.id,
            token,
            doc.rows[0].value.title,
            usersdb,
            () => {
              console.log (
                `posting scheduled promo last post statii "${doc.rows[0].value.title}" 1 times`
              );
              resolve ('posting scheduled promo notification');
            }
          );
        } else {
          resolve ('not enough posts');
        }
      })
      .catch (function (err) {
        console.log (err);

        reject (err);
      });
  });
}

function populatedb (id, callback) {
  localdb.get (id, function (err) {
    if (err) {
      localdb.put ({_id: id}, function () {
        callback (true);
      });
    } else {
      callback (false);
    }
  });
}
async function get_pages (file) {
  const pagestoget = require (`${__dirname}/_includes/sources/${file}.json`);
  let arr = [];
  return new Promise (resolve => {
    async.each (
      pagestoget.rows,
      (itemx, cb) => {
        request (
          `http://node-one.rhcloud.com/fbfeed/${itemx.id}`,
          (error, response, body) => {
            if (!error && response.statusCode === 200) {
              arr = arr.concat (JSON.parse (body).data);
              cb ();
            } else {
              cb ();
            }
          }
        );
      },
      function () {
        if (arr.length < 5) {
          reject ({err: 'something wrong'});
        } else {
          resolve (arr);
        }
      }
    );
  });
}

async function get_fresh_ones (posts, type) {
  let arr = [];
  return new Promise (resolve => {
    async.each (
      posts,
      (post, cb) => {
        populatedb (post.id, function (exist) {
          if (exist && post.type === type) {
            get ({
              uri: 'http://node-one.rhcloud.com/fb/' + post.id,
              transform: function (body) {
                return JSON.parse (body);
              },
            })
              .then (function (data) {
                arr.push (data);
                cb ();
              })
              .catch (function (err) {
                cb ();
              });
          } else {
            cb ();
          }
        });
      },
      function () {
        resolve (_.shuffle (arr).slice (0, 49));
      }
    );
  });
}

async function post_and_insert_db_fresh (arr, collectiondb) {
  return new Promise (resolve => {
    if (arr[1]) {
      async.each (
        arr,
        function (item, cb) {
          if (item.type === 'link') {
            let insertjson = item;
            insertjson.type = collectiondb;
            insertjson.title = insertjson.name;
            insertjson.description = insertjson.message
              ? insertjson.message
              : ' ';
            insertjson.url = insertjson.picture;
            insertjson.provider = insertjson.link.split ('/')[2];
            insertjson.source = insertjson.link;
            insertjson.url_big = insertjson.full_picture;
            insertjson._id =
              new Date (insertjson.created_time).getTime () + '_1';

            db.put (insertjson, function (err, nonerr) {
              //post (insertjson._id, zzmata => {
              cb ();
              //});
            });
          } else if (item.type === 'photo') {
            let insertjson = item;
            insertjson.type = collectiondb;
            insertjson._id =
              new Date (insertjson.created_time).getTime () + '_1';
            db.put (insertjson, function (err, nonerr) {
              //post (insertjson._id, zzmata => {
              cb ();
              //});
            });
          } else {
            cb ();
          }
        },
        function () {
          resolve ('posted ' + arr.length + 'new items to' + collectiondb);
        }
      );
    } else {
      resolve ('nothing new to get');
    }
  });
}

async function statii (params, callback) {
  const pre_step_notify = await scheduled_post (
    'newsbg', //view to retrieve latest post and send the title
    'newsb/', //before the _id
    process.env.izvestie_token,
    'bgusers' //userbase on localhost to randomize
  );
  const step1 = await get_pages ('source_statii');
  const get_fresh = await get_fresh_ones (step1, 'link');

  const ifarraypost = await post_and_insert_db_fresh (get_fresh, 'newsbg');

  callback (ifarraypost);

  console.log ('== D O N E  B G ==');
}
async function statii_en (params, callback) {
  const pre_step_notify = await scheduled_post (
    'newsen', //view to retrieve latest post and send the title
    '/', //before the _id
    process.env.article_token,
    'poparticles' //userbase on localhost to randomize
  );

  const pre_step_notify2 = await scheduled_post (
    'newsen', //view to retrieve latest post and send the title
    '/news/', //before the _id
    process.env.mystbox_token,
    'mystic' //userbase on localhost to randomize
  );
  const step1 = await get_pages ('en_source_statii');
  const get_fresh = await get_fresh_ones (step1, 'link');

  const ifarraypost = await post_and_insert_db_fresh (get_fresh, 'newsenglish');

  callback (ifarraypost);
  console.log ('== D O N E  E N ==' + ifarraypost.length);
}

//dsadasdasddadsadsd
if (!process.env.PORT) {
  // statii_en ('1', function (data) {});
}

module.exports = {
  statii,
  statii_en,
  post_and_insert_db_fresh,
  scheduled_post,
  get_pages,
  get_fresh_ones,
};
//dasda
