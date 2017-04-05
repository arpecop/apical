const request = require('request');
const fs = require('fs');
const get = require('get');
const async = require('async');
const md5 = require('md5');

const sizeOf = require('image-size');
const shortid = require('shortid');

const _ = require('underscore');
const db = require('../_includes/dbaws.js');
const dbcdn = require('nano')('http://1:1@db.arpecop.com/cdn');


const gm = require('gm').subClass({
    imageMagick: true
});


function upload(json, callback) {
    dbcdn.attachment.insert(json.Key, 'f.jpg', json.Body, json.ContentType, function (err, body) {
        //console.log(body);
        callback()
    });
}


var downloadnprocess = function (id, stack, callback) {
    var dl = get(id);
    var shortie = shortid.generate();
    var file = '/tmp/' + shortie + '.jpg';
    dl.toDisk(file, function (err, filename) {
        var readStream = fs.createReadStream('/tmp/' + shortie + '.jpg');
        fs.readFile(file, function (err, filedata) {
            sizeOf(file, function (err, dimensions) {
                db.put({
                    arr: 'true',
                    kofa: 'db.arpecop.com/cdn/' + shortie + '/',
                    key: shortie,
                    dir: 'fb',
                    w: dimensions.width,
                    h: dimensions.height,
                    ext: 'jpg',
                    type: '' + stack + ''
                }, function (err, doc) {
                    gm(readStream)
                        .size({
                            bufferStream: true
                        }, function (err, size) {
                            this.resize(300)
                            this.write('/tmp/' + shortie + '_sm.jpg', function (err) {
                                fs.readFile('/tmp/' + shortie + '_sm.jpg', function (err, filedata) {
                                    upload({
                                        Key: doc.id + '300',
                                        Body: filedata,
                                        ContentType: 'image/jpeg'
                                    }, function (err, dataxssss) {})
                                })
                            });

                            this.resize(450)
                            this.crop(450, 236, 0, 0)
                            this.write('/tmp/' + shortie + '_feed.jpg', function (err) {
                                fs.readFile('/tmp/' + shortie + '_feed.jpg', function (err, filedata) {
                                    upload({
                                        Key: doc.id + 'feed',
                                        Body: filedata,
                                        ContentType: 'image/jpeg'
                                    }, function (err, dataxssss) {})
                                })
                            });
                        });

                    upload({
                        Key: doc.id,
                        Body: filedata,
                        ContentType: 'image/jpeg'
                    }, function (err, dataxssss) {
                        fs.rename('/tmp/' + shortie + '.jpg', '/tmp/' + doc.id + '.jpg', function (err) {
                            callback(doc.id)
                        });
                    });
                });
            });
        });
    });
}


if (!process.env.PORT) {
    downloadnprocess('https://db.arpecop.com/fc/cdn/1491241021389_9/f.jpg', 'testxx', () => {})
    //https://db.arpecop.com/fc/cdn/1491239343240_8/f.jpg
}


module.exports = {
    'go': downloadnprocess
}