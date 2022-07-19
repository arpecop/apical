const async = require('async')
const db = require('nano')('http://1:1@34.242.41.16:5984/que')
const fetch = require('node-fetch')
const cheerio = require('cheerio')

async function gethtml (url) {
  return fetch(url).then(res => res.text())
}

function run_bitch () {
  fetch(
    'http://34.242.41.16:5984/que/_design/api/_view/processnova?limit=1000&include_docs=true&update=true'
  ).then(res => {
    res.json().then(tasks => {
      async.eachLimit(
        tasks.rows,
        250,
        function (task, callback) {
          gethtml(task.value.url).then(html_full => {
            const $ = cheerio.load(html_full)
            const description = $("meta[property='og:description']").attr(
              'content'
            )
            var list = []
            const lines = $('span[itemprop="description"] p').each(
              (index, item) => {
                list.push(
                  $(item)
                    .text()
                    .trim()
                )
              }
            )

            const newDoc = {
              ...task.doc,
              content: {
                description,
                html: list
              }
            }

            db.insert(newDoc, function () {
              console.log('inserted')
              callback()
            })
            //insert('news', newDoc)
          })
        },
        function () {
          run_bitch()
        }
      )
    })
  })
}
run_bitch()
