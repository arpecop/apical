/* eslint-disable func-style */
const request = require('request');
const async = require('async');
const cheerio = require('cheerio');
const firedb = require('./_includes/firedb.js');
const db = require('nano')('http://1:1@pouchdb.herokuapp.com/chetiva');
const downloadnprocess = require('./_includes/downloadandprocess.js');
const Twitter = require('twitter');

let client = new Twitter({
  consumer_key: 'ik6JO8L37WQfYOBY9SpoY8cLc',
  consumer_secret: '66H24oIuWJRCnFU6wa5xglK21Oqvk50IzmZ0hPZkNzEIAwkz8O',
  access_token_key: '1168401004502626305-yLI495CnaWUEvX3qS2yscfhdGxAddd',
  access_token_secret: 'Rh1qdX5DNoEhfW4bRzl4TaOD8ohIlIFcbR5JY3fYtCxdx',
});

// eslint-disable-next-line func-style
function programm(x, callback) {
  request('http://pr0gramm.com/api/items/get?flags=1', (error, response, body) => {
    if (!error && response.statusCode == 200) {
      const json = JSON.parse(body);
      let i = 0;
      async.each(
        json.items,
        (item, callbackx) => {
          item.location = i++;
          const checkmedia = item.image.split('.');
          if (checkmedia[1] === 'jpg') {
            firedb.get(item.id, d => {
              if (d.err) {
                firedb.put(`${process.env.PORT ? item.id : new Date().getTime().toString()}`, () => {
                  request('https://pr0gramm.com/api/items/info?itemId=' + item.id, (error, response, body) => {
                    if (!error && response.statusCode == 200) {
                      const _id = new Date().getTime().toString();
                      const title = `#${JSON.parse(body)
                        .tags.map(item => item.tag.replace(/ /g, ''))
                        .join(' #')}`;
                      db.insert(
                        {
                          _id,
                          type: 'pr0',
                          image: `http://img.pr0gramm.com/${item.image}`,
                          tags: JSON.parse(body),
                          title,
                        },
                        function() {
                          client
                            .post('statuses/update', {
                              status: title + ' http://couched.herokuapp.com/chetiva/' + _id,
                            })
                            .then(function(tweet) {
                              callbackx();
                              console.log(tweet);
                            })
                            .catch(function(error) {
                              console.log(error);
                              callbackx();
                            });
                        }
                      );
                    } else {
                      callbackx();
                    }
                  });
                });
              } else {
                callbackx();
              }
            }); // dsds
          } else {
            callbackx();
          }
        },
        () => {
          callback();
        }
      );
    }
  });
}

function imgur(params, callback) {
  request.get(`http://imgur.com/${params}`, (_err, _d, body) => {
    const $ = cheerio.load(body);
    const arr = [];
    $('.cards .post a').each(function() {
      arr.push(
        $(this)
          .attr('href')
          .replace('/gallery/', '')
      );
    });

    async.each(
      arr,
      (item, cb) => {
        firedb.get(`${item}-ur`, doc => {
          if (doc.err) {
            firedb.put(`${item}-ur`, () => {
              request.get(`http://imgur.com/gallery/${item}`, (_e, _r, body) => {
                const $ = cheerio.load(body);
                const img = $('link[rel="image_src"]').attr('href');
                if (img) {
                  downloadnprocess.go(img, () => {
                    cb();
                  });
                } else {
                  cb();
                }
              });
            });
          } else {
            cb();
          }
        });
      },
      () => {
        callback();
      }
    );
  });
}

if (!process.env.PORT) {
  imgur('fresh', function() {});
}

module.exports = {
  programm,
  imgur,
};
