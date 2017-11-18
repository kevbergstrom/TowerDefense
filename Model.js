class Model{
	
	constructor(grid){//,player){

		this.grid = grid

		this.playerTowers = []
		this.enemies = []
		this.projectiles = []

		this.gameOver = false
		this.waveStarted = false //TODO integrate this
		this.wave = 0

		//going to be put into the player class
		this.money = 1000
		this.health = 100

	}

update() {

  this.grid.update(this.enemies,this)

  this.playerTowers.forEach(tower => {
    tower.update(this.enemies,this.projectiles,this)
  })

  this.projectiles.forEach(proj => {
    proj.update(this.enemies,this.projectiles)
  })
}

killAllSprites(){
	//TODO kills all sprites EVERYWHERE in this model
  this.grid.killAllSprites()

  for(var i = 0;i<enemies.length;i++){
    enemies[i].phaserRef.kill()
  }

  for(var j = 0;j<projectiles.length;j++){
    projectiles[j].phaserRef.kill()
  }

}

startWave(){
	this.wave = this.wave + 1
    this.preWaveSetup()
    this.waveStarted = true
}

endWave(){
 if(this.waveStarted == true){
   this.waveStarted = false
 }
}

preWaveSetup(){
  let newPath = this.grid.findShortestPath(this.getEnemySpawns().x,this.getEnemySpawns().y,this.getPlayerBases().x,this.getPlayerBases().y)
  this.getEnemySpawns().setPath(newPath)
  this.getEnemySpawns().populateSpawnQueue(this.wave)
}


dropNewTower(towerType, gridPoint) {
  this.changeMoney(-100)
  const x = gridPoint.getX()
  const y = gridPoint.getY()
  const tower = factory.createTower(towerType, x, y) 
  // Add to player's towers
  // Occupy gridPoint
  this.playerTowers.push(tower)
  gridPoint.set(tower)
  exitDropTowerState()
}

dropNewBase(baseType, gridPoint) {
  const x = gridPoint.getX()
  const y = gridPoint.getY()
  const base = factory.createBase(baseType , x, y )  
  // Occupy gridPoint
  this.grid.addBase(base)
  gridPoint.set(base)
}

dropNewSpawn(spawnType, gridPoint) {
  const interval = 60//one enemy a second
  const x = gridPoint.getX()
  const y = gridPoint.getY()
  const spawn = factory.createEnemySpawn(spawnType,x,y,interval) 
  // Occupy gridPoint
  this.grid.addSpawn(spawn)
  gridPoint.set(spawn)
}

dropNewWall(wallType, gridPoint) {
  const x = gridPoint.getX()
  const y = gridPoint.getY()
  const wall = factory.createWall(wallType , x, y)  
  // Occupy gridPoint
  gridPoint.set(wall)
}

spawnQueueEmpty(){
	return this.grid.enemySpawns.finished()
}

getEnemySpawns(){
	return this.grid.enemySpawns
}

getPlayerBases(){
	return this.grid.playerBases
}

//maybe giveMoney would make more sense
changeMoney(amount) {
  this.money += amount
}

moneyCheck(price) {
	//TODO change with player class
  return this.getMoney() >= price
}

takeDamage(amount) {
	//TODO change with player class
this.health -= amount
  if(this.health < 0){this.health = 0}
}

//GETers
getMoney(){
	//TODO change with player class
	return this.money
}

getHealth(){
	//TODO change with player class
	return this.health
}

getTowers(){
	return this.playerTowers
}

getEnemies(){
	return this.enemies
}

getProjectiles(){
	return this.projectiles
}

}