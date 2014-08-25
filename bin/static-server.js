#!/usr/bin/env node

const DEFAULT_PORT = 9080;
const DEFAULT_INDEX = 'index.html';
const DEFAULT_FOLLOW_SYMLINKS = false;
const DEFAULT_DEBUG = false;


var path    = require("path");
var fsize   = require('file-size');
var program = require('commander');
var chalk   = require('chalk');

var pkg     = require(path.join(__dirname, '..', 'package.json'));

var StaticServer = require('../server.js');
var server;

initTerminateHandlers();

program
  .version(pkg.name + '@' + pkg.version)
  .usage('[options] <root_path>')
  .option('-p, --port <n>', 'the port to listen to for incoming HTTP connections', DEFAULT_PORT)
  .option('-i, --index <filename>', 'the default index file if not specified', DEFAULT_INDEX)
  .option('-f, --follow-symlink', 'follow links, otherwise fail with file not found', DEFAULT_FOLLOW_SYMLINKS)
  .option('-d, --debug', 'enable to show error messages', DEFAULT_DEBUG)
  .parse(process.argv);
;

// overrides
program.rootPath = program.args[0] || process.cwd();
program.name = pkg.name;


server = new StaticServer(program);

server.start(function () {
  console.log(chalk.blue('*'), 'Static server successfully started.');
  console.log(chalk.blue('*'), 'Listening on port:', chalk.cyan(program.port));
  console.log(chalk.blue('*'), 'Press', chalk.yellow.bold('Ctrl+C'), 'to shutdown.');

  return server;
});

server.on('request', function (req, res) {
  console.log(chalk.gray('<--'), chalk.blue('[' + req.method + ']'), req.path);
});

server.on('symbolicLink', function (file, link) {
  console.log(chalk.cyan('---'), '"' + path.relative(server.rootPath, file) + '"', chalk.magenta('>'), '"' + path.relative(server.rootPath, link) + '"');
});

server.on('response', function (req, res, err, stat, file) {
  var relFile;
  var nrmFile;

  if (res.status >= 400) {
    console.log(chalk.gray('-->'), chalk.red(status, message), req.path, '(' + res.elapsedTime + ')');
  } else if (file) {
    relFile = path.relative(server.rootPath, file);
    nrmFile = path.normalize(req.path.substring(1));

    console.log(chalk.gray('-->'), chalk.green(res.status, server.STATUS_CODES[res.status]), req.path + (nrmFile !== relFile ? (' ' + chalk.dim('(' + relFile + ')')) : ''), fsize(stat.size).human(), '(' + res.elapsedTime + ')');
  } else {
    console.log(chalk.gray('-->'), chalk.green.dim(res.status, server.STATUS_CODES[res.status]), req.path, '(' + res.elapsedTime + ')');
  }

  if (err && server.debug) {
    console.error(err.stack || err.message || err);
  }

});



/**
Prepare the 'exit' handler for the program termination
*/
function initTerminateHandlers() {
  var readLine;

  if (process.platform === "win32"){
    readLine = require("readline");

    readLine.createInterface ({
      input: process.stdin,
      output: process.stdout
    }).on("SIGINT", function () {
      process.emit("SIGINT");
    });
  }

  // handle INTERRUPT (CTRL+C) and TERM/KILL signals
  process.on('exit', function () {
    if (server) {
      console.log(chalk.blue('*'), 'Shutting down server');
      server.close();
    }
    console.log();  // extra blank line
  });
  process.on('SIGINT', function () {
    console.log(chalk.blue.bold('!'), chalk.yellow.bold('SIGINT'), 'detected');
    process.exit();
  });
  process.on('SIGTERM', function () {
    console.log(chalk.blue.bold('!'), chalk.yellow.bold('SIGTERM'), 'detected');
    process.exit(0);
  });
}

