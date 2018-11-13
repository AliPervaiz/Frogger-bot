function setup() {
  createCanvas(window.innerWidth, window.innerHeight);
  background('#006600');
}

function draw() {
	var c = color(153, 153, 153);
	fill(c);
	noStroke();
  rect(0, 500, window.innerWidth, 100);
}