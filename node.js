function Node(x, y, text, type) {
	this.x = Math.round(x);
	this.y = Math.round(y);

	this.setText(text);

	this.id = Node.nextId++;

	this.setType(type);

	this.textColor = '#000';
	this.focused = false;
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

Node.nextId = 0;

Node.prototype.draw = function() {
	var color = Node.COLORS[this.color];

	ctx.fillStyle = this.focused ? color.border_focus : color.border;
	ctx.fillRect(this.x, this.y, this.width, this.height);

	ctx.fillStyle = color.fill;
	ctx.fillRect(this.x + 2, this.y + 2, this.width - 4, this.height - 4);

	ctx.fillStyle = this.textColor;
	ctx.textAlign = 'center';
	for(var i = 0; i < this.lines.length; ++i) {
		ctx.fillText(this.lines[i], this.x + this.width/2, this.y + 25 + i * 20);
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
	this.lines = this._makeLines(text);

	this.width = 20;
	for(var i = 0; i < this.lines.length; ++i) {
		var length = ctx.measureText(this.lines[i]).width + 20;
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