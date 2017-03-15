//let lambda = require('/root/serve/core/lambda');
"use strict";
let shortid = require('shortid');
let extend = require('extend');

let async = require('async');
let request = require('request');
let _ = require('underscore');
let fs = require('fs');
//let levelup = require('levelup')
let cred = {
    accessKeyId: process.env.awsuser,
    secretAccessKey: process.env.awspass,
    endpoint: 'dynamodb.eu-west-1.amazonaws.com',
    sslEnabled: false
}
let md5 = require('md5');
let db = require('dynamodb').ddb(cred);
//let ldb = levelup('/tmp/' + shortid.generate(), { valueEncoding: 'json' })
function put(jsonx, callback) {
    if (jsonx) {
        var json = {
            key: jsonx._id || shortid.generate(),
            time: jsonx.time ? Math.round(jsonx.time) : 1,
            value: JSON.stringify(jsonx)
        };
        json.time = jsonx.arr ? Math.round(new Date('2151').getTime()) - Math.round(
            new Date().getTime()) : json.time
        db.putItem('mydb', json, {}, function (err, res, cap) {
            if (!err) {
                callback(null, {
                    _id: json.key,
                    id: json.key
                });
                json = null;
            } else {
                callback({}, {});
                json = null;
            }
        });
    } else {
        callback({}, {});
    }
}
var options = {
    expected: {
        value: {
            value: '4',
            exists: true
        }
    },
    returnValues: 'ALL_OLD'
};

function get(id, callback) {
    if (typeof id === 'object') {
        db.query('mydb', id.id, {
            limit: isNaN((Math.round(id.limit) > 1 ? Math.round(id.limit) : 30) > 1000 ?
                1000 : Math.round(id.limit)) ? 30 : (Math.round(id.limit) > 1 ? Math.round(
                id.limit) : 30) > 1000 ? 1000 : Math.round(id.limit),
            rangeKeyCondition: {
                GE: id.gt ? Math.round(id.gt) : 1
            }
        }, function (err, res, cap) {
            if (!err) {
                if (res.count === 0) {
                    callback({}, {})
                } else {
                    var arr = [];
                    async.each(res.items, function (item, callback) {
                        arr.push(extend(JSON.parse(item.value), {
                            key: item.time
                        }))
                        callback()
                    }, function done() {
                        callback(null, {
                            docs: arr
                        });
                        arr = null;
                    });
                }
            } else {
                callback({}, {});
            }
        });
    } else {
        db.getItem('mydb', id, 1, {
            attributesToGet: ['value']
        }, function (err, res, cap) {
            if (res) {
                callback(null, JSON.parse(res.value));
            } else {
                callback({}, {})

            }
        });

    }
}

function exist(id, callback) {
    db.getItem('mydb', id, 1, {
        attributesToGet: ['time']
    }, function (err, res, cap) {
        if (res) {
            callback(null, JSON.parse(res.time));
        } else {
            callback({}, {})
        }
    });
}


module.exports = {
    'get': get,
    'exist': exist,
    'insert': put,
    'put': put
}