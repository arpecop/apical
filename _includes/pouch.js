const PouchDB = require('pouchdb');
const fs = require('mz/fs');

const allusers = new PouchDB(`${__dirname}/db/allusers`);

const wordb = new PouchDB('/tmp/allusers');
const _ = require('underscore');
const async = require('async');

//
const levelup = require('levelup');
const leveldown = require('leveldown');

// 1) Create our store

//

function gimmethousend1(db, callback) {
  allusers.get(`0_${db}`, (err, count) => {
    const rd = Math.floor(Math.random() * count.total) + 0;
    allusers.get(`${db}_${rd}`, (err, chunk) => {
      callback(chunk.users);
    });
  });
}

// /////gimmethousend advanced
const dbx = levelup(leveldown('/tmp/xx'));
async function gimmethousend(db, callback) {
  dbx.get(`next${db}`, (err, next) => {
    if (err) {
      allusers.get(`0_${db}`, (err, count) => {
        const whatever = _.flatten(
          new Array(150).fill(
            _.shuffle(_.keys(new Array(count.total).join('0').split(''))),
          ),
        ).map((val, _id) => ({
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
          allusers.get(`${db}_${val.toString()}`, (err, chunk) => {
            callback(chunk.users);
          });
        });
      });
    }
  });
}

if (!process.env.PORT) {
  // gimmethousend('bgusers', (data) => {
  // });
}

module.exports = {
  gimmethousend,
};
