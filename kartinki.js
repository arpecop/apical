 const request = require('request');
 const fs = require('fs');
 const get = require('get');
 const async = require('async');
 const extend = require('extend');
 const pages = require('./pages.json');
 const sizeOf = require('image-size');

 const shortid = require('shortid');
 const AWS = require('aws-sdk');

 const _ = require('underscore');
 const db = require('./kartinki/dbaws.js');
 const downloadnprocess = require('./_includes/downloadandprocess.js');
 const promo = require('./_includes/promo.js');


 var template = 'тази снимка получи над 30 харесвания.';

 const pagestoget = require('./kartinki/source.json');

 function datex(prefix) {
   var coeff = 1000 * 60 * 3;
   var date = new Date(); //or use any other date
   var rounded = new Date(Math.round(date.getTime() / coeff) * coeff)
   var d = date.getDate();
   var m = date.getMonth();
   var h = date.getHours();
   var m1 = date.getMinutes();
   var y = date.getFullYear();
   return (prefix + '' + y + '' + m + '' + d + '' + h + '' + m1);
 }

 Array.prototype.chunk = function (n) {
   if (!this.length) {
     return [];
   }
   return [this.slice(0, n)].concat(this.slice(n).chunk(n));
 };



 //post_notification('pix/B1FEG3WYg')

 function post_img(page, callback) {
   request.post('https://graph.facebook.com/' + page.id + '/photos', {
     form: {
       url: 'http://socketserve.herokuapp.com/image/' + page.hid + '.jpg',
       access_token: page.access_token
     }
   }, function (error, response, body) {
     console.log(body);
     callback();
   });
 }

 function post(id, callback) {
   console.log('posting ' + id);
   //function post(url, token, title, db, callback) {
   promo.post('pix/' + id, process.env.izvestie_token, template, 'bgusers', function () {
     async.eachSeries(_.shuffle(pages), function (page, callbackx) {
       request.post('https://graph.facebook.com/' + page.id + '/feed', {
         form: {
           published: process.env.PORT ?
             1 : 0,
           link: 'https://pix.fbook.space/' + id,
           access_token: page.access_token
         }
       }, function (error, response, body) {
         let resp = JSON.parse(body);
         console.log(resp);
         //if (resp.error) {
         post_img(extend({
           hid: id
         }, page), function (zdd) {})
         //}
         callbackx();
       });

     }, function done() {
       callback()
     })
   })
 }


 //
 function kartinki(lat, callback) {
   async.eachSeries(pagestoget.rows, function (item, callbackx) {
     var rtoken = Math.floor((Math.random() * 90) + 0);
     var url = 'https://graph.facebook.com/v2.6/' + item.id + '/feed?access_token=' + process.env.izvestie_token + '&fields=id,likes,type,full_picture&limit=3'
     request(url, function (error, response, body) {
       var collect = [];
       if (!error && response.statusCode == 200) {
         async.eachSeries(JSON.parse(body).data, function (item, callback1) {
           if (item.likes && item.likes.data.length >= 10 && item.type === 'photo') {
             db.exist(item.id, function (err, data) {
               if (err) {
                 db.put({
                   _id: item.id
                 }, function (dsd, dsdsd) {
                   downloadnprocess.go(item.full_picture, 'bgimages', function (shortie) {
                     post(shortie, function (zzmata) {
                       callback1();
                     });
                   });
                 });
               } else {
                 callback1();
               }
             })
           } else {
             callback1()
           }
         }, function done() {
           callbackx()
         });
       } else {
         callbackx()
       }
     });
   }, function done() {
     callback()
   });
 }



 module.exports = {
   kartinki: kartinki
 }