import cluster from 'cluster'
import fetch from 'node-fetch'
import http from 'http'
const port = process.env.PORT || 3001
import { go } from './hasura/get_contents.mjs'

if (cluster.isPrimary) {
  cluster.fork()

  cluster.on('exit', worker => {
    console.log(`👷 ${worker.process.pid}`)
    //cluster.fork()
  })
} else {
  const server = http.createServer((req, resp) => {
    resp.end('i got work to do mmmkay!')
  })
  go()
  server.listen(port)

  setInterval(function () {
    fetch('https://apicall1.herokuapp.com/')
  }, 59000)
  go()
  process.on('unhandledRejection', (reason, p) => {
    console.log(
      'Possibly Unhandled Rejection at: Promise ',
      p,
      ' reason: ',
      reason
    )
    process.exit(0)
  })
}
