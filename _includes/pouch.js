const PouchDB = require('pouchdb-node');

const mystbox = new PouchDB(__dirname + '/db/mystic');
const bgusers = new PouchDB(__dirname + '/db/bgusers');
const poparticles = new PouchDB(__dirname + '/db/poparticles');
module.exports = {
    mystbox: mystbox,
    bgusers: bgusers,
    poparticles: poparticles
}

bgusers.get('count', function (err, doc) {
    console.log(doc);

})