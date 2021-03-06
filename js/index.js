// TODO:
// 1. Fitness function
// 2. Get mutant of frog player

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
		this.terrain.velocity=velocity;
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
//a new world should be created for each generation
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
		if(controller.getBestFrog() + 10 > this.terrains.length){
			if(Math.random()<PROB_ROAD){
				this.terrains.push(createRoad());
			}else{
				this.terrains.push(createGrass());			   
			}
		}
		for(let i=0;i<this.terrains.length;i++){
			translate(0,CELL_SIZE);
			this.terrains[i].draw(width);
		}
		translate(0, -CELL_SIZE*this.terrains.length);
	}

	isPositionClear(x,y){
		return this.terrains[y].row[x]==0;
	}
}

//////////////////////
//       FROG       //
//////////////////////

const DELAY_TIME = 10;

//the frog class only displays the frog; the frog player handles logic.
class Frog {
	constructor(x, y)
	{
		this.x = x;
		this.y = y;
		this.delay = DELAY_TIME;
		this.isDead = false;
	}
	
	up(){
		if(this.delayDone()){
			this.y++;
			this.delay = DELAY_TIME;
		}
	}

	down(){
		if(this.y != 0 && this.delayDone()){
			this.y--;
			this.delay = DELAY_TIME;
		}
	}
	
	right(){
		if(this.x != HORIZONTAL_CELLS-1 && this.delayDone()){
			this.x++;
			this.delay = DELAY_TIME;
		}
	}
	
	left(){
		if(this.x != 0 && this.delayDone()){
			this.x--;
			this.delay = DELAY_TIME;
		}
	}

	die(){
		this.isDead = true;
	}
	
	delayDone(){
		return this.delay <= 0;
	}
	
	draw(){
		this.delay--;
		if(this.isDead)
			fill(255,0,0);
		else
			fill(FROG_COLOR);
		let x_tSpace = (this.x-HORIZONTAL_CELLS/2)*CELL_SIZE
		translate(0, CELL_SIZE*(this.y+1));
		rect(x_tSpace, 0, CELL_SIZE, CELL_SIZE);
		translate(0, -CELL_SIZE*(this.y+1));
	}
}

const GRID_WIDTH = 2;
const GRID_HEIGHT = 3;

const TYPE_POS_VEL = 1;
const TYPE_NEG_VEL = 2;
const TYPE_WALL = 3;

//grid stores data about the environment. a grid is associated with each frog player
class Grid{
	constructor(type){
		this.spots = [];
		this.type = type;
	}

	int_evaluateVelocity(world, x, y, vel){
		const xStart = x-GRID_WIDTH;
		const xEnd = x+GRID_WIDTH;
		const yStart = y-GRID_HEIGHT;
		const yEnd = y+GRID_HEIGHT;
		let arrayIndex = 0;
		for(let j=yStart;j<=yEnd;j++){
			if(j<0||j>world.terrains.length-1||world.terrains[j].velocity!=vel){
				for(let i=xStart;i<xEnd;i++){
					this.spots[arrayIndex++] = 0;
				}
			}else
				for(let i=xStart;i<=xEnd;i++){
					if(i<0||i>HORIZONTAL_CELLS-1||world.terrains[j].row[i]==0)
						this.spots[arrayIndex++] = 0;
					else{
						this.spots[arrayIndex++] = 1;
					}
				}
		}
	}

	int_evaluateWall(world, x, y){
		const xStart = x-GRID_WIDTH;
		const xEnd = x+GRID_WIDTH;
		const yStart = y-GRID_HEIGHT;
		const yEnd = y+GRID_HEIGHT;
		let arrayIndex = 0;
		for(let j=yStart;j<=yEnd;j++){
			if(j<0||j>world.terrains.length-1){
				for(let i=xStart;i<xEnd;i++){
					this.spots[arrayIndex++] = 1;
				}
			}else
				for(let i=xStart;i<=xEnd;i++){
					if(i<2||i>HORIZONTAL_CELLS-3)
						this.spots[arrayIndex++] = 1;
					else
						this.spots[arrayIndex++] = 0;
				}
		}
	}

	//fill grid spaces with appropriate values
	evaluate(world, x, y){
		switch(this.type){
		case TYPE_POS_VEL:
			this.int_evaluateVelocity(world, x, y, 1);
			break;	
		case TYPE_NEG_VEL:
			this.int_evaluateVelocity(world, x, y, -1);
			break;
		case TYPE_WALL:
			this.int_evaluateWall(world,x,y);
			break;
		}
	}
}

const INPUT_SIZE = (GRID_HEIGHT*2+1)*(GRID_WIDTH*2+1)*3;
const OUTPUT_SIZE = 5;
const N_INTERMEDIATE_LAYERS = 2;

function activationFunction(inputs, bias) {
	let sum = 0;
	for(let input of inputs){
		sum+= input;
	}
	sum+= bias;
	return Math.tanh(sum);
}

function getRand(){
	return 2*Math.random() - 1;
}

let nextNeuronId = 0;
class Neuron {
	constructor() {
		this.activation = 0;
		this.feeders = [];
		this.bias = getRand();
		this.id = nextNeuronId++;
	}

	calc() {
		this.activation = activationFunction(this.feeders.map(feeder => feeder[0].activation*feeder[1]), this.bias);
	}

	addAxon(feederNeuron, weight){
		this.feeders.push([feederNeuron, weight]);
		return [this,this.feeders.length-1];
	}

	clone(neuronMapping){
		let returner = new Neuron();
		returner.bias = this.bias;
		this.feeders.forEach((feeder)=>{
			returner.feeders.push([neuronMapping[feeder[0].id], feeder[1]]);
		});
		return returner;
	}
}

class NeuralNet{

	constructor(){
		this.neuronLayers = [];
		this.axons = [];

		let firstLayer = [];
		for (let i = 0; i < INPUT_SIZE; i++) {
			firstLayer.push(new Neuron());
		}
		this.neuronLayers.push(firstLayer);
		
		//initialize neuron layers
		for(let i=0;i<N_INTERMEDIATE_LAYERS;i++)
			this.neuronLayers.push([]);
		
		//initialize last layer & set output neuron biases
		let lastLayer = []; for(let i=0;i<OUTPUT_SIZE;i++){ lastLayer.push(new Neuron()); }
		this.neuronLayers.push(lastLayer);
	
	}

	//feeds the neural network with input data from grids
	//should return 5 outputs
	feed(grids){
		//set the first layer's neuron activations
		grids.forEach((grid, i)=>{
			grid.spots.forEach((num, j)=>{
				this.neuronLayers[0][i*grid.spots.length+j].activation = num;
			});
		});

		//calculate the following layers' neurons' activations
		this.neuronLayers.forEach((neuronLayer, layerIndex) => {
			if (layerIndex > 0)
				neuronLayer.forEach(neuron => neuron.calc());
		});
		//return output activations
		return this.neuronLayers[this.neuronLayers.length - 1].map(neuron => neuron.activation);
	}


	//returns a mutated clone of this
	getMutant(){
		let returner = this.clone();
		
		let numCreations = Math.ceil((Math.random()-0.8)*5);
		if(numCreations>0)
			for(let i=0;i<numCreations;i++)
				returner.createNeuron();
		
		let numNeuronModifies = Math.ceil((Math.random()-0.5)*5);
		if(numNeuronModifies>0)
			for(let i=0;i<numNeuronModifies;i++)
				returner.modifyNeuron();

		let numNeuronNudges = Math.ceil((Math.random()-0.5)*5);
		if(numNeuronNudges>0)
			for(let i=0;i<numNeuronNudges;i++)
				returner.nudgeNeuron();
		
		let numNudges = Math.ceil((Math.random()-0.3)*10);
		if(numNudges>0)
			for(let i=0;i<numNudges;i++)
				returner.nudgeAxon();
		
		let numModifications = Math.ceil((Math.random()-0.5)*5);
		if(numModifications>0)
			for(let i=0;i<numModifications;i++)
				returner.modifyAxon();
		
		let numCreationsAxon = Math.ceil((Math.random()-0.5)*5);
		if(numCreationsAxon>0)
			for(let i=0;i<numCreationsAxon;i++)
				returner.createAxon();
		
		let numRemoveAxons = Math.ceil((Math.random()-0.8)*5);
		if(numRemoveAxons>0)
			for(let i=0;i<numRemoveAxons;i++)
				returner.removeAxon();
		
		return returner;
	}

	//returns total number of neurons
	getTotalNeurons(startLayer, endLayer){
		let sum = 0;
		for(let i=startLayer;i<endLayer;i++)
			sum+=this.neuronLayers[i].length;
		return sum;
	}

	//returns a random neuron between a range of layers (inclusive, exclusive)
	getRandomNeuron(startLayer, endLayer){
		let numNeurons = this.getTotalNeurons(startLayer,endLayer);
		let index = Math.floor(Math.random()*numNeurons);
		let cIndex = 0;
		let layerIndex = startLayer;
		let nIndex = 0;
		let neuron;
		while(true){
			cIndex+=this.neuronLayers[layerIndex].length;
			if(index>=cIndex){
				layerIndex++;
				continue;
			}
			cIndex-=this.neuronLayers[layerIndex].length;
			nIndex = index-cIndex;
			neuron = this.neuronLayers[layerIndex][nIndex];
			break;
		}
		return [neuron, layerIndex, nIndex];
	}

	//mutaion functions

	//randomly creates an axon between neurons
	createAxon(){
		let endNeuron = this.getRandomNeuron(1,this.neuronLayers.length);
		let startNeuron = this.getRandomNeuron(0,endNeuron[1]);

		this.axons.push(endNeuron[0].addAxon(startNeuron[0], getRand()));
	}

	//nudges the weight value of a random axon by a small amount
	nudgeAxon(){
		if(this.axons.length==0)
			return;
		let i = Math.floor(Math.random()*this.axons.length);
		let axon = this.axons[i];
		let nudgeAmount = Math.random()>0.5?0.2:-0.2;
		axon[0].feeders[axon[1]][1]+=nudgeAmount;
	}

	//changes the value of a random axon's weight value to a random amount
	modifyAxon(){
		if(this.axons.length==0)
			return;
		let i = Math.floor(Math.random()*this.axons.length);
		let axon = this.axons[i];
		axon[0].feeders[axon[1]][1]=getRand();
	}

	//remvoe an axon from the net
	removeAxon(){
		if(this.axons.length==0)
			return;
		let i = Math.floor(Math.random()*this.axons.length);
		let axon = this.axons[i];

		axon[0].feeders.splice(axon[1],1);
		this.axons.splice(i,1);
		for(let i=0;i<this.axons.length;i++){
			let otherAxon = this.axons[i];
			if(otherAxon[0]==axon[0] && otherAxon[1]>axon[1])
				otherAxon[1]--;
		}
	}

	//creats a neuron at a random layer
	createNeuron(){
		let neuron = new Neuron();
		let layerIndex = 1+Math.floor(Math.random()*N_INTERMEDIATE_LAYERS);
		this.neuronLayers[layerIndex].push(neuron);
	}

	//modifies a neuron's bias
	modifyNeuron(){
		this.getRandomNeuron(1, this.neuronLayers.length).bias = getRand();
	}

	//modifies a neuron's bias
	nudgeNeuron(){
		let i = Math.floor(Math.random()*this.axons.length);
		let nudgeAmount = Math.random()>0.5?0.2:-0.2;
		this.getRandomNeuron(1, this.neuronLayers.length).bias += nudgeAmount;
	}

	//returns a clone of this neural net
	clone(){
		let neuronMapping = {};
		let positionMapping = {};
		for(let i=0;i<this.neuronLayers.length;i++){
			let neuronLayer = this.neuronLayers[i];
			for(let j=0;j<neuronLayer.length;j++){
				let neuron = neuronLayer[j];
				neuronMapping[neuron.id] = neuron.clone(neuronMapping);
				positionMapping[neuronMapping[neuron.id].id] = [i,j];
			}
		}

		let returner = new NeuralNet();

		for(let newNeuron of Object.values(neuronMapping)){
			let position = positionMapping[newNeuron.id];
			returner.neuronLayers[position[0]][position[1]]=newNeuron;
		}
		for(let oldAxon of this.axons){
			let newAxon = [
				neuronMapping[oldAxon[0].id],
				oldAxon[1]
			];
			returner.axons.push(newAxon);
		}

		return returner;
	}
}


const FROG_TIMEOUT = 700;

class FrogPlayer{
	constructor(neuralNet){
		this.data = [
			new Grid(TYPE_POS_VEL),
			new Grid(TYPE_NEG_VEL),
			new Grid(TYPE_WALL)
		];
		this.neuralNet = neuralNet;
		this.wasDead = false;
		this.timer = 0;
		this.fitness = 0;
		this.reset();
	}

	reset(world){
		this.world = world;
		this.frog = new Frog(Math.floor(HORIZONTAL_CELLS/2),0);
		this.maxY = this.frog.y;
		this.wasDead = false;
		this.timer = 0;
	}

	//returns true if not dead
	draw(){
		if(this.frog.isDead){
			if(!this.frog.wasDead){
				this.frog.wasDead = true;
				//this is when the frog dies
				this.fitness += this.frog.y;
			}
			return false;
		}

		this.data.forEach(grid=>grid.evaluate(this.world, this.frog.x, this.frog.y));
		let output = this.neuralNet.feed(this.data);	//feed neural network grid data
		
		//calculate max index of output (this will be used to determine which move to make)
		let max = -999;									
		let maxIndex = -1;
		output.forEach((value, index)=>{
			if(value>max){
				max = value;
				maxIndex = index;
			}
		});

		this.frog.draw();
		
		if(!this.world.isPositionClear(this.frog.x, this.frog.y) || this.shouldTerminate()){
			this.frog.die();
		}
		if(this.shouldTerminate()){
			this.frog.die();
		}
		
		//then, move the frog based on the output
		switch(maxIndex){
		case 0:
			this.frog.left();
			break;
		case 1:
			this.frog.right();
			break;
		case 2:
			this.frog.up();
			if(this.frog.y > this.maxY){
				this.maxY = this.frog.Y;
				this.timer = 0;
			}
			break;
		case 3:
			this.frog.down();
			break;
		case 4:
			//frog doesn't move
			break;
		}

		return true;
	}

	getFitness(){
		return this.fitness;
	}

	//called if the frog hasn't made progress
	shouldTerminate() {
		if(this.timer++ > FROG_TIMEOUT){
			return true;
		}
		return false;
	}

	getMutant() {
		return new FrogPlayer(this.neuralNet.getMutant());
	}

}

let Car;
let terrainRoad;
let controller;
var running = false;

const POPULATION_SIZE = 400;

function setup() {
	FROG_COLOR = color(0,120,0);
	GRASS_COLOR = color(0,255,0);
	createCanvas(window.innerWidth, window.innerHeight);
	createGrass = function(){
		return new Terrain(GRASS_COLOR, null, 1);
	}

	createRoad = function(){
		//let size = CELL_SIZE * ( 0.8 + Math.random()*1.5 );
		let size = CELL_SIZE * (1.5);
		let minSeparation = 2 * size;
		let maxSeparation = 6 * size;
		//let velocity = 0.75 + 1.5*Math.random();
		let velocity = 1.0;
		if(Math.random()<0.5)
			velocity *= -1;
		//let Car = getMovingObjectGenerator(CELL_SIZE*(size), minSeparation, maxSeparation, velocity, color(255,0,0));
		let Car = getMovingObjectGenerator((size), minSeparation, maxSeparation, velocity, color(255,0,0));
		return new Terrain(color(120), Car, 1);
	}
	
	controller = new Controller(POPULATION_SIZE, new World(10));
}

let bestY;

function draw() {
	background(GRASS_COLOR);
	noStroke();

	applyMatrix();
	translate(width/2, height*2/3);
	scale(1,-1);
	
	var y = controller.getBestFrog();
	bestY = y;
	translate(0, -CELL_SIZE*y);
	controller.draw();
	translate(0, CELL_SIZE*y);

	resetMatrix();
	
	
	fill(0);
	rect(0,0,width/2-CELL_SIZE*HORIZONTAL_CELLS/2,height);
	rect(width/2+CELL_SIZE*HORIZONTAL_CELLS/2,0,width/2-CELL_SIZE*HORIZONTAL_CELLS/2,height);

	fill(255);
	textSize(30);
	textAlign(LEFT, TOP);
	text(`Generation ${controller.genNumber+1} - ${controller.roundNumber}`, 30, 30);
	text(`Dist: ${y}`, 30, 80);
	text(`# Alive: ${controller.alive}`, 30, 130);
	controller.drawStats();
}

function maxFrogComparator(currentBest, newFrogPlayer){
	if(currentBest.getFitness()<newFrogPlayer.getFitness())
		return newFrogPlayer;
	else return currentBest;
}

const HISTORIAN_WIDTH = 300;
class Controller{
	constructor(n, world){
		this.world = world;
		this.frogs = this.createPopulation(n);
		this.running = false;
		this.genNumber = 0;
		this.alive = 0;
		this.historian = createGraphics(HISTORIAN_WIDTH, POPULATION_SIZE);
		this.historian.background(0);
		this.frameNumber = 0;
		this.roundNumber = 0;
	}
	
	createPopulation(n){
		var frogs = [];
		for(var i = 0;i<n;i++){
			var frog = new FrogPlayer(new NeuralNet());
			frog.reset(this.world);
			frogs.push(frog);
			//console.log(frogs[i]);
		}
		return frogs;
	}

	nextRound(){
		this.setWorld(new World(10));
		this.frameNumber = 0;
		this.historian.background(0);
		this.roundNumber++;
		this.frogs.forEach(frog=>frog.reset(this.world));
	}

	nextGeneration(){
		this.roundNumber=0;
		let newFrogs = [];
		let maxFitness = this.frogs.reduce(maxFrogComparator).getFitness();
		
		while(newFrogs.length < POPULATION_SIZE){
			const oldFrog = this.frogs[Math.floor(Math.random()*POPULATION_SIZE)];
			if(Math.random()*maxFitness-0.07<=oldFrog.getFitness()){
				let newFrog = oldFrog.getMutant();
				newFrog.reset(this.world);
				newFrogs.push(newFrog);
			}
		}
		this.frogs = newFrogs;
		this.genNumber++;
	}
	
	setWorld(world){
		this.world = world;
	}
	
	/*
		Returns the best y value out of all the frogs (furthest frog)
	*/
	getBestFrog(){
		var best = 0;
		for(var i = 0;i<this.frogs.length;i++){
			if(this.frogs[i].frog.y > best && !this.frogs[i].frog.isDead){
				best = this.frogs[i].frog.y;
			}
		}
		return best;
	}
	
	draw(){
		this.alive = 0;
		this.world.draw();
		let stillFrogsLeft = false;
		for(var i = 0;i<this.frogs.length;i++){
			let isAlive = this.frogs[i].draw();
			if(isAlive)
				this.alive++;
			stillFrogsLeft = isAlive || stillFrogsLeft;
		}
		if(!stillFrogsLeft){
			this.nextRound();
			if(this.roundNumber==4){
				this.nextGeneration();
			}
		}
	}

	drawStats(){
		let x = (this.frameNumber++)%HISTORIAN_WIDTH;
		this.historian.stroke(0);
		this.historian.line(x, 0, x, POPULATION_SIZE);
		if(Math.floor(this.frameNumber/HISTORIAN_WIDTH)%2 == 0)
			this.historian.stroke(0,200,255);
		else
			this.historian.stroke(0,255,255);
		this.historian.line(x, POPULATION_SIZE, x, POPULATION_SIZE-this.alive);
		this.historian.noStroke();
		this.historian.fill(255,0,0);
		let y = sqrt(bestY)*4;
		this.historian.rect(x-1,POPULATION_SIZE-y-3, 3,3);
		resetMatrix();
		image(this.historian, 0, height-POPULATION_SIZE);
}
	
}
