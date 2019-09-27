const request = require('request');
const async = require('async');
const pages = require('./_includes/pages.json');
const bgsource = require('./_includes/sources/bg_source_kartinki.json');

const get = async url => {
     return new Promise((resolve, reject) => {
          request.get(url, function(re, r, data) {
               resolve(data);
          });
     });
};

const getAll = () => {
     async.eachSeries(
          bgsource.rows,
          async function(file, callback) {
               console.log(file.id, '----');

               const content = await get(
                    'https://graph.facebook.com/' +
                         file.id +
                         '/feed?access_token=770341770061627|b_5dNQ1-IaetK4Wo9rfyW7lGe2M'
               );
               console.log(content);
          },
          function(err) {
               // if any of the file processing produced an error, err would equal that error
          }
     );
};

(async () => {
     await getAll();
})();
