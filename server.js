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
  const cookie = require('./_fortune.js');
  // const mash = require('./_mashable.js');
  const pr0gramm = require('./_pr0gramm.js');

  const app = require('express')();
  const server = require('http').Server(app);

  setTimeout(() => {
    console.log('💀 firing slow worker ,pack your shit boy! ');
    process.exit(0);
  }, 30000);
  request.get('http://apicall.herokuapp.com/', () => {});
  request.get('http://apicall2.herokuapp.com/', () => {});
  request.get('http://chimpsnap.herokuapp.com/', () => {});

  async.waterfall(
    [
      (cb) => {
        statii.statii('1', (datastatii) => {
          cb(null, '');
        });
      },
      (one, cb) => {
        console.log(datastatii);

        statii.statii_en('1', () => {
          cb(null, '');
        });
      },
      (one, cb) => {
        kartinki.kartinki('1', () => {
          cb(null, '');
        });
      },
      (one, cb) => {
        pr0gramm.pr0gramm('1', () => {
          cb(null, '');
        });
      },
      (one, cb) => {
        pr0gramm.imgur('top/time', () => {
          cb(null, '');
        });
      },

      (one, cb) => {
        pr0gramm.imgur('t/funny', () => {
          cb(null, '');
        });
      },
      (one, cb) => {
        pr0gramm.imgur('hot/viral', () => {
          cb(null, '');
        });
      },
      (one, cb) => {
        pr0gramm.ninegag('trending', () => {
          cb(null, '');
        });
      },
      (one, cb) => {
        pr0gramm.ninegag('hot', () => {
          cb(null, '');
        });
      },
      (one, cb) => {
        cookie.go('1', (data) => {
          cb(null, '📦 delivered cookie invites');
        });
      },
    ],
    (err, result) => {
      console.log('final');
      console.log(err || result);
      setTimeout(() => {
        process.exit(0);
      }, Math.floor(Math.random() * 15000 + 1000));
    },
  );

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

  server.listen(port);
}
