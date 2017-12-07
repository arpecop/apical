const PouchDB = require('pouchdb');

const allusers = new PouchDB(`${__dirname}/db/allusers`);

const remotedb = new PouchDB('http://1:1@pouchdb.herokuapp.com/db/');
const _ = require('underscore');
const async = require('async');

//
const levelup = require('levelup');
const leveldown = require('leveldown');

const dbx = levelup(leveldown('/tmp/xx11'));
// 1) Create our store

//


// /////gimmethousend advanced

async function gimmethousend(db, callback) {
  dbx.get(`next${db}`, (err, next) => {
    if (err) {
      allusers.get(`0_${db}`, (err, count) => {
        console.log(err);
        const whatever = _.flatten(new Array(150).fill(_.shuffle(_.keys(new Array(count.total).join('0').split(''))), ), ).map((val, _id) => ({
          _id,
          val,
        }));

        async.each(
          whatever,
          (val, cb) => {
            dbx.put(`${val._id}${db}`, val.val, (err) => {
              // console.log(val);
              cb();
            });
          },
          (err) => {
            dbx.put(`next${db}`, 0, () => {
              allusers.get(`${db}_${whatever[0].val}`, (err, chunk) => {
                callback(chunk.users);
              });
            });
          },
        );
        // whatever.push({ _id: 'counter', val: '0' });
      });
    } else {
      dbx.put(`next${db}`, Math.round(next.toString()) + 1, () => {
        dbx.get(`${next.toString()}${db}`, (err, val) => {
          console.log(`${next.toString()}_${db}_${val.toString()}`);

          allusers.get(`${db}_${val.toString()}`, (err, chunk) => {
            callback(chunk.users);
          });
        });
      });
    }
  });
}

if (!process.env.PORT) {
  gimmethousend('bgusers', (data) => {});
}

module.exports = {
  gimmethousend,
  remotedb,
};
