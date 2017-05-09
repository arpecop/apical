const request = require('request');
const fs = require('fs');
const get = require('get');
const async = require('async');
const md5 = require('md5');
const pintetez = require('node-pinterest');
const pinterest = pintetez.init('AT3u7ZwNxWQpVASg6-MmSf6l8y56FLrVnW7SARtD-s__umBBdgAAAAA');
const console = require('better-console');
const sizeOf = require('image-size');
const shortid = require('shortid');

const _ = require('underscore');
const db = require(__dirname + '/dbaws.js');

const tempcdn = require('nano')('http://1:1@robco.herokuapp.com/content');
const pages = require('./pages.json');


function post_img(url, callback) {
  pinterest.api('pins', {
    method: 'POST',
    body: {
      board: '195554877508708250', // grab the first board from the previous response
      note: '',
      link: 'http://pix.fbook.space/',
      image_url: url
    }
  }).then(function(json) {
    request.get('https://developers.pinterest.com/widget/pins/' + json.data.id + '/', function(err, ser, body) {
      if (!err) {
        let jsxon = JSON.parse(body);
        callback({
          url: jsxon.data.image.original.url.replace('originals', '236x'),
          url_big: jsxon.data.image.original.url,
        })
      } else {
        callback({})
      }
    })

  }).catch(function(err) {
    callback({})
  });

}



const gm = require('gm').subClass({
  imageMagick: true
});




var downloadnprocess = function(id, stack, callback) {
  var dl = get(id);
  var md = md5(id);

  var shortie = shortid.generate();
  var xid = new Date().getTime() + '_' + Math.floor((Math.random() * 10) + 1);
  var file = '/tmp/' + shortie + '.jpg';

  dl.toDisk(file, function(err, filename) {
    var readStream = fs.createReadStream(file);
    fs.readFile(file, function(err, filedata) {
      var md = md5(filedata);

      tempcdn.attachment.insert(shortie, 'f.jpg', filedata, 'image/jpeg', function(err, body) {
        sizeOf(file, function(err, dimensions) {
          post_img('http://robco.herokuapp.com/content/' + shortie + '/f.jpg', function(pindata) {
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
          });
        });
      });
    });
  });
}


if (!process.env.PORT) {


}


module.exports = {
  'go': downloadnprocess
}