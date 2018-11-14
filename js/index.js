
/////////////
// TERRAIN //
/////////////

const HORIZONTAL_CELLS = 15;
const CELL_SIZE = 50;

const NOTHING = 0;
const CAR = 1;
const WATER = 2;
const LOG = 3;

class Terrain
{
	constructor(color, MovingObject, flag)
	{
		this.color = color;
		this.MovingObject = MovingObject;
		this.cooldown = 0;
		this.flag = flag;	//flag can either be nothing (0), car (1), water (2), or log (3)
		this.row = [];		//row is the terrain's section of the grid that contains flags

		//generate all initial moving objects
		if(MovingObject){
			this.children = [];
			MovingObject.fill(this);
			this.cooldown = this.children[this.children.length-1].cooldown;
		}
	}
	
	draw(canvasWidth){
		noStroke();
		fill(this.color);
		rect(-canvasWidth/2, 0, canvasWidth, CELL_SIZE);

		for(let i=0;i<HORIZONTAL_CELLS;i++)
			this.row[i] = 0;
		
		if(this.MovingObject){
			//wait for the cooldown to reach 0. once it does, add a new moving object to children
			if(--this.cooldown <= 0){
				let nextObject = new this.MovingObject(this);
				this.cooldown = nextObject.cooldown;
				this.children.push(nextObject);
			}


			//draw each child
			for(let i=this.children.length-1;i>-1;i--)
				this.children[i].draw();
			
			fill(255,0,0,100);

			translate(-(HORIZONTAL_CELLS*CELL_SIZE)/2, 0);
			for(let i=0;i<HORIZONTAL_CELLS;i++){
				if(this.row[i]==1){
					rect(i*CELL_SIZE, 0, CELL_SIZE, CELL_SIZE);
				}
			}
		}
	}
	
	removeChild(){
		this.children.shift();
	}
}

/////////////////////
// M.O. GENERATORS //
/////////////////////


function getMovingObjectGenerator(width, minSeparation, maxSeparation, velocity, color){
	function randomCooldown(){
		return Math.ceil((Math.random()*(maxSeparation-minSeparation)+minSeparation)/Math.abs(velocity));
	}

	let MovingObject = function(terrain){
		this.terrain = terrain;
		this.cooldown = randomCooldown();
		this.x = (-HORIZONTAL_CELLS*CELL_SIZE-width)/2;
		if(velocity<0)
			this.x*=-1;
	}

	MovingObject.prototype.draw = function(){
		this.x += velocity;
		if(Math.abs(this.x) > (HORIZONTAL_CELLS/2+5)*CELL_SIZE){
			this.terrain.removeChild();
			return;
		}
		
		let startCell = Math.floor((this.x+HORIZONTAL_CELLS*CELL_SIZE/2-width/2)/CELL_SIZE);
		let endCell = Math.floor((this.x+HORIZONTAL_CELLS*CELL_SIZE/2+width/2)/CELL_SIZE);

		console.log(startCell, endCell);

		for(let i=0;i<HORIZONTAL_CELLS;i++){
			if(startCell <= i && i <= endCell)
				this.terrain.row[i] = 1;
		}
		console.log(this.terrain.row);

		fill(color);
		noStroke();
		rect(this.x-width/2, 3, width, CELL_SIZE-6);
	}

	MovingObject.fill = function(terrain){
		let maxX = (HORIZONTAL_CELLS*CELL_SIZE+width)/2;
		let movingObject = new MovingObject(terrain);
		for(let lastX = -maxX; lastX<maxX; lastX+=Math.abs((movingObject = new MovingObject(terrain)).cooldown*velocity)){
			movingObject.x = lastX;
			if(velocity>0)
				terrain.children.unshift(movingObject);
			else
				terrain.children.push(movingObject);
		}
	}

	return MovingObject;
}


let Car;
let Car2;
let terrainRoad;
let terrainRoad2;

function setup() {
	createCanvas(window.innerWidth, window.innerHeight);
	background('#006600');
	Car = getMovingObjectGenerator(CELL_SIZE*.8, 70, 300, 0.75, color(255, 0, 0));
	terrainRoad = new Terrain(color(200, 200, 200), Car, 0);

	Car2 = getMovingObjectGenerator(CELL_SIZE*1.2, 70, 500, -1.25, color(255, 255, 0));
	terrainRoad2 = new Terrain(color(150, 150, 150), Car2, 0);
}

function draw() {
	var c = color(153, 153, 153);
	fill(c);
	noStroke();
	
	applyMatrix();
		translate(width/2, CELL_SIZE*4);
		terrainRoad.draw(width);
	resetMatrix();

	applyMatrix();
		translate(width/2, CELL_SIZE*6);
		terrainRoad2.draw(width);
	resetMatrix();
	
	applyMatrix();
		translate(width/2-CELL_SIZE*HORIZONTAL_CELLS/2, 0);
		stroke(0);
		strokeWeight(2);
		for(let i=0;i<=HORIZONTAL_CELLS;i++){
			line(i*CELL_SIZE,0, i*CELL_SIZE, height);
		}
	resetMatrix();
}
  