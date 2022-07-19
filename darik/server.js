//https://dariknews.bg/categories/more/_/10/200000

const async = require('async')
const cheerio = require('cheerio')
const slugify = require('slugify')
const sanitizeHtml = require('sanitize-html')
const shortid = require('shortid')
const _ = require('lodash')
const fetch = require('node-fetch')
const pages = Array(200)
  .fill(0)
  .map((_x, i) => i * 100)
  .reverse()

function fetchGraphQL (operationsDoc, operationName, variables) {
  return fetch('https://workers.kloun.workers.dev/graphql', {
    method: 'POST',
    body: JSON.stringify({
      query: operationsDoc,
      variables: variables,
      operationName: operationName
    })
  }).then(result => result.json())
}

const operationsDoc = `
mutation MyMutation($objects: [news_insert_input!] = {}) {
  insert_news(objects: $objects, on_conflict: {constraint: news_pkey}) {
    returning {
      uid
    }
  }
}
`

function executeMyMutation (objects) {
  return fetchGraphQL(operationsDoc, 'MyMutation', { objects: objects })
}

const getcontents = async json => {
  const response = await fetch(json.href)
  const body = await response.text()
  const $ = cheerio.load(body)
  const description = $('meta[property="og:description"]').attr('content')
  const contentx = $('div[data-io-article-url]').html()
  const clean = sanitizeHtml(contentx, {
    allowedTags: []
  })
    .split('\n')
    .map(x => x.replace(/\s+/g, ' '))
    .filter(x => x.length > 10)

  const img = $('.img-wrapper figure img').attr('src')
  return new Promise(resolve => {
    const content = {
      html: clean,
      image: img ? 'https:' + img.replace('991-ratio', '126-70') : null,
      description
    }

    resolve({ ...json, content, image: content.image })
  })
}

async.eachSeries(
  pages,
  function (url, callback) {
    fetch('https://dariknews.bg/categories/more/_/100/' + url)
      .then(response => {
        return response.text()
      })
      .then(body => {
        const $ = cheerio.load(body.replace(/\s+/g, ' '))
        const docs = []
        $('article').each(async function (_, el) {
          const $el = $(el)
          const title = $el
            .find('.no-padding .list-item h2 a')
            .text()
            .replace(/\s+/g, ' ')
          docs.push({
            title,
            href:
              'http:' + $el.find('.no-padding .list-item h2 a').attr('href'),
            slug: slugify(title, {
              separator: '-',
              lower: true
            }),
            date: $el
              .find('.no-padding .list-item .time-stamp')
              .text()
              .replace(/\s+/g, ' '),
            source: 'darik'
          })
        })

        let transaction = []
        async.eachLimit(
          _.uniqBy(docs, 'slug'),
          25,
          function (url, cb) {
            getcontents(url).then(res => {
              transaction.push(res)
              cb(null, res)
            })
          },
          function (err, result) {
            console.log(`🔘 ${url}`)

            executeMyMutation(transaction).then(({ data, errors }) => {
              if (errors) {
                // handle those errors like a pro
                console.error(errors)
              }
              // do something great with this precious data
              console.log(data)
              callback(null, url)
            })
          }
        )
      })
  },
  (err, results) => {
    if (err) throw err
    // results is now an array of the response bodies
    console.log(results)
  }
)
