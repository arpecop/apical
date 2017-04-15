var level = require('levelup');

var db = level('/tmp/' + process.pid, {
    valueEncoding: 'json'
});
module.exports = {
    db: db
}