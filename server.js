import express from 'express';

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

  if (process.env.appslug === 'apicall1') {
    request.get('https://apicall1.herokuapp.com/', () => {});
    const unused = [
      {
        db: 'enimgsx',
        url: 'g/box/',
        tok: process.env.article_token,
        app: 'poparticles',
        limit: 651,
      },
      {
        db: 'enimgsx', // view to retrieve latest post and send the title
        url: 'g/box/', // before the _id
        tok: process.env.mystbox_token,
        app: 'mystic',
        limit: 651,
      },
    ];
    const train = [
      {
        tok: process.env.izvestie_token,
        url: '#chat',
        title: 'Каня те в общия чат',
        app: 'bgusers',
      },
    ];

    async.eachSeries(
      train,
      (val, cb) => {
        //  promo.post(val, () => {
        //  cb(null, 'd');
        // });
        cb();
      },
      err => {
        console.log('=== SHIFT DONE ===');

        process.exit(0);
      }
    );
  } else {
    request.get('https://collector1.herokuapp.com/', () => {});
    const kartinki = require('./_kartinki.js');
    // const statii = require('./_statii.js');
    const twitter = require('./_twitter.js');
    const pr0gramm = require('./_pr0gramm.js');
    const tout = 0;
    // statii.statiiBg , kartinkiEn , statiiEn
    async.series(
      [
        cb => {
          kartinki.kartinkiEn('1', d => {
            setTimeout(() => {
              cb(null, d);
            }, tout);
          });
        },
        cb => {
          kartinki.kartinkiBg('1', d => {
            setTimeout(() => {
              cb(null, d);
            }, tout);
          });
        },
        cb => {
          twitter.gowork('1', d => {
            setTimeout(() => {
              cb(null, 'twitter worker');
            }, tout);
          });
        },
        cb => {
          pr0gramm.imgur('hot/time', d => {
            setTimeout(() => {
              cb(null, 'imgur worker 2');
            }, tout);
          });
        },
        cb => {
          pr0gramm.imgur('new/time', d => {
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
        },
      ],
      (err, result) => {
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
