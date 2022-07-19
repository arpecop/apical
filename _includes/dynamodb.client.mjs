import {
  DynamoDBClient,
  ExecuteStatementCommand
} from '@aws-sdk/client-dynamodb'
import shortid from 'shortid'

const awsConfig = {
  region: 'eu-west-1',
  accessKeyId: process.env.AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET
}
const client = new DynamoDBClient(awsConfig)

const partiQL = async query => {
  try {
    const res = await client.send(new ExecuteStatementCommand(query))
    return new Promise((resolve, reject) => {
      resolve(res)
    })
  } catch (error) {
    console.log(error)
  }
}

const insert = async (type, insert_object) => {
  const obj = {
    added: Date.now(),
    type: type,
    _id: insert_object._id || shortid.generate(),
    content: insert_object
  }
  const params = {
    Statement: `INSERT INTO "ddb" VALUE ${JSON.stringify(obj)
      .replaceAll("'", '`')
      .replaceAll('{"', "{'")
      .replaceAll('":', "':")
      .replaceAll(',"', ",'")
      .replaceAll(':"', ":'")
      .replaceAll('",', "',")
      .replaceAll('"}', "'}")
      .replaceAll('["', "['")
      .replaceAll('"]', "']")}`
  }

  const res = await partiQL(params)
  console.log(params)
  return res
}
export default partiQL

export { insert }
