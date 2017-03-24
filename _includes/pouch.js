const PouchDB = require('pouchdb-node');

const mystbox = new PouchDB('http://robco.herokuapp.com/mystic');
const bgusers = new PouchDB('http://robco.herokuapp.com/bgusers');
const poparticles = new PouchDB('http://robco.herokuapp.com/poparticles');
const db = new PouchDB('http://db.arpecop.com/db');

module.exports = {
    mystbox: mystbox,
    bgusers: bgusers,
    poparticles: poparticles
}