const PouchDB = require('pouchdb-node');

const mystbox = new PouchDB('./db/mystic');
const bgusers = new PouchDB('./db/bgusers');
const poparticles = new PouchDB('./db/poparticles');
module.exports = {
    mystbox: mystbox,
    bgusers: bgusers,
    poparticles: poparticles
}

poparticles.get('count', function (err, doc) {
    console.log(doc);

})