const PouchDB = require('pouchdb');
const allusers = new PouchDB(__dirname + '/db/allusers');


function gimmethousend(db, callback) {
  allusers.get("0_" + db, function(err, count) {
    console.log("0_" + db);

    console.log(err || count);

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


