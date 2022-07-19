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
          db.get(task.id, function (err, doc) {
            if (!doc.content) {
              gethtml(task.value.url).then(html_full => {
                console.log(html_full.length)
                console.log(task.value.url)
                const $ = cheerio.load(html_full)
                const htmlz = cheerio.load(
                  $('.article-content .article-body').html()
                )
                if (htmlz) {
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
                    .map(item => item.trim())
                  console.log(lines.length, 'added')
                  const newDoc = {
                    ...task.doc,
                    content: {
                      html: lines
                    }
                  }
                  db.insert(newDoc)
                  insert('news', newDoc)
                } else {
                  db.insert({
                    ...task.doc,
                    content: {
                      html: ''
                    }
                  })
                }

                callback()
              })
            } else {
              console.log('already exists')
              callback()
            }
          })
        },
        function (err) {
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
