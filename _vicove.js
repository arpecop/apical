/* eslint-disable func-style */

const request = require('request')

const Twitter = require('twitter')
const keyword_extractor = require('keyword-extractor')
const levelup = require('levelup')
const leveldown = require('leveldown')
const localdb = levelup(leveldown('/tmp/twitter'))
const db = require('nano')('http://pouchdb.herokuapp.com/news')

let client = new Twitter({
    consumer_key: process.env.consumer_key,
    consumer_secret: process.env.consumer_secret,
    access_token_key: '1224673122420514818-iU62cqqa8MivUzFUem2HsPkZjTFHDx',
    access_token_secret: '6dAn8cpzCxq8cyHFzeaEHs99oQkB3YmmJa3V3OqHJxHEP',
})

//
function populatedb() {
    const id = new Date().getHours() + '' + new Date().getMinutes()
    return new Promise(resolve => {
        localdb.get(id, err => {
            if (err) {
                localdb.put(id, 'c', () => {
                    resolve(true)
                })
            } else {
                resolve(false)
            }
        })
    })
}
const get = url => {
    return new Promise((resolve, reject) => {
        request.get(url, (x, v, body) => {
            resolve(JSON.parse(body))
        })
    })
}
//module.exports = { news }
async function gowork(params, callback) {
    console.log('works' + process.env.consumer_key)

    const mins = new Date().getMinutes()
    const randJoke = await get(
        `https://pouchdb.herokuapp.com/jokes/_all_docs?skip=${Math.floor(
            Math.random() * 59979
        ) + 1}&limit=1&include_docs=true`
    )
    const isItTime = await populatedb()
    console.log(isItTime)

    if (
        mins === 05 ||
        mins === 10 ||
        mins === 15 ||
        mins === 20 ||
        mins === 25 ||
        mins === 30 ||
        mins === 35 ||
        mins === 40 ||
        mins === 45 ||
        mins === 50 ||
        mins === 55
    ) {
        if (isItTime) {
            client
                .post('statuses/update', {
                    status:
                        'https://arpecop.xyz/' +
                        randJoke.rows[0].doc._id +
                        ' ' +
                        randJoke.rows[0].doc.joke +
                        ' #bulgaria, #joke',
                })
                .then(function(tweet) {
                    console.log(tweet)
                    callback()
                })
                .catch(function(error) {
                    console.log(error)
                    callback()
                })
        } else {
            callback()
        }
    } else {
        callback()
    }
}
if (!process.env.PORT) {
    gowork('', function() {})
}
module.exports = { gowork }
