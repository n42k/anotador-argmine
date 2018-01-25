function Node(x, y, text, type) {
	this.x = Math.round(x);
	this.y = Math.round(y);

	this.setText(text);

	this.id = Node.nextId++;

	this.type = type;
	switch(type) {
		case 'I':
			this.fillColor = Node.NORMAL_FILL_COLOR;
			this.borderColor = Node.NORMAL_BORDER_COLOR;
			this.color = 'b';
			break;
		case 'RA':
			this.fillColor = Node.INFERENCE_FILL_COLOR;
			this.borderColor = Node.INFERENCE_BORDER_COLOR;
			this.color = 'g';
			break;
		default:
			console.log('Unknown node type');
	}

	this.textColor = '#000';
}

Node.MAX_WIDTH = 200;

Node.NORMAL_FILL_COLOR = '#ddeef9';
Node.NORMAL_BORDER_COLOR = '#89c3ea';
Node.NORMAL_BORDER_FOCUS_COLOR = '#3498db';

Node.INFERENCE_FILL_COLOR = '#def8e9';
Node.INFERENCE_BORDER_COLOR = '#86e2ad';
Node.INFERENCE_BORDER_FOCUS_COLOR = '#2ecc71';

Node.EPSILON = 0.001;

Node.nextId = 0;

Node.prototype.draw = function() {
	ctx.fillStyle = this.borderColor;
	ctx.fillRect(this.x, this.y, this.width, this.height);

	ctx.fillStyle = this.fillColor;
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
	switch(this.type) {
		case 'I':
			this.borderColor = Node.NORMAL_BORDER_FOCUS_COLOR;
			break;
		case 'RA':
			this.borderColor = Node.INFERENCE_BORDER_FOCUS_COLOR;
			break;
	}
}

Node.prototype.release = function() {
	held = null;
	switch(this.type) {
		case 'I':
			this.borderColor = Node.NORMAL_BORDER_COLOR;
			break;
		case 'RA':
			this.borderColor = Node.INFERENCE_BORDER_COLOR;
			break;
	}
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