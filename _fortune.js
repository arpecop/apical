const promo = require(`${__dirname}/_includes/promo.js`);

exports.go = function (id, callback) {
  promo.post(
    '/',
    process.env.cookie_token,
    'It is your lucky day, chek your fortune!',
    'cookie',
    () => {
      callback();
    },
  );
};
