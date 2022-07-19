//https://nova.bg/filter/all/21774
const NUM = 12742
const fetch = require('node-fetch')
const cheerio = require('cheerio')
const async = require('async')
const db = require('nano')('http://1:1@34.242.41.16:5984/que')
function dateformat (date) {
  const source = date.split(' ')
  const day = source[0].length === 1 ? '0' + source[0] : source[0]
  const month = source[1]
    .replace('ян', '01')
    .replace('фев', '02')
    .replace('мар', '03')
    .replace('апр', '04')
    .replace('авг', '08')
    .replace('сеп', '09')
    .replace('окт', '10')
    .replace('ное', '11')
    .replace('дек', '12')
  const year = source[2].slice(2, 4)
  return `${day}/${month}/${year}`
}

async function get_content (url) {
  const response = await fetch(url)
  const html = await response.text()
  const $ = cheerio.load(html)
  //<meta property="og:title"
  const result = $(
    'div[itemtype="https://schema.org/ItemList"] div[itemprop="itemListElement"]'
  )
    .map(function (i, el) {
      const image = $(el)
        .find('.img-responsive')
        .attr('src')
      const title = $(el)
        .find('h3[itemprop="name"]')
        .text()
      const href = $(el)
        .find('h3[itemprop="name"] a')
        .attr('href')
      const date = dateformat(
        $(el)
          .find('.media-date-on')
          .text()
      )

      return {
        image,
        title,
        href,
        date,
        source: 'nova'
      }
    })
    .get()
  return result
}
const pages = Array(NUM)
  .fill(0)
  .map((_, i) => i + 1)
async.eachLimit(
  pages.reverse(),
  25,
  function (url, callback) {
    get_content('https://nova.bg/filter/all/' + url).then(data => {
      db.bulk({ docs: data }, function (err, body) {
        console.log(`🔘 ${url}  {${body.length}}`)
        callback()
      })
    })
  },
  function (err) {
    if (err) {
      console.log(err)
    }
  }
)
//   }
//   browser

process.on('uncaughtException', function (err) {
  console.log(err)
})
