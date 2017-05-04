const cluster = require('cluster');
const fs = require('fs');
const request = require('request');
const async = require('async')
const port = process.env.PORT || 3000;
const _ = require('underscore');

if (cluster.isMaster) {
  cluster.fork();
  cluster.on('exit', function (worker) {
    console.log('👷 ' + worker.process.pid + ' wants to work');
    cluster.fork();
  });
} else {
  const express = require('express');
  const kartinki = require('./kartinki.js');
  const kartinki_en = require('./kartinki_en.js');
  const mash = require('./mashable.js');
  const pr0gramm = require('./pr0gramm.js');
  const app = require('express')();
  const server = require('http').Server(app);


  setTimeout(function () {
    console.log('💀 killing stuck worker 5 min ');
    process.exit(0);

  }, 300000);
  request.get('http://apicall.herokuapp.com/', () => { });
  request.get('http://apicall2.herokuapp.com/', () => { });
  request.get('http://chimpsnap.herokuapp.com/', () => { });

  console.log('job openings')
  setTimeout(function () {
    async.waterfall([
      (cb) => {
        kartinki.kartinki('1', () => { cb(null, '') })
      },
      (one, cb) => {
        kartinki_en.kartinki_en('1', () => { cb(null, '') })
      },
      (one, cb) => {
        pr0gramm.pr0gramm('1', () => { cb(null, '') })
      },
      (one, cb) => {
        pr0gramm.imgur('1', () => { cb(null, '') })
      },
      (one, cb) => {
        pr0gramm.ninegag('trending', () => { cb(null, '') })
      },
      (one, cb) => {
        pr0gramm.ninegag('hot', () => { cb(null, '') })
      },
      (fresh, cb) => {
        pr0gramm.ninegag('fresh', () => { cb(null, '') })
      },
      (one, cb) => { mash.newsapi('1', () => { cb(null, '📦 delivered all newsapi'); }) },
      (one, cb) => {
        mash.crunch('crunch', () => { cb(null, '📦 delivered crunch'); })
      },
      (one, cb) => {
        mash.upworthy('upworthy', () => { cb(null, '📦 delivered upworthy'); })
      },
      (one, cb) => {
        mash.distractify('distractify', () => { cb(null, '📦 delivered distractify'); })
      },
      (one, cb) => {
        mash.huffingtonpost('buzz', () => { cb(null, '📦 delivered huffingtonpost'); })
      }
    ], function (err, result) {
      console.log('final');
      console.log(err || result);
      setTimeout(function () {
        process.exit(0)
      }, 300);

    });
  }, Math.floor((Math.random() * 5000) + 1000));





  app.get('/', function (req, res) {
    res.writeHead(200, {
      'content-type': 'text/plain;charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'X-Requested-With'
    });
    res.end('i got work to do mmmkay!')

  })

  app.get('/:id.jpg', function (req, res) {
    res.sendFile('/tmp/' + req.params.id + '.jpg')
  })

  server.listen(port);
}
