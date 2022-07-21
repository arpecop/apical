//vicove.top/c/vicove?page=5116&template=infinite

//https://nova.bg/filter/all/21774
const NUM = 5114
const fetch = require('node-fetch')
const cheerio = require('cheerio')
const async = require('async')
const md5 = require('md5')

async function insertx (object) {
  const data = await fetch('http://db.kloun.lol/v2/query', {
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
        objects: [object],
        returning: null
      }
    })
  })
  const res = await data.json()
  if (!res.error) {
    console.log(res)
  }
}

async function get_content (url) {
  const response = await fetch(url)
  const html = await response.text()
  const $ = cheerio.load(html)
  //<meta property="og:title"
  const result = $('.card .card-body .card-text')
    .map(function (i, el) {
      const joke = $(el)
        .text()
        .split('\n')
        .map(x => x.trim())
        .filter(x => x)
        .join('\n')
      return {
        joke,
        _id: md5(joke),
        cat: 'Разни'
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
  10,
  function (url, callback) {
    get_content(
      'https://vicove.top/c/vicove?page=' + url + '&template=infinite'
    ).then(async data => {
      data.forEach(async element => {
        await insertx(element)
      })
      console.log(url)
      callback()
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

process.on('uncaughtException', function (err) {})
