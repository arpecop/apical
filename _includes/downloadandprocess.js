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



module.exports = {
    'go': downloadnprocess
}