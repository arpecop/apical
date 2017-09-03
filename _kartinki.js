const statcore = require ('./_statii.js');

async function kartinki_bg (params, callback) {
  const step1 = await statcore.get_pages ('source_kartinki_bg');
  const get_fresh = await statcore.get_fresh_ones (step1, 'photo');
  const ifarraypost = await statcore.post_and_insert_db_fresh (
    get_fresh,
    'bgimgsx'
  );
  console.log (ifarraypost);
}

if (!process.env.PORT) {
  // sch
  kartinki_bg ('1', data => {
    console.log (data);
  });
}

module.exports = {
  kartinki_bg,
};
