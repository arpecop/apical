const request = require("request");
const fs = require("fs");
const get = require("get");
const async = require("async");
const shortid = require("shortid");
const _ = require("underscore");
const extend = require("extend");
const sizeOf = require("image-size");

const db = require(__dirname + "/_includes/dbaws.js");
const pagestoget = require(__dirname + "/_includes/source.json");
const pages = require(__dirname + "/_includes/pages.json");

const downloadnprocess = require(__dirname + "/_includes/downloadandprocess.js");
const promo = require(__dirname + "/_includes/promo.js");

var template = "тази снимка от приятел става популярна.";

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
    id: "bgimgsx",
    limit: 4
  }, function (e, doc_old) {
    console.log('https://s-media-cache-ak0.pinimg.com/236x/' + doc_old.docs[2].img);

    db.get(id, function (err, doc) {
      //      promo.post(id, process.env.izvestie_token, template, "bgusers", function
      // () {
      async
        .each(_.shuffle(pages), function (page, callbackx) {
          request
            .post("https://graph.facebook.com/" + page.id + "/feed", {
              form: {
                published: process.env.PORT
                  ? 1
                  : 0,
                link: "http://pix.fbook.space/" + id,
                child_attachments: [
                  {
                    link: "https://pix.fbook.space/" + id,
                    picture: 'https://s-media-cache-ak0.pinimg.com/400x/' + doc.img
                  }, {
                    link: "https://pix.fbook.space/" + doc_old.docs[2]._id,
                    picture: 'https://s-media-cache-ak0.pinimg.com/400x/' + doc_old.docs[2].img
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
          console.log("📘 posted to facebook pages 🚨:" + counterr + " ✅:" + count);
          callback();
        });
      // });
    });
  });
}

function kartinki(lat, callback) {

  async
    .each(pagestoget.rows, function (item, callbackx) {
      var rtoken = pages[Math.floor(Math.random() * pages.length + 0)].access_token;
      //var rtoken = process.env.izvestie_token;
      var url = "https://graph.facebook.com/v2.6/" + item.id + "/feed?access_token=" + rtoken + "&fields=id,likes,type,full_picture&limit=1";
      request(url, function (error, response, body) {

        var collect = [];
        if (!error && response.statusCode == 200) {
          async
            .each(JSON.parse(body).data, function (item, callback1) {
              if (item.likes && item.likes.data.length >= 20 && item.type === "photo") {
                db
                  .db1
                  .get(item.id, function (err, data) {
                    if (err) {
                      db
                        .db1
                        .put({
                          _id: item.id
                        }, function (err, zer) {
                          downloadnprocess
                            .go(item.full_picture, "bgimgsx", function (shortie) {
                              post(shortie, function (zzmata) {
                                callback1();
                              });
                            });
                        });
                    } else {
                      callback1();
                    }
                  });
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
  kartinki('1', function (data) {
    console.log(data);

  })

}

module.exports = {
  kartinki: kartinki
};
//