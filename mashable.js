const request = require('request');
const async = require('async');
const db = require('./_includes/dbaws.js');
const cheerio = require('cheerio');
var Feed = require('rss-to-json');
//const request = require('request');
const promo = require('./_includes/promo.js');
const striptags = require('striptags');

const pintetez = require('node-pinterest');
const pinterest = pintetez.init('AT3u7ZwNxWQpVASg6-MmSf6l8y56FLrVnW7SARtD-s__umBBdgAAAAA');



function post_pinterest(json, callback) {
    pinterest.api('pins', {
        method: 'POST',
        body: {
            board: '195554877508708250', // grab the first board from the previous response
            note: json.title,
            link: 'http://news.fbook.space/' + json.id,
            image_url: json.fullimg
        }
    }).then(function (jsonx) {
        request.get('https://developers.pinterest.com/widget/pins/' + jsonx.data.id + '/', function (err, ser, body) {
            if (!err && JSON.parse(body).data) {
                callback({
                    url: JSON.parse(body).data.image.original.url.replace('originals', '236x'),
                    url_big: JSON.parse(body).data.image.original.url,
                })
            } else {
                callback({})
            }
        })
    });
}


function insertdb(json, callback) {
    json.type = 'newsen'
    json.arr = true;
    db.exist(json.uid, function (err) {
        if (err) {
            db.put({
                _id: json.uid
            }, function () {
                db.put(json, function (err, ass) {
                    post_pinterest(json, function () {
                        promo.post(ass.id, process.env.article_token, json.title, 'poparticles', function () {
                            //'http://news.fbook.space/' + ass.id
                        });
                    })
                });
            })
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
                json.uid = json.content_id;

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


function crunch(id, callback) {
    Feed.load('http://feeds.feedburner.com/TechCrunch/', function (err, rss) {
        async.eachSeries(rss.items, function (item, cb) {
            let json = item;
            json.fullimg = item.media.thumbnail ? item.media.thumbnail[0].url[0].split('?')[0] : 'https://tctechcrunch2011.files.wordpress.com/2017/03/tc-equity-podcast-ios.jpg';
            json.provider = 'TechCrunch';
            json.source = json.url;
            json.media = null;
            json.description = striptags(item.description).replace('Read More', '')
            json.uid = json.created + '_t';
            insertdb(json, function () {
                cb();
            })


        }, function (err, results) {
            callback()
        });

    })

}


function upworthy(id, callback) {
    Feed.load('http://feeds.feedburner.com/upworthy', function (err, rss) {
        async.eachSeries(rss.items, function (item, cb) {
            let json = item;
            json.fullimg = item.enclosures ? item.enclosures[0].url.split('?')[0] : 'https://www.upworthy.com/assets/social-eyecatcher-orange-0a6d6dca485d6e1c339cae4cfc777544.png';
            json.provider = 'upworthy';
            json.source = json.url;
            json.enclosures = null;
            json.description = striptags(item.description);
            json.uid = json.created + '_u';

            insertdb(json, function () {
                cb();
            })

        },
            function (err, results) {
                callback()
            });

    })

}


function distractify(x, callback) {
    request.get('http://distractify.com/api/0.1/channels/slug/trending/resources/latest/1/10', function (er, ass, body) {
        if (!er && body.length > 200) {

            async.eachSeries(JSON.parse(body).pkg.resources[0][1], function (item, cb) {
                //console.log(item);
                var json = {};
                json.title = item.title;
                json.description = item.facebookDesc
                json.provider = "Distractify";
                json.fullimg = item.featuredImage.originalFileUrl;
                json.source = 'http://distractify.com' + item.permalink;
                json.uid = item.sid;
                insertdb(json, function () {
                    cb();
                })



            },
                function (err, results) {
                    callback()
                });

        } else {
            callback();
        }
    })
}


//boingboing.net/feed

function boing(id, callback) {
    Feed.load('http://boingboing.net/feed', function (err, rss) {
        async.eachSeries(rss.items, function (item, cb) {

            let json = item;
            json.fullimg = item.description.split('src="')[1].split('"')[0];
            json.provider = 'BoingBoing';
            json.source = json.url;

            json.description = striptags(item.description);
            json.uid = json.created + '_b';
            //console.log(json);
            insertdb(json, function () {
                cb();
            })

        },
            function (err, results) {
                callback()
            });

    })

}



function buzz(x, callback) {
    request.get('https://www.buzzfeed.com/site-component/v1/en-us/morebuzz?page_size=5&page=1', function (er, ass, body) {
        if (!er && body.length > 100) {

            async.eachSeries(JSON.parse(body).results, function (item, cb) {
                //console.log(item);
                var json = {};
                json.title = item.name;
                json.provider = "Buzzfeed";
                json.source = 'https://www.buzzfeed.com' + item.url;
                json.fullimg = item.image;
                json.uid = item.id + '_buzz';
                db.get(json.uid, function (err, doc) {
                    if (err) {
                        request.get('https://graph.facebook.com/?id=' + json.source + '&access_token=' + process.env.article_token, function (er, ass, body) {
                            json.description = JSON.parse(body).og_object.description;

                            insertdb(json, function () {
                                cb();
                            })
                        });
                    } else {

                        cb();
                    }
                })



            },
                function (err, results) {
                    callback()
                });

        } else {
            callback();
        }
    })
}

//


function huffingtonpost(id, callback) {
    Feed.load('http://www.huffingtonpost.com/feeds/index.xml', function (err, rss) {
        async.eachSeries(rss.items, function (item, cb) {

            let json = item;
            json.fullimg = item.enclosures ? item.enclosures[0].url : 'https://www.upworthy.com/assets/social-eyecatcher-orange-0a6d6dca485d6e1c339cae4cfc777544.png';
            json.provider = 'huffingtonpost';
            json.source = json.url;
            json.enclosures = null;
            json.description = striptags(item.description);
            json.uid = json.created + '_huff';
            insertdb(json, function () {
                cb();
            })


        },
            function (err, results) {
                callback()
            });

    })

}


//d734ebaa11aa4ad0b2df9e074d202869
function newsapix(source, callback) {
    request.get('https://newsapi.org/v1/articles?source=' + source.src + '&sortBy=' + source.get + '&apiKey=d734ebaa11aa4ad0b2df9e074d202869', function (er, ass, body) {
        if (!er && body.length > 100) {
            async.eachSeries(JSON.parse(body).articles, function (item, cb) {

                var json = {};
                json.title = item.title;
                json.provider = source.src;
                json.description = item.description;
                json.source = item.url;
                json.fullimg = item.urlToImage;
                json.uid = new Date(item.publishedAt).getTime() + '' + source.src;
                insertdb(json, function () {
                    cb();
                })
            },
                function (err, results) {
                    callback(source)
                });
        } else {
            callback(source);
        }
    })

}


function newsapi(dummy, callback) {

    var sources = [{
        'src': 'engadget',
        'get': 'latest'
    },
    {
        'src': 'ars-technica',
        'get': 'top'
    },

    {
        'src': 'bbc-news',
        'get': 'top'
    },
    {
        'src': 'bloomberg',
        'get': 'top'
    },
    {
        'src': 'daily-mail',
        'get': 'latest'
    },
    {
        'src': 'newsweek',
        'get': 'latest'
    },
    {
        'src': 'entertainment-weekly',
        'get': 'latest'
    },
    {
        'src': 'hacker-news',
        'get': 'latest'
    },
    {
        'src': 'google-news',
        'get': 'top'
    },
    {
        'src': 'ign',
        'get': 'latest'
    },
    {
        'src': 'independent',
        'get': 'top'
    },
    {
        'src': 'mirror',
        'get': 'latest'
    },
    {
        'src': 'the-lad-bible',
        'get': 'latest'
    },
    {
        'src': 'buzzfeed',
        'get': 'latest'
    },
    {
        'src': 'mashable',
        'get': 'latest'
    }
    ]

    async.eachSeries(sources, function (item, cb) {
        newsapix(item, function (deliver) {
            console.log('📦 delivered ' + deliver.src);
            cb();
        });
    }, function (err, results) {
        db.get({
            'id': 'newsen',
            'limit': 1
        }, function (e, doc) {
            console.log('posting scheduled promo last post' + doc.docs[0].id);

            promo.post(doc.docs[0].id, process.env.article_token, doc.docs[0].title, 'poparticles', function () {

                callback()

            });
        })

    });
}

if (!process.env.PORT) {

}



module.exports = {
    digg: digg,

    crunch: crunch,
    upworthy: upworthy,
    distractify: distractify,
    boing: boing,
    huffingtonpost: huffingtonpost,
    newsapi: newsapi
}