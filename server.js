const cluster = require('cluster');
const fs = require('fs');
const request = require('request');
const async = require('async');

const port = process.env.PORT || 3001;
const _ = require('underscore');

if (cluster.isMaster) {
  cluster.fork();

  cluster.on('exit', (worker) => {
    console.log(`👷 ${worker.process.pid}`);
    cluster.fork();
  });
} else {
  const express = require('express');
  const kartinki = require('./_kartinki.js');
  const statii = require('./_statii.js');
  const twitter = require('./_twitter.js');

  // const mash = require('./_mashable.js');
  // const pr0gramm = require('./_pr0gramm.js');dsad dsaddsad

  const app = require('express')();
  const server = require('http').Server(app);

  setTimeout(() => {
    console.log('💀  pack your shit boy! ');
    process.exit(0);
  }, 120000);
  request.get(`https://${process.env.appslug}.herokuapp.com/`, () => {});

  if (process.env.appslug === 'apicall1' || process.env.appslug === 'apicall2' || process.env.appslug === 'apicall3' || process.env.appslug === 'apicall4') {
    console.log('apicall');
    const train = [{
      db: 'newsen',
      url: 'app/news',
      tok: process.env.article_token,
      app: 'poparticles',
    },
    {
      db: 'newsen', // view to retrieve latest post and send the title
      url: 'app/news', // before the _id
      tok: process.env.mystbox_token,
      app: 'mystic',
    },
    {
      db: 'newsen', // view to retrieve latest post and send the title
      url: 'app/news', // before the _id
      tok: process.env.cookie_token,
      app: 'cookie',
    }, {
      db: 'newsbg', // view to retrieve latest post and send the title
      url: 'app/newsboy', // before the _id
      tok: process.env.izvestie_token,
      app: 'bgusers',
    },
    ];


    async.eachSeries(
      train,
      (val, cb) => {
        statii.scheduled_post(
          val.db, // view to retrieve latest post and send the title
          val.url, // before the _id
          val.tok,
          val.app,
          () => {
            cb(null, 'd');
          },
        );
      },
      (err) => {
        console.log('=== SHIFT DONE ===');

        process.exit(0);
      }
    );
  } else {
    console.log('others');
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
      ],
      (err, result) => {
        console.log('== SHIFT DONE 🤷🏻‍ ==\n\n');


        process.exit(0);
      },
    );
  }

  app.get('/', (req, res) => {
    res.writeHead(200, {
      'content-type': 'text/plain;charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'X-Requested-With',
    });
    res.end('i got work to do mmmkay!');
  });

  app.get('/:id.jpg', (req, res) => {
    res.sendFile(`/tmp/${req.params.id}.jpg`);
  });

  process.on('unhandledRejection', (reason, p) => {
    console.log(
      'Possibly Unhandled Rejection at: Promise ',
      p,
      ' reason: ',
      reason,
    );
    // application specific logging here
    process.exit(0);
  });

  server.listen(port);
}
