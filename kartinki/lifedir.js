// http://life.dir.bg/list_all.php 11111
const cheerio = require('cheerio');
const fs = require('fs');
const request = require('request');
const async = require('async');
const nano = require('nano')('http://db.arpecop.com/');
const alice = nano.db.use('images');
const cdn = nano.db.use('test');
const feedparser = require('feedparser');
const iconv = require('iconv-lite');
const md5 = require('MD5');
const _ = require('underscore');
const bind = require('bind');
const CronJob = require('cron').CronJob;


const token =
  'CAAJXyZCYDxocBACzo1pgmkoU0YROgDw4XVOBcCvJCuZBpvZAS31m6q8pZB9LZBgRpxFfxnmpwFD1WjGasptthsCtfRj2t0cRxJI1m053dPSPB1eO5YWDYTgGXxulKTvcgcDZAxRlmuhXPhezzq7OQbyHvFss5qqfLSCYH6g2TvzJT5ZBNcWNzZBKUBo3pCfgpW5USMXnZCbBk3Cwtw1SZBHWvP';


function particular(url) {
  request(`http://life.dir.bg${url}`, (error, response, body) => {
    if (!error && response.statusCode == 200) {
      const $ = cheerio.load(body);

      const json = {};
      json.title = $('#leftClomn h1').text();
      json._id = url.replace('/news.php?id=', '');
      json.body = $('#leftClomn #articlebody').text().replace(
        /(?:\r\n|\r|\n)/g,
        '<br />'
      );
      json.image = `http://dariknews.bg/${$('#imageLink img').attr('src')
        .replace('28_', '5e_')}`;
      json.type = 'lifedir';
      json.iztochnik = 'life.dir.bg';
      json.date = `${new Date()}`;

      if (json.image) {
        alice.insert(json, (err, body, header) => {
          fs.readFile('./pages.json', 'utf8', (err, datax) => {
            JSON.parse(datax).forEach((val, index) => {
              console.log(`${val.id} ${val.access_token}`);

              post.push({
                id: val.id,
                token: val.access_token,
                url: `http://blog.izteglisi.com/${
                  json._id}/i`,
              }, (err) => {

              });
            });
          });
        });
      }
    }
  });
}
// /


var post = async.queue((task, callback) => {
  request.post({
    url: `https://graph.facebook.com/${task.id}/links/`,
    form: {
      access_token: task.token,
      link: task.url,
    },
  }, (err, httpResponse, body) => {
    console.log(body);
    callback();
  });
}, 3);


post.drain = function () {
  console.log('all items have been processed');
};


// /////////////////////////////////////////////OTHER/////////////////////////////////////
function two() {
  request('http://dariknews.bg/category.php?category_id=8', (
    error,
    response, body
  ) => {
    if (!error && response.statusCode == 200) {
      const $ = cheerio.load(body);

      $('.list li p a').each((i, elem) => {
        const id = $(elem).attr('href');


        const docid = id.replace('/view_article.php?article_id=', '');

        alice.get(docid, (err, doc) => {
          if (!err) {
            particular_darik(docid);
          }
        });
      });
    }
  });
}


function upload(data, callback) {
  alice.view('items', 'dirlife', {
    include_docs: 'true',
    limit: '5',
  }, (err, bodyzz) => {
    const json = {};
    json.article = data;
    json.q1 = bodyzz;
    console.log(json);
    cdn.insert({
      ok: 'ok',
    }, `${json.article._id}`, (err, datax) => {
      if (!err) {
        const rev = datax.rev;

        bind.toFile('./template/interesno.html', json, (data) => {
          // body...
          const randomnumber = Math.floor(Math.random() * 11);
          const file = `./template/cache/${randomnumber}.html`;
          fs.writeFile(file, data, (err) => {
            fs.readFile(file, (err, data) => {
              if (!err) {
                cdn.attachment.insert(
                  `${json.article
                    ._id}`,
                  'i',
                  data,
                  'text/html', {
                    rev,
                  },
                  (err, body) => {
                    callback('ok');
                    console.log(err);
                  }
                );
              }
            });
          });
        });
      } else {
        callback('ok');
      }
    });
  });
}


function particular_darik(url) {
  const hurl = `http://dariknews.bg/view_article.php?article_id=${url}`;

  request({
    url: hurl,
    encoding: null,
  }, (error, response, body) => {
    if (!error && response.statusCode == 200) {
      const bodyWithCorrectEncoding = iconv.decode(body, 'CP1251');


      const $ = cheerio.load(bodyWithCorrectEncoding);

      const json = {};
      json.title = $('.cbox h1').text();
      json._id = url;
      json.date = `${new Date()}`;


      //	json.image = $('#imageLink img').attr('src').replace('28_', '5e_');
      json.type = 'lifedir';
      json.iztochnik = 'dariknews.bg';
      json.image = `http://dariknews.bg/${$('.article img').attr('src')}`;
      const content = [];

      $('#textsize p').each(function (i, elem) {
        content.push($(this).text().replace(
          /(?:\r\n|\r|\n)/g,
          '<br />'
        ));
      });


      json.body = content.join('<br>');


      upload(json, (argument) => {
        // body...

        if (json.image && json.title && json.body.length > 40) {
          alice.insert(json, (err, body, header) => {
            if (!err) {
              fs.readFile('./pages.json', 'utf8', (
                err,
                datax
              ) => {
                JSON.parse(datax).reverse().forEach((
                  val,
                  index
                ) => {
                  post.push({
                    id: val.id,
                    token: val.access_token,
                    url: `http://blog.izteglisi.com/${
                      json._id}/i`,
                  }, (err) => {
                    console.log('finished processing bar');
                  });
                });
              });
            }
          });
        }
      });
    }
  });
}


// /particular vesti.bg//////////////////////////////////////////////////
function three() {
  request('http://www.vesti.bg/razvlechenia/vsichki-statii', (
    error,
    response, body
  ) => {
    if (!error && response.statusCode == 200) {
      const $ = cheerio.load(body);

      $('.content-left .articles-list').each((i, elem) => {
        const id = $(elem).attr('href');


        const docid = md5(id);

        alice.get(docid, (err, doc) => {
          if (err) {
            particular_vesti(id, docid);
          }
        });
      });
    }
  });
}


function particular_vesti(url, docid) {
  request({
    url,
    encoding: null,
  }, (error, response, body) => {
    if (!error && response.statusCode == 200) {
      const bodyWithCorrectEncoding = iconv.decode(body, 'utf8');


      const $ = cheerio.load(bodyWithCorrectEncoding);

      const json = {};
      json.title = $('header hgroup h1').text();
      json._id = docid;
      json.date = `${new Date()}`;


      json.type = 'lifedir';
      json.iztochnik = 'vesti.bg';
      json.image = $('.article-main-image img').attr('src');


      const content = [];
      $('.textfix p').each(function (i, elem) {
        content.push($(this).text().replace(
          /(?:\r\n|\r|\n)/g,
          '<br />'
        ));
      });


      json.body = content.join('<br>');


      upload(json, (argument) => {
        if (json.image && json.title && json.body.length > 4) {
          alice.insert(json, (err, body, header) => {
            if (!err) {
              fs.readFile(
                `${__dirname}/pages.json`, 'utf8',
                (
                  err,
                  datax
                ) => {
                  JSON.parse(datax).reverse().forEach((
                    val,
                    index
                  ) => {
                    post.push({
                      id: val.id,
                      token: val.access_token,
                      url: `http://blog.izteglisi.com/${
                        json._id}/i`,
                    }, (err) => {
                      console.log('finished processing bar');
                    });
                  });
                }
              );
            }
          });
        }
      });
    }
  });
}


// / lifestyle actualno


function five() {
  request('http://today.actualno.com/', (
    error,
    response, body
  ) => {
    if (!error && response.statusCode == 200) {
      const $ = cheerio.load(body);

      $('.news-title').each((i, elem) => {
        const id = $(elem).attr('href');


        const docid = md5(id);

        alice.get(docid, (err, doc) => {
          if (err) {
            particular_actualno(id, docid);
          }
        });
      });
    }
  });
}
const querystring = require('querystring');

function particular_actualno(url, docid) {
  request({
    url,
    encoding: null,
  }, (error, response, body) => {
    if (!error && response.statusCode == 200) {
      const $ = cheerio.load(body);

      const json = {};
      json.title = $('.article-page h1').text();
      json._id = docid;
      json.date = `${new Date()}`;


      json.type = 'lifedir';
      json.iztochnik = 'actualno.com';
      json.image = $('#image_in_article').attr('src');
      //  upload(json, function(argument) {
      if (json.image && json.title) {
        const test = $('#news_body_content').text();
        // var test = $("#news_body_content").html().replace(/^\s*<!--|-->\s*$/g, '').replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi).replace(/<span\b[^<]*(?:(?!<\/span>)<[^<]*)*<\/span>/gi, '').replace(/<div\b[^<]*(?:(?!<\/div>)<[^<]*)*<\/div>/gi, '');
        const arr = [];
        const testx = test.split('\t');
        testx.forEach((val, index) => {
          if (val.length > 125) {
            arr.push(val);
          }
        });
        json.body = arr.join('').replace(
          /(?:\r\n|\r|\n)/g,
          '<br />'
        );


        upload(json, () => {
          alice.insert(json, (err, body, header) => {
            if (!err) {
              fs.readFile(
                `${__dirname}/pages.json`, 'utf8',
                (
                  err,
                  datax
                ) => {
                  JSON.parse(datax).reverse().forEach((
                    val,
                    index
                  ) => {
                    post.push({
                      id: val.id,
                      token: val.access_token,
                      url: `http://blog.izteglisi.com/${
                        json._id}/i`,
                    }, (err) => {
                      console.log('finished processing bar');
                    });
                  });
                }
              );
            }
          });
        });
      }
    }
  });
}


const Twitter = require('twitter');

const get = require('get');


const client = new Twitter({
  consumer_key: 'qKU7MNibOSLDMh8dNuuUHqxoM',
  consumer_secret: 'pnqxTQ30YSIKf6oKlHQYi8CPeQCPGRjJH6RzkMjb00Hep0Fb53',
  access_token_key: '25739013-arGt6s00JzgkM5nRMkZgGw4TvFXRNjZW25MqHzFR9',
  access_token_secret: '5VAk3V6RTMnx174YD1DfMPwGXsZdIeXJBIfMt8Ur0TlQJ',
});


// var

const post_twitter = async.queue((task, callback) => {
  const dl = get(task.image);
  const file = `${__dirname}/cache/${task.location}.jpg`;
  dl.toDisk(file, (err, filename) => {
    const data = require('fs').readFileSync(file);

    // Make post request on media endpoint. Pass file data as media parameter
    client.post('media/upload', {
      media: data,
    }, (error, media, response) => {
      if (!error) {
        const status = {
          status: `${task.title} ${task.text}`,
          media_ids: media.media_id_string,
        };

        client.post('statuses/update', status, (
          error,
          tweet,
          response
        ) => {
          if (!error) {
            console.log(tweet);
          }
        });
      }
    });
    callback();
  });
}, 1);


const q = async.queue((task, callback) => {
  console.log(`hello ${task.name}`);
  const json = {};
  json._id = md5(task.name);
  json.date = `${new Date()}`;
  json.type = 'distractify';
  request(`http://distractify.com/${task.name}`, (
    error,
    response, body
  ) => {
    if (!error && response.statusCode == 200) {
      $ = cheerio.load(body);

      json.title = $('header h1').text();
      json.images = [];

      $('.full-post_subpost').each((i, elem) => {
        const jq = cheerio.load($(elem).html());


        const title = jq('h1').text();
        const image = jq('figure img').attr('src');
        if (image) {
          json.images[i] = {};
          json.images[i].title = title;
          json.images[i].text = jq('.post-text').text();
          json.images[i].image = jq('figure img').attr('src');
          json.images[i].location = i;
          const id = md5(json.images[i].image);

          db.insert({
            ok: 'ok',
          }, id, (err, doc) => {
            //  console.log(doc);

            if (!err) {
              post_twitter.push(json.images[i]);
            }
          });
          //
        }
      });


      db.insert(json, (err, doc) => {
        //  console.log(doc);
      });
    }

    callback();
  });
}, 1);

// http://distractify.com/site/list/skip/0/limit/100


// new CronJob('*/5 * * * *', function() {

two();
three();

five();


// }, null, true, 'America/Los_Angeles');
