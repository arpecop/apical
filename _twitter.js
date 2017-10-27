const request = require('request');
const async = require('async');
// const cheerio = require('cheerio');
const jsonizehtml = require('html2json').html2json;
const sanitizeHtml = require('sanitize-html');


const html2json = function (html, callback) {
  // console.log(jsonizehtml(`<ul ${arr[1]}`).child);
  const clean = jsonizehtml(sanitizeHtml(html, {
    allowedTags: ['img', 'li', 'ul'],
    allowedAttributes: {
      a: ['href'],
      img: ['data-*', 'src'],
    },
    selfClosing: ['img'],
  }));
  const arr = [];
  console.log('');

  async.each(clean.child, (file, cb) => {
    if (file.tag === 'li') {
      const doubles = file.child.map((item) => {
        if (item.node === 'text') {
          console.log(item);

          return item;
        } else if (item.attr) {
          return item.attr;
          console.log(item.attr);
        } else if (item.child) {
          return (item.child);
        }
      });
      console.log(Object.assign(...doubles, { testxxxx: 1 })); console.log('==========');


      arr.push(Object.assign(Object.assign(...doubles, { testxxxx: 1 })));
    }
    // cb();
  }, (err) => {
    callback(arr);
  });
};
// http://maps.googleapis.com/maps/api/geocode/json?address=dobrich&sensor=false
const getTl = function (user) {
  return new Promise((resolve, reject) => {
    request.get(
      {
        url: `https://syndication.twitter.com/timeline/profile?callback=__twttrf.callback&dnt=false&screen_name=${user}&suppress_response_codes=true&lang=en&limit=en&rnd=${Math.random()}`,
      },
      (err, res, datax) => {
        if (res.statusCode !== 200 && datax.length > 100) {
          reject({ status: res.statusCode, reason: 'user not exist' });
        } else {
          const body = JSON.parse(datax.split('callback(')[1].slice(0, -2)).body.replace(/(?:\r\n|\r|\n)/g, '').replace(/\s\s+/g, ' ');

          html2json(body, (clean) => {
            resolve(clean);
          });
        }
      },
    );
  });
};

getTl('MKBHD')
  .then((data) => {
    // console.log(data);
  })
  .catch((reason) => {
    console.log(reason);
  });

