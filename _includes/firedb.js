const levelup = require('levelup');
const leveldown = require('leveldown');
const localdb = levelup(leveldown('/tmp/fire'));
const admin = require('firebase-admin');
const serviceAccount = require(`${__dirname}/rudixfiredb.json`);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

function ldbupdate(params) {
  return new Promise((resolve) => {
    localdb.put(
      params._id ? params._id : params,
      params._id ? JSON.stringify(Object.assign(params, { cached: true })) : '{"cached":true}', () => {
        resolve({});
      }
    );
  });
}

async function lget(params) {
  return new Promise((resolve) => {
    localdb.get(params._id ? params._id : params, (err, data) => {
      resolve(err ? { exists: false } : Object.assign(JSON.parse(data), { cached: true }));
    });
  });
}

async function put(params, callback) {
  ldbupdate(params);

  const insert = await db.collection('objects').doc(params._id ? params._id : params).set(params._id ? params : {});
  console.log(insert);


  callback(insert);
}

async function get(params, callback) {
  const check = await lget(params);
  if (check.cached) {
    callback(check);
  } else {
    const datax = await db.collection('objects').doc(params._id ? params._id : params).get();
    datax.exists ? ldbupdate(Object.assign(datax.data(), { _id: params._id ? params._id : params })) : '';
    callback(datax.exists ? datax.data() : { err: 1 });
  }
}


module.exports = { get, put };
