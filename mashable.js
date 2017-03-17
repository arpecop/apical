const request = require('request');
const async = require('async');
const db = require('./kartinki/dbaws.js');
const cheerio = require('cheerio');
var Feed = require('rss-to-json');
//const request = require('request');
const promo = require('./_includes/promo.js');
const striptags = require('striptags');


function insertdb(json, callback) {
    db.exist(json._id, function (err) {
        if (err) {
            promo.post('poparticles/' + json._id, process.env.article_token, json.title, 'poparticles', function () {
                db.put(json, function (err, ass) {
                    json.arr = true;
                    json.id = json._id;
                    json._id = 'poparticles';
                    db.put(json, function (err, ass) {
                        callback()
                    });
                });
            });
        } else {
            callback()
        }
    })
}


function mashable(params, callback) {
    request.get('http://mashable.com/stories.json?hot_per_page=3&new_per_page=3&rising_per_page=3', function (er, ass, body) {
        if (!er && body.length > 200) {
            var arr = JSON.parse(body).new.concat(JSON.parse(body).hot).concat(JSON.parse(body).rising);
            var arr2 = [];
            async.eachSeries(arr, function (item, cb) {

                var json = item;
                json.fullimg = decodeURIComponent(item.image.split('/')[6]);
                json.provider = 'mashable';
                json._id = json.short_url.replace('http://on.mash.to/', '');
                json.responsive_images = null;
                json.velocity = null;
                json.shares = null;
                json.shortcode_data = null;
                json.source = json.short_url;
                json.description = json.content.plain;
                json.content = null;
                arr2.push(json);

                insertdb(json, function () {
                    cb();
                })
            }, function (err, results) {
                callback()
            });
        } else {
            callback()
        }
    })
}



function digg(x, callback) {
    //http://digg.com/api/news/popular.json?count=10
    request.get('http://digg.com/api/news/popular.json?count=10', function (er, ass, body) {
        if (!er && body.length > 200) {
            var arr = JSON.parse(body).data.feed;
            async.eachSeries(arr, function (item, cb) {

                let json = item.content;
                json.fullimg = json.media.images[0].original_url;
                json.provider = 'mashable';
                json.tags = null;
                json.media = null;
                json.source = json.url;
                json._id = json.content_id;
                insertdb(json, function () {
                    cb();
                })

            }, function (err, results) {
                callback()
            });


        } else {
            callback();
        }
    });
}

function wired(id, callback) {

    Feed.load('https://www.wired.com/feed/', function (err, rss) {

        async.eachSeries(rss.items, function (item, cb) {
            let json = item;
            json.fullimg = item.description.split('<img src="')[1].split('"')[0];
            json.provider = 'wired';
            json.source = json.url;
            json.description = striptags(item.description)
            json._id = json.created + '_1';
            insertdb(json, function () {
                cb();
            })


        }, function (err, results) {
            callback()
        });
    });
}

function crunch(id, callback) {

    Feed.load('http://feeds.feedburner.com/TechCrunch/', function (err, rss) {

        async.eachSeries(rss.items, function (item, cb) {
            let json = item;
            json.fullimg = item.media.thumbnail[0].url[0].split('?')[0];
            json.provider = 'TechCrunch';
            json.source = json.url;
            json.description = striptags(item.description).replace('Read More', '')
            json._id = json.created + '_t';
            insertdb(json, function () {
                cb();
            })


        }, function (err, results) {
            callback()
        });

    })

}

if (!process.env.PORT) {
    crunch('1', function () {})
}

module.exports = {
    mashable: mashable,
    digg: digg,
    wired: wired,
    crunch: crunch
}