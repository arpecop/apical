const shortid = require("shortid");
const extend = require("extend");
const async = require("async");
const request = require("request");
const fs = require("fs");
const PouchDB = require("pouchdb");

const db = new PouchDB("http://1:1@pouchdb.herokuapp.com/db");

const db2 = new PouchDB(
  process.env.PORT
    ? "http://pouchdb.herokuapp.com/api"
    : "http://pouchdb.herokuapp.com/api"
);
const db1 = new PouchDB("http://1:1@pouchdb.herokuapp.com/content");

function put(jsonx, callback) {
  db.get(jsonx._id, (err, old_doc) => {
    const json = {
      _id: jsonx._id
        ? jsonx._id
        : `${new Date().getTime()}_${Math.floor(Math.random() * 10 + 1)}`,
      type: jsonx.type ? jsonx.type || jsonx._id : undefined,
      time: new Date().getTime(),
      _rev: err ? undefined : old_doc._rev,
      value: jsonx,
    };
    db.put(json, (err, cap) => {
      callback(null, cap);
    });
  });
}

function get(id, callback) {
  if (id) {
    const sid = typeof id === "object" ? id.id || id._id : id;
    if (id.limit) {
      db.query(
        `i/${id.id}`,
        Object.assign(id, {
          descending: true,
          skip: id.skip ? id.skip : 0,
          start_key: id.gt ? id.gt : undefined,
        }),
        (err, body) => {
          if (!err) {
            const arr = [];
            Promise.all(
              body.rows.map(
                (item) =>
                  new Promise((cb, rj) => {
                    arr.push(
                      Object.assign(item.value, {
                        key: item.id,
                        id: item.id,
                        _date: new Date(item.value.time),
                      })
                    );
                    cb();
                  })
              )
            ).then((data) => {
              console.log(arr);

              callback(null, {
                docs: arr,
              });
            });
          } else {
            callback(err);
          }
        }
      );
    } else {
      db.get(sid, (err, doc) => {
        if (err) {
          callback({}, {});
        } else {
          console.log("---");
          console.log(doc.value);

          callback(null, doc);
        }
      });
    }
  } else {
    callback({}, {});
  }
}

// dsd

module.exports = {
  get,
  exist: get,
  insert: put,
  put,
  db1,
  db2,
  query: db.query,
};
