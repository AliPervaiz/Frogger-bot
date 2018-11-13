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
	constructor(color, movingObjectGenerator)
	{
		this.color = color;
		this.movingObjectGenerator = movingObjectGenerator;
		this.cooldown = 0;

		//generate all initial moving objects
		if(movingObjectGenerator){
			this.children = [];
			let nextObject;
			do{
				nextObject = movingObjectGenerator();
				this.children.push(nextObject);
			}while(nextObject.cooldown==0);
			this.cooldown = nextObject.cooldown;
		}
	}
	
	draw(width, cellHeight){
		noStroke();
		fill(this.color);
		rect(-width/2, -.5, width, .5);
		
		if(this.movingObjectGenerator){
			//wait for the cooldown to reach 0. once it does, add a new moving object to children
			if(--this.cooldown <= 0){
				let nextObject = this.movingObjectGenerator();
				this.cooldown = nextObject.cooldown;
				this.children.push(nextObject);
			}

			//draw each child
			for(let i=this.children.length-1;i>-1;i--)
				children[i].draw();
		}

	}
	
	removeChild(){
		children.shift();
	}
}

/////////////////////
// M.O. GENERATORS //
/////////////////////

