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

var action = null;

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

	if(held.start.type != 'I') {
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

	var middleX = (held.start.x + held.end.x)/2;
	var middleY = (held.start.y + held.end.y)/2;
	var inference = new InferenceNode(middleX, middleY, InferenceNode.schemes.SUPPORT);
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
	if(shift || held == node && Date.now() - heldSelectionTime < DOUBLE_CLICK_TIME || action == 'new_inference') {
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
	var text = getSelected();
	if(text != '') {
		onDragText(x, y, text);
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

	cancelActions();

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
	
	cancelActions();

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
	cancelActions();
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

function onSave() {
	cancelActions();
	var jnodes = {};

	var json = {
		nodes: [],
		edges: []
	};

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

	prompt('JSON:', JSON.stringify(json));
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

	do {
		var modified = 0;
		for(var i = 0; i < nodes.length; ++i) {
			if(nodes[i].type != 'RA')
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

function onDragText(x, y, text) {
	cancelActions();
	clearSelection();
	if(text == '')
		return;

	if(held)
		held.release();

	var node = new Node(x, y, text, 'I');
	nodes.push(node);
	node.hold();
	onDraw();
}

function cancelActions() {
	var button = document.getElementById("newInferenceButton");
	button.style.backgroundColor = '';

	action = null;
}

function onNewInference() {
	var button = document.getElementById("newInferenceButton");
	button.style.backgroundColor = 'green';

	action = 'new_inference';
}