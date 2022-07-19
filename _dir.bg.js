const request = require('request-promise')

const async = require('async')
const sanitizeHtml = require('sanitize-html')
const cheerio = require('cheerio')
const levelup = require('levelup')
const leveldown = require('leveldown')
const { html2json } = require('html2json')
const fetch = require('node-fetch')
const { extend } = require('lodash')
const md5 = require('md5')
var db = levelup(leveldown('/tmp/dsadsad111543541113'))

async function doRequest (url) {
  return new Promise((resolve, reject) => {
    request(url, (error, res, body) => {
      if (!error && res.statusCode == 200) {
        resolve(body)
      } else {
        reject(error)
      }
    })
  })
}
const insert = (json, callback) => {
  fetch('https://db.rudixlab.com/v2/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type: 'insert',
      args: {
        table: { name: 'News', schema: 'public' },
        source: 'DB',
        objects: [
          {
            ...json
          }
        ],
        returning: ['id', 'uid']
      }
    })
  })
    .then(result => {
      return result.json()
    })
    .then(data => {
      console.log(data)
      callback(data)
    })
}

async function dir (params, callback) {
  const htmlString = await doRequest('https://m.dir.bg')
  const $x = cheerio.load(htmlString)
  let extended = []
  const arry = $x('.inner-wrapper .list-article a')
    .toArray()
    .map(x => ({
      title: $x(x).text(),
      href: $x(x).attr('href'),
      uid: md5($x(x).attr('href')),
      id: $x(x)
        .attr('href')
        .split('/')
    }))

  const arrx = arry.filter(
    x =>
      !x.href.includes('viber') &&
      !x.href.includes('javascript') &&
      x.href.length > 20
  )

  async.eachSeries(
    arrx,
    (i, cb) => {
      fetch(i.href)
        .then(res => res.text())
        .then(body => {
          const $ = cheerio.load(body)
          const title = $('meta[property="og:title"]').attr('content')
          const media = $('meta[property="og:image"]').attr('content')
          const tags = $('.article-body')
            .text()
            .replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, ' ')
            .replace(/[\r\n\t]+/g, ' ')
            .split(' ')
            .filter(x => x.length > 8)
            .map(x => x.toLowerCase())
          const clean = sanitizeHtml($('.article-body').html(), {
            allowedTags: ['p', 'img'],
            allowedAttributes: {
              img: ['data-original', 'class', 'src']
            }
          }).replace(/data-original/g, 'src')
          const react = html2json(clean).child.map((item, i) => {
            return { id: i, ...item }
          })

          if (title.length > 20) {
            extended.push({
              title,
              media,
              md5: md5(title),
              uid: md5(title),
              source: 'dir.bg',
              tags,
              react
            })
            cb()
          } else {
            cb()
          }
        })
    },
    err => {
      async.each(
        extended,
        (i, cb) => {
          db.get(i.uid, (e, data) => {
            if (!data) {
              db.put(i.uid, 'xxx', function () {
                insert(i, () => {
                  cb()
                })
              })
            } else {
              console.log('cached')

              cb()
            }
          })
        },
        err => {
          callback(extended)
        }
      )
    }
  )
}

if (!process.env.PORT) {
  dir('', () => {})
}
module.exports = {
  dir
  //imgur,
}
