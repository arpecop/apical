import { partiQL, insert } from '../../_includes/dynamodb.client.mjs'

const test = async () => {
  const obj = { test: 'test' }
  const res = await insert('test', obj)

  console.log(res)
}

test()
