 var facebook = {};
 var request = require('request');
 var async = require('async');
 var extend = require('extend');
 var db = require('../dbaws.js');
 facebook.page = function (query, callback) {
 	var url = 'https://graph.facebook.com/v2.6/' + query.id +
 		'/feed?access_token=' + facebook.token +
 		'&fields=id,likes,type,full_picture&limit=5'
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
 									processx.downloadnprocess(item.full_picture, function (shortie) {
 										console.log(shortie);
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
 				console.log(collect);
 				callback(collect)
 			});
 		} else {
 			callback({
 				'error': 'happens'
 			});
 		}
 	});
 };
 module.exports = facebook;