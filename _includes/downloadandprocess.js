const request = require('request');
const fs = require('fs');
const get = require('get');
const async = require('async');
const md5 = require('md5');
const _ = require('underscore');
const pintetez = require('node-pinterest');


//

const admin = require('firebase-admin');

const serviceAccount = require(`${__dirname}/rudixfiredb.json`);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const docRef = db.collection('test').doc('test2');

db.collection('objects').doc('test').set({}).then((data) => {
  console.log(data);
});
//

function post_img(url, callback) {
  const pintokens = [
    {
      id: '195554877508708250',
      token: 'AeI49loHXJ5cLDWJVRkl41CouDttFL1aAVF1pZVD-s__umBBdgAAAAA',
    },
    {
      token: 'ATyXx8cFSAVfdzvz0LOcdnfl7nYqFL1Zq1IV_vpEABate-BEIwAAAAA',
      id: '822470019387553676',
    },
    {
      token: 'AfB6L4UIIf_pxeFYYBhp6i4UY4WDFL1aXdkDIT1EABgj4aAsUgAAAAA',
      id: '696369229821180914',
    },
    {
      token: 'AW0khR-wW7c8ZFFXPBT7qhsY_s5BFL1anfzTmpVEABiqpqA4IQAAAAA',
      id: '728879589631261225',
    },
    {
      token: 'AVsm6IPRCRqwE7ZOCN3qB7DHcK5zFL2ForcN1gBEAHLhXWA_EAAAAAA',
      id: '643944515408822125',
    },
    {
      token: 'AVltJ91yn4LTSUmk_vNfrsmJc6VFFL2Fy3o4C7FEAHM3gQBASwAAAAA',
      id: '769482355021774579',
    },
  ];
  const pintoken = _.shuffle(pintokens)[0];
  const pinterest = pintetez.init(pintoken.token);
  pinterest
    .api('pins', {
      method: 'POST',
      body: {
        board: pintoken.id,
        note: '',
        link: 'https://box.netlify.com/',
        image_url: url,
      },
    })
    .then((json) => {
      request.get(
        `https://api.pinterest.com/v1/pins/${json.data.id}/?access_token=${pintoken.token}&fields=image`,
        (err, ser, body) => {
          if (!err) {
            const jsxon = JSON.parse(body);
            if (jsxon.data) {
              callback({
                url: 1,
                _id: `${json.data.id}_1`,
                url_big: 1,
                img: jsxon.data.image.original.url.split('originals/')[1],
              });
            } else {
              callback({
                err: jsxon,
              });
            }
          } else {
            callback({
              err: 'retrieving pin data error',
            });
          }
        },
      );
    })
    .catch((err) => {
      callback({
        err: err.body,
      });
    });
}


module.exports = {
  post_img,
};
