//https://papagal.bg/search_results/б?type=company

const fetch = require('node-fetch')
const cheerio = require('cheerio')
const async = require('async')

//const azbuka = 'абвгдежзийклмнопрстуфхцчшщюя'.split('')

//

const pages = require('./map.json')

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
        table: { name: 'companies', schema: 'public' },
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
  const result = $('.pagination .page-item .page-link')
    .map(function (i, el) {
      return $(el).text()
    })
    .get()
    .reverse()
  return result
}

async function get_data (url, letter) {
  const response = await fetch(url)
  const html = await response.text()
  const $ = cheerio.load(html)
  //<meta property="og:title"
  const format = str => {
    return str
      .split('\n')
      .map(x => x.trim())
      .join(' ')
  }
  const format_date = str => {
    return str.split(' ').filter(x => x.length === 4)[0]
  }
  const column = $('table tbody tr[onclick]')
    .map(function (i, el) {
      const bulstad = $(el)
        .find('th')
        .text()
        .split('\n')
        .map(x => x.trim())
        .filter(x => x)[0]
      const name = format(
        $(el)
          .find('td:nth-child(2)')
          .text()
      )
      const created_at = format(
        $(el)
          .find('td:nth-child(3)')
          .text()
      )
      const loc = format(
        $(el)
          .find('td:nth-child(4)')
          .text()
      )
        .replace('БЪЛГАРИЯ,', '')
        .trim()
        .split('(')

      //
      return {
        _id: Number(bulstad),
        name: name.trim(),
        created_at: Number(format_date(format(created_at))),
        location: loc[0]
          .replace('гр.', '')
          .replace('с.', '')
          .trim(),
        zip: Number(loc[1].replace(')', '').trim())
      }
    })
    .get()

  return column
}

const arr = []
async.eachLimit(
  pages,
  20,
  function (url, callback) {
    get_data(url).then(async data => {
      console.log(url)
      data.forEach(async element => {
        await insertx(element)
      })

      callback()
    })
  },
  function (err) {}
)

process.on('uncaughtException', function (err) {
  console.log('е')
})
