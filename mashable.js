const request = require('request');
const async = require('async');
const db = require('./kartinki/dbaws.js');
const cheerio = require('cheerio');
//const request = require('request');




function mashable(params, callback) {
    request.get('http://mashable.com/stories.json?hot_per_page=3&new_per_page=3&rising_per_page=3', function (er, ass, body) {
        if (!er && body.length > 200) {
            var arr = JSON.parse(body).new.concat(JSON.parse(body).hot).concat(JSON.parse(body).rising);
            var arr2 = [];
            async.eachSeries(arr, function (item, cb) {
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

                db.exist(json._id, function (err) {
                    if (err) {
                        db.put(json, function (err, ass) {
                            json.arr = true;
                            json.id = json._id;
                            json._id = 'poparticles';
                            db.put(json, function (err, ass) {
                                cb()
                            });
                        });
                    } else {
                        cb()
                    }
                })
            }, function (err, results) {
                callback()
            });
        } else {
            callback()
        }
    })
}

module.exports = {
    mashable: mashable
}