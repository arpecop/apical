
const PouchDB = require('pouchdb');
//var levelup = require('levelup')

const allusers = new PouchDB(__dirname + '/db/allusers');
//const mystbox = new PouchDB(__dirname + '/db/mystic');
//const bgusers = new PouchDB(__dirname + '/db/bgusers');
//const poparticles = new PouchDB(__dirname + '/db/poparticles');

//var db = levelup(__dirname + '/db/allusers')



function gimmethousend(db, callback) {
  allusers.get("0_" + db, function(err, count) {

    let rd = Math.floor(Math.random() * count.total) + 0;
    allusers.get(db + '_' + rd, function(err, chunk) {

      callback(chunk.users)
    });
  })


}


//gimmethousend('bgusers', function(data) {})


module.exports = {
  gimmethousend: gimmethousend
}


