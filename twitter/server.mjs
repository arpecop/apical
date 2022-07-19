import {
  DynamoDBClient,
  ExecuteStatementCommand
} from '@aws-sdk/client-dynamodb'
import { GraphQLClient, gql } from 'graphql-request'
import fetch from 'node-fetch'
import cheerio from 'cheerio'
import async from 'async'
import pkg from 'lodash'

const { chunk } = pkg

const awsConfig = {
  region: 'eu-central-1'
}

const client = new DynamoDBClient(awsConfig)

async function main (object) {
  const graphQLClient = new GraphQLClient('http://34.242.41.16/v1/graphql', {
    headers: {
      'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET
    }
  })

  const query = gql`
    mutation MyMutation($objects: [twusers_insert_input!] = {}) {
      insert_twusers(
        objects: $objects
        on_conflict: { constraint: twusers_pkey, update_columns: id }
      ) {
        returning {
          id
        }
      }
    }
  `
  await graphQLClient.request(query, { objects: object })
}
async function test () {
  await main([{ id: '1' }, { id: '2' }])
}

test()
async function queryWithPartiQL (n) {
  const params = {
    Statement:
      'SELECT u FROM "ddb" WHERE "tip" = \'t\' AND "vreme" > ? ORDER BY "vreme" ASC',
    Parameters: [{ N: n }]
  }
  const res = await client.send(new ExecuteStatementCommand(params))
  const objects = res.Items.map(x => {
    return {
      id: x.u.S
    }
  })
  const chunked = chunk(objects, 2000)

  async.eachSeries(
    chunked,
    async function (x, cb) {
      await main(x)
      cb()
    },
    function (err) {
      console.log(res.LastEvaluatedKey.vreme.N)
      queryWithPartiQL(res.LastEvaluatedKey.vreme.N)
    }
  )
}
queryWithPartiQL('1594364753399')
