const _ = require('underscore');
const request = require('request');
const async = require('async');
function fatvape() {
    var pages = _.shuffle(require(__dirname + '/pages.json'))
    async.eachSeries(pages, function (item, callback) {
        request('https://graph.facebook.com/' + item.id + '/insights/page_fans/lifetime?access_token=' + item.access_token, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                if (JSON.parse(body).data[0].values[0].value > 200) {
                    console.log(JSON.stringify(item) + ',');
                }
            }
        });
        callback()
    }, function done() { });
}
fatvape();