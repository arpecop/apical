const cluster = require('cluster');
const fs = require('fs');
const request = require('request');
const async = require('async');

const port = process.env.PORT || 3001;
const _ = require('underscore');

if (cluster.isMaster) {
  cluster.fork();

  cluster.on('exit', (worker) => {
    console.log(`👷 ${worker.process.pid} wants to work`);
    cluster.fork();
  });
} else {
  const express = require('express');
  const kartinki = require('./_kartinki.js');
  const statii = require('./_statii.js');

  // const mash = require('./_mashable.js');
  // const pr0gramm = require('./_pr0gramm.js');dsad dsad

  const app = require('express')();
  const server = require('http').Server(app);

  setTimeout(() => {
    console.log('💀 slow ass worker ,pack your shit boy! ');
    process.exit(0);
  }, 120000);
  request.get(`https://${process.env.appslug}.herokuapp.com/`, () => {});

  if (process.env.appslug === 'apicall1' || process.env.appslug === 'apicall2') {
    console.log('apicall');

    async.parallel(
      [(cb) => {
        statii.scheduled_post(
          'newsbg', // view to retrieve latest post and send the title
          'app/newsboy', // before the _id
          process.env.izvestie_token,
          'bgusers',
          () => {
            cb(null, 'd');
          },
        );
      },
      ],
      (err, result) => {
        console.log('=== SHIFT DONE ===');
        process.exit(0);
      },
    );
  } else {
    console.log('others');
    async.parallel(
      [
        (cb) => {
          statii.statiiBg('1', (d) => {
            cb(null, d);
          });
        },
        (cb) => {
          statii.statiiEn('1', (d) => {
            cb(null, d);
          });
        },
        (cb) => {
          kartinki.kartinkiEn('1', (d) => {
            cb(null, d);
          });
        },
        (cb) => {
          kartinki.kartinkiBg('1', (d) => {
            cb(null, d);
          });
        },
      ],
      (err, result) => {
        console.log('=== SHIFT DONE ===');
        console.log(err || result);

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
