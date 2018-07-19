const request = require('request');
const pages = require('./all_pages.json');


// page_fans

pages.forEach((page) => {
  // me / insights / page_fans;
  request.get(`https://graph.facebook.com/me/insights/page_fans?access_token=${page.access_token}`, (e, d, data) => {
    if (JSON.parse(data).data[0].values[0].value > 10) {
      console.log(`${JSON.stringify(page)},`);
    }
  });
});
