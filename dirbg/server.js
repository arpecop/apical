const cheerio = require('cheerio')
const async = require('async')
const fetch = require('node-fetch')
const shortid = require('shortid')
const db = require('nano')('http://1:1@34.242.41.16:5984/que')
const puppeteer = require('puppeteer')

// edit bellow
const pages = Array(7280)
  .fill(0)
  .map((_, i) => i + 1)
puppeteer.launch({ headless: true }).then(async browser => {
  async.eachLimit(
    pages.reverse(),
    40,
    function (url, callback) {
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
        await page.goto('https://dir.bg/latest-news?page=' + url, {
          waitUntil: 'domcontentloaded'
        })

        const docs = await page.evaluate(() => {
          const tds = Array.from(
            document.querySelectorAll('.section .inner-wrapper .list-article')
          )
          return Array.from(tds, row => {
            const href = row.querySelector('a').getAttribute('href')

            return {
              title: row.querySelector('.title').innerText,
              date: row
                .querySelector('.text-wrapper .additional-info .timestamp')
                .innerText.split(' | ')[1]
                .replace(/\./g, '/'),
              href,
              image: row
                .querySelector('img')
                .getAttribute('src')
                .split('?')[0]
            }
          })
        })

        await page.close()
        await db.bulk({ docs })
      }
      get_content(url).then(() => {
        console.log(`🔘 ${url}`)
        callback()
      })

      //return url
    },
    function (err) {
      if (err) {
        console.log(err)
      }
      console.log('🔘 done')
      browser.close()
    }
  )
})

process.on('uncaughtException', function (err) {
  console.log(err)
})
