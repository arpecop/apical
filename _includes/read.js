const scrapeIt = require('scrape-it');
const request = require('request');

const url =
  'http://www.capital.bg/politika_i_ikonomika/bulgaria/2017/08/18/3025896_bulgarskata_ikonomika_na_krilete_na_potreblenieto/';

// Promise interface
scrapeIt(url, {
  title: '.header h1',
  desc: '.content',
  avatar: {
    selector: '.header img',
    attr: 'src',
  },
}).then((page) => {
  console.log(page);
});
