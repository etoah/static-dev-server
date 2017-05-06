//text/html

function socketScript(port) {

var scriptTag = `<script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/1.7.3/socket.io.min.js"></script><script>
var socket = io.connect('http://localhost:${port}');socket.on('update', function (data) {
if (data.refresh == true) {
	window.location.reload(true);
}
});
</script>
</body>
`
	return scriptTag

}


module.exports = function (buffer, port) {
	var str = buffer.toString();
	return str.replace('</body>', socketScript(port));
}