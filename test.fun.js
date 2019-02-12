const request = require('request');

const options = {
  uri: 'https://arpecop.serveo.net/twitter/_find',
  method: 'POST',
  json: {
    selector: {
      screenName: {
        $eq: '_________scotch',
      },
    },
    fields: ['time', '_id', 'title', 'urls', 'screenName'],
    update: true,
  },
};

request(options, (error, response, body) => {
  console.log(body); // Print the shortened url.
});
