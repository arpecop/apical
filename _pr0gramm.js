/* eslint-disable func-style */
const request = require('request')
const async = require('async')
const cheerio = require('cheerio')
const levelup = require('levelup')
const leveldown = require('leveldown')
const localdb = levelup(leveldown('/tmp/twitter11xxx'))
const db = require('nano')('http://1:1@pouchdb.herokuapp.com/chetiva')

const Twitter = require('twitter')

let client = new Twitter({
    consumer_key: 'ik6JO8L37WQfYOBY9SpoY8cLc',
    consumer_secret: '66H24oIuWJRCnFU6wa5xglK21Oqvk50IzmZ0hPZkNzEIAwkz8O',
    access_token_key: '1168401004502626305-yLI495CnaWUEvX3qS2yscfhdGxAddd',
    access_token_secret: 'Rh1qdX5DNoEhfW4bRzl4TaOD8ohIlIFcbR5JY3fYtCxdx',
})

function populatedb(id, callback) {
    localdb.get(id, err => {
        if (err) {
            localdb.put(id, 'c', () => {
                callback(false)
            })
        } else {
            callback(true)
        }
    })
}
const getAll = () => {
    return new Promise((resolve, reject) => {
        const arr = []
        request.get(
            'http://pr0gramm.com/api/items/get?flags=1',
            (e, x, body) => {
                async.forEachOf(
                    JSON.parse(body).items,
                    function(item, i, callback) {
                        request.get(
                            'https://pr0gramm.com/api/items/info?itemId=' +
                                item.id,
                            function(e, x, body) {
                                callback()

                                arr.push({ ...item, ...JSON.parse(body) })
                            }
                        )
                    },
                    function() {
                        resolve(
                            arr
                                .filter(item => item.image.includes('.jpg'))
                                .map(it => {
                                    return {
                                        ...it,
                                        type: 'pr0',
                                        _id: it.id.toString(),
                                        thumb:
                                            'https://img.pr0gramm.com/' +
                                            it.thumb,
                                        image:
                                            'https://img.pr0gramm.com/' +
                                            it.image,
                                    }
                                })
                        )
                    }
                )
            }
        )
    })
}
function processem(arr) {
    return new Promise((resolve, reject) => {
        async.forEachOf(
            arr,
            function(item, i, callback) {
                populatedb(item._id, function(x) {
                    if (!x) {
                        db.insert(item, function(e) {
                            callback()
                        })
                    } else {
                        callback()
                    }
                })
            },
            function() {
                console.log('done')
                resolve()
            }
        )
    })
}
// eslint-disable-next-line func-style
async function programm(item, callback) {
    const x = await getAll()
    await processem(x)
    console.log('pr0gramme done ')
    callback()
}
if (!process.env.PORT) {
    programm('fresh', function() {})
}

module.exports = {
    programm,
    //imgur,
}
