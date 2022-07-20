//const { request, gql } = require('graphql-request')
const fetch = require('node-fetch')
const db = require('nano')('http://1:1@34.242.41.16:5984/que')
const slugify = require('slugify')
function dateformat (date) {
  return date
    .replace('ян', '01')
    .replace('фев', '02')
    .replace('мар', '03')
    .replace('апр', '04')
    .replace('авг', '08')
    .replace('сеп', '09')
    .replace('окт', '10')
    .replace('ное', '11')
    .replace('дек', '12')
}

async function insert (objects) {
  const data = await fetch('http://34.242.41.16/v2/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET
    },
    body: JSON.stringify({
      type: 'insert',
      args: {
        table: { name: 'newsbg', schema: 'public' },
        source: 'DB',
        objects,
        returning: null
      }
    })
  })
  const x = await data.json()
  console.log(x)
  return null
}

function run_bitch () {
  fetch(
    'http://34.242.41.16:5984/que/_design/api/_view/processed?limit=1500&include_docs=true&update=true'
  ).then(res => {
    res.json().then(async ({ rows }) => {
      const forhasura = rows.map(i => {
        const { title, date, href, image, content } = i.doc

        return {
          uid: i.id,
          ...{
            title,
            date,
            href,
            date: dateformat(date || '12/12/15'),
            image,
            slug: slugify(title, {
              separator: '-',
              lower: true
            }),
            content
          }
        }
      })
      const forcouch = rows.map(i => {
        return {
          ...i.doc,
          synced: true
        }
      })

      db.bulk({ docs: forcouch }, async function () {
        //insert to
        await insert(forhasura)
        run_bitch()
        console.log('done ask for next')
      })
    })
  })
}

run_bitch()
