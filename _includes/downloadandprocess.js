const request = require('request');
const fs = require('fs');
const get = require('get');
const async = require('async');
const md5 = require('md5');

const sizeOf = require('image-size');
const shortid = require('shortid');
const AWS = require('aws-sdk');
const _ = require('underscore');
const db = require('../kartinki/dbaws.js');
const cred = {
    "accessKeyId": process.env.awsuser,
    "secretAccessKey": process.env.awspass,
    "region": "eu-west-1"
}

AWS.config.update(cred);
const gm = require('gm').subClass({
    imageMagick: true
});


var s3bucket = new AWS.S3({
    params: {
        Bucket: 'imgserve.izteglisi.com'
    }
});

function upload(json, callback) {
    db.get(json.Key.split('/')[0], function (err, old_doc) {
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
            db.exist(md5(filedata), function (err, sox) {
                if (err) {
                    sizeOf(file, function (err, dimensions) {
                        db.put({
                            kofa: 'imgserve.izteglisi.com',
                            dir: 'fb',
                            date: new Date(),
                            _id: shortie,
                            w: dimensions.width,
                            h: dimensions.height,
                            ext: 'jpg'
                        }, function (err, ass) {
                            //   db.put({ _id: md5(filedata) }, function () { })
                            db.put({
                                arr: true,
                                kofa: 'imgserve.izteglisi.com',
                                dir: 'fb',
                                id: shortie,
                                w: dimensions.width,
                                h: dimensions.height,
                                ext: 'jpg',
                                _id: stack
                            }, function (err, ass) {
                                upload({
                                    Key: 'fb/' + shortie + '.jpg',
                                    Body: filedata,
                                    ContentType: 'image/jpeg'
                                }, function (err, dataxssss) {
                                    callback(shortie)
                                });
                            });
                        });
                    });
                } else {
                    callback(shortie)
                }
            })
        });
    });
}

module.exports = {
    'go': downloadnprocess
}