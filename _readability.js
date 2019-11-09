const read = require('node-read');

read('http://howtonode.org/really-simple-file-uploads', (err, article, res) => {
  // Main Article.
  console.log(article.content);

  // Title
  console.log(article.title);

  // HTML
  console.log(article.html);
});
