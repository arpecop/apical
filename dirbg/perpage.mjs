import fetch from 'node-fetch'
import async from 'async'
import nano from 'nano'
import * as cheerio from 'cheerio'
import { insert } from '../_includes/dynamodb.client.mjs'
let n = nano('http://1:1@34.242.41.16:5984')

let db = n.db.use('que')

async function gethtml (url) {
  return fetch(url).then(res => res.text())
}

function run_bitch () {
  fetch(
    'http://1:1@34.242.41.16:5984/que/_design/api/_view/process?limit=1000&include_docs=true&update=true'
  ).then(res => {
    res.json().then(tasks => {
      async.eachLimit(
        tasks.rows,
        100,
        function (task, callback) {
          gethtml(task.value.url).then(html_full => {
            console.log(html_full.length)
            console.log(task.value.url)
            const $ = cheerio.load(html_full)
            const htmlz = cheerio.load(
              $('.article-content .article-body').html() || 'empty\n'
            )

            htmlz('script').each((index, item) => {
              htmlz(item).remove()
            })
            htmlz('div').each((index, item) => {
              htmlz(item).remove()
            })
            htmlz('img').each((index, item) => {
              htmlz(item).remove()
            })
            const lines = htmlz('body')
              .text()
              .split('\n')
            const newDoc = {
              ...task.doc,
              content: {
                html: lines
              }
            }
            db.insert(newDoc)
            insert('news', newDoc)
            callback()
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
process.on('uncaughtException', function (err) {
  console.log(err)
})
