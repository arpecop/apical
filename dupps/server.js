var csv = require('node-csv').createParser()
const fs = require('fs')

fs.readFile('./dupps/dupps.csv', 'utf8', (err, data) => {
  if (err) throw err
  csv.parse(data, (err, output) => {
    if (err) throw err
    const ids = output.map(
      (x, i) => `x${i.toString()}:delete_jokes(where: {_id: {_eq: "${x[0]}"}}) {
        affected_rows
      }`
    )
    console.log(ids.join('\n'))
    fs.writeFileSync('./dupps/dupps.graphql', `${ids.join('\n')}`)
  })
})
