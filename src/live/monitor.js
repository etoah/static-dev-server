var fs      = require("fs");
var watch   = require('watch');
var sys     = require('sys')
var exec    = require('child_process').exec;
var io;
const updateDelay = 500;


var monitor = {
	directory: '',
	socket: null,
	command: true,
    updated: false,
	isInLazy: false,
	listeners: [],
	watch: function(server, directory, command)
	{
		that 		   = this;
		that.directory = directory;
		that.command   = command;
		io 			   = require('socket.io').listen(server);

		server.on('request', function(response){
			peer = response.client._peername;
			io.sockets.on('connection', function (socket) {
				that.socket = socket;
			});
		});

        watch.watchTree(directory, function (f, curr, prev) {		
            if (typeof f == "object" && prev === null && curr === null) {
              // Finished walking the tree
            } else if (prev === null) {
              // f is a new file
              that.fixEmmit(f);
            } else if (curr.nlink === 0) {
              // f was removed
              that.fixEmmit(f);
            } else {
              // f was changed
              that.fixEmmit(f);
            }
        });
		
    	io.setMaxListeners(0);
    	server.setMaxListeners(0);

		this.addListener(this.emit);

        return this.updated;
	},

	fixEmmit: function(f)
	{
		if (!this.isInLazy) {
			
			this.isInLazy = true;
			setTimeout(()=>{
				this.isInLazy = false;
			}, updateDelay)

			this.listeners.forEach((cb)=>{
				cb.call(this, f)
			})
		}
	},

	emit: function(f){
		if (this.socket != null) {

			connection = this.socket.emit('update', { refresh: true });
			if (this.command !== true) {
				exec(this.command, function(error, stdout, stderr){
					sys.puts(stdout);
				});
			}
		}
	},

	addListener(f){
		if(typeof f !== 'function'){
			return null;
		}

		this.listeners.push(f);
	}
}


module.exports = monitor;
