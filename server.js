const cluster = require('cluster');

const port = process.env.PORT || 3000;

const train = [
  {
    db: 'newsen',
    url: 'n/news/',
    tok: process.env.article_token,
    app: 'poparticles',
  },
  {
    db: 'newsen', // view to retrieve latest post and send the title
    url: 'n/news/', // before the _id
    tok: process.env.mystbox_token,
    app: 'mystic',
  },
  {
    db: 'newsen', // view to retrieve latest post and send the title
    url: 'n/news/', // before the _id
    tok: process.env.cookie_token,
    app: 'cookie',
  },
  {
    db: 'promoted_bg', // view to retrieve latest post and send the titleds
    url: '', // before the _id
    tok: process.env.izvestie_token,
    app: 'bgusers',
  },
];
console.log(process.env.LOGNAME);
if (cluster.isMaster) {
  cluster.fork();

  cluster.on('exit', (worker) => {
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
  }, 50000);

  if (
    process.env.appslug === 'apicall1' ||
    process.env.appslug === 'apicall2' ||
    process.env.appslug === 'apicall3' ||
    process.env.appslug === 'apicall4' ||
    process.env.LOGNAME === 'rudix'
  ) {
    async.eachSeries(
      train,
      (val, cb) => {
        promo.scheduled_post(
          val,
          () => {
            cb(null, 'd');
          }
        );
      },
      (err) => {
        console.log('=== SHIFT DONE ===');

        process.exit(0);
      }
    );
  } else {
    const kartinki = require('./_kartinki.js');
    const statii = require('./_statii.js');
    const twitter = require('./_twitter.js');
    const pr0gramm = require('./_pr0gramm.js');
    const tout = 1000;
    async.series(
      [
        (cb) => {
          statii.statiiBg('1', (d) => {
            setTimeout(() => {
              cb(null, d);
            }, tout);
          });
        },
        (cb) => {
          statii.statiiEn('1', (d) => {
            setTimeout(() => {
              cb(null, d);
            }, tout);
          });
        },
        (cb) => {
          kartinki.kartinkiEn('1', (d) => {
            setTimeout(() => {
              cb(null, d);
            }, tout);
          });
        },
        (cb) => {
          kartinki.kartinkiBg('1', (d) => {
            setTimeout(() => {
              cb(null, d);
            }, tout);
          });
        },
        (cb) => {
          twitter.gowork('1', (d) => {
            setTimeout(() => {
              cb(null, 'twitter worker');
            }, tout);
          });
        },
        (cb) => {
          pr0gramm.imgur('hot/time', (d) => {
            setTimeout(() => {
              cb(null, 'imgur worker 2');
            }, tout);
          });
        },
        (cb) => {
          pr0gramm.imgur('new/time', (d) => {
            setTimeout(() => {
              cb(null, 'imgur worker 2');
            }, tout);
          });
        },
        (cb) => {
          pr0gramm.programm('1', (d) => {
            setTimeout(() => {
              cb(null, 'pr0gramm worker');
            }, tout);
          });
        },
        (cb) => {
          pr0gramm.ninegag('hot', (d) => {
            setTimeout(() => {
              cb(null, 'ninegag worker');
            }, tout);
          });
        },
        (cb) => {
          kartinki.rebuildPinterest((d) => {
            setTimeout(() => {
              cb(null, 'pinterest rebuild');
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
