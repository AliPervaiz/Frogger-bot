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

/////////////
// TERRAIN //
/////////////

class Terrain
{
	constructor(color, movingObject)
	{
		this.color = color;
		this.movingObject = movingObject;
		this.children = [];
	}
	
	draw(width, cellHeight){
		noStroke();
		fill(this.color);
		rect(-width/2, 0, width, 1);
		
		if(this.movingObject){
			
		}
	}
	
	removeChild(){
		children.shift();
	}
}