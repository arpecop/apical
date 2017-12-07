const levelup = require('levelup');
const leveldown = require('leveldown');

const localdb = levelup(leveldown('/tmp/fire'));

// const db = admin.firestore();
const db = require('nano')('https://pouch.nyc3.digitaloceanspaces.com/db/');
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  endpoint: new AWS.Endpoint('nyc3.digitaloceanspaces.com'),
  accessKeyId: process.env.s31,
  secretAccessKey: process.env.s32,
});
function getType(p) {
  if (Array.isArray(p)) return 'array';
  else if (typeof p === 'string') return 'string';
  else if (p != null && typeof p === 'object') return 'object';
  return 'other';
}

function ldbupdate(params) {
  return new Promise((resolve) => {
    localdb.put(
      params._id ? params._id : params,
      params._id ? JSON.stringify(Object.assign(params, {
        cached: true,
      })) : '{"cached":true}', () => {
        resolve({});
      },
    );
  });
}

async function lget(params) {
  return new Promise((resolve) => {
    localdb.get(params._id ? params._id : params, (err, data) => {
      resolve(err ? {
        exists: false,
      } : Object.assign(JSON.parse(data), {
        cached: true,
      }));
    });
  });
}

async function put(params, callback) {
  ldbupdate(params);
  const id = params._id ? params._id : params;
  s3.putObject({
    Body: (getType(params) === 'object') ? JSON.stringify(params) : params,
    Bucket: 'pouch',
    ACL: 'public-read',
    Key: `db/${id}`,
    ContentType: 'application/json',
  }, (err, data) => {
    callback(data);
  });
}

async function get(params, callback) {
  const check = await lget(params);
  if (check.cached) {
    callback(check);
  } else {
    db.get(params._id ? params._id : params, (err, data) => {
      callback(err ? { err: '1' } : data);
    });
  }
}

// get('test1', (data) => {});
// put({ _id: 'test' }, () => {});

module.exports = { get, put };
