const request = require('request');
const pages = require('./pages.json');
const async = require('async');

function shuffle(array) {
    let counter = array.length;

    // While there are elements in the array
    while (counter > 0) {
        // Pick a random index
        let index = Math.floor(Math.random() * counter);

        // Decrease counter by 1
        counter--;

        // And swap the last element with it
        let temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }

    return array;
}

function post(id, callback) {
    async.eachSeries(shuffle(pages), function (page, callbackx) {
        request
            .post('https://graph.facebook.com/' + page.id + '/feed', {
                form: {
                    published: process.env.PORT
                        ? 1
                        : 0,
                    link: 'http://izteglisi.com/' + id,
                    access_token: page.access_token
                }
            }, function (error, response, body) {
                let resp = JSON.parse(body);
                console.log(resp);

                callbackx();
            });

    }, function done() {
        callback()
    })
}

function go() {
    request.get('http://arpecop.herokuapp.com/izteglisi?format=xjson', function (error, response, body1) {
        var body = JSON.parse(body1)

        var arr = shuffle(Object.assign(body.bgapps, body.quizes));

        post(arr[0].appid, function (params) {
            console.log('done');
        })


    })

}

module.exports = {
    go: go
}