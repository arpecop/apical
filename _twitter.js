const request = require('request')

const { exec } = require('child_process')
const async = require('async')
const levelup = require('levelup')

const leveldown = require('leveldown')

const localdb = levelup(
    leveldown(process.env.PORT ? '/tmp/twitter' : `/tmp/${new Date()}`)
)
const urlx = 'http://3.120.176.89/twitter'

const db = require('nano')('http://1:1@pouchdb.herokuapp.com/db')
const db1 = require('nano')('https://db.arpecop.xyz/twitter')
request.get(
    `${urlx}/_design/api/_view/feed?reduce=false&skip=0&limit=1`,
    () => {}
)
request.get(
    `${urlx}/_design/api/_view/users?reduce=false&skip=0&limit=1`,
    () => {}
)
request.get(
    `${urlx}/_design/api/_view/tags?reduce=false&skip=0&limit=1`,
    () => {}
)
function populatedb(id, callback) {
    if (id) {
        localdb.get(id, err => {
            if (err) {
                localdb.put(id, 'c', () => {
                    callback(true)
                })
            } else {
                callback(false)
            }
        })
    } else {
        callback(false)
    }
}
function reject(obj, keys) {
    return Object.keys(obj)
        .filter(k => !keys.includes(k))
        .map(k => Object.assign({}, { [k]: obj[k] }))
        .reduce((res, o) => Object.assign(res, o), {})
}

async function getFreshOnes(posts, type) {
    const arr = []
    return new Promise(resolve => {
        async.each(
            posts,
            (post, cb) => {
                if (post) {
                    populatedb(
                        process.env.PORT
                            ? post.id
                            : new Date().getTime().toString(),
                        exist => {
                            if (exist) {
                                db.insert(
                                    {
                                        _id: post.id,
                                    },
                                    () => {
                                        const objectDefined = {
                                            ...post,
                                            time: Math.round(post.id),
                                            _id: Math.round(post.id).toString(),
                                            title: post.text,
                                            text: null,
                                            date: new Date()
                                                .getTime()
                                                .toString(),
                                            image: post.images
                                                ? post.images[0]
                                                : undefined,
                                        }

                                        db1.insert(
                                            reject(objectDefined, [
                                                'isRetweet',
                                                'isPinned',
                                                'isReplyTo',
                                                'text',
                                                'urls',
                                                'replyCount',
                                                'retweetCount',
                                                'sortable',
                                                'favoriteCount',
                                                'images',
                                                'image',
                                                'time',
                                            ]),
                                            (e, doc) => {
                                                console.log(
                                                    '===================================='
                                                )
                                                console.log(
                                                    e ? e.statusCode : doc
                                                )
                                                console.log(
                                                    '===================================='
                                                )
                                                cb()
                                            }
                                        )
                                    }
                                )
                            } else {
                                cb()
                            }
                        }
                    )
                } else {
                    cb()
                }
            },
            () => {
                resolve(arr)
            }
        )
    })
}

async function getTl(q, type) {
    return new Promise(resolve => {
        const q1 =
            type === 'user'
                ? `./node_modules/scrape-twitter/bin/scrape-twitter.js timeline ${q} --count 2`
                : `./node_modules/scrape-twitter/bin/scrape-twitter.js search --query="${q}" --count 2  --type latest`
        if (q.length > 2) {
            exec(q1, (err, stdout) => {
                if (err || !stdout) {
                    resolve()
                } else {
                    resolve(JSON.parse(stdout))
                }
            })
        } else {
            resolve()
        }
    })
}
const {
    bgQueries,
    enQueries,
    bgUsers,
} = require(`./_includes/sources/twitter.js`)
async function queries(quries, type) {
    return new Promise(resolve => {
        async.eachLimit(
            quries,
            8,
            (q, callback) => {
                getTl(q, 'query').then(data => {
                    getFreshOnes(data, type).then(() => callback())
                })
            },
            () => {
                resolve({})
            }
        )
    })
}

async function users(queries, type) {
    return new Promise(resolve => {
        async.eachLimit(
            queries,
            8,
            (q, callback) => {
                getTl(q, 'user').then(data => {
                    getFreshOnes(data, type).then(() => callback())
                })
            },
            () => {
                resolve({})
            }
        )
    })
}
// dsadas

async function gowork(params, callback) {
    await users(bgUsers, 'bgNews')
    await queries(bgQueries, 'twitterbg')
    await queries(enQueries, 'twitteren')

    console.log('== D O N E   T W I T T E R ==')
    callback({})
}

if (!process.env.PORT) {
    gowork(1, () => {})

    process.stdin.resume()
}
// dasddsad
module.exports = {
    gowork,
}
