const shortid = require('shortid');
const extend = require('extend');
const async = require('async');
const request = require('request');
const fs = require('fs');
const level = require('./level.js');
var db = require('nano')('http://1:1@95.85.19.37/db');

function put(jsonx, callback) {
    db.get(jsonx._id, function (err, old_doc) {
        var json = {
            _id: jsonx._id ? jsonx._id : undefined,
            type: jsonx.type ? (jsonx.type || jsonx._id) : undefined,
            time: new Date().getTime(),
            _rev: err ? undefined : old_doc._rev,
            value: jsonx
        };

        db.insert(json, function (err, cap) {
            callback(null, cap);

        });
    });
}

function get(id, callback) {
    let sid = (typeof id === 'object') ? id.id || id._id : id;
    if (id.limit) {
        db.view('i', 'i', Object.assign(id, {
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
                            _date: new Date(Math.round(new Date('2151').getTime() - new Date(item.value.time).getTime()))
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
get({
    limit: '5',
    skip: 10,
    id: 'testx'
}, function (err, doc) {


})



function serve(req, res) {
    //res.header("Access-Control-Allow-Origin", "*");
    res.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "X-Powered-By": "vault-tec",
        "Access-Control-Allow-Headers": "X-Requested-With"
    });
    if (req.method === "GET") {
        if (req.query.limit) {
            req.json = req.query;
            req.json.id = req.query.id ? req.query.id : req.params.id;


            get(req.json, function (err, doc) {
                res.end(JSON.stringify(doc));
                req = null;
                res = null;
            });
        } else if (req.params.id) {
            get(req.params.id, function (err, doc) {
                res.end(JSON.stringify(doc));
                req = null;
                res = null;
            });
        } else {
            res.end('ddb');
        }
    } else {
        put(req.body, function (err, data) {
            if (!err) {
                res.end(JSON.stringify(data));
                req = null;
                res = null;
            } else {
                res.end('{}');
                req = null;
                res = null;
            }
        });
    }
}


function getid(id, callback) {
    level.db.get(id, function (err, cached) {
        if (err) {
            db.get(id, function (err, res) {
                if (res) {
                    callback(null, res.value);
                    level.db.put(id, {
                        err: null,
                        item: res.value
                    })
                } else {
                    callback({}, {})
                    level.db.put(id, {
                        err: {},
                        item: {}
                    });
                }
            });
        } else {
            callback(cached.err, cached.item)
        }
    })
}

//dsd

module.exports = {
    'get': get,
    'getid': getid,
    'exist': getid,
    'insert': put,
    'put': put,
    'serve': serve
}