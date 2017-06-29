const promo = require(__dirname + "/_includes/promo.js");

exports.go = function(id, cb) {
  promo.post(
    "/",
    process.env.cookie_token,
    "It is your lucky day, chek your fortune!",
    "cookie",
    function() {}
  );
};
