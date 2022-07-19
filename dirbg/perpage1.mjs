import puppeteer from 'puppeteer'
import fetch from 'node-fetch'
import async from 'async'
import nano from 'nano'

let n = nano('http://1:1@34.242.41.16:5984')

let db = n.db.use('que')

function run_bitch () {
  puppeteer
    .launch({
      headless: true,
      args: [`--window-size=200,200`],
      defaultViewport: {
        width: 10,
        height: 10
      }
    })
    .then(async browser => {
      fetch(
        'http://1:1@34.242.41.16:5984/que/_design/api/_view/process?limit=20000&include_docs=true&update=true'
      ).then(res => {
        res.json().then(tasks => {
          async.eachLimit(
            tasks.rows,
            100,
            function (task, callback) {
              async function get_content (url) {
                const page = await browser.newPage()
                await page.setRequestInterception(true)
                page.on('request', request => {
                  if (
                    ['image', 'stylesheet', 'font', 'script'].indexOf(
                      request.resourceType()
                    ) !== -1
                  ) {
                    request.abort()
                  } else {
                    request.continue()
                  }
                })
                //url
                //
                await page.goto(url, { waitUntil: 'domcontentloaded' })
                const data = await page.evaluate(async () => {
                  const html = await document.querySelector(
                    '.article-content .article-body'
                  ).innerHTML
                  const stripped = html
                    .replace(/<[^>]+>/g, '')
                    .split('\n')
                    .map(item => item.trim())

                  const p = Array.from(
                    document.querySelectorAll(
                      '.article-content .article-body p'
                    )
                  ).map(p => p.textContent)
                  return p.length > 0 ? p : stripped
                })
                await page.close()
                return data
              }
              db.get(task.id).then(doc => {
                if (!doc.content) {
                  get_content(task.value.url).then(data => {
                    console.log(data[0])
                    //console.log('🔘', data)
                    db.insert({ ...task.doc, content: { html: data } })
                    //KEEP UPDATING
                    callback()
                  })
                } else {
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
    })
}
run_bitch()
process.on('uncaughtException', function (err) {
  console.log(err)
})
