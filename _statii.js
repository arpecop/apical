const request = require ('request');
const fs = require ('fs');
const get = require ('get');
const async = require ('async');
const shortid = require ('shortid');
const _ = require ('underscore');
const extend = require ('extend');
const sizeOf = require ('image-size');
const downloadnprocess = require ('./_includes/downloadandprocess.js');
const doken = '122683342943|i6JbMuSGKjhZnt3piT-nSOJNNao';
const db = require (`${__dirname}/_includes/dbaws.js`);

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

function scheduled_post () {
  return new Promise (resolve => {
    db.get (
      {
        id: 'newsbg',
        limit: 1,
      },
      (e, doc) => {
        promo.post (
          `newsb/${doc.docs[0].value.id}`,
          process.env.izvestie_token,
          doc.docs[0].title,
          'bgusers',
          () => {
            console.log (
              `posting scheduled promo last post statii "${doc.docs[0].title}" 1 times`
            );
            resolve ('posting scheduled promo notification');
          }
        );
      }
    );
  });
}
function populatedb (id, callback) {
  db.db2.get (id, function (err) {
    if (err) {
      db.put ({_id: id}, function () {
        callback (true);
      });
    } else {
      callback (false);
    }
  });
}
async function get_pages (file) {
  const pagestoget = require (`${__dirname}/_includes/${file}.json`);
  let arr = [];
  return new Promise (resolve => {
    async.each (
      pagestoget.rows,
      (itemx, cb) => {
        request (
          `https://graph.facebook.com/${itemx.id}/feed?access_token=${doken}&fields=id,type&limit=20`,
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
        resolve (arr);
        console.log (arr);
      }
    );
  });
}

async function get_fresh_ones (posts, type) {
  let typebasedquery = {
    photo: '?fields=id,likes,type,created_time,full_picture',
    link: '?fields=full_picture,message,link,name,type,created_time',
  };
  let arr = [];
  return new Promise (resolve => {
    async.each (
      posts,
      (post, cb) => {
        populatedb (post.id, function (exist) {
          if (exist && post.type === type) {
            arr.push ({
              relative_url: post.id + '' + typebasedquery[type],
              method: 'GET',
            });
            cb ();
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

async function fresh_ones_beautify (postids) {
  let arr = [];
  return new Promise (resolve => {
    request.post (
      {
        url: 'https://graph.facebook.com/',
        form: {
          access_token: doken,
          batch: JSON.stringify (postids),
        },
      },
      (err, httpResponse, body) => {
        async.each (
          JSON.parse (body),
          (postx, cb) => {
            let post = JSON.parse (postx.body);
            post.full_picture ? arr.push (post) : '';
            cb ();
          },
          function () {
            if (arr[1]) {
              resolve (arr);
            } else {
              resolve (null);
            }
          }
        );
      }
    );
  });
}

async function post_and_insert_db_fresh (arr, collectiondb) {
  return new Promise (resolve => {
    if (arr) {
      //resolve (' new to get');
      async.eachSeries (
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

            db.put (insertjson, function () {
              //post (insertjson._id, zzmata => {
              cb ();
              //});
            });
          } else if (item.type === 'photo') {
            cb ();
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
  const step1 = await get_pages ('_source_statii');
  const get_fresh = await get_fresh_ones (step1, 'link');
  const process_fresh = await fresh_ones_beautify (get_fresh);
  const ifarraypost = await post_and_insert_db_fresh (process_fresh, 'newsbg');
  const pre_step_notify = await scheduled_post ();

  callback (ifarraypost);

  console.log ('== D O N E  B G ==');
}
async function statii_en (params, callback) {
  const step1 = await get_pages ('_en_source_statii');
  const get_fresh = await get_fresh_ones (step1, 'link');
  const process_fresh = await fresh_ones_beautify (get_fresh);
  const ifarraypost = await post_and_insert_db_fresh (
    process_fresh,
    'newsenglish'
  );

  callback (ifarraypost);
  console.log ('== D O N E  E N ==');
}

//dsadasdasddadsadsd
if (!process.env.PORT) {
  let pagestoget = require (`${__dirname}/_includes/_en_source_statii.json`);

  statii_en ('1', function (data) {
    console.log (data);
  });
}

module.exports = {
  statii,
  statii_en,
};
//dasda
