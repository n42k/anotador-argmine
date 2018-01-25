var nodes = [];
var edges = [];

var held = null;
var heldOffsetX = 0;
var heldOffsetY = 0;
var dragging = false;

function getNodeAt(x, y) {
	for(var i = nodes.length - 1; i != -1; --i)
		if(nodes[i].isInside(x, y))
			return nodes[i];
	return null;
}

function addPermanentEdge(node) {
	if(held == null || !(held instanceof Edge) || node == null)
		return false;

	held.setEnd(node);
	var middleX = (held.start.x + held.end.x)/2;
	var middleY = (held.start.y + held.end.y)/2;
	var inference = new Node(middleX, middleY, 'Default Inference', 'RA');
	nodes.push(inference);

	var edge1 = new Edge(held.start);
	edge1.setEnd(inference);
	edges.push(edge1);
	var edge2 = new Edge(inference);
	edge2.setEnd(held.end);
	edges.push(edge2);

	held.release();
	onDraw();
	return true;
}

function showContextMenu(x, y) {
	contextMenu.style.display = 'block';
	contextMenu.style.left = x + 'px';
	contextMenu.style.top = y + 'px';
}

function hideContextMenu() {
	contextMenu.style.display = 'none';
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
	for(var i = 0; i < edges.length; ++i)
		edges[i].draw();
	for(var i = 0; i < nodes.length; ++i)
		nodes[i].draw();
}

function onPress(x, y, shift) {
	hideContextMenu();

	var node = getNodeAt(x, y);
	if(addPermanentEdge(node))
		return;

	// if shift is pressed, and we're inside a node,
	// begin creating a new edge
	if(shift) {
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
		if(held)
			held.release();

		var node = new Node(x, y, text, 'I');
		nodes.push(node);
		node.hold();
		onDraw();
		return;
	}

	// if we clicked on a node, select it
	if(node != null) {
		if(held)
			held.release();

		node.hold();
		heldOffsetX = node.x - x;
		heldOffsetY = node.y - y;
		dragging = true;
		onDraw();
		return;
	}

	// if we clicked on nothing, unselect the current node
	if(held == null)
		return;

	held.release();

	onDraw();
}

function onRelease(x, y, shift) {
	dragging = false;

	if(held != null && held instanceof Edge) {
		var node = getNodeAt(x, y);
		if(addPermanentEdge(node))
			return;
		held.release();
		onDraw();
	}
}

function onMove(x, y, shift) {
	if(held == null || !dragging)
		return;

	held.move(x + heldOffsetX, y + heldOffsetY);
	onDraw();
}

function onRightClick(x, y, shift) {
	var node = getNodeAt(x, y);

	if(node == null)
		return;

	if(held)
		held.release();

	node.hold();
	onDraw();
	showContextMenu(x, y);
}

function onSave() {
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
			text: node.text,
			width: node.width,
			height: node.height,
			type: node.type,
			color: node.color,
			scheme: 72,
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
	deleteNode(held);

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
	
	var newText = prompt('Editar:', held.text);
	if(newText == null)
		return;

	held.setText(newText);
	onDraw();
}