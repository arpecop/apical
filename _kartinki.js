const statcore = require ('./_statii.js');

async function kartinki_bg (params, callback) {
  const step1 = await statcore.get_pages ('source_kartinki_bg');
  const get_fresh = await statcore.get_fresh_ones (step1, 'photo');
  const ifarraypost = await statcore.post_and_insert_db_fresh (
    get_fresh,
    'bgimgsx'
  );
  console.log (ifarraypost);
  console.log ('== D O N E  K A R T I N K I   B G ==');
  callback (ifarraypost);
}

async function kartinki_en (params, callback) {
  const step1 = await statcore.get_pages ('en_source_kartinki');

  const get_fresh = await statcore.get_fresh_ones (step1, 'photo');
  const ifarraypost = await statcore.post_and_insert_db_fresh (
    get_fresh,
    'enimgsx'
  );
  console.log (ifarraypost);
  console.log ('== D O N E  K A R T I N K I   E N ==');
  callback (ifarraypost);
}

if (!process.env.PORT) {
  //kartinki_en ('1', data => { console.log (data);});
}

module.exports = {
  kartinki_bg,
  kartinki_en,
};
