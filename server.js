const cluster = require('cluster');

const port = process.env.PORT || 3001;

if (cluster.isMaster) {
  cluster.fork();

  cluster.on('exit', worker => {
    console.log(`👷 ${worker.process.pid}`);
    cluster.fork();
  });
} else {
  const request = require('request');
  const async = require('async');
  const http = require('http');
  const server = http.createServer((req, resp) => {
    resp.end('i got work to do mmmkay!');
  });
  server.listen(port);

  setTimeout(() => {
    console.log('slow dyno');
    process.exit(0);
  }, 960000);

  //const kartinki = require('./_kartinki.js');
  const pr0gramm = require('./_pr0gramm.js');
  const news = require('./_news.js');
  request.get('https://collector1.herokuapp.com/', () => {});

  async.series(
    [
      cb => {
        pr0gramm.programm('new/time', () => {
          cb();
        });
      },
      cb => {
        news.news('new/time', () => {
          cb();
        });
      },
    ],
    () => {
      console.log('== SHIFT DONE 🤷🏻‍ ==\n\n');
      process.exit(0);
    }
  );
  process.on('unhandledRejection', (reason, p) => {
    console.log('Possibly Unhandled Rejection at: Promise ', p, ' reason: ', reason);
    process.exit(0);
  });
}
