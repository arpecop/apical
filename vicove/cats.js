//http://m.vicove.biz/categories
const request = require('request-promise')

const async = require('async')

const cheerio = require('cheerio')
const _ = require('lodash')
const fetch = require('node-fetch')
const { extend } = require('lodash')
const md5 = require('md5')
const fs = require('fs')

const arr = []

async function main () {
  return new Promise((resolve, reject) => {
    fetch('http://m.vicove.biz/categories', {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 5.0; SM-G920A) AppleWebKit (KHTML, like Gecko) Chrome Mobile Safari (compatible; AdsBot-Google-Mobile; +http://www.google.com/mobile/adsbot.html)'
      }
    })
      .then(result => {
        return result.text()
      })
      .then(async body => {
        const $ = cheerio.load(body)
        const catz = []
        $('ul li a').each((i, el) => {
          const cat = {
            cat: $(el).text(),
            alt: $(el).attr('title'),
            url: $(el).attr('href')
          }
          catz.push(cat)
        })
        const cats = catz.filter(x => x.alt.startsWith('Вицове'))

        async.eachLimit(
          cats,
          50,
          (x, cb) => {
            fetch(x.url, {
              method: 'GET',
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Linux; Android 5.0; SM-G920A) AppleWebKit (KHTML, like Gecko) Chrome Mobile Safari (compatible; AdsBot-Google-Mobile; +http://www.google.com/mobile/adsbot.html)'
              }
            })
              .then(result => {
                return result.text()
              })
              .then(body => {
                const $x = cheerio.load(body)

                const pages = $x('.description b:nth-child(2)').text()
                const preplaced = Math.ceil(pages.replace(' вица', '') / 15)
                const pagesfixed = pages.includes('вица')
                  ? preplaced
                  : Number(pages)
                const obj = { ...x, pages: pagesfixed }
                arr.push(obj)

                console.log(obj)
                cb()
              })
          },
          function (err) {
            console.log(JSON.stringify(arr))
            const write = _.orderBy(arr, ['pages'], ['desc'])
            fs.writeFile('./map.json', JSON.stringify(write), err => {})
          }
        )
      })
  })
}

main().then(() => {
  console.log('done')
})
