var frame = document.getElementById('frame');
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

var selfURL = new URL(window.location.href);
var textURL = selfURL.searchParams.get('url');

var xhr = new XMLHttpRequest();
xhr.onreadystatechange = function() {
	switch(xhr.readyState) {
		case XMLHttpRequest.OPENED:
		case XMLHttpRequest.LOADING:
			frame.innerHTML = 'Loading...';
			break;
		case XMLHttpRequest.DONE:
			frame.innerHTML = xhr.responseText;
			init();
			break;
	}
}

xhr.open('GET', 'https://cors.io/?' + textURL, true);
xhr.send();

function resizeCanvas() {
	canvas.width = canvas.clientWidth;
	canvas.height = canvas.clientHeight;
	onDraw();
}

resizeCanvas();

function getSelected() {
	return window.getSelection().toString();
}

function init() {
	canvas.addEventListener('mouseup', function(event) {
		onRelease(event.offsetX, event.offsetY, event.shiftKey);
	});
	canvas.addEventListener('mousedown', function(event) {
		onPress(event.offsetX, event.offsetY, event.shiftKey);
		window.getSelection().removeAllRanges();
	});
	canvas.addEventListener('mousemove', function(event) {
		onMove(event.offsetX, event.offsetY, event.shiftKey);
	});
	window.addEventListener('resize', resizeCanvas);
}