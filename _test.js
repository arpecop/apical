const request = require ('request');

function resolveAfter2Seconds (x) {
  return new Promise (resolve => {
    setTimeout (() => {
      resolve (x);
    }, 1000);
  });
}

async function f1 () {
  let x = await resolveAfter2Seconds (1120);

  console.log (x);
}
async function readAndProcess (url) {
  let content = await request.get (url, 'utf8');
  let result = await processAsync (content);
  return result;
}

f1 ();
