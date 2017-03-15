 var request = require('request');
 var fs = require('fs');
 var get = require('get');
 var async = require('async');
 var facebook = require('./facebook.js');
 var pages = require('./pages.json');
 var sizeOf = require('image-size');
 //pages
 var shortid = require('shortid');
 let cred = {
 	"accessKeyId": process.env.awsuser,
 	"secretAccessKey": process.env.awspass,
 	"region": "eu-west-1"
 }
 let AWS = require('aws-sdk');
 let md5 = require('md5');
 AWS.config.update(cred);
 var db = require('../dbaws.js');
 var gm = require('gm').subClass({
 	imageMagick: true
 });
 var nano = require('nano')('http://1:1@robco.herokuapp.com'),
 	cdb = nano.use('db');
 var kofa = 'imgserve.izteglisi.com';
 var s3bucket = new AWS.S3({
 	params: {
 		Bucket: kofa
 	}
 });
 var s3bucket1 = new AWS.S3({
 	params: {
 		Bucket: 'arpecop.com'
 	}
 });

 function shuffle(a) {
 	var j, x, i;
 	for (i = a.length; i; i -= 1) {
 		j = Math.floor(Math.random() * i);
 		x = a[i - 1];
 		a[i - 1] = a[j];
 		a[j] = x;
 	}
 }
 // FIXME:
 function post(id, callback) {
 	async.eachSeries(pages, function (page, callbackx) {
 		request.post({
 			headers: {
 				'content-type': 'application/x-www-form-urlencoded'
 			},
 			url: 'https://graph.facebook.com/v2.6/' + page.id + '/feed/',
 			body: 'link=http://fbkartinki.xyz/' + id + '&access_token=' + page.access_token +
 				''
 		}, function (error, response, body) {
 			console.log(error || body);
 			callbackx();
 		});
 	}, function done() {
 		callback()
 	})
 }

 function thumbnail(shortie, callback) {
 	request('https://arpecop.herokuapp.com/kartinki/' + shortie, function (error, response, body) {
 		gm("/tmp/" + shortie + ".jpg").resize(null, 150).crop(120, 120, 0, 0).write(
 			"/tmp/" + shortie + "_t.jpg",
 			function (err) {
 				fs.readFile("/tmp/" + shortie + "_t.jpg", function (err, filedatablur) {
 					s3bucket.upload({
 						Key: 'fb/' + shortie + '_t.jpg',
 						Body: filedatablur,
 						ContentType: 'image/jpeg',
 						StorageClass: 'REDUCED_REDUNDANCY'
 					}, function (err, dataxssss) {
 						fs.createReadStream("/tmp/" + shortie + "_t.jpg").pipe(cdb.attachment
 							.insert(shortie, 't.jpg', null, 'image/jpeg', function (err, ass) {
 								callback('ok')
 							}));
 					});
 				});
 			});
 	});
 }
 var downloadnprocess = function (id, callback) {
 	var dl = get(id);
 	var shortie = shortid.generate();
 	var file = '/tmp/' + shortie + '.jpg';
 	dl.toDisk(file, function (err, filename) {
 		fs.readFile(file, function (err, filedata) {
 			sizeOf(file, function (err, dimensions) {
 				db.put({
 					kofa: kofa,
 					dir: 'fb',
 					id: shortie,
 					_id: shortie,
 					w: dimensions.width,
 					h: dimensions.height,
 					ext: 'jpg'
 				}, function (err, ass) {
 					db.put({
 						time: new Date('2151').getTime() - new Date().getTime(),
 						kofa: kofa,
 						dir: 'fb',
 						id: shortie,
 						w: dimensions.width,
 						h: dimensions.height,
 						ext: 'jpg',
 						_id: 'bgimages'
 					}, function (err, ass) {
 						gm(file)
 							//.crop(600, 0, 0, 0)
 							.resize(470, null)
 							//.blur(100, 3)
 							//.draw(['image over 150,111 0,150 "zoom.png"'])
 							.write("/tmp/" + shortie + "_b.jpg", function (err) {
 								s3bucket.upload({
 									Key: 'fb/' + shortie + '.jpg',
 									Body: filedata,
 									ContentType: 'image/jpeg',
 									StorageClass: 'REDUCED_REDUNDANCY'
 								}, function (err, dataxssss) {
 									fs.readFile("/tmp/" + shortie + "_b.jpg", function (err, filedatablur) {
 										s3bucket.upload({
 											Key: 'fb/' + shortie + '_b.jpg',
 											Body: filedatablur,
 											ContentType: 'image/jpeg',
 											StorageClass: 'REDUCED_REDUNDANCY'
 										}, function (err, dataxssss) {
 											thumbnail(shortie, function (zmata) {
 												post(shortie, function (zzmata) {
 													callback(shortie)
 												})
 											})
 										})
 									});
 								});
 							});
 					});
 				})
 			});
 		});
 	});
 }
 //
 const pagestoget = require('./source.json');
 async.eachSeries(pagestoget.rows, function (item, callback) {
 	var rtoken = Math.floor((Math.random() * 90) + 0);
 	var token = pages[rtoken].access_token;
 	var url = 'https://graph.facebook.com/v2.6/' + item.id +
 		'/feed?access_token=' + token +
 		'&fields=id,likes,type,full_picture&limit=5'
 	console.log(url);
 	request(url, function (error, response, body) {
 		var collect = [];
 		if (!error && response.statusCode == 200) {
 			async.each(JSON.parse(body).data, function (item, callback1) {
 				if (item.likes) {
 					if (item.likes.data.length >= 10 && item.type === 'photo') {
 						db.exist(item.id, function (err, data) {
 							if (err) {
 								db.put({
 									_id: item.id
 								}, function (dsd, dsdsd) {
 									downloadnprocess(item.full_picture, function (shortie) {
 										callback1();
 									})
 								})
 							} else {
 								callback1();
 							}
 							//collect.push(item.full_picture);
 						})
 					} else {
 						callback1()
 					}
 				} else {
 					callback1()
 				}
 			}, function done() {
 				callback()
 			});
 		} else {
 			callback()
 		}
 	});
 }, function done() {});
 module.exports = {
 	downloadnprocess: downloadnprocess
 }