const request = require('request');
const fs = require('fs');
const get = require('get');
const async = require('async');
const md5 = require('md5');

const sizeOf = require('image-size');
const shortid = require('shortid');

const _ = require('underscore');
const db = require('../kartinki/dbaws.js');
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
                    arr: true,
                    kofa: 'imgserve.izteglisi.com/cdn/',
                    dir: 'fb',
                    w: dimensions.width,
                    h: dimensions.height,
                    ext: 'jpg',
                    _id: stack
                }, function (err, doc) {
                    upload({
                        Key: 'fb/' + doc.id + '.jpg',
                        Body: filedata,
                        ContentType: 'image/jpeg'
                    }, function (err, dataxssss) {
                        callback(doc.id)
                    });
                });

            });

        });
    });
}

if (!process.env.PORT) {
    downloadnprocess('https://external-otp1-1.xx.fbcdn.net/safe_image.php?d=AQCUuKNF93yXupjO&w=284&h=149&url=https%3A%2F%2Fscontent-otp1-1.xx.fbcdn.net%2Ft45.1600-4%2F14965998_6054212277158_5314469451192598528_n.png&cfs=1&_nc_hash=AQBqZfshQ5q73Kik', 'bgimages', function (data) {
        console.log(data);

    })

}

module.exports = {
    'go': downloadnprocess
}