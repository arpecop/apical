const db = require('./_includes/dbaws.js');
const request = require('request');
const async = require('async');
const cheerio = require('cheerio');
const jsonizehtml = require('html2json').html2json;

const fix_tweets_html = function (html) {
  console.log(html);

  arr = html.split('<ul');
  console.log(arr.length);

  console.log(jsonizehtml(`<ul ${arr[1]}`).child);

  return new Promise((resolve, reject) => {
    resolve('ok');
  });
};
// http://maps.googleapis.com/maps/api/geocode/json?address=dobrich&sensor=false
const get_tl = function (user) {
  return new Promise((resolve, reject) => {
    request.get(
      `https://twitter.com/i/profiles/show/${user}/timeline/tweets?include_available_features=1&include_entities=1&oldest_unread_id=0&reset_error_state=false&limit=1`,
      (err, res, data) => {
        if (res.statusCode !== 200 || data[0] == '<') {
          reject({ status: res.statusCode, reason: 'user not exist' });
        } else {
          fix_tweets_html(JSON.parse(data).items_html).then((data) => {
            console.log(data);
          });
          resolve(Object.assign({ status: res.statusCode }, JSON.parse(data)));
        }
      },
    );
  });
};

const get_timeline = new Promise((resolve, reject) => {
  get_tl('Telco2011')
    .then((data) => {
      resolve(data);
    })
    .catch((reason) => {
      console.log(reason);
    });

  // successMessage is whatever we passed in the resolve(...) function above.
  // It doesn't have to be a string, but if it is only a succeed message, it probably will be.
}).catch((reason) => {
  console.log(`r2${reason}`);
});

get_timeline.then((data) => {
  console.log('done');
});
