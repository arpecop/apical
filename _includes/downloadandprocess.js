const request = require('request');
const fs = require('fs');
const get = require('get');
const async = require('async');
const md5 = require('md5');
const _ = require('underscore');
const pintetez = require('node-pinterest');
const pintokens = [{
  'id': '195554877508708250',
  'token': 'AeI49loHXJ5cLDWJVRkl41CouDttFL1aAVF1pZVD-s__umBBdgAAAAA'
}, {
  'token': 'ATyXx8cFSAVfdzvz0LOcdnfl7nYqFL1Zq1IV_vpEABate-BEIwAAAAA',
  'id': '822470019387553676'
}, {
  'token': 'AfB6L4UIIf_pxeFYYBhp6i4UY4WDFL1aXdkDIT1EABgj4aAsUgAAAAA',
  'id': '696369229821180914'
}, {
  'token': 'AW0khR-wW7c8ZFFXPBT7qhsY_s5BFL1anfzTmpVEABiqpqA4IQAAAAA',
  'id': '728879589631261225'
}, {
  'token': 'AVsm6IPRCRqwE7ZOCN3qB7DHcK5zFL2ForcN1gBEAHLhXWA_EAAAAAA',
  'id': '643944515408822125'
}, {
  'token': 'AVltJ91yn4LTSUmk_vNfrsmJc6VFFL2Fy3o4C7FEAHM3gQBASwAAAAA',
  'id': '769482355021774579'
}];

const console = require('better-console');
const sizeOf = require('image-size');
const shortid = require('shortid');
//

const db = require(__dirname + '/dbaws.js');

const tempcdn = require('nano')('http://1:1@robco.herokuapp.com/content');
const pages = require('./pages.json');


function post_img(url, callback) {
  var pintoken = _.shuffle(pintokens)[0];
  console.log('===' + pintoken.id);

  var pinterest = pintetez.init(pintoken.token);
  pinterest.api('pins', {
    method: 'POST',
    body: {
      board: pintoken.id,
      note: '',
      link: 'https://box.fbook.space/',
      image_url: url
    }
  }).then(function(json) {
    request.get('https://api.pinterest.com/v1/pins/' + json.data.id + '/?access_token=' + pintoken.token + '&fields=image', function(err, ser, body) {
      if (!err) {
        let jsxon = JSON.parse(body);

        if (jsxon.data) {
          callback({
            url: jsxon.data.image.original.url.replace('originals', '236x'),
            url_big: jsxon.data.image.original.url,
            img: jsxon.data.image.original.url.split('originals/')[1]
          })
        } else {
          callback({
            err: jsxon
          })
        }
      } else {
        callback({
          err: 'retrieving pin data error'
        })
      }
    })

  }).catch(function(err) {
    callback({
      err: err.body
    })
  });

}



const gm = require('gm').subClass({
  imageMagick: true
});




var downloadnprocess = function(id, stack, callback) {


  db.db1.get(md5(id), function(err) {

    if (err) {
      db.db1.put({
        _id: md5(id)
      }, function() {})
      var shortie = shortid.generate();
      var xid = new Date().getTime() + '_' + Math.floor((Math.random() * 10) + 1);
      var file = '/tmp/' + shortie + '.jpg';
      var dl = get(id);
      dl.toDisk(file, function(err, filename) {
        var readStream = fs.createReadStream(file);
        fs.readFile(file, function(err, filedata) {
          db.db1.get(md5(filedata), function(err) {
            if (err) {
              db.db1.put({
                _id: md5(filedata)
              }, function() {})
              tempcdn.attachment.insert(shortie, 'f.jpg', filedata, 'image/jpeg', function(err, body) {
                sizeOf(file, function(err, dimensions) {
                  post_img('http://robco.herokuapp.com/content/' + shortie + '/f.jpg', function(pindata) {
                    if (!pindata.err) {
                      db.put(Object.assign({
                        _id: xid,
                        arr: 'true',
                        w: dimensions.width,
                        h: dimensions.height,
                        type: stack
                      }, pindata), function(err, doc) {
                        fs.rename('/tmp/' + shortie + '.jpg', '/tmp/' + doc.id + '.jpg', function(err) {
                          callback(doc.id)
                        });
                      });
                    } else {
                      console.log(pindata.err)
                      callback()
                    }
                  });
                });
              });
            } else {
              callback()
            }
          })
        });
      });
    } else {
      callback();
    }
  });

}


if (!process.env.PORT) {
  var pintoken = _.shuffle(pintokens)[0];
  console.log('===' + pintoken.id);

  var pinterest = pintetez.init(pintoken.token);
  pinterest.api('me').then(console.log);

  pinterest.api('pins', {
    method: 'POST',
    body: {
      board: pintoken.id,
      note: '',
      link: 'https://box.fbook.space/',
      image_url: 'https://s-media-cache-ak0.pinimg.com/564x/3a/ee/ed/3aeeed6a1a58df881d89f0da681102de.jpg'
    }
  }).then(function(json) {});
}


module.exports = {
  'go': downloadnprocess



}