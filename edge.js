function Edge(node) {
	this.start = node;
	this.end = null;
	this.id = Edge.nextId++;
}

Edge.nextId = 0;

Edge.prototype.setEndXY = function(x, y) {
	this.end = new _End(x, y);
}

Edge.prototype.setEnd = function(node) {
	if(this.start == node)
		throw "Edge can't have equal start and end nodes.";

	this.end = node;
}

Edge.prototype._drawTriangle = function() {
	ctx.beginPath();
	ctx.moveTo(-5, -5);
	ctx.lineTo(5, 0);
	ctx.lineTo(-5, 5);
	ctx.closePath();
	ctx.fill();
}

Edge.prototype._lineIntersect = function(Sx, Sy, dx, dy, Ex, Ey, vx, vy) {
	var divisor = vx * dy - vy * dx;

	if(divisor == 0)
		return null;

	var j = (Ey * dx - Ex * dy + Sx * dy - Sy * dx) / divisor;

	return {
		x: Ex + j * vx,
		y: Ey + j * vy
	}
}

Edge.prototype._distance = function(x1, y1, x2, y2) {
	return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

Edge.prototype.draw = function() {
	if(this.end == null)
		return;

	var SCx = this.start.getCenterX();
	var SCy = this.start.getCenterY();
	var ECx = this.end.getCenterX();
	var ECy = this.end.getCenterY();

	// draw line of the edge
	ctx.beginPath();
	ctx.moveTo(SCx, SCy);
	ctx.lineTo(ECx, ECy);
	ctx.stroke();

	// draw arrow of the edge
	ctx.save();

	var Sx = this.start.x;
	var Sy = this.start.y;
	var Ex = this.end.x;
	var Ey = this.end.y;

	var dx = ECx - SCx;
	var dy = ECy - SCy;
	var angle = Math.atan2(dy, dx);

	if(this.end instanceof Node) {
		var w = this.end.width;
		var h = this.end.height;

		// cp stands for closest point
		var cp = this._lineIntersect(SCx, SCy, dx, dy, Ex, Ey, 1, 0);
		if(cp && !this.end.isInside(cp.x, cp.y))
			cp = null;

		// p stands for point
		var p = this._lineIntersect(SCx, SCy, dx, dy, Ex, Ey, 0, 1);
		if(cp == null)
			cp = p;
		else if(p != null && this._distance(SCx, SCy, p.x, p.y) < this._distance(SCx, SCy, cp.x, cp.y) && this.end.isInside(p.x, p.y))
			cp = p;

		p = this._lineIntersect(SCx, SCy, dx, dy, Ex + w, Ey + h, 1, 0);
		if(cp == null)
			cp = p;
		else if(p != null && this._distance(SCx, SCy, p.x, p.y) < this._distance(SCx, SCy, cp.x, cp.y) && this.end.isInside(p.x, p.y))
			cp = p;

		p = this._lineIntersect(SCx, SCy, dx, dy, Ex + w, Ey + h, 0, 1);
		if(cp == null)
			cp = p;
		else if(p != null && this._distance(SCx, SCy, p.x, p.y) < this._distance(SCx, SCy, cp.x, cp.y) && this.end.isInside(p.x, p.y))
			cp = p;

		if(cp == null || !this.end.isInside(cp.x, cp.y)) {
			ctx.restore();
			return;
		}

		var dist = this._distance(0, 0, dx, dy);
		var ndx = dx/dist;
		var ndy = dy/dist;

		ctx.translate(cp.x - 5 * ndx, cp.y - 5 * ndy);
	} else
		ctx.translate(ECx, ECy);

	ctx.rotate(angle);
	this._drawTriangle();
	ctx.restore();
}

Edge.prototype.isInside = function(x, y) {
	var SCx = this.start.getCenterX();
	var SCy = this.start.getCenterY();
	var ECx = this.end.getCenterX();
	var ECy = this.end.getCenterY();

	var dx = ECx - SCx;
	var dy = ECy - SCy;

	var p = this._lineIntersect(SCx, SCy, dx, dy, x, y, dx, -dy);

	return this._distance(x, y, p.x, p.y) < 5;
}

Edge.prototype.hold = function() {
	held = this;
}

Edge.prototype.release = function() {
	held = null;
}

Edge.prototype.delete = function() {
	var i = edges.indexOf(held);
	if(i > -1)
		edges.splice(i, 1);

}

Edge.prototype.move = function(x, y) {
	this.setEndXY(x, y);
}

function _End(x, y) {
	this.x = x;
	this.y = y;
}

_End.prototype.getCenterX = function() {
	return this.x;
}

_End.prototype.getCenterY = function() {
	return this.y;
}
