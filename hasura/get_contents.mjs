import { GraphQLClient, gql } from 'graphql-request'
import fetch from 'node-fetch'
import cheerio from 'cheerio'
import async from 'async'

async function main (object) {
  const graphQLClient = new GraphQLClient(
    'https://db.up.railway.app/v1/graphql',
    {
      headers: {
        'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET
      }
    }
  )

  const query = gql`
    mutation MyMutation($id: String!, $content: jsonb!) {
      update_news(where: { _id: { _eq: $id } }, _set: { content: $content }) {
        returning {
          _id
        }
      }
    }
  `
  const resp = await graphQLClient.request(query, {
    id: object.id,
    content: object.content
  })
  console.log(1)
}
let got = 0
export const go = async () => {
  const response = await fetch(
    'https://db.up.railway.app/api/rest/news/fetcherempty'
  )
  const pages = await response.json()

  async.mapLimit(
    pages.news,
    30,
    async function (url) {
      const response = await fetch(url.href)
      const body = await response.text()
      const $ = cheerio.load(body)
      const $lines = $(
        '.inner-wrapper .main-section .article-content .article-body'
      )
      const image = $('meta[property="og:image"]').attr('content')
      const description = $('meta[property="og:description"]').attr('content')
      const arr = []
      $lines.find('p').each(function (_, el) {
        arr.push($(el).text())
      })
      if (arr.length > 0) {
        const object = {
          id: url._id,
          content: { html: arr, image: image, description: description }
        }

        await main(object)
      } else {
        const object = {
          id: url._id,
          content: {
            image: image,
            description: description,
            html: $lines
              .text()
              .replace(/ +(?= )/g, '')
              .split('\n')
          }
        }

        await main(object)
      }
      return url
    },
    (err, results) => {
      go()
    }
  )
}

go()

//latest
