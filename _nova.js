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
var db = levelup(leveldown('/tmp/sdsds111'))

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
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': 'dasdasasd'
    },
    body: JSON.stringify({
      type: 'insert',
      args: {
        table: { name: 'News', schema: 'public' },
        source: 'DB',
        objects: [
          {
            ...json
            //user_id: res.locals.user.username,
          }
        ],
        returning: ['id']
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

async function nova (params, callback) {
  const htmlString = await doRequest('https://nova.bg/filter/all')
  const $x = cheerio.load(htmlString)
  let extended = []
  const arrx = $x('.thumb-box .thumb-desc .thumb-title h3 a')
    .toArray()
    .map(x => ({
      title: $x(x).text(),
      href: $x(x).attr('href'),
      id: $x(x)
        .attr('href')
        .split('/')
    }))

  async.eachSeries(
    arrx,
    (i, cb) => {
      fetch(i.href)
        .then(res => res.text())
        .then(body => {
          const $ = cheerio.load(body)
          const title = $('.title-wrap-roboto h1').text()
          const media = $('.row-custom-media .gutter-0 div img').attr('src')
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
              md5: md5(title),
              media,
              react,
              tags,
              source: 'nova.bg',
              uid: md5(title)
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
  nova('', () => {})
}
module.exports = {
  nova
  //imgur,
}
