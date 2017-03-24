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
    dbcdn.get(json.Key.split('/')[0], function (err, old_doc) {
        if (err) {
            dbcdn.attachment.insert(json.Key.split('/')[0], json.Key.split('/')[1], json.Body, json.ContentType, function (err, body) {
                callback()

            });
        } else {
            dbcdn.attachment.insert(json.Key.split('/')[0], json.Key.split('/')[1], json.Body, json.ContentType, {
                rev: old_doc._rev
            }, function (err, body) {

                callback()
            });
        }
    })

}


var downloadnprocess = function (id, stack, callback) {
    var dl = get(id);
    var shortie = shortid.generate();
    var file = '/tmp/' + shortie + '.jpg';
    dl.toDisk(file, function (err, filename) {
        fs.readFile(file, function (err, filedata) {
            sizeOf(file, function (err, dimensions) {
                db.put({
                    arr: 'true',
                    kofa: 'imgserve.izteglisi.com/cdn/',
                    dir: 'fb',
                    w: dimensions.width,
                    h: dimensions.height,
                    ext: 'jpg',
                    type: '' + stack + ''
                }, function (err, doc) {
                    upload({
                        Key: 'fb/' + doc.id + '.jpg',
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
    downloadnprocess('https://scontent-otp1-1.xx.fbcdn.net/v/t1.0-9/14344978_919463701498662_8416533571720898962_n.jpg?oh=ed9d15dfffabebc8abbed195e532609b&oe=5969B28F', 'bgimgsx', function (data) {
        console.log(data);

    })

    db.put({
        arr: 'true',
        kofa: 'imgserve.izteglisi.com/cdn/',
        count: '2',
        type: 'testx'
    }, function (err, doc) {});
}

module.exports = {
    'go': downloadnprocess
}