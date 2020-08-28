const request = require("request-promise");

const async = require("async");
const sanitizeHtml = require("sanitize-html");
const cheerio = require("cheerio");
const levelup = require("levelup");
const leveldown = require("leveldown");
const { html2json } = require("html2json");

var db = levelup(leveldown("/tmp/dasdsa3"));

async function doRequestJson(url) {
  return new Promise((resolve, reject) => {
    request(url, (error, res, body) => {
      if (!error && res.statusCode == 200) {
        resolve(JSON.parse(body));
      } else {
        reject(error);
      }
    });
  });
}

function insert(json, callback) {
  request.post(
    "https://rudixlab.com/dbput",
    {
      json,
    },
    () => {
      callback();
    }
  );
}

async function doRequest(url) {
  return new Promise((resolve, reject) => {
    request(url, (error, res, body) => {
      if (!error && res.statusCode == 200) {
        resolve(body);
      } else {
        reject(error);
      }
    });
  });
}

async function darik(params, callback) {
  const htmlString = await doRequest("https://dariknews.bg/novini");
  const $x = cheerio.load(htmlString);
  const arrx = $x("article div div h2 a")
    .toArray()
    .map((x) => ({
      title: $x(x).text(),
      href: `https:${$x(x).attr("href")}`,
    }));

  const extended = await Promise.all(
    arrx.map(async (url) => {
      const htmlString1 = await doRequest(url.href);
      const $ = cheerio.load(htmlString1);

      const clean = sanitizeHtml($(".io-article-body").html(), {
        allowedTags: ["p", "img"],
        allowedAttributes: {
          img: ["data-original", "class", "src"],
        },
      }).replace(/data-original/g, "src");

      const json = JSON.parse(
        $('script[type="application/ld+json"]').get()[0].children[0].data
      );

      return {
        ...json,
        ...url,
        content: clean,
        react: html2json(clean),
        image: json.image,
        tip: "newsbg",
        source: "dariknews.bg",
        vreme: new Date(json.datePublished).getTime(),
      };
    })
  );
  console.log(extended.length);

  async.eachSeries(
    extended,
    (i, cb) => {
      db.get(i.vreme, (e, data) => {
        if (!data) {
          db.put(i.vreme, "xxx", function() {
            insert(i, () => {
              cb();
            });
          });
        } else {
          console.log("cached");

          cb();
        }
      });
    },
    (err) => {
      callback(extended);
    }
  );
}
if (!process.env.PORT) {
  darik("", () => {});
}

module.exports = {
  darik,
  //imgur,
};
