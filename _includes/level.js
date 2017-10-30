// var level = require('levelup');

const fs = require('fs');
fs.readFile('/tmp/procs.json', (err, old) => {
  if (err) {
    fs.writeFile('/tmp/procs.json', `[{"1":${process.pid }}]`, () => {});
  } else {

  }
});

// var db = level('/tmp/' + process.pid, {valueEncoding: 'json'});
module.exports = {
  db,
};
