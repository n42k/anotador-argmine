function Node(x, y, text, type) {
	this.x = Math.round(x);
	this.y = Math.round(y);

	this.setText(text);

	this.id = Node.nextId++;

	this.setType(type);

	this.textColor = '#000';
	this.focused = false;
	this.scheme = 0;
}

Node.MAX_WIDTH = 200;

Node.COLORS = {
	b: {
		fill: '#ddeef9',
		border: '#89c3ea',
		border_focus: '#3498db'
	},
	g: {
		fill: '#def8e9',
		border: '#86e2ad',
		border_focus: '#2ecc71'
	},
	r: {
		fill: '#fbdedb',
		border: '#f1958b',
		border_focus: '#e74c3c'
	}
};

Node.EPSILON = 0.001;
Node.BORDER_SIZE = 2;

Node.nextId = 0;

Node.prototype._drawRoundRect = function(x, y, w, h, b, r) {
	ctx.beginPath();
	ctx.moveTo(x + b, y);
	ctx.lineTo(x + w - b, y);
	ctx.arcTo(x + w, y, x + w, y + b, r);
	ctx.lineTo(x + w, y + h - b);
	ctx.arcTo(x + w, y + h, x + w - b, y + h, r);
	ctx.lineTo(x + b, y + h);
	ctx.arcTo(x, y + h, x, y + h - b, r);
	ctx.lineTo(x, y + b);
	ctx.arcTo(x, y, x + b, y, r);
	ctx.fill();
}

Node.prototype.draw = function() {
	var x = this.x;
	var y = this.y;
	var w = this.width;
	var h = this.height;
	var b = Node.BORDER_SIZE;
	var r = 4; // border radius

	var color = Node.COLORS[this.color];

	ctx.fillStyle = this.focused ? color.border_focus : color.border;
	this._drawRoundRect(x, y, w, h, b, r);

	ctx.fillStyle = color.fill;
	this._drawRoundRect(x + b, y + b, w - 2 * b, h - 2 * b, b, r);

	ctx.fillStyle = this.textColor;
	ctx.textAlign = 'center';
	for(var i = 0; i < this.lines.length; ++i) {
		ctx.fillText(this.lines[i], x + w/2, y + 25 + i * 20);
	}
}

Node.prototype._makeLines = function(text) {
	var width = 0;

	var wordI = 0;
	var words = text.split(' ');
	var lines = [];

	while(wordI != words.length) {
		var prevLine = '';
		var nextLine = '';

		do {
			prevLine = nextLine;

			if(wordI == words.length)
				break;

			var nextLine = prevLine + (prevLine == '' ? '' : ' ') + words[wordI++];
		} while(ctx.measureText(nextLine).width < Node.MAX_WIDTH - 20);

		var line = nextLine;
		if(wordI != words.length) {
			--wordI;
			line = prevLine;
		}
		
		lines.push(line);
	}

	return lines;
}

Node.prototype.hold = function() {
	held = this;
	this.focused = true;
}

Node.prototype.release = function() {
	held = null;
	this.focused = false;
}

Node.prototype.isInside = function(x, y) {
	return x > this.x - Node.EPSILON && x < this.x + this.width + Node.EPSILON &&
	       y > this.y - Node.EPSILON && y < this.y + this.height + Node.EPSILON;
}

Node.prototype.move = function(x, y) {
	this.x = x;
	this.y = y;
}

Node.prototype.getCenterX = function() {
	return this.x + this.width/2;
}

Node.prototype.getCenterY = function() {
	return this.y + this.height/2;
}

Node.prototype.setText = function(text) {
	this.text = text;
	this.jsonText = text;
	this.lines = this._makeLines(text);

	var emptySize = 16 + Node.BORDER_SIZE * 2;
	this.width = emptySize;
	for(var i = 0; i < this.lines.length; ++i) {
		var length = ctx.measureText(this.lines[i]).width + emptySize;
		if(length > this.width)
			this.width = length;
	}
	this.width = Math.ceil(this.width);
	this.height = this.lines.length * 20 + 20;
}

Node.prototype.setType = function(type) {
	this.type = type;
	switch(type) {
		case 'I': this.color = 'b'; break;
		case 'RA': this.color = 'g'; break;
		case 'CA': this.color = 'r'; break;
		default:
			console.log('Unknown node type');
	}
}

function InferenceNode(x, y, scheme) {
	Node.call(this, x, y, '', 'I');

	this.setScheme(scheme);
}

InferenceNode.prototype = Object.create(Node.prototype);

InferenceNode.prototype.setScheme = function(scheme) {
	this.scheme = scheme;
	switch(scheme) {
		case InferenceNode.schemes.SUPPORT:
			this.setType('RA');
			this.setText('Suporte');
			this.jsonText = 'Default Inference';
			break;
		case InferenceNode.schemes.ATTACK:
			this.setType('CA');
			this.setText('Ataque');
			this.jsonText = 'Default Conflict';
			break;
		default:
			throw "Invalid InferenceNode type";
			break;
	}
}

InferenceNode.schemes = {
	SUPPORT: 72,
	ATTACK: 71
}