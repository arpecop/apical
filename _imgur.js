const request = require('request');
const async = require('async');
const db = require('nano')('http://1:1@pouchdb.herokuapp.com/chetiva');
//59e95f4c71c614f884edc79df5e05a92eecbd3ac
const Twitter = require('twitter');

let client = new Twitter({
  consumer_key: 'ik6JO8L37WQfYOBY9SpoY8cLc',
  consumer_secret: '66H24oIuWJRCnFU6wa5xglK21Oqvk50IzmZ0hPZkNzEIAwkz8O',
  access_token_key: '1168401004502626305-yLI495CnaWUEvX3qS2yscfhdGxAddd',
  access_token_secret: 'Rh1qdX5DNoEhfW4bRzl4TaOD8ohIlIFcbR5JY3fYtCxdx',
});

function imgur(x, callback) {
  request(
    {
      url: 'https://api.imgur.com/3/gallery/hot/time/day/0',
      headers: {
        Authorization: 'Client-ID 04e2c49522b2562',
      },
    },
    (e, r, body) => {
      async.eachSeries(
        JSON.parse(body).data,
        function(file, callback) {
          if (file.images) {
            if (file.images[0].type === 'image/jpeg') {
              const tags = file.tags.map(item => item.name).join(' #');
              db.insert(
                {
                  _id: file.images[0].id + '1',
                  type: 'imgur',
                  image: file.images[0].link,
                  tags: file.tags.map(item => item.name),
                  title: tags,
                },
                function(e) {
                  if (!e) {
                    client
                      .post('statuses/update', {
                        status: '#' + tags + ' http://couched.herokuapp.com/chetiva/' + file.images[0].id + '1',
                      })
                      .then(function(tweet) {
                        callback();
                        console.log(tweet);
                      })
                      .catch(function(error) {
                        console.log(error);
                        callback();
                      });
                  } else {
                    callback();
                  }
                },
              );
            } else {
              callback();
            }
            //.link
          } else {
            callback();
          }
        },
        function(err) {
          // if any of the file processing produced an error, err would equal that error
        },
      );
    },
  );
}
module.exports = { imgur };
if (!process.env.PORT) {
  imgur();
}
