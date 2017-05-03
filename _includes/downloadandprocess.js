const request = require('request');
const fs = require('fs');
const get = require('get');
const async = require('async');
const md5 = require('md5');
const pintetez = require('node-pinterest');
const pinterest = pintetez.init('AT3u7ZwNxWQpVASg6-MmSf6l8y56FLrVnW7SARtD-s__umBBdgAAAAA');

const sizeOf = require('image-size');
const shortid = require('shortid');

const _ = require('underscore');
const db = require(__dirname + '/dbaws.js');
const dbcdn = require('nano')('http://1:1@db2.arpecop.com/cdn');
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
    }).then(function (json) {
        request.get('https://developers.pinterest.com/widget/pins/' + json.data.id + '/', function (err, ser, body) {
            if (!err) {
                let jsxon = JSON.parse(body);
                console.log(jsxon)
                callback({
                    url: jsxon.data.image.original.replace('originals', '236x'),
                    url_big: jsxon.data.image.original,
                })
            } else {
                callback({})
            }
        })

    });

}



const gm = require('gm').subClass({
    imageMagick: true
});


function upload(json, callback) {
    dbcdn.attachment.insert(json.Key, 'f.jpg', json.Body, json.ContentType, function (err, body) {
        callback()
    });
}

var downloadnprocess = function (id, stack, callback) {

    var dl = get(id);
    var shortie = shortid.generate();
    var xid = new Date().getTime() + '_' + Math.floor((Math.random() * 10) + 1);
    var file = '/tmp/' + shortie + '.jpg';
    dl.toDisk(file, function (err, filename) {
        var readStream = fs.createReadStream(file);
        fs.readFile(file, function (err, filedata) {
            sizeOf(file, function (err, dimensions) {
                post_img('http://apicall.herokuapp.com/' + shortie + '.jpg', function (fbdata) {
                    db.put(Object.assign({
                        arr: 'true',
                        kofa: true,
                        key: shortie,
                        shortie: shortie,
                        dir: 'fb',
                        w: dimensions.width,
                        h: dimensions.height,
                        ext: 'jpg',
                        type: '' + stack + ''
                    }, fbdata), function (err, doc) {
                        gm(readStream)
                            .size({
                                bufferStream: true
                            }, function (err, size) {
                                this.resize(250)
                                this.crop(250, 501, 0, 0)
                                this.write('/tmp/' + shortie + '_sm.jpg', function (err) {
                                    fs.readFile('/tmp/' + shortie + '_sm.jpg', function (err, filedata) {
                                        upload({
                                            Key: doc.id + '300',
                                            Body: filedata,
                                            ContentType: 'image/jpeg'
                                        }, function (err, dataxssss) { })
                                    })
                                });
                                //this.append("./cover.png")
                                //gm("img.png").watermark(brightness, saturation)

                                this.resize(450)
                                this.crop(450, 236, 0, 0)
                                this.draw(['image Over 0,0 0,0 "/app/_includes/cover.png"'])
                                this.write('/tmp/' + shortie + '_feed.jpg', function (err) {
                                    fs.readFile('/tmp/' + shortie + '_feed.jpg', function (err, filedata) {
                                        upload({
                                            Key: doc.id + 'feed',
                                            Body: filedata,
                                            ContentType: 'image/jpeg'
                                        }, function (err, dataxssss) { })
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
                })
            });
        });
    });
}


if (!process.env.PORT) {

    downloadnprocess('https://db.arpecop.com/cdn/1493656010098_4/f.jpg', 'testxx', () => { })

}


module.exports = {
    'go': downloadnprocess
}