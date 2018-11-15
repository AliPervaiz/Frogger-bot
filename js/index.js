
  /////////////
 // TERRAIN //
/////////////

const HORIZONTAL_CELLS = 15;
const CELL_SIZE = 50;

let GRASS_COLOR;
let FROG_COLOR;

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
			translate((HORIZONTAL_CELLS*CELL_SIZE)/2, 0);

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


		for(let i=0;i<HORIZONTAL_CELLS;i++){
			if(startCell <= i && i <= endCell)
				this.terrain.row[i] = 1;
		}

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

const PROB_ROAD = 0.5;

let createGrass;
let createRoad;

//World
class World{
	constructor(nTerrains){
		this.terrains = [];

		this.terrains.push(createGrass());
		
		for(let i=1;i<nTerrains;i++){
			if(Math.random()<PROB_ROAD){
				this.terrains.push(createRoad());
			}else{
				this.terrains.push(createGrass());
			}

		}
	}

	draw(){
		for(let i=0;i<this.terrains.length;i++){
			translate(0,CELL_SIZE);
			this.terrains[i].draw(width);
		}
		translate(0, -CELL_SIZE*this.terrains.length);
	}
}


let Car;
let terrainRoad;
let myWorld;

function setup() {
	FROG_COLOR = color(0,120,0);
	GRASS_COLOR = color(0,255,0);
	createCanvas(window.innerWidth, window.innerHeight);

	createGrass = function(){
		return new Terrain(GRASS_COLOR, null, 1);
	}

	createRoad = function(){
		let size = CELL_SIZE * ( 0.8 + Math.random()*1.5 );
		let minSeparation = 1 * size;
		let maxSeparation = 6 * size;
		let velocity = 0.75 + 1.5*Math.random();
		if(Math.random()<0.5)
			velocity *= -1;
		//let Car = getMovingObjectGenerator(CELL_SIZE*(size), minSeparation, maxSeparation, velocity, color(255,0,0));
		let Car = getMovingObjectGenerator((size), minSeparation, maxSeparation, velocity, color(255,0,0));
		return new Terrain(color(120), Car, 1);
	}

	myWorld = new World(10);
}

function draw() {
	background(GRASS_COLOR);
	noStroke();

	applyMatrix();
	translate(width/2, height*2/3);
	scale(1,-1);
	myWorld.draw();

	resetMatrix();
	
	
	fill(0);
	rect(0,0,width/2-CELL_SIZE*HORIZONTAL_CELLS/2,height);
	rect(width/2+CELL_SIZE*HORIZONTAL_CELLS/2,0,width/2-CELL_SIZE*HORIZONTAL_CELLS/2,height);
	
}

//////////////////////
//       FROG       //
//////////////////////

const DELAY_TIME = 1000;

class Frog {
	constructor(x, y)
	{
		this.x = x;
		this.y = y;
		this.delay = DELAY_TIME;
	}
	
	up(){
		if(delayDone())
			y++;
	}

	down(){
		if(y != 0 && delayDone())
			y--;
	}
	
	right(){
		if(x != HORIZONTAL_CELLS && delayDone())
			x++;
	}
	
	left(){
		if(x != 0 && delayDone())
			x--;
	}
	
	delayDone(){
		return this.delay > 0;
	}
	
	draw(){
		delay--;
		fill(0,255,0);
		let x_tSpace = (x-HORIZONTAL_CELLS/2)*CELL_SIZE
		rect(x_tSpace, 0, CELL_SIZE, CELL_SIZE);
	}
}