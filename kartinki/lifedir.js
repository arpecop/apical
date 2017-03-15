//http://life.dir.bg/list_all.php 11111
var cheerio = require('cheerio');
var fs = require('fs');
var request = require('request');
var async = require('async');
var nano = require('nano')('http://db.arpecop.com/');
var alice = nano.db.use('images');
var cdn = nano.db.use('test');
var feedparser = require('feedparser');
var iconv = require('iconv-lite');
var md5 = require('MD5');
var _ = require('underscore');
var bind = require('bind');
var CronJob = require('cron').CronJob;


var token =
  'CAAJXyZCYDxocBACzo1pgmkoU0YROgDw4XVOBcCvJCuZBpvZAS31m6q8pZB9LZBgRpxFfxnmpwFD1WjGasptthsCtfRj2t0cRxJI1m053dPSPB1eO5YWDYTgGXxulKTvcgcDZAxRlmuhXPhezzq7OQbyHvFss5qqfLSCYH6g2TvzJT5ZBNcWNzZBKUBo3pCfgpW5USMXnZCbBk3Cwtw1SZBHWvP';



function particular(url) {
  request('http://life.dir.bg' + url, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      var $ = cheerio.load(body);

      var json = {};
      json.title = $('#leftClomn h1').text();
      json._id = url.replace('/news.php?id=', '');
      json.body = $('#leftClomn #articlebody').text().replace(
        /(?:\r\n|\r|\n)/g,
        '<br />');
      json.image = 'http://dariknews.bg/' + $('#imageLink img').attr('src')
        .replace('28_', '5e_');
      json.type = "lifedir";
      json.iztochnik = "life.dir.bg";
      json.date = "" + new Date() + "";

      if (json.image) {



        alice.insert(json, function(err, body, header) {



          fs.readFile('./pages.json', 'utf8', function(err, datax) {

            JSON.parse(datax).forEach(function(val, index) {
              console.log(val.id + ' ' + val.access_token);

              post.push({
                id: val.id,
                token: val.access_token,
                url: 'http://blog.izteglisi.com/' +
                  json._id + '/i'
              }, function(err) {

              });


            });

          });



        });
      }

    }
  });

}
///



var post = async.queue(function(task, callback) {


  request.post({
    url: 'https://graph.facebook.com/' + task.id + '/links/',
    form: {
      access_token: task.token,
      link: task.url
    }
  }, function(err, httpResponse, body) {
    console.log(body);
    callback();

  });


}, 3);


post.drain = function() {
  console.log('all items have been processed');
};



///////////////////////////////////////////////OTHER/////////////////////////////////////
function two() {
  request('http://dariknews.bg/category.php?category_id=8', function(error,
    response, body) {

    if (!error && response.statusCode == 200) {

      var $ = cheerio.load(body);

      $('.list li p a').each(function(i, elem) {
        var id = $(elem).attr("href");


        var docid = id.replace('/view_article.php?article_id=', '');

        alice.get(docid, function(err, doc) {

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
    'include_docs': 'true',
    'limit': '5'
  }, function(err, bodyzz) {


    var json = {};
    json.article = data;
    json.q1 = bodyzz;
    console.log(json);
    cdn.insert({
      'ok': 'ok'
    }, "" + json.article._id, function(err, datax) {
      if (!err) {



        var rev = datax.rev;

        bind.toFile('./template/interesno.html', json, function(data) {
          // body...
          var randomnumber = Math.floor(Math.random() * 11);
          var file = "./template/cache/" + randomnumber + ".html";
          fs.writeFile(file, data, function(err) {



            fs.readFile(file, function(err, data) {
              if (!err) {
                cdn.attachment.insert('' + json.article
                  ._id,
                  'i',
                  data,
                  'text/html', {
                    rev: rev
                  },
                  function(err, body) {
                    callback('ok');
                    console.log(err);
                  });
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

  var hurl = 'http://dariknews.bg/view_article.php?article_id=' + url;

  request({
    url: hurl,
    encoding: null
  }, function(
    error, response, body) {
    if (!error && response.statusCode == 200) {

      var bodyWithCorrectEncoding = iconv.decode(body, 'CP1251');


      var $ = cheerio.load(bodyWithCorrectEncoding);

      var json = {};
      json.title = $('.cbox h1').text();
      json._id = url;
      json.date = "" + new Date() + "";


      //	json.image = $('#imageLink img').attr('src').replace('28_', '5e_');
      json.type = "lifedir";
      json.iztochnik = "dariknews.bg";
      json.image = 'http://dariknews.bg/' + $('.article img').attr('src');
      var content = [];

      $('#textsize p').each(function(i, elem) {
        content.push($(this).text().replace(
          /(?:\r\n|\r|\n)/g,
          '<br />'));

      });


      json.body = content.join('<br>');


      upload(json, function(argument) {
        // body...

        if (json.image && json.title && json.body.length > 40) {
          alice.insert(json, function(err, body, header) {
            if (!err) {



              fs.readFile('./pages.json', 'utf8', function(err,
                datax) {

                JSON.parse(datax).reverse().forEach(function(
                  val,
                  index) {



                  post.push({
                    id: val.id,
                    token: val.access_token,
                    url: 'http://blog.izteglisi.com/' +
                      json._id + '/i'
                  }, function(err) {
                    console.log(
                      'finished processing bar');
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


///particular vesti.bg//////////////////////////////////////////////////
function three() {

  request('http://www.vesti.bg/razvlechenia/vsichki-statii', function(error,
    response, body) {
    if (!error && response.statusCode == 200) {

      var $ = cheerio.load(body);

      $('.content-left .articles-list').each(function(i, elem) {
        var id = $(elem).attr("href");


        var docid = md5(id);

        alice.get(docid, function(err, doc) {

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
    url: url,
    encoding: null
  }, function(
    error, response, body) {
    if (!error && response.statusCode == 200) {

      var bodyWithCorrectEncoding = iconv.decode(body, 'utf8');


      var $ = cheerio.load(bodyWithCorrectEncoding);

      var json = {};
      json.title = $('header hgroup h1').text();
      json._id = docid;
      json.date = "" + new Date() + "";



      json.type = "lifedir";
      json.iztochnik = "vesti.bg"
      json.image = $('.article-main-image img').attr('src');



      var content = [];
      $('.textfix p').each(function(i, elem) {
        content.push($(this).text().replace(
          /(?:\r\n|\r|\n)/g,
          '<br />'));

      });


      json.body = content.join('<br>');



      upload(json, function(argument) {
        if (json.image && json.title && json.body.length > 4) {
          alice.insert(json, function(err, body, header) {

            if (!err) {



              fs.readFile(__dirname + '/pages.json', 'utf8',
                function(
                  err,
                  datax) {

                  JSON.parse(datax).reverse().forEach(function(
                    val,
                    index) {
                    post.push({
                      id: val.id,
                      token: val.access_token,
                      url: 'http://blog.izteglisi.com/' +
                        json._id + '/i'
                    }, function(err) {
                      console.log(
                        'finished processing bar');
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



/// lifestyle actualno


function five() {
  request('http://today.actualno.com/', function(error,
    response, body) {
    if (!error && response.statusCode == 200) {


      var $ = cheerio.load(body);

      $('.news-title').each(
        function(i, elem) {

          var id = $(elem).attr("href");


          var docid = md5(id);

          alice.get(docid, function(err, doc) {

            if (err) {
              particular_actualno(id, docid);
            }
          });

        });

    }
  });
}
var querystring = require('querystring');

function particular_actualno(url, docid) {

  request({
    url: url,
    encoding: null
  }, function(
    error, response, body) {
    if (!error && response.statusCode == 200) {



      var $ = cheerio.load(body);

      var json = {};
      json.title = $('.article-page h1').text();
      json._id = docid;
      json.date = "" + new Date() + "";



      json.type = "lifedir";
      json.iztochnik = "actualno.com";
      json.image = $('#image_in_article').attr('src');
      //  upload(json, function(argument) {
      if (json.image && json.title) {
        var test = $("#news_body_content").text();
        //var test = $("#news_body_content").html().replace(/^\s*<!--|-->\s*$/g, '').replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi).replace(/<span\b[^<]*(?:(?!<\/span>)<[^<]*)*<\/span>/gi, '').replace(/<div\b[^<]*(?:(?!<\/div>)<[^<]*)*<\/div>/gi, '');
        var arr = [];
        var testx = test.split('\t');
        testx.forEach(function(val, index) {
          if (val.length > 125) {
            arr.push(val);

          }
        });
        json.body = arr.join('').replace(
          /(?:\r\n|\r|\n)/g,
          '<br />');


        upload(json, function() {

          alice.insert(json, function(err, body, header) {

            if (!err) {



              fs.readFile(__dirname + '/pages.json', 'utf8',
                function(
                  err,
                  datax) {

                  JSON.parse(datax).reverse().forEach(function(
                    val,
                    index) {
                    post.push({
                      id: val.id,
                      token: val.access_token,
                      url: 'http://blog.izteglisi.com/' +
                        json._id + '/i'
                    }, function(err) {
                      console.log(
                        'finished processing bar');
                    });


                  })

                });

            }

          });

        });

      }



    }
  })

}



var Twitter = require('twitter');

var get = require('get');



var client = new Twitter({
  consumer_key: 'qKU7MNibOSLDMh8dNuuUHqxoM',
  consumer_secret: 'pnqxTQ30YSIKf6oKlHQYi8CPeQCPGRjJH6RzkMjb00Hep0Fb53',
  access_token_key: '25739013-arGt6s00JzgkM5nRMkZgGw4TvFXRNjZW25MqHzFR9',
  access_token_secret: '5VAk3V6RTMnx174YD1DfMPwGXsZdIeXJBIfMt8Ur0TlQJ'
});



//var

var post_twitter = async.queue(function(task, callback) {
  var dl = get(task.image);
  var file = __dirname + '/cache/' + task.location + '.jpg';
  dl.toDisk(file, function(err, filename) {

    var data = require('fs').readFileSync(file);

    // Make post request on media endpoint. Pass file data as media parameter
    client.post('media/upload', {
      media: data
    }, function(error, media, response) {

      if (!error) {


        var status = {
          status: task.title + ' ' + task.text,
          media_ids: media.media_id_string
        };

        client.post('statuses/update', status, function(error,
          tweet,
          response) {
          if (!error) {
            console.log(tweet);
          }
        });

      }
    });
    callback();
  });

}, 1);


var q = async.queue(function(task, callback) {
  console.log('hello ' + task.name);
  var json = {};
  json._id = md5(task.name);
  json.date = "" + new Date() + "";
  json.type = "distractify";
  request('http://distractify.com/' + task.name, function(error,
    response, body) {
    if (!error && response.statusCode == 200) {


      $ = cheerio.load(body);

      json.title = $('header h1').text();
      json.images = [];

      $('.full-post_subpost').each(function(i, elem) {
        var jq = cheerio.load($(elem).html());


        var title = jq('h1').text();
        var image = jq('figure img').attr('src');
        if (image) {
          json.images[i] = {};
          json.images[i].title = title;
          json.images[i].text = jq('.post-text').text();
          json.images[i].image = jq('figure img').attr('src');
          json.images[i].location = i;
          var id = md5(json.images[i].image);

          db.insert({
            'ok': 'ok'
          }, id, function(err, doc) {
            //  console.log(doc);

            if (!err) {
              post_twitter.push(json.images[i]);
            }
          });
          //



        }

      });



      db.insert(json, function(err, doc) {
        //  console.log(doc);
      });


    }

    callback();
  });

}, 1);

//http://distractify.com/site/list/skip/0/limit/100


//new CronJob('*/5 * * * *', function() {

two();
three();

five();


//}, null, true, 'America/Los_Angeles');
