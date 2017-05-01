const request = require('request');
const fs = require('fs');
const get = require('get');
const async = require('async');
const md5 = require('md5');

const sizeOf = require('image-size');
const shortid = require('shortid');

const _ = require('underscore');
const db = require(__dirname + '/dbaws.js');
const dbcdn = require('nano')('http://1:1@db2.arpecop.com/cdn');
const pages = require('./pages.json');


function post_img(url, callback) {
    var rtoken = pages[Math.floor((Math.random() * pages.length) + 0)].access_token;
    request.post('https://graph.facebook.com/me/photos', {
        form: {
            url: url,
            access_token: rtoken
        }
    }, function (error, response, body) {


        callback(JSON.parse(body));
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
    var file = '/tmp/temp.jpg';
    dl.toDisk(file, function (err, filename) {
        var readStream = fs.createReadStream('/tmp/temp.jpg');
        fs.readFile(file, function (err, filedata) {
            sizeOf(file, function (err, dimensions) {
                post_img('http://apicall.herokuapp.com/temp.jpg', function (fbdata) {
                    console.log(fbdata)
                    db.put(Object.assign({
                        arr: 'true',
                        kofa: true,
                        key: shortie,
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
                                this.write('/tmp/temp_sm.jpg', function (err) {
                                    fs.readFile('/tmp/temp_sm.jpg', function (err, filedata) {
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
    // downloadnprocess('http://db.arpecop.com/fc/cdn/1491421286645_7/f.jpg', 'testxx', () => {})
    //https://db.arpecop.com/fc/cdn/1491239343240_8/f.jpg
}


module.exports = {
    'go': downloadnprocess
}