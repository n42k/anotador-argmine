var frame = document.getElementById('frame');
var nodeContextMenu = document.getElementById('contextmenu-node');
var edgeContextMenu = document.getElementById('contextmenu-edge');
var fullscreenHider = document.getElementById('fullscreen-hider');

var modalEditInference = document.getElementById('edit-inference');
var modalEditNode = document.getElementById('edit-node');
var modalHelp = document.getElementById('help');

var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

var selfURL = new URL(window.location.href);

// get news URL
var textURL = selfURL.searchParams.get('url');

// get news id
var newsId = parseInt(textURL.match(/(\d+)(?!.*\d)/)[0]);

var proxyURL = selfURL.searchParams.get('proxy');

if(!proxyURL)
	proxyURL = 'https://cors.io/?';

var resultsURL = selfURL.searchParams.get('results');

if(!resultsURL)
	resultsURL = 'results.php';

var loadURL = selfURL.searchParams.get('load');

var exitURL = selfURL.searchParams.get('exit');

if(!exitURL)
	exitURL = '../annotations.php';

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

			if(loadURL) {
				load();
			} else
				init();
			break;
	}
}

xhr.open('GET', proxyURL + textURL, true);
xhr.send();

function load() {
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		switch(xhr.readyState) {
			case XMLHttpRequest.DONE:
				var json = JSON.parse(xhr.responseText);
				init();
				onLoad(json);
				break;
		}
	}
	xhr.open('GET', loadURL + '?newsId=' + newsId, true);
	xhr.send();
}

function resizeCanvas() {
	canvas.width = canvas.clientWidth;
	canvas.height = canvas.clientHeight;
	onDraw();
}

resizeCanvas();

function getIndicesRelativeTo(range, relativeElement) {
	function _hasParentNode(parent, child) {
		if(child == parent)
			return true;

		if(child == null)
			return false;

		return _hasParentNode(parent, child.parentNode);
	}

	function _getLengthTo(parent, child) {
		function _getLengthToAux(parent, child) {
			if(parent == child)
				return {
					length: 0,
					found: true
				};

			if(parent.length)
				return {
					length: parent.length,
					found: false
				};

			var nodes = parent.childNodes;
			var found = false;
			var length = 0;

			for(var i = 0; i < nodes.length; ++i) {
				var parentChild = nodes[i]; // a child of the parent

				lengthTo = _getLengthToAux(parentChild, child);
				length += lengthTo.length;
				if(lengthTo.found) {
					found = true;
					break;
				}
			}

			return {
				found: found,
				length: length
			}
		}

		return _getLengthToAux(parent, child).length;
	}

	if(!_hasParentNode(relativeElement, range.startContainer) ||
	   !_hasParentNode(relativeElement, range.endContainer))
		return null;

	var childNodes = relativeElement.childNodes;

	var startLength = _getLengthTo(relativeElement, range.startContainer) + range.startOffset;
	var endLength = _getLengthTo(relativeElement, range.endContainer) + range.endOffset;

	return {
		start: startLength,
		end: endLength
	}
}

function getSelected() {
	var selection = window.getSelection();

	if(selection.rangeCount == 0)
		return null;

	var range = selection.getRangeAt(0);
	var indices = getIndicesRelativeTo(range, frame);

	var string = selection.toString();

	if(indices == null || string == '')
		return null;

	return {
		start: indices.start,
		end: indices.end,
		text: selection.toString()
	};
}

function clearSelection() {
	window.getSelection().removeAllRanges();
}

var dragSelection = null;
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
		dragSelection = getSelected();
		event.preventDefault();
	});
	canvas.addEventListener('drop', function(event) {
		onDragText(event.offsetX, event.offsetY, dragSelection);
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
	modalHelp.style.display = 'none';
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

var timeout = null;
function saveJSON(json, callbackSuccess, callbackLoading) {
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		switch(xhr.readyState) {
			case XMLHttpRequest.OPENED:
			case XMLHttpRequest.LOADING:
				if(callbackLoading)
					callbackLoading();
				break;
			case XMLHttpRequest.DONE:
				if(callbackSuccess)
					callbackSuccess(xhr.responseText == 'success');
				break;
		}
	}

	xhr.open('POST', resultsURL, true);
	xhr.send(JSON.stringify(json));
}

function exit() {
	window.location.href = exitURL;
}