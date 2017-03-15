const request = require('request');
const async = require('async');
const db = require('./kartinki/dbaws.js');
const cheerio = require('cheerio');
//const request = require('request');



var app_token = '128280664728|3cdgcR4hHIeXxqVqqggOqFWuzcs'; //mystic box
var template = 'over 30 👍 on this picture';

function post_promo(url, callback) {
    let arr = [];
    pouch.mystic.get('count', function (e, count) {
        let rd = Math.floor(Math.random() * count.count) + 0;
        pouch.mystic.get('' + rd + '', function (err, docs) {
            async.eachSeries(docs.docs, function (fr, cb) {
                arr.push({
                    "method": "POST",
                    "relative_url": fr.id + "/notifications?href=" + url + "&template=" + template
                });
                arr.push({
                    "method": "POST",
                    "relative_url": fr.id + "/apprequests?href=" + url + "&message=" + template
                });
                cb();
            }, function done() {
                callback();
                if (process.env['PORT']) {
                    arr.chunk(50).forEach(function (chunk) {
                        request.post({
                            url: 'https://graph.facebook.com/',
                            form: {
                                access_token: app_token,
                                batch: JSON.stringify(chunk)
                            }
                        }, function (err, httpResponse, body) {
                            console.log(JSON.parse(body).length + 'ен posts');

                        });
                    });
                } else {
                    console.log(arr);
                    console.log('posting en posts on localhost');


                }
            });

        });
    });
}


function mashable(params, callback) {
    request.get('http://mashable.com/stories.json?hot_per_page=3&new_per_page=3&rising_per_page=3', function (er, ass, body) {
        if (!er && body.length > 200) {
            var arr = JSON.parse(body).new.concat(JSON.parse(body).hot).concat(JSON.parse(body).rising);
            var arr2 = [];
            async.eachSeries(arr, function (item, callback) {
                console.log(decodeURIComponent(item.image.split('/')[6]));
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
                console.log(json._id);
                db.exist(json._id, function (err) {
                    if (err) {
                        db.put(json, function (err, ass) {
                            json.arr = true;
                            json.id = json._id;
                            json._id = 'poparticles';
                            db.put(json, function (err, ass) {
                                callback()
                            });
                        });
                    } else {
                        console.log('exist');
                        callback()
                    }
                })
            }, function (err, results) {

            });
        } else {
            callback()
        }
    })
}

module.exports = {
    mashable: mashable
}