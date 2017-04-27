const cluster = require('cluster');
const fs = require('fs');
const request = require('request');
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

  function go() {
    setTimeout(function () {
      console.log('💀 killing stuck worker 5 min ');
      process.exit(0);
      request.get('http://apicall.herokuapp.com/', () => { });
      request.get('http://apicall2.herokuapp.com/', () => { });
    }, 300000);
    if (process.env.appslug === 'apicall') {
      request.get('http://apicall.herokuapp.com/', () => { });
      kartinki.kartinki('1', function () {
        console.log('📦 delivered kartinki');
        kartinki_en.kartinki_en('1', function () {
          console.log('📦 delivered kartinki_en');
          pr0gramm.pr0gramm('1', function () {
            console.log('📦 delivered pr0gramm');
            pr0gramm.imgur('1', function () {
              console.log('📦 delivered imgur');
              pr0gramm.ninegag('trending', function () {
                console.log('📦 delivered 9gag trending');
                pr0gramm.ninegag('hot', function () {
                  console.log('📦 delivered 9gag hot');
                  pr0gramm.ninegag('fresh', function () {
                    console.log('📦 delivered 9gag fresh');
                    setTimeout(function () {
                      process.exit(0)
                    }, 300);
                  });
                });
              });
            });
          });
        });
      });
    } else {
      request.get('http://apicall2.herokuapp.com/', () => { });
      mash.newsapi('x', function () {
        console.log('📦 delivered all newsapi');
        mash.digg('digg', function () {
          console.log('📦 delivered digg');
          mash.crunch('crunch', function () {
            console.log('📦 delivered tech crunch');
            mash.upworthy('upworthy', function () {
              console.log('📦 delivered upworthy');
              mash.distractify('distractify', function () {
                console.log('📦 delivered distractify');
                //mash.boing('boing', function () { console.log('📦 delivered boing boing');
                mash.huffingtonpost('buzz', function () {
                  console.log('📦 delivered huffingtonpost');

                  setTimeout(function () {
                    process.exit(0)
                  }, 300);
                });
              });
            });
          });
        });
      });
    }
  }


  go();

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




 /*

const Twitter = require('twitter');
const async = require('async');
let client = new Twitter({
  consumer_key: 'qKU7MNibOSLDMh8dNuuUHqxoM',
  consumer_secret: 'pnqxTQ30YSIKf6oKlHQYi8CPeQCPGRjJH6RzkMjb00Hep0Fb53',
  access_token_key: '25739013-arGt6s00JzgkM5nRMkZgGw4TvFXRNjZW25MqHzFR9',
  access_token_secret: '5VAk3V6RTMnx174YD1DfMPwGXsZdIeXJBIfMt8Ur0TlQJ'
});


 */