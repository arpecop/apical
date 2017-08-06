const request = require("request");
const fs = require("fs");
const get = require("get");
const async = require("async");
const shortid = require("shortid");
const _ = require("underscore");
const extend = require("extend");
const sizeOf = require("image-size");

const db = require(__dirname + "/_includes/dbaws.js");
const pagestoget = require(__dirname + "/_includes/source_statii.json");
const pages = require(__dirname + "/_includes/pages.json");

// const downloadnprocess = require(__dirname +
// "/_includes/downloadandprocess.js");
const promo = require(__dirname + "/_includes/promo.js");

function datex(prefix) {
  var coeff = 1000 * 60 * 3;
  var date = new Date(); //or use any other date
  var rounded = new Date(Math.round(date.getTime() / coeff) * coeff);
  var d = date.getDate();
  var m = date.getMonth();
  var h = date.getHours();
  var m1 = date.getMinutes();
  var y = date.getFullYear();
  return prefix + "" + y + "" + m + "" + d + "" + h + "" + m1;
}
//
Array.prototype.chunk = function (n) {
  if (!this.length) {
    return [];
  }
  return [this.slice(0, n)].concat(this.slice(n).chunk(n));
};

function post(id, callback) {
  count = 0;
  counterr = 0;

  db.get({
    id: 'newsbg',
    limit: 3,
    gt: id
  }, function (err, posts) {

    db
      .get(id, function (err, doc) {
        async
          .eachSeries(_.shuffle(pages), function (page, callbackx) {

            request
              .post("https://graph.facebook.com/" + page.id + "/feed", {
                form: {
                  published: process.env.PORT
                    ? 1
                    : 0,
                  link: "https://newsboy.fbook.space/",
                  child_attachments: [
                    {
                      'description': posts.docs[0].description,
                      'name': posts.docs[0].name,
                      'link': "https://newsboy.fbook.space/" + id,
                      'picture': posts.docs[0].url_big
                    }, {
                      'description': posts.docs[1].description,
                      'name': posts.docs[1].name,
                      'link': "https://newsboy.fbook.space/" + posts.docs[1].id,
                      'picture': posts.docs[1].url_big
                    }
                  ],
                  access_token: page.access_token
                }
              }, function (error, response, body) {
                console.log(body);

                let resp = JSON.parse(body);
                if (resp.error) {
                  counterr++;
                } else {
                  count++;
                }
                callbackx();
              });

          }, function done() {
            console.log("📘 posted to facebook pages news 🚨:" + counterr + " ✅:" + count);
            callback();
          });

      });
  })
}

function statii(lat, callback) {

  async
    .each(pagestoget.rows, function (item, callbackx) {
      var rtoken = pages[Math.floor(Math.random() * pages.length + 0)].access_token;
      //var rtoken = process.env.izvestie_token;
      var url = "https://graph.facebook.com/" + item.id + "/feed?access_token=" + rtoken + "&fields=id,likes,type,full_picture&limit=1";
      request(url, function (error, response, body) {

        var collect = [];
        if (!error && response.statusCode == 200) {
          async
            .each(JSON.parse(body).data, function (item, callback1) {

              if (item.likes && item.type === "link") {
                request("https://graph.facebook.com/" + item.id + "?access_token=" + rtoken + "&fields=full_picture,message,link,name,created_time", function (error, response, body) {
                  var insertjson = JSON.parse(body);
                  insertjson.type = 'newsbg';
                  insertjson.title = insertjson.name;
                  insertjson.description = insertjson.message;
                  insertjson.url = insertjson.picture;
                  insertjson.source = insertjson.link;
                  insertjson.url_big = insertjson.full_picture;
                  insertjson._id = new Date(insertjson.created_time).getTime() + '_1';
                  db.get(insertjson._id, function (err, data) {
                    if (err) {
                      db
                        .put(insertjson, function (err, zer) {
                          post(insertjson._id, function (zzmata) {
                            callback1();
                          });

                        });
                    } else {
                      callback1();
                    }
                  });
                })
              } else {
                callback1();
              }
            }, function done() {
              callbackx();
            });
        } else {
          callbackx();
        }
      });
    }, function done() {
      callback();
    });
}

if (!process.env.PORT) {
  statii('1', function (data) {
    console.log(data);

  })

}

module.exports = {
  statii: statii
};
//