const request = require('request');

const remotedb = require('nano')('http://1:1@pouchdb.herokuapp.com/db');
const _ = require('underscore');

//
const levelup = require('levelup');
const leveldown = require('leveldown');

const dbx = levelup(leveldown('/tmp/xx11'));
// 1) Create our store

//

// /////gimmethousend advanced

async function gimmethousend(db, callback) {
  request.get(`http://pouchdb.herokuapp.com/${db}`, (e, x, body) => {
    request.get(
      `https://pouchdb.herokuapp.com/${db}/${Math.floor(
        Math.random() * JSON.parse(body).doc_count + 0
      )}`,
      (e, x, zbody) => {
        callback(JSON.parse(zbody).docs.map(params => params.id));
      }
    );
  });
}

module.exports = {
  gimmethousend,
  remotedb
};
