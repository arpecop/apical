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

  const promo = require('./_includes/promo.js');

  const server = http.createServer((req, resp) => {
    resp.end('i got work to do mmmkay!');
  });
  server.listen(port);

  setTimeout(() => {
    console.log('slow dyno');
    process.exit(0);
  }, 960000);

  if (process.env.appslug === 'apicall1' || process.env.USER === 'rudix') {
    request.get('https://apicall1.herokuapp.com/', () => {});
    console.log('apicall worker');

    const train = [
      {
        tok: '181361935494|iii2yPaq_2q9kUKy1RWcM27d0n4',
        url: '#chat',
        title: '📩 имаш 1 нови съобщения ',
        app: 'bgusers'
      }
    ];

    async.eachSeries(
      train,
      (val, cb) => {
        promo.post(val, () => {
          cb(null, 'd');
        });
      },
      () => {
        console.log('=== SHIFT DONE ===');

        process.exit(0);
      }
    );
  } else {
    // const kartinki = require('./_kartinki.js');
    const pr0gramm = require('./_pr0gramm.js');
    const statii = require('./_statii.js');
    console.log('collector worker');

    request.get('https://collector1.herokuapp.com/', () => {});

    // const twitter = require('./_twitter.js');
    statii.postPages();

    const tout = 0;

    async.series(
      [
        cb => {
          pr0gramm.imgur('hot/time', () => {
            setTimeout(() => {
              cb(null, 'imgur worker 2');
            }, tout);
          });
        },
        cb => {
          pr0gramm.imgur('new/time', () => {
            setTimeout(() => {
              cb(null, 'imgur worker 2');
            }, tout);
          });
        },
        cb => {
          pr0gramm.ninegag('hot', d => {
            setTimeout(() => {
              cb(null, 'ninegag worker');
            }, tout);
          });
        }
      ],
      () => {
        console.log('== SHIFT DONE 🤷🏻‍ ==\n\n');
        process.exit(0);
      }
    );
  }

  process.on('unhandledRejection', (reason, p) => {
    console.log(
      'Possibly Unhandled Rejection at: Promise ',
      p,
      ' reason: ',
      reason
    );
    process.exit(0);
  });
}
