const levelup = require('levelup');
const leveldown = require('leveldown');
const localdb = levelup(leveldown('/tmp/fire'));
const admin = require('firebase-admin');
const serviceAccount = require(`${__dirname}/rudixfiredb.json`);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

async function ldbupdate(params) {
  return new Promise((resolve) => {
    localdb.put(params._id ? params._id : params, params._id ? JSON.stringify(params) : '{"exist":true}', () => {
      resolve({});
    });
  });
}

async function lget(params) {
  return new Promise((resolve) => {
    localdb.get(params._id ? params._id : params, (err, data) => {
      resolve(err ? { exists: false } : JSON.parse(data));
    });
  });
}

async function put(params, callback) {
  const local = await lget(params);
  const insert = await db.collection('objects').doc(params._id ? params._id : params).set(params._id ? params : {});
  callback({});
}

async function get(params, callback) {
  const check = await lget(params);

  const datax = await check.err ? db.collection('objects').doc(params._id ? params._id : params).get() : check;

  callback(datax.exists ? datax.data() : { err: 1 });
}


get('test', (data) => {
  console.log(data);
});
put({ _id: 'test122', empx: 15 }, (data) => {
  console.log('Done');
  console.log(data);
});


module.exports = { get, put };
