var frame = document.getElementById('frame');
var nodeContextMenu = document.getElementById('contextmenu-node');
var edgeContextMenu = document.getElementById('contextmenu-edge');
var fullscreenHider = document.getElementById('fullscreen-hider');

var modalEditInference = document.getElementById('edit-inference');
var modalEditNode = document.getElementById('edit-node');

var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

var selfURL = new URL(window.location.href);
var textURL = selfURL.searchParams.get('url');
var proxyURL = selfURL.searchParams.get('proxy');

if(!proxyURL)
	proxyURL = 'https://cors.io/?';

var resizer = new Resizer('#wrapper2');

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

xhr.open('GET', proxyURL + textURL, true);
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

function clearSelection() {
	window.getSelection().removeAllRanges();
}

function init() {
	canvas.addEventListener('mouseup', function(event) {
		event.preventDefault();

		if(event.which == 1) // if left mouse button was pressed
			onRelease(event.offsetX, event.offsetY, event.shiftKey);
	});
	canvas.addEventListener('mousedown', function(event) {
		event.preventDefault();

		// ignore non-left button presses
		if(event.which != 1)
			return;

		onPress(event.offsetX, event.offsetY, event.shiftKey);
		window.getSelection().removeAllRanges();
	});
	canvas.addEventListener('mousemove', function(event) {
		if(nodeContextMenu.style.display == 'none' && edgeContextMenu.style.display == 'none')
			onMove(event.offsetX, event.offsetY, event.shiftKey);
	});
	canvas.addEventListener('contextmenu', function(event) {
		event.preventDefault();
		onRightClick(event.offsetX, event.offsetY, event.shiftKey);
	});
	canvas.addEventListener('dragover', function(event) {
		event.preventDefault();
	});
	canvas.addEventListener('drop', function(event) {
		var text = event.dataTransfer.getData("text/plain");
		onDragText(event.offsetX, event.offsetY, text);
		event.preventDefault();
	});
	window.addEventListener('resize', resizeCanvas);
}

function bEditInference() {
	var type = document.getElementById('inferenceType').value;
	onEditInference(type);
}

function bEditNode() {
	var text = document.getElementById('nodeText').value.replace('\n', ' ');
	onEditNode(text);
}

function bCancel() {
	hideModal();
}

function showEditNode(text) {
	document.getElementById('nodeText').value = text;
	showModal(modalEditNode);
}

function showEditInference(type) {
	document.getElementById('inferenceType').value = type;
	showModal(modalEditInference);
}

function showModal(modal) {
	modalEditNode.style.display = 'none';
	modalEditInference.style.display = 'none';
	modal.style.display = 'block';
	fullscreenHider.style.display = 'flex';
}

function hideModal() {
	fullscreenHider.style.display = 'none';
}


function showNodeContextMenu(x, y) {
	nodeContextMenu.style.display = 'block';
	nodeContextMenu.style.left = x + 'px';
	nodeContextMenu.style.top = y + 'px';
}

function showEdgeContextMenu(x, y) {
	edgeContextMenu.style.display = 'block';
	edgeContextMenu.style.left = x + 'px';
	edgeContextMenu.style.top = y + 'px';
}

function hideContextMenu() {
	nodeContextMenu.style.display = 'none';
	edgeContextMenu.style.display = 'none';
}