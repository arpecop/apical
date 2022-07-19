import async from 'async'
import puppeteer from 'puppeteer'
import shortid from 'shortid'

import fetch from 'node-fetch'
import { readFile } from 'fs/promises'
import _ from 'lodash'

const json = JSON.parse(await readFile(new URL('./map.json', import.meta.url)))
const ordered = _.orderBy(json, ['pages'], ['desc'])
const removed = {
  cat: 'Жени',
  alt: 'Вицове за жени',
  url: 'http://www.vicove.biz/zheni',
  pages: 1632
}

async function insertx (doc) {
  await fetch('http://34.242.41.16/v2/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET
    },
    body: JSON.stringify({
      type: 'insert',
      args: {
        table: { name: 'jokes', schema: 'public' },
        source: 'DB',
        objects: [
          {
            ...doc
          }
        ],
        returning: null
      }
    })
  })
  //console.log(await data.json())
}

const ref = ordered.map(x => {
  return {
    cat: x.pages < 15 ? 'Разни' : x.cat,
    tag: x.cat,
    pages: Array(x.pages)
      .fill(0)
      .map((_, i) => `${x.url}?page=${i + 1}`)
      .reverse()
  }
})

const browser = await puppeteer.launch({ headless: true })
async.eachSeries(
  [
    {
      cat: 'Мъже',
      alt: 'Вицове за мъже',
      url: 'http://m.vicove.biz/mazhe',
      pages: 1015
    }
  ],
  (cat, cb) => {
    async.eachLimit(
      _.shuffle(cat.pages),
      20,
      async pagex => {
        const page = await browser.newPage()
        await page.goto(pagex, {
          waitUntil: 'domcontentloaded'
        })
        const data = await page.evaluate(() => {
          const tds = Array.from(document.querySelectorAll('p'))
          return tds.map(td => td.textContent)
        })

        const items = data
          .map(x => {
            return {
              _id: shortid.generate(),
              joke: x.toString(),
              cat: cat.cat
            }
          })
          .filter(x => !x.joke.includes('В тази'))
        await page.close()
        console.log(pagex)
        for (let index = 0; index < items.length; index++) {
          insertx(items[index])
        }

        //cb1()
      },
      function (err) {
        cb()
      }
    )
  },
  function (err) {
    //console.log(arr)
  }
)

process.on('uncaughtException', function (err) {})

//console.log(ref)
