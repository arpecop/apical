const Fs = require('fs')
const CsvReadableStream = require('csv-reader')

let inputStream = Fs.createReadStream(
  '/Volumes/SSD/DBS/dupplicates.csv',
  'utf8'
)
const arr = []
inputStream
  .pipe(
    new CsvReadableStream({
      parseNumbers: true,
      parseBooleans: true,
      trim: true
    })
  )
  .on('data', function (row) {
    console.log('A row arrived: ', row[0])
    arr.push("'" + row[0] + "'")
  })
  .on('end', function () {
    console.log('No more rows!')
    Fs.writeFile('./map.txt', '(' + arr.join(', ') + ')', err => {})
  })
