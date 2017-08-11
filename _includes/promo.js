const async = require("async");
const request = require("request");
const pouch = require(__dirname + "/pouch.js");
const console = require("better-console");
var _ = require("lodash");
var chunk = function (n) {
  if (!this.length) {
    return [];
  }
  return [this.slice(0, n)].concat(this.slice(n).chunk(n));
};
//dsad
function IsJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

function post(url, token, title, db, callback) {
  let logx = {
    'url': url,
    'token': token,
    'title': title,
    'db': db
  }
  console.log(logx);

  let arr = [];
  pouch.gimmethousend(db, function (docs) {
    async
      .eachSeries(docs, function (fr, cb) {
        arr.push({
          method: "POST",
          relative_url: fr + "/notifications?href=" + url + "&template=" + title
        });

        cb();
      }, function done() {
        var count = 0;
        var counterr = 0;
        if (process.env["PORT"]) {
          async
            .each(_.chunk(arr, 50), function (chunk, cb) {
              request
                .post({
                  url: "https://graph.facebook.com/",
                  form: {
                    access_token: token,
                    batch: JSON.stringify(chunk)
                  }
                }, function (err, httpResponse, body) {
                  async
                    .each(JSON.parse(body), function (ix, cbx) {
                      if (err || !IsJsonString(ix.body)) {
                        console.log(ix.body);
                        counterr++;
                      } else {
                        count++;
                      }
                      cbx();
                    }, function done() {
                      cb();
                    });
                });
            }, function done() {
              console.info(" 👍:" + count + " 🚨:" + counterr + " 💾:" + db + "  http://fbook.space/" + url);
              callback();
            });
        } else {
          console.log("posting en posts on localhost " + url + "," + token + "," + title + ", " + db);
          callback();
        }
      });
  });
}
module.exports = {
  post: post
};