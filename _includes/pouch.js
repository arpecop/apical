const PouchDB = require('pouchdb');
const fs = require('mz/fs');

const allusers = new PouchDB(`${__dirname}/db/allusers`);

const wordb = new PouchDB('/tmp/allusers');
const _ = require('underscore');

function gimmethousend(db, callback) {
  allusers.get(`0_${db}`, (err, count) => {
    const rd = Math.floor(Math.random() * count.total) + 0;
    allusers.get(`${db}_${rd}`, (err, chunk) => {
      callback(chunk.users);
    });
  });
}

// /////

async function gimmethousend1(db, callback) {
  const dbxx = new PouchDB(`/tmp/${db}x`);

  allusers.get(`0_${db}`, (err, count) => {
    // _.shuffle(_.keys(emptyArray)
    const whatever = _.flatten(
      new Array(50).fill(
        _.shuffle(_.keys(new Array(count.total).join('0').split(''))),
      ),
    ).map((val, index) => ({ _id: `${index}`, val }));
    console.log(whatever);
    whatever.push({ _id: 'counter', val: '0' });
    dbxx.bulkDocs(whatever, (err, ass) => {
      console.log(err || ass);
    });
    const rd = Math.floor(Math.random() * count.total) + 0;
    console.log(rd);

    allusers.get(`${db}_${rd}`, (err, chunk) => {
      callback(chunk.users);
    });
  });
}

if (!process.env.PORT) {
  // gimmethousend1('cookie', (data) => {});
}

module.exports = {
  gimmethousend,
};
