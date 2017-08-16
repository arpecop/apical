const request = require('request');
const fs = require('fs');
const get = require('get');
const async = require('async');

const facebook = require(`${__dirname}/facebook.js`);
const pages = require(`${__dirname}/pages.json`);
const sizeOf = require('image-size');
// pages
const shortid = require('shortid');

const cred = {
  accessKeyId: process.env.awsuser,
  secretAccessKey: process.env.awspass,
  region: 'eu-west-1',
};
const AWS = require('aws-sdk');
const md5 = require('md5');

AWS.config.update(cred);
const db = require('../dbaws.js');
const gm = require('gm').subClass({
  imageMagick: true,
});
let nano = require('nano')('http://1:1@db.fbook.space'),
  cdb = nano.use('db');

const kofa = 'imgserve.izteglisi.com';
const s3bucket = new AWS.S3({
  params: {
    Bucket: kofa,
  },
});
const s3bucket1 = new AWS.S3({
  params: {
    Bucket: 'arpecop.com',
  },
});

function shuffle(a) {
  let j,
    x,
    i;
  for (i = a.length; i; i -= 1) {
    j = Math.floor(Math.random() * i);
    x = a[i - 1];
    a[i - 1] = a[j];
    a[j] = x;
  }
}
// FIXME:
function post(id, callback) {
  async.eachSeries(pages, (page, callbackx) => {
    request.post({
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      url: `https://graph.facebook.com/v2.6/${page.id}/feed/`,
      body: `link=http://fbkartinki.xyz/${id}&access_token=${page.access_token
      }`,
    }, (error, response, body) => {
      console.log(error || body);
      callbackx();
    });
  }, () => {
    callback();
  });
}

function thumbnail(shortie, callback) {
  request(`https://arpecop.herokuapp.com/kartinki/${shortie}`, (error, response, body) => {
    gm(`/tmp/${shortie}.jpg`).resize(null, 150).crop(120, 120, 0, 0).write(
      `/tmp/${shortie}_t.jpg`,
      (err) => {
        fs.readFile(`/tmp/${shortie}_t.jpg`, (err, filedatablur) => {
          s3bucket.upload({
            Key: `fb/${shortie}_t.jpg`,
            Body: filedatablur,
            ContentType: 'image/jpeg',
            StorageClass: 'REDUCED_REDUNDANCY',
          }, (err, dataxssss) => {
            fs.createReadStream(`/tmp/${shortie}_t.jpg`).pipe(cdb.attachment
              .insert(shortie, 't.jpg', null, 'image/jpeg', (err, ass) => {
                callback('ok');
              }));
          });
        });
      });
  });
}
const downloadnprocess = function (id, callback) {
  const dl = get(id);
  const shortie = shortid.generate();
  const file = `/tmp/${shortie}.jpg`;
  dl.toDisk(file, (err, filename) => {
    fs.readFile(file, (err, filedata) => {
      sizeOf(file, (err, dimensions) => {
        db.put({
          kofa,
          dir: 'fb',
          id: shortie,
          _id: shortie,
          w: dimensions.width,
          h: dimensions.height,
          ext: 'jpg',
        }, (err, ass) => {
          db.put({
            time: new Date('2151').getTime() - new Date().getTime(),
            kofa,
            dir: 'fb',
            id: shortie,
            w: dimensions.width,
            h: dimensions.height,
            ext: 'jpg',
            _id: 'bgimages',
          }, (err, ass) => {
            gm(file)
              // .crop(600, 0, 0, 0)
              .resize(470, null)
              // .blur(100, 3)
              // .draw(['image over 150,111 0,150 "zoom.png"'])
              .write(`/tmp/${shortie}_b.jpg`, (err) => {
                s3bucket.upload({
                  Key: `fb/${shortie}.jpg`,
                  Body: filedata,
                  ContentType: 'image/jpeg',
                  StorageClass: 'REDUCED_REDUNDANCY',
                }, (err, dataxssss) => {
                  fs.readFile(`/tmp/${shortie}_b.jpg`, (err, filedatablur) => {
                    s3bucket.upload({
                      Key: `fb/${shortie}_b.jpg`,
                      Body: filedatablur,
                      ContentType: 'image/jpeg',
                      StorageClass: 'REDUCED_REDUNDANCY',
                    }, (err, dataxssss) => {
                      thumbnail(shortie, (zmata) => {
                        post(shortie, (zzmata) => {
                          callback(shortie);
                        });
                      });
                    });
                  });
                });
              });
          });
        });
      });
    });
  });
};
//
const pagestoget = require('./source.json');

async.eachSeries(pagestoget.rows, (item, callback) => {
  const rtoken = Math.floor((Math.random() * 90) + 0);
  const token = pages[rtoken].access_token;
  const url = `https://graph.facebook.com/v2.6/${item.id
  }/feed?access_token=${token
  }&fields=id,likes,type,full_picture&limit=5`;

  request(url, (error, response, body) => {
    const collect = [];
    if (!error && response.statusCode == 200) {
      async.each(JSON.parse(body).data, (item, callback1) => {
        if (item.likes) {
          if (item.likes.data.length >= 10 && item.type === 'photo') {
            db.exist(item.id, (err, data) => {
              if (err) {
                db.put({
                  _id: item.id,
                }, (dsd, dsdsd) => {
                  downloadnprocess(item.full_picture, (shortie) => {
                    callback1();
                  });
                });
              } else {
                callback1();
              }
            // collect.push(item.full_picture);
            });
          } else {
            callback1();
          }
        } else {
          callback1();
        }
      }, () => {
        callback();
      });
    } else {
      callback();
    }
  });
}, () => {
});
module.exports = {
  downloadnprocess,
};
