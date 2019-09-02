const PouchDB = require("pouchdb");
const request = require("request");
const async = require("async");
const { json2html } = require("html2json");
const pages = require("./_includes/pages.json");

const db = new PouchDB("http://1:1@pouchdb.herokuapp.com/db");

const approved_pages = [
  {
    name: "На колко години изглеждаш [Скенер]",
    id: "246560865463407"
  }
];
async function filterPages() {
  const filtered = pages.filter(item => {
    if (item.id === approved_pages[0].id) {
      return item;
    }
  });
  return new Promise(resolve => {
    resolve(filtered);
  });
}

async function getSomeContent() {
  return new Promise(resolve => {
    db.query("i/bgimgsx", {
      limit: 1,
      descending: true,
      include_docs: true,
      skip: Math.floor(Math.random() * 2689)
    }).then(doc => {
      resolve(doc.rows[0].doc);
    });
  });
}

async function goPost(filtered, content) {
  return new Promise(resolve => {
    // html_source
    // published
    // development_mode

    async.eachSeries(
      filtered,
      (page, cb) => {
        console.log(page, json2html(content.content), content._id);
        request.post(
          "https://graph.facebook.com/me/instant_articles",
          {
            form: {
              development_mode: false,
              access_token: page.access_token,
              html_source: `<html lang="ar" dir="rtl" prefix="op: http://media.facebook.com/op#">
              <head>
              <meta charset="utf-8">
              <link rel="canonical" href="https://arpecop.gitlab.io/izteglisi/post/${
                content._id
              }"/>
              <meta property="fb:use_automatic_ad_placement" content="true">
              <head>
              <body>
              <article>
              ${json2html(content.content)}
              </article><body></html>`
            }
          },
          (error, d, body) => {
            console.log(body);
          }
        );
        cb();
      },
      () => {
        resolve();
      }
    );
  });
}

async function go() {
  const filtered = await filterPages();
  const getContent = await getSomeContent();
  const post = await goPost(filtered, getContent);

  // console.log(filtered, getContent);
}

if (!process.env.PORT) {
  go();
}

module.exports = {
  go
};
