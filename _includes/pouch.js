const PouchDB = require('pouchdb-node');

const mystbox = new PouchDB('/app/_includes/db/mystic');
const bgusers = new PouchDB('/app/_includes/db/bgusers');
const poparticles = new PouchDB('/app/_includes/db/poparticles');
module.exports = {
    mystbox: mystbox,
    bgusers: bgusers,
    poparticles: poparticles
}

poparticles.get('count', function (err, doc) {
    console.log(doc);

})