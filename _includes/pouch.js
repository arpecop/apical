const PouchDB = require('pouchdb');

const allusers = new PouchDB(`${__dirname}/db/allusers`);

function gimmethousend(db, callback) {
  allusers.get(`0_${db}`, (err, count) => {
    const rd = Math.floor(Math.random() * count.total) + 0;
    allusers.get(`${db}_${rd}`, (err, chunk) => {
      callback(chunk.users);
    });
  });
}

// gimmethousend('bgusers', function(data) {})

module.exports = {
  gimmethousend,
};
