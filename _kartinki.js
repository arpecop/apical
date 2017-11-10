const statcore = require('./_statii.js');
const async = require('async');
const _ = require('underscore');
const request = require('request');
const axios = require('axios');
const PouchDB = require('pouchdb');
const md5 = require('md5');

const pages = require(`${__dirname}/_includes/pages.json`);
const db = new PouchDB('http://1:1@pouchdb.herokuapp.com/db');

//

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
    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
  });
}


async function post_to_bg(arritem) {
  return new Promise((resolve) => {
    if (arritem) {
      db.get(md5(arritem.full_picture), (err) => {
        if (err) {
          db.put({ _id: md5(arritem) }, () => {
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
                  console.log(body);

                  callbackx();
                },
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

async function kartinkiBg(params, callback) {
  const step1 = await statcore.get_pages('source_kartinki_bg');
  const getfresh = await statcore.get_fresh_ones(step1, 'photo');
  const ifarraypost = await statcore.postAndInsertDbFresh(
    getfresh,
    'bgimgsx',
  );
  // const postfirstarritem = await post_to_bg(ifarraypost[0]);
  console.log(`== D O N E  K A R T I N K I   B G ==${ifarraypost.length}`);
  callback(ifarraypost.length);
}

async function kartinkiEn(params, callback) {
  const step1 = await statcore.get_pages('en_source_kartinki');
  const getfresh = await statcore.get_fresh_ones(step1, 'photo');
  const ifarraypost = await statcore.postAndInsertDbFresh(
    getfresh,
    'enimgsx',
  );

  console.log(`== D O N E  K A R T I N K I   E N ==${ifarraypost.length}`);
  callback(ifarraypost.length);
}


async function rebuildPinterest(callback) {
  axios.all([
    axios.get('https://widgets.pinterest.com/v3/pidgets/boards/rudixlab3/fun/pins'),
    axios.get('https://widgets.pinterest.com/v3/pidgets/boards/yzrid/funny/pins'),
    axios.get('https://widgets.pinterest.com/v3/pidgets/boards/rudixlab/funny/pins'),
    axios.get('https://widgets.pinterest.com/v3/pidgets/boards/rudixrudix/worth/pins'),
    axios.get('https://widgets.pinterest.com/v3/pidgets/boards/likewall/funny-hits/pins'),
    axios.get('https://widgets.pinterest.com/v3/pidgets/boards/rudixlab1/news/pins'),
  ])
    .then(axios.spread((one, two, three, four, five, six) => {
      const test = Array.prototype.concat.apply([], [one.data.data.pins, two.data.data.pins, three.data.data.pins, four.data.data.pins, five.data.data.pins, six.data.data.pins]);
      const sorted = sortByKey(test, 'id').map((val, index) => { const one = 1; return (Object.assign(val.images['237x'], { id: val.id, color: val.dominant_color })); });
      request.post('http://sharlem.herokuapp.com/', { json: { _id: 'kartinkien', payload: sorted.reverse() } }, (e, a, body) => {
        callback(sorted);
        console.log('---P I N T E R E S T---');
      });
    }))
    .catch((error) => {
      callback();
    });
}
if (!process.env.PORT) {
  rebuildPinterest(() => {});
}

module.exports = {
  kartinkiBg,
  kartinkiEn,
  rebuildPinterest,
};
