/* eslint-disable func-style */
const firedb = require('./_includes/firedb.js');
const md5 = require('md5');
const request = require('request');
const async = require('async');
const Twitter = require('twitter');
let client = new Twitter({
  consumer_key: 'ik6JO8L37WQfYOBY9SpoY8cLc',
  consumer_secret: '66H24oIuWJRCnFU6wa5xglK21Oqvk50IzmZ0hPZkNzEIAwkz8O',
  access_token_key: '1168401004502626305-yLI495CnaWUEvX3qS2yscfhdGxAddd',
  access_token_secret: 'Rh1qdX5DNoEhfW4bRzl4TaOD8ohIlIFcbR5JY3fYtCxdx',
});

const getApi = async url => {
  return new Promise((resolve, reject) => {
    const d = new Date();
    const d1 = d.getDay() + '' + d.getHours() + '' + d.getMinutes();
    const id = md5(url + '' + d1);
    firedb.get(id, e => {
      if (e.err) {
        request.get(url, (e, x, body) => {
          firedb.put({ _id: id, content: JSON.parse(body) }, () => {
            resolve(JSON.parse(body));
          });
        });
      } else {
        resolve(e.content);
      }
    });
  });
};
async function go() {
  const content = await getApi(
    'https://newsapi.org/v2/everything?q=a&sortBy=publishedAt&apiKey=d734ebaa11aa4ad0b2df9e074d202869'
  );
  const content2 = await getApi(
    'https://newsapi.org/v2/everything?q=to&sortBy=publishedAt&apiKey=d734ebaa11aa4ad0b2df9e074d202869'
  );
  const combined = [...content.articles, ...content2.articles];
  return new Promise((resolve, reject) => {
    async.eachSeries(
      combined,
      function(file, callback) {
        console.log(file);
        client
          .post('statuses/update', {
            status: file.url + '' + file.title,
          })
          .then(function(tweet) {
            callback();
            console.log(tweet);
          })
          .catch(function(error) {
            callback();
          });
      },
      function(err) {
        resolve({ ok: 1 });
      }
    );
  });
}

function news(x, callback) {
  go().then(data => {
    console.log(data);
    callback();
  });
}
module.exports = { news };
