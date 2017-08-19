const db = require('./_includes/dbaws.js');

db.db2.get('1502872229000_1', (err, data) => {
  // console.log(data);
});
db.db2.get(
  {
    id: 'newsbg',
    limit: 20,
  },
  (err, posts) => {
    console.log(posts);
  },
);
