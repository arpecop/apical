//var level = require('levelup');

var fs = require('fs');
fs.readFile('/tmp/procs.json', function(err, old) {
  if (err) {
    fs.writeFile('/tmp/procs.json', '[{"1":' + process.pid + '}]', function() {})
  } else {

  }
})

//var db = level('/tmp/' + process.pid, {valueEncoding: 'json'});
module.exports = {
  db: db
}