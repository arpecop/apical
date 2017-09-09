const statcore = require ('./_statii.js');
const async = require ('async');
const _ = require ('underscore');
const request = require ('request');
const pages = require (`${__dirname}/_includes/pages.json`);
async function post_to_bg (arritem) {
  return new Promise (resolve => {
    if (arritem) {
      async.each (_.shuffle (pages), (page, callbackx) => {
        request.post (
          `https://graph.facebook.com/${page.id}/photos`,
          {
            form: {
              url: arritem.full_picture,
              access_token: page.access_token,
            },
          },
          function (e, m, body) {
            console.log (body);

            callbackx ();
          }
        );
      });
    } else {
      resolve ();
    }
  });
}

async function kartinki_bg (params, callback) {
  const step1 = await statcore.get_pages ('source_kartinki_bg');
  const get_fresh = await statcore.get_fresh_ones (step1, 'photo');
  const ifarraypost = await statcore.post_and_insert_db_fresh (
    get_fresh,
    'bgimgsx'
  );
  const postfirstarritem = await post_to_bg (ifarraypost[0]);
  console.log ('== D O N E  K A R T I N K I   B G ==' + ifarraypost.length);
  callback (ifarraypost);
}

async function kartinki_en (params, callback) {
  const step1 = await statcore.get_pages ('en_source_kartinki');
  const get_fresh = await statcore.get_fresh_ones (step1, 'photo');
  const ifarraypost = await statcore.post_and_insert_db_fresh (
    get_fresh,
    'enimgsx'
  );

  console.log ('== D O N E  K A R T I N K I   E N ==' + ifarraypost.length);
  callback (ifarraypost);
}

if (!process.env.PORT) {
  //post_to_bg ( 'https://scontent.xx.fbcdn.net/v/t1.0-9/21430127_1683783854988623_341643365042409039_n.jpg?oh=243f231a862e1b15b34dd1888da88b2e&oe=5A58F945');
  kartinki_bg ('1', data => {
    console.log (data);
  });
}

module.exports = {
  kartinki_bg,
  kartinki_en,
};
