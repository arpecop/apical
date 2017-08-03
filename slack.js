var slack = require('slack')
//
let bot = slack
    .rtm
    .client()
let token = 'xoxp-220341632595-219880865249-221094636467-ba63c499bcd6e0de5a3c2a9d20554f9a'

//bot.listen({token})

slack
    .channels
    .create({
        'token': token,
        'name': 'test'
    }, function (err, data) {
        console.log(err);

    })

for (i = 0; i < 100; i++) {
    slack
        .chat
        .postMessage({
            'token': token,
            'channel': 'test',
            'text': {
                '_id': new Date().getTime()
            }
        }, function (err, data) {
            console.log(err);

        })

}

slack
    .search
    .messages({
        'token': token,

        'query': '"emp"'
    }, function (err, data) {
        console.log(data);

    })