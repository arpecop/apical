function run_bitch () {
  fetch(
    'http://1:1@34.242.41.16:5984/que/_design/api/_view/process?limit=1000&include_docs=true&update=true'
  ).then(res => {
    res.json().then(tasks => {
      async.eachLimit(
        tasks.rows,
        250,
        function (task, callback) {
          gethtml(task.value.url).then(html_full => {
            console.log(task.value.url + ' ' + html_full.length)
            const $ = cheerio.load(html_full)
            const htmlz = cheerio.load(
              $('.article-content .article-body').html() || 'empty\n'
            )

            htmlz('script').each((index, item) => {
              htmlz(item).remove()
            })
            htmlz('div').each((index, item) => {
              htmlz(item).remove()
            })
            htmlz('img').each((index, item) => {
              htmlz(item).remove()
            })
            const lines = htmlz('body')
              .text()
              .replaceAll('"', '〝')
              .split('\n')
            const newDoc = {
              ...task.doc,
              content: {
                html: lines
              }
            }
            db.insert(newDoc)
            //insert('news', newDoc)
            callback()
          })
        },
        function () {
          run_bitch()
        }
      )
    })
  })
}
