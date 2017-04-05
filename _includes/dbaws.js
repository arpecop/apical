const shortid = require('shortid');
const extend = require('extend');
const async = require('async');
const request = require('request');
const fs = require('fs');
const PouchDB = require('pouchdb-node');
const db = new PouchDB('http://1:1@db.arpecop.com/dc/db');

function put(jsonx, callback) {
    db.get(jsonx._id, function (err, old_doc) {
        var json = {
            _id: jsonx._id ? jsonx._id : new Date().getTime() + '_' + Math.floor((Math.random() * 10) + 1),
            type: jsonx.type ? (jsonx.type || jsonx._id) : undefined,
            time: new Date().getTime(),
            _rev: err ? undefined : old_doc._rev,
            value: jsonx
        };
        db.put(json, function (err, cap) {
            callback(null, cap);
        });
    });
}

function get(id, callback) {
    let sid = (typeof id === 'object') ? id.id || id._id : id;
    if (id.limit) {
        db.query('i/i', Object.assign(id, {
            'descending': true,
            'key': id.id,
            'skip': id.skip ? id.skip : 0
        }), function (err, body) {
            if (!err) {
                var arr = [];
                Promise.all(body.rows.map(function (item) {
                    return new Promise(function (cb) {
                        arr.push(Object.assign(item.value.value, {
                            key: item.id,
                            id: item.id,
                            _date: new Date(item.value.time)
                        }));
                        cb()
                    });
                })).then(function (data) {
                    callback(null, {
                        docs: arr
                    });
                });
            }
        });
    } else {
        db.get(sid, function (err, doc) {
            if (err) {
                callback({}, {})
            } else {
                callback(null, Object.assign(doc.value, {
                    _id: doc._id
                }))
            }
        })
    }
}


module.exports = {
    'get': get,
    'exist': get,
    'insert': put,
    'put': put
}