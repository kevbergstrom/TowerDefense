class Model{
	
	constructor(grid){

		this.grid = grid

		this.playerTowers = []
		this.enemies = []
		this.projectiles = []

		this.gameOver = false
		this.waveStarted = false
		this.wave = 8

		this.money = 1000
		this.health = 100

	}

update() {
  this.grid.update(this.enemies,this)

  this.playerTowers.forEach(tower => {
    tower.update(this.enemies,this.projectiles,this)
  })

  this.projectiles.forEach(proj => {
    proj.update(this.grid,this.projectiles)
  })
}

killAllSprites(){
  this.grid.killAllSprites()

    while(this.enemies.length>0){
      this.enemies.pop().phaserRef.destroy()
    }

  for(var j = 0;j<this.projectiles.length;j++){
    this.projectiles[j].phaserRef.destroy()

  }

  towerUpgrader.clearPopup()

}

startWave(){
	this.wave = this.wave + 1
    this.preWaveSetup()
    this.waveStarted = true
}

endWave(){
 if(this.waveStarted == true){
   this.waveStarted = false
   soundPlayer.play('win')
 }
}

preWaveSetup(){
  let newPath = this.grid.findShortestPath(this.getEnemySpawns().x,this.getEnemySpawns().y,this.getPlayerBases().x,this.getPlayerBases().y)
  this.grid.clearHasPaths()
  this.grid.updateHasPaths(newPath)
  this.getEnemySpawns().setPath(newPath)
  this.getEnemySpawns().populateSpawnQueue(this.wave)

  this.playerTowers.forEach(tower => {
    tower.generateInRange(this.grid)
  })

}

findDivergentPaths(newPath){
  let allPaths = []
  //go to each gridPoint with enemies
  for(var x = 0;x<GRID_SIZE;x++){
    allPaths.push([])
    for(var y = 0;y<GRID_SIZE;y++){
      let gridPoint = this.grid.getPoint(x,y)
      if(gridPoint.enemies.length>0&&!(gridPoint.x==this.getPlayerBases().x&&gridPoint.y==this.getPlayerBases().y)){
        //generate a new A* path for all in that grid
        let newerPath = this.grid.findShortestPath(gridPoint.x,gridPoint.y,this.getPlayerBases().x,this.getPlayerBases().y)
        allPaths[x][y]=newerPath

        if(newerPath==null){
          return false
        }
      }
    }
  }
  
  this.grid.setPath(newPath)
  this.grid.clearHasPaths()
  this.grid.updateHasPaths(newPath)

for(var x = 0;x<this.grid.grid.length;x++){
    allPaths.push([])
    for(var y = 0;y<this.grid.grid.length;y++){
      let gridPoint = this.grid.getPoint(x,y)
      let newerPath = allPaths[x][y]
      if(newerPath!=null){
         this.grid.updateDivergentHasPaths(newerPath)
          gridPoint.enemies.forEach(enemy => {
            enemy.changePath(newerPath)
            enemy.landmark = 0
          })
      }
    }
  }

return true
}

removeTower(gridPoint,towers){
  gridPoint.occupant.removeThis(gridPoint,towers)
  gridPoint.node.rescindObstruction()

  newPath = this.grid.findShortestPath(this.getEnemySpawns().x,this.getEnemySpawns().y,this.getPlayerBases().x,this.getPlayerBases().y)
  this.grid.setPath(newPath)
  this.findDivergentPaths(newPath)

  this.playerTowers.forEach(tower => {
    tower.generateInRange(this.grid)
  })

}

dropNewTower(towerType, gridPoint) {
  const initialCost = 100
  this.changeMoney(-initialCost)
  const x = gridPoint.getX()
  const y = gridPoint.getY()
  const tower = factory.createTower(towerType, x, y)
  tower.generateInRange(this.grid)
  tower.gridPoint = gridPoint
  // Occupy gridPoint
  this.playerTowers.push(tower)
  gridPoint.set(tower)
  gridPoint.node.setObstruction()
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
  const interval = 30 //two enemies a second
  const x = gridPoint.getX()
  const y = gridPoint.getY()
  const spawn = factory.createEnemySpawn(spawnType,x,y,interval)
  gridPoint.openPassage()
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
  gridPoint.node.setObstruction()
}

changeDifficulty(difficulty){
  //TODO implement difficulties
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

changeMoney(amount) {
  this.money += amount
}

moneyCheck(price) {
  return this.getMoney() >= price
}

takeDamage(amount) {
this.health -= amount
  if(this.health < 0){this.health = 0}
}

getMoney(){
	return this.money
}

getHealth(){
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

