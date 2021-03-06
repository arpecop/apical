const cluster = require("cluster");

const port = process.env.PORT || 3001;

if (cluster.isMaster) {
  cluster.fork();

  cluster.on("exit", (worker) => {
    console.log(`👷 ${worker.process.pid}`);
    cluster.fork();
  });
} else {
  const request = require("request");
  const async = require("async");
  const http = require("http");
  const server = http.createServer((req, resp) => {
    resp.end("i got work to do mmmkay!");
  });
  server.listen(port);

  setTimeout(() => {
    console.log("slow dyno");
    process.exit(0);
  }, 960000);

  //const kartinki = require('./_kartinki.js');

  const programm = require("./_pr0gramm.js");
  const vicove = require("./_vicove");
  const imgur = require("./_imgur.js");
  const news = require("./_news.js");
  request.get("https://apicall1.herokuapp.com/", () => {});
  request.get("https://collector1.herokuapp.com/", () => {});
  request.get("https://graphqldbone.herokuapp.com/", () => {});
  async.series(
    [
      (cb) => {
        imgur.imgur("new/time", () => {
          cb();
        });
      },
      (cb) => {
        programm.programm("new/time", () => {
          cb();
        });
      },
      (cb) => {
        news.darik("new/time", () => {
          cb();
        });
      },
      //cb => {
      //    twitter.gowork('new/time', () => {
      //       cb()
      //    })
      // },
    ],
    () => {
      console.log("== SHIFT DONE 🤷🏻‍ ==\n\n");
      process.exit(0);
    }
  );
  process.on("unhandledRejection", (reason, p) => {
    console.log(
      "Possibly Unhandled Rejection at: Promise ",
      p,
      " reason: ",
      reason
    );
    process.exit(0);
  });
}
