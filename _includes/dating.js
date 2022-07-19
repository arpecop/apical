let eachAsync = require('each-async');
const request = require('request');
const _ = require('lodash');
const db = require('nano')('http://1:1@pouchdb.herokuapp.com/dating');
const pages = require('./pages.json');
//ddd
function gender(first_name) {
     const arr_female = ['a', 'e', 'i', 'j', 'o', 'u', 'y', 'а', 'е', 'и', 'о', 'у', 'я'];
     const x = first_name.split('');
     const last = x.reverse()[0].toLowerCase();
     const filtered = arr_female.filter(i => i === last);

     if (filtered[0]) {
          return 'female';
     } else {
          return 'male';
     }
}

function name(page) {
     request.get('https://pouchdb.herokuapp.com/bgusers/' + page, function(exm, xx, body) {
          let counter = 0;
          eachAsync(
               JSON.parse(body).docs,
               function(item, index, done) {
                    //console.log(_.shuffle(pages)[0].access_token);
                    request.get(
                         'https://graph.facebook.com/' +
                              item.id +
                              '?fields=first_name&access_token=' +
                              _.shuffle(pages)[0].access_token,
                         function(exm, xx, body) {
                              if (body) {
                                   const x = JSON.parse(body);
                                   if (x.first_name) {
                                        const json = {
                                             ...x,
                                             gender: gender(x.first_name),
                                             _id: x.id.toString(),
                                        };
                                        db.insert(json, function(params) {
                                             console.log(counter++);
                                        });
                                   }
                              }
                              done();
                         }
                    );
               },
               function(error) {
                    const next = page + 1;
                    console.log('finished', next);

                    name(next);
               }
          );
     });
}

name(1027);
