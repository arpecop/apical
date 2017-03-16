const cluster = require('cluster');
const fs = require('fs');
const request = require('request');
const port = process.env.PORT || 3000;
const _ = require('underscore');

if (cluster.isMaster) {
  cluster.fork();
  cluster.fork();
  cluster.fork();
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
      process.exit(0)
    }, 300000);
    if (process.env.appslug === 'apicall') {
      kartinki.kartinki('1', function () {
        console.log('📦 delivered kartinki');
        kartinki_en.kartinki_en('1', function () {
          console.log('📦 delivered kartinki_en');
          pr0gramm.pr0gramm('1', function () {
            console.log('📦 delivered pr0gramm');
            pr0gramm.imgur('1', function () {
              console.log('📦 delivered imgur');
              setTimeout(function () {
                process.exit(0)
              }, 300);
            });
          });
        });
      });
    } else if (process.env.appslug === 'apicall2') {
      pr0gramm.ninegag('trending', function () {
        console.log('📦 delivered 9gag trending');
        pr0gramm.ninegag('hot', function () {
          console.log('📦 delivered 9gag hot');
          mash.mashable('mashable', function () {
            console.log('📦 delivered mashable');
            setTimeout(function () {
              process.exit(0)
            }, 300);
          });
        });
      });
    }
  }

  var randomstart = Math.floor((Math.random() * 20000) + 0);

  setTimeout(function () {
    console.log('⌛️ random start' + randomstart + ' delay');
    request.get('htts://' + process.env.appslug + '.herokuapp.com/', function (err, der, derp) {

    })
    go();
  }, randomstart);
  app.get('/', function (req, res) {
    res.writeHead(200, {
      'content-type': 'text/plain;charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'X-Requested-With'
    });
    res.end('i got work to do mmmkay!')

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
function fatvape() {
  var pages = _.shuffle(require('./pages.json'))
  async.eachSeries(pages, function (item, callback) {
    request('https://graph.facebook.com/' + item.id + '/insights/page_fans/lifetime?access_token=' + item.access_token, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        if (JSON.parse(body).data[0].values[0].value > 100) {
          console.log(JSON.stringify(item) + ',');
        }
      }
    });
    callback()
  }, function done() {});
}
//fatvape()

*/