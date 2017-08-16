const request = require('request');
const async = require('async');
const db = require('./_includes/dbaws.js');
const cheerio = require('cheerio');
const Feed = require('rss-to-json');
const md5 = require('md5');
const console = require('better-console');
// const request = require('request');
const promo = require('./_includes/promo.js');
const striptags = require('striptags');

const pintetez = require('node-pinterest');

const pinterest = pintetez.init('AT3u7ZwNxWQpVASg6-MmSf6l8y56FLrVnW7SARtD-s__umBBdgAAAAA');

// dsd

function post_pinterest(json, callback) {
  pinterest.api('pins', {
    method: 'POST',
    body: {
      board: '195554877508708250', // grab the first board from the previous response
      note: json.title,
      link: `http://news.fbook.space/${json.id}`,
      image_url: json.fullimg ? json.fullimg : 'http://www.vtc.edu/sites/default/files/news-3.jpg',
    },
  }).then((jsonx) => {
    request.get(`https://developers.pinterest.com/widget/pins/${jsonx.data.id}/`, (err, ser, body) => {
      if (!err && JSON.parse(body).data) {
        callback({
          _id: `${new Date().getTime()}_${Math.floor((Math.random() * 10) + 1)}`,
          url: JSON.parse(body).data.image.original.url.replace('originals', '236x'),
          url_big: JSON.parse(body).data.image.original.url,
        });
      } else {
        callback({});
      }
    });
  }).catch((e) => {
    callback({});
  });
}


function insertdb(json, callback) {
  json.type = 'newsen';
  json.arr = true;
  db.db1.get(md5(json.title), (err) => {
    if (err) {
      db.db1.put({
        _id: md5(json.title),
      }, () => {
        post_pinterest(json, (assx) => {
          db.put(Object.assign(json, assx), (err, ass) => {
            promo.post(ass.id, process.env.article_token, json.title, 'poparticles', (pindata) => {
              db.put(Object.assign(json, ass, pindata), () => {
                callback({});
              });
            });
          });
        });
      });
    } else {
      callback();
    }
  });
}


function digg(x, callback) {
  // http://digg.com/api/news/popular.json?count=10
  request.get('http://digg.com/api/news/popular.json?count=10', (er, ass, body) => {
    if (!er && body.length > 200) {
      const arr = JSON.parse(body).data.feed;
      async.eachSeries(arr, (item, cb) => {
        const json = item.content;
        json.fullimg = json.media.images[0].original_url;
        json.provider = 'mashable';
        json.tags = null;
        json.media = null;
        json.source = json.url;
        json.uid = json.content_id;

        insertdb(json, () => {
          cb();
        });
      }, (err, results) => {
        callback();
      });
    } else {
      callback();
    }
  });
}


function crunch(id, callback) {
  Feed.load('http://feeds.feedburner.com/TechCrunch/', (err, rss) => {
    async.eachSeries(rss.items, (item, cb) => {
      const json = item;
      json.fullimg = item.media.thumbnail ? item.media.thumbnail[0].url[0].split('?')[0] : 'https://tctechcrunch2011.files.wordpress.com/2017/03/tc-equity-podcast-ios.jpg';
      json.provider = 'TechCrunch';
      json.source = json.url;
      json.media = null;
      json.description = striptags(item.description).replace('Read More', '');
      json.uid = `${json.created}_t`;
      insertdb(json, () => {
        cb();
      });
    }, (err, results) => {
      callback();
    });
  });
}


function upworthy(id, callback) {
  Feed.load('http://feeds.feedburner.com/upworthy', (err, rss) => {
    async.eachSeries(rss.items, (item, cb) => {
      const json = item;
      json.fullimg = item.enclosures ? item.enclosures[0].url.split('?')[0] : 'https://www.upworthy.com/assets/social-eyecatcher-orange-0a6d6dca485d6e1c339cae4cfc777544.png';
      json.provider = 'upworthy';
      json.source = json.url;
      json.enclosures = null;
      json.description = striptags(item.description);
      json.uid = `${json.created}_u`;

      insertdb(json, () => {
        cb();
      });
    },
    (err, results) => {
      callback();
    });
  });
}


function distractify(x, callback) {
  request.get('http://distractify.com/api/0.1/channels/slug/trending/resources/latest/1/10', (er, ass, body) => {
    if (!er && body.length > 200) {
      async.eachSeries(JSON.parse(body).pkg.resources[0][1], (item, cb) => {
        // console.log(item);
        const json = {};
        json.title = item.title;
        json.description = item.facebookDesc;
        json.provider = 'Distractify';
        json.fullimg = item.featuredImage.originalFileUrl;
        json.source = `http://distractify.com${item.permalink}`;
        json.uid = item.sid;
        insertdb(json, () => {
          cb();
        });
      },
      (err, results) => {
        callback();
      });
    } else {
      callback();
    }
  });
}


// boingboing.net/feed

function boing(id, callback) {
  Feed.load('http://boingboing.net/feed', (err, rss) => {
    async.eachSeries(rss.items, (item, cb) => {
      const json = item;
      json.fullimg = item.description.split('src="')[1].split('"')[0];
      json.provider = 'BoingBoing';
      json.source = json.url;

      json.description = striptags(item.description);
      json.uid = `${json.created}_b`;
      // console.log(json);
      insertdb(json, () => {
        cb();
      });
    },
    (err, results) => {
      callback();
    });
  });
}


function buzz(x, callback) {
  request.get('https://www.buzzfeed.com/site-component/v1/en-us/morebuzz?page_size=5&page=1', (er, ass, body) => {
    if (!er && body.length > 100) {
      async.eachSeries(JSON.parse(body).results, (item, cb) => {
        // console.log(item);
        const json = {};
        json.title = item.name;
        json.provider = 'Buzzfeed';
        json.source = `https://www.buzzfeed.com${item.url}`;
        json.fullimg = item.image;
        json.uid = `${item.id}_buzz`;
        db.db1.get(json.uid, (err, doc) => {
          if (err) {
            request.get(`https://graph.facebook.com/?id=${json.source}&access_token=${process.env.article_token}`, (er, ass, body) => {
              json.description = JSON.parse(body).og_object.description;
              insertdb(json, () => {
                cb();
              });
            });
          } else {
            cb();
          }
        });
      }, (err, results) => {
        callback();
      });
    } else {
      callback();
    }
  });
}

//


function huffingtonpost(id, callback) {
  Feed.load('http://www.huffingtonpost.com/feeds/index.xml', (err, rss) => {
    async.eachSeries(rss.items, (item, cb) => {
      const json = item;
      json.fullimg = item.enclosures ? item.enclosures[0].url : 'https://www.upworthy.com/assets/social-eyecatcher-orange-0a6d6dca485d6e1c339cae4cfc777544.png';
      json.provider = 'huffingtonpost';
      json.source = json.url;
      json.enclosures = null;
      json.description = striptags(item.description);
      json.uid = `${json.created}_huff`;
      insertdb(json, () => {
        cb();
      });
    }, (err, results) => {
      callback();
    });
  });
}


// d734ebaa11aa4ad0b2df9e074d202869
function newsapix(source, callback) {
  request.get(`https://newsapi.org/v1/articles?source=${source.src}&sortBy=${source.get}&apiKey=d734ebaa11aa4ad0b2df9e074d202869`, (er, ass, body) => {
    if (!er && body.length > 100) {
      async.eachSeries(JSON.parse(body).articles, (item, cb) => {
        const json = {};
        json.title = item.title;
        json.provider = source.src;
        json.description = item.description;
        json.source = item.url;
        json.fullimg = item.urlToImage;
        json.uid = `${new Date(item.publishedAt).getTime()}${source.src}`;
        insertdb(json, () => {
          cb();
        });
      },
      (err, results) => {
        callback(source);
      });
    } else {
      callback(source);
    }
  });
}


function newsapi(dummy, callback) {
  const sources = [{
    src: 'engadget',
    get: 'latest',
  },
  {
    src: 'ars-technica',
    get: 'top',
  },

  {
    src: 'bbc-news',
    get: 'top',
  },
  {
    src: 'bloomberg',
    get: 'top',
  },
  {
    src: 'daily-mail',
    get: 'latest',
  },
  {
    src: 'newsweek',
    get: 'latest',
  },
  {
    src: 'entertainment-weekly',
    get: 'latest',
  },
  {
    src: 'hacker-news',
    get: 'latest',
  },
  {
    src: 'google-news',
    get: 'top',
  },
  {
    src: 'ign',
    get: 'latest',
  },
  {
    src: 'independent',
    get: 'top',
  },
  {
    src: 'mirror',
    get: 'latest',
  },
  {
    src: 'the-lad-bible',
    get: 'latest',
  },
  {
    src: 'buzzfeed',
    get: 'latest',
  },
  {
    src: 'mashable',
    get: 'latest',
  },
  ];

  async.eachSeries(sources, (item, cb) => {
    newsapix(item, (deliver) => {
      console.info(`📦 delivered ${deliver.src}`);
      cb();
    });
  }, (err, results) => {
    db.get({
      id: 'newsen',
      limit: 1,
    }, (e, doc) => {
      console.info(`posting scheduled promo last post ${doc.docs[0].id} ${doc.docs[0].title}`);
      promo.post(`news/${doc.docs[0].id}`, process.env.universe_token, doc.docs[0].title, 'poparticles', () => {
        promo.post(doc.docs[0].id, process.env.article_token, doc.docs[0].title, 'poparticles', () => {
          callback();
        });
      });
    });
  });
}

if (!process.env.PORT) {


}


module.exports = {
  digg,

  crunch,
  upworthy,
  distractify,
  boing,
  huffingtonpost,
  newsapi,
};
