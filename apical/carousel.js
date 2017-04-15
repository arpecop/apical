request('http://arpecop.herokuapp.com/cdb/bgimages/?limit=1000', function (error, response, body) {
    if (!error && response.statusCode == 200) {
        var docs = JSON.parse(body).docs;

        async.eachSeries(pages, function (item, callback) {
            var items = _.shuffle(docs).slice(0, 8);

            var arr = [];
            var arr2 = []
            items.forEach(function (val, index) {

                arr[index] = {}
                arr[index].link = 'http://alpha.nightchat.me/' + val.id + '/?ref=fb'
                arr2.push(val.id);
            })
            level.db.get(datex(item.id), function (err, assx) {
                if (err) {
                    level.db.put(datex(item.id), '1')
                    request.post({
                        url: 'https://graph.facebook.com/me/feed',
                        form: {
                            published: process.env.PORT ? 1 : 0,
                            access_token: item.access_token,
                            link: 'http://alpha.nightchat.me/' + item.id + '',
                            child_attachments: arr
                        }
                    }, function (err, httpResponse, body) {
                        var resx = JSON.parse(body);
                        resx.name = item.name;
                        resx.pageurl = 'https://facebook.com/' + item.id
                        if (resx.error) {
                            item.hid = arr2[Math.floor((Math.random() * 7) + 0)];
                            post_img(extend(item, resx.error), function (data) {
                                res.write(JSON.stringify(data) + ', \n\n\n');
                                console.log(data);
                            })
                        } else {
                            res.write(JSON.stringify(resx) + ', \n\n\n');
                            console.log(resx);
                        }
                        setTimeout(function () {
                            callback();
                        }, 5000);
                    })
                } else {
                    console.log('spam prevent');
                    callback();
                }
            })

        }, function done() {
            console.log("DONE");
            res.end('done')
            level.db.del('work', function () {

            })
        });

    }
});
