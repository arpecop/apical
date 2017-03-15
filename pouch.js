const PouchDB = require('pouchdb-node');

const mystic = new PouchDB('http://robco.herokuapp.com/mystic');
const users = new PouchDB('http://robco.herokuapp.com/bgusers');
const cookie = new PouchDB('http://robco.herokuapp.com/cookie');
const compliments = new PouchDB('http://robco.herokuapp.com/compliments');
module.exports = {
    mystic: mystic,
    users: users
}