const PouchDB = require('pouchdb');
const fs = require('mz/fs');

const allusers = new PouchDB(`${__dirname}/db/allusers`);
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
  allusers.get(`0_${db}`, (err, count) => {
    console.log(count);

    fs
      .readFile('/tmp/Index.html')
      .then((contents) => {
        console.log(contents);
      })
      .catch((err) => {
        const emptyArray = new Array(count.total).join('0').split('');
        console.log(_.shuffle(_.keys(emptyArray)));
        console.error(err);
      });
    const rd = Math.floor(Math.random() * count.total) + 0;
    allusers.get(`${db}_${rd}`, (err, chunk) => {
      callback(chunk.users);
    });
  });
}

if (!process.env.PORT) {
  gimmethousend1('bgusers', (data) => {
    // console.log(data);
  });
}

module.exports = {
  gimmethousend,
};
