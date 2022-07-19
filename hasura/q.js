const fetch = require('node-fetch')
const cheerio = require('cheerio')
const async = require('async')

function fetchGraphQL (operationsDoc, operationName, variables) {
  return fetch('https://db.up.railway.app/v1/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET
    },
    body: JSON.stringify({
      query: operationsDoc,
      variables: variables,
      operationName: operationName
    })
  }).then(result => result.json())
}

const operationsDoc = `
  mutation MyMutation($id: String!, $content: jsonb!) {
    update_news(where: {_id: {_eq: $id}}, _set: {content: $content}) {
      returning {
        _id
      }
    }
  }
`

function executeMyMutation (id, content) {
  return fetchGraphQL(operationsDoc, 'MyMutation', { id: id, content: content })
}

// QUE

var q = async.queue(async function (url, callback) {
  const response = await fetch(url.href)
  const body = await response.text()
  const $ = cheerio.load(body)
  const $lines = $('.inner-wrapper .put-section .article-content .article-body')
  const image = $('meta[property="og:image"]').attr('content')
  const description = $('meta[property="og:description"]').attr('content')
  const arr = []
  $lines.find('p').each(function (_, el) {
    arr.push($(el).text())
  })
  if (arr.length > 0) {
    executeMyMutation(url._id, {
      html: arr,
      image: image,
      description: description
    }).then(({ data }) => {
      console.log(data)
    })
    callback()
  } else {
    executeMyMutation(url._id, {
      image: image,
      description: description,
      html: $lines
        .text()
        .replace(/ +(?= )/g, '')
        .split('\n')
    }).then(({ data }) => {
      console.log(data)
    })
    callback()
  }
}, 10)

async function go () {
  const response = await fetch(
    'https://db.up.railway.app/api/rest/news/fetcherempty'
  )
  const pages = await response.json()

  q.push(pages.news)
}
q.drain(function () {
  console.log('all items have been processed')
})
q.drain(() => {
  console.log('all items have been processed')
})

//latest

go()
