var nodes = [];
var edges = [];

var DOUBLE_CLICK_TIME = 500; // ms

var heldSelectionTime = 0;
var held = null;
var heldOffsetX = 0;
var heldOffsetY = 0;
var dragging = false;

var drawOffsetX = 0;
var drawOffsetY = 0;

function getNodeAt(x, y) {
	for(var i = nodes.length - 1; i != -1; --i)
		if(nodes[i].isInside(x, y))
			return nodes[i];
	return null;
}

function getEdgeAt(x, y) {
	for(var i = 0; i < edges.length; ++i) {
		if(edges[i].isInside(x, y))
			return edges[i];
	}

	return null;
}

function addPermanentEdge(node) {
	if(held == null || !(held instanceof Edge) || node == null)
		return false;

	var foundBidirectionalEdge = false;
	for(var i = 0; i < edges.length; ++i) {
		var e = edges[i];
		if(e.start == node && e.end == held.start)
			foundBidirectionalEdge = true;
	}

	if(held.start.type != 'I' || held.start == node || foundBidirectionalEdge) {
		held.delete();
		held.release();
		onDraw();
		return true;
	}

	try {

		held.setEnd(node);
	} catch(e) {
		held.delete();
		held.release();
		onDraw();
		return true;
	}

	if(held.end.type != 'I') {
		held = null;
		onDraw();
		return true;
	}

	var middleX = (held.start.x + held.start.width + held.end.x)/2;
	var middleY = (held.start.y + held.start.height + held.end.y)/2;
	var inference = new InferenceNode(middleX, middleY, InferenceNode.schemes.SUPPORT);
	inference.x -= inference.width/2;
	inference.y -= inference.height/2;
	nodes.push(inference);

	var edge1 = new Edge(held.start);
	edge1.setEnd(inference);
	edges.push(edge1);
	var edge2 = new Edge(inference);
	edge2.setEnd(held.end);
	edges.push(edge2);

	held.delete();
	held.release();
	onDraw();
	return true;
}

function deleteNode(node) {
	// remove node
	var i = nodes.indexOf(node);
	if(i == -1)
		return;

	nodes.splice(i, 1);

	for(var i = 0; i < edges.length; ++i)
		if(edges[i].start == node || edges[i].end == node)
			edges.splice(i--, 1);
}

function onDraw() {
	canvas.width = canvas.width;
	ctx.save();
	ctx.translate(drawOffsetX, drawOffsetY);
	for(var i = 0; i < edges.length; ++i)
		edges[i].draw();
	for(var i = 0; i < nodes.length; ++i)
		nodes[i].draw();
	ctx.restore();
}

function onPress(x, y, shift) {
	x = x - drawOffsetX;
	y = y - drawOffsetY;

	hideContextMenu();

	var node = getNodeAt(x, y);
	if(addPermanentEdge(node))
		return;

	// if shift is pressed, or the node we have held is the same
	// as the one we clicked, and we did so within a DOUBLE_CLICK_TIME interval,
	// begin creating a new edge
	if(shift || held == node && Date.now() - heldSelectionTime < DOUBLE_CLICK_TIME) {
		if(node == null)
			return;

		var edge = new Edge(node);
		edges.push(edge);
		if(held)
			held.release();
		edge.hold();
		heldOffsetX = 0;
		heldOffsetY = 0;
		dragging = true;
		onDraw();
		return;
	}

	// if there's text selected, add a node
	var selection = getSelected();
	if(selection != null) {
		onDragText(x, y, selection);
		return;
	}

	// if we clicked on a node, select it
	if(node != null) {
		if(held)
			held.release();

		node.hold();
		heldSelectionTime = Date.now();
		heldOffsetX = node.x - x;
		heldOffsetY = node.y - y;
		dragging = true;
		onDraw();
		return;
	}

	// if we clicked on nothing, unselect the current node
	if(held != null)
		held.release();

	// if there's nothing else to click on, we clicked on the background
	// begin dragging it
	dragging = true;
	heldOffsetX = -x;
	heldOffsetY = -y;

	onDraw();
}

function onRelease(x, y, shift) {
	x = x - drawOffsetX;
	y = y - drawOffsetY;

	dragging = false;

	if(held != null && held instanceof Edge) {
		var node = getNodeAt(x, y);
		if(addPermanentEdge(node))
			return;
		held.delete();
		held.release();
		onDraw();
	}
}

function onMove(x, y, shift) {
	if(!dragging)
		return;

	x = x - drawOffsetX;
	y = y - drawOffsetY;

	if(held == null) {
		drawOffsetX = x + heldOffsetX + drawOffsetX;
		drawOffsetY = y + heldOffsetY + drawOffsetY;
	} else
		held.move(x + heldOffsetX, y + heldOffsetY);
	onDraw();
}

function onRightClick(x, y, shift) {
	x = x - drawOffsetX;
	y = y - drawOffsetY;
	
	hideContextMenu();

	var node = getNodeAt(x, y);

	if(node == null) {
		var edge = getEdgeAt(x, y);

		if(edge == null)
			return;

		if(held)
			held.release();

		edge.hold();
		showEdgeContextMenu(x + drawOffsetX, y + drawOffsetY);
		return;
	}

	if(held)
		held.release();

	node.hold();
	onDraw();
	showNodeContextMenu(x + drawOffsetX, y + drawOffsetY);
}

// this function is used to give an id to each node, again
// so that the first node has an id of 0, the second of 1, and so on
function reIdNodes() {
	for(var i = 0; i < nodes.length; ++i)
		nodes[i].id = i;
}

function getJSON() {
	var jnodes = {};

	var json = {
		nodes: [],
		edges: [],
		metadata: {
			newsId: newsId,
			ranges: []
		}
	};

	reIdNodes();

	for(var i = 0; i < nodes.length; ++i) {
		var node = nodes[i];
		var jnode = {
			id: node.id,
			x: node.x,
			y: node.y,
			text: node.jsonText,
			width: node.width,
			height: node.height,
			type: node.type,
			color: node.color,
			scheme: node.scheme,
			visible: true
		};

		json.nodes.push(jnode);
		json.metadata.ranges.push(node.hasRange ? [node.start, node.end] : null);
		jnodes[jnode.id] = jnode;
	}

	for(var i = 0; i < edges.length; ++i) {
		var edge = edges[i];

		json.edges.push({
			from: jnodes[edge.start.id],
			to: jnodes[edge.end.id],
			visible: true
		});
	}

	return json;
}

function onSave() {
	var json = getJSON();

	var button = document.getElementById("saveButton");

	saveJSON(json, function(success) {
		if(success)
			button.style.backgroundColor = '#4bb543';
		else
			button.style.backgroundColor = '#ff0033';

		if(timeout != null)
			clearTimeout(timeout);

		timeout = setTimeout(function() {
			button.style.backgroundColor = '';
		}, 3000);
	}, function() {
		button.style.backgroundColor = '#ff7900';
	});
}

function onErase() {
	if(held instanceof Node)
		deleteNode(held);
	else if(held instanceof Edge) {
		var i = edges.indexOf(held);
		if(i == -1)
			return;

		edges.splice(i, 1);
	} else throw "Unsupported held type";

	held = null;

	do {
		var modified = 0;
		for(var i = 0; i < nodes.length; ++i) {
			if(nodes[i].type == 'I')
				continue;

			var foundStart = false;
			var foundEnd = false;
			for(var j = 0; j < edges.length; ++j) {
				if(edges[j].start == nodes[i])
					foundStart = true;
				else if(edges[j].end == nodes[i])
					foundEnd = true;
			}

			if(!foundStart || !foundEnd) {
				deleteNode(nodes[i--]);
				modified++;
			}
		}
	} while(modified > 0);

	onDraw();
	hideContextMenu();
}

function onEdit() {
	hideContextMenu();
	
	if(held.type == 'I')
		showEditNode(held.text);
	else
		showEditInference(held.jsonText);
}

function onEditInference(type) {
	switch(type) {
		case 'Default Inference':
			held.setScheme(InferenceNode.schemes.SUPPORT);
			break;
		case 'Default Conflict':
			held.setScheme(InferenceNode.schemes.ATTACK);
			break;
	}

	hideModal();
	onDraw();
}

function onEditNode(text) {
	held.setText(text);
	hideModal();
	onDraw();
}

function onDragText(x, y, selection) {
	clearSelection();
	if(selection == null)
		return;

	if(held)
		held.release();

	var node = new Node(x, y, selection.text, 'I');
	node.setRange(selection.start, selection.end);

	if(!node.isConflicting()) {
		nodes.push(node);
		node.hold();
		onDraw();
	}
}

function onLoad(json) {
	console.log(json);
	var ns = json['nodes'];

	for(var i = 0; i < ns.length; ++i) {
		var n = ns[i];

		var x = n['x'];
		var y = n['y'];
		var type = n['type'];
		var text = n['text'];

		switch(type) {
			case 'I':
				nodes.push(new Node(x, y, text, type));
				break;
			case 'RA':
				nodes.push(new InferenceNode(x, y, InferenceNode.schemes.SUPPORT));
				break;
			case 'CA':
				nodes.push(new InferenceNode(x, y, InferenceNode.schemes.ATTACK));
				break;
		}

		var metadata = json['metadata'];
		if(!metadata)
			continue;

		var ranges = metadata['ranges'];
		if(!ranges)
			continue;

		var range = ranges[i];
		if(!range)
			continue;

		nodes[nodes.length - 1].setRange(range[0], range[1]);
	}

	var es = json['edges'];

	for(var i = 0; i < es.length; ++i) {
		var e = es[i];

		var edge = new Edge(nodes[parseInt(e['from']['id'])]);
		edge.setEnd(nodes[parseInt(e['to']['id'])]);
		edges.push(edge);
	}

	onDraw();
}

function onExit() {
	var exitConfirmed = confirm('Tem a certeza que pretende sair? Qualquer alteração não guardada será perdida!');

	if(exitConfirmed)
		exit();
}

function onHelp() {
	showModal(modalHelp);
}