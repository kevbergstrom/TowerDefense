

const TOWER_SCALE = 0.3
const PURCHASE_BUTTON_SIZE = 140
const CANVAS_WIDTH = 650
const CANVAS_HEIGHT = 650
const GRID_SIZE = 16

const game = new Phaser.Game(
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  Phaser.AUTO,
  'TowerDefense',
  { preload, create, update }
)

const factory = new Factory()

const towerUpgrader = new TowerUpgrader()
 
let model
let soundPlayer

let spriteSheet

let waveButton
let healthText
let moneyText
let levelText
let enemiesText

let id = 0
let mouseWasDown = false
let background
let dropTowerState = false  // Determines if player is in the process of dropping a new tower
let hoveringTower           // Temporary tower attached to cursor while purchasing new tower
let towerPurchaseOptions = [] // Tower purchase buttons on player panel

let panel     // Player UI panel
let levelSelectUI
let menuUI
let pauseMenu
let gameOverMenu
let autoplay

let difficulty = 1  

function preload() {
  slickUI = game.plugins.add(Phaser.Plugin.SlickUI)
  slickUI.load('assets/ui/kenney-theme/kenney.json')

  factory.initialize()

  soundPlayer = new SoundPlayer()
  soundPlayer.load([
      {
        name: 'shoot',
        link: 'assets/sounds/shoot.mp3'
      },
      {
        name: 'explosion',
        link: 'assets/sounds/explosion.mp3'
      },
      {
        name: 'laser',
        link: 'assets/sounds/laser.mp3'
      },
      {
        name: 'upgrade',
        link: 'assets/sounds/upgrade.mp3'
      },
      {
        name: 'win',
        link: 'assets/sounds/win.mp3'
      },
      {
        name: 'background',
        link: 'assets/sounds/background.mp3'
      }
    ])
  game.time.advancedTiming = true

}

function create() {
  // Start phaser arcade physics engine
  game.physics.startSystem(Phaser.Physics.ARCADE)
  // Add background to canvas
  background = game.add.tileSprite(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, 'background')
  soundPlayer.cache()
  soundPlayer.loop('background', 0.3)

  openPanel()
  closePanel()

  pauseKey = game.input.keyboard.addKey(Phaser.Keyboard.ESC)
  pauseKey.onDown.add(function(){
    if(panel.visible&&!model.gameOver){
      if (!game.paused) {game.paused = true; openPauseMenu()} 
      else {game.paused = false; closePauseMenu()}
    }
  } ,this)


  openMenu()

}

function update() {
  if(model!=null){
    if(!game.paused && !model.gameOver){

      model.update()

      if (dropTowerState) {
        dropTowerUpdate()
      }
      if (model.waveStarted) {
        isWaveComplete()
      }

      updateTextItems()

      // Update mouse state
      mouseWasDown = game.input.activePointer.isDown

      checkIfLost()
    }
  }
  //TESTING
  game.debug.text('fps:' + game.time.fps,50,600,0)
}

function clearOldModel(){
  if(model != null){
    model.killAllSprites()
  }
  exitDropTowerState()
  game.paused = false
  pauseMessage.visible = false
}

function updateTextItems(){
  healthText.value = "Health: " + model.getHealth()
  moneyText.value = "Money: " + model.getMoney()
  levelText.value = "Wave: " + model.wave
  enemiesText.value = "Enemies: " + (model.getEnemies().length + model.grid.enemySpawns.spawnQueue.length)
}

function startNextWave(){
  if(model.waveStarted == false){
    waveButton.visible = false
    model.startWave()
  }
}

function endThisWave(){
  if(model.waveStarted == true){
    model.endWave()
    waveButton.visible = true
  }

  if (autoplay.checked) {
    startNextWave()
  }
}

function isWaveComplete(){
    if(model.getEnemies().length==0 && model.spawnQueueEmpty()){
      endThisWave()
    }
}

function checkIfLost(){
  if(model.getHealth()<=0){
      model.gameOver = true
      closePanel()

      gameOverMenu = new SlickUI.Element.Panel(0, 0, game.width, game.height)
      slickUI.add(gameOverMenu)

      let loseMessage = new SlickUI.Element.Text((CANVAS_WIDTH-100)/2, (CANVAS_HEIGHT/2)+80, "GAME OVER\n SCORE "+model.wave)
      gameOverMenu.add(loseMessage)

      let restartButton = factory.createButton((CANVAS_HEIGHT-290)/2,(CANVAS_HEIGHT-50)/2, 290, 50, 'Exit to main menu', gameOverMenu)
        restartButton.events.onInputDown.add(function(){ 
          model.killAllSprites();
          delete model; 
          exitDropTowerState(); 
          game.paused = false; 
          gameOverMenu.destroy(); 
          openMenu()
        }, this)
  }

}

function openPanel(){
  closeMenu()
  closelevelSelect()
  if(panel==null){
  const panelX = 0
  const panelY = game.height - 150
  const wavePanelWidth = 150
  const statsPanelWidth = 150

  const statsPanel = new SlickUI.Element.Panel(0, 0, statsPanelWidth, 150)
  const towerPanel = new SlickUI.Element.Panel(statsPanel._width, 0, game.width - statsPanelWidth - wavePanelWidth, 150)
  const wavePanel = new SlickUI.Element.Panel(statsPanelWidth + towerPanel._width, 0, wavePanelWidth, 150) 

  panel = new SlickUI.Element.Panel(panelX, panelY, game.width, 150)

  slickUI.add(panel)
  panel.add(statsPanel)
  panel.add(towerPanel)
  panel.add(wavePanel)

  healthText = new SlickUI.Element.Text(4, 0, "Health: ")
  moneyText = new SlickUI.Element.Text(4, 32, "Money: ")
  levelText = new SlickUI.Element.Text(4, 0, "Wave: ")
  enemiesText = new SlickUI.Element.Text(4, 32, "Enemies: ")

  statsPanel.add(healthText)
  statsPanel.add(moneyText)
  wavePanel.add(levelText)
  wavePanel.add(enemiesText)

  const autoplayText = new SlickUI.Element.Text(4, 32, "continuous")
  autoplay = new SlickUI.Element.Checkbox(85, wavePanel._height - 65, SlickUI.Element.Checkbox)
  wavePanel.add(autoplay)
  autoplay.events.onInputDown.add(() => {
      if (autoplay.checked && !model.waveStarted) {
        startNextWave()
      }
  }, this);

  waveButton = new SlickUI.Element.Button(0, wavePanel._height - 60, wavePanelWidth - 75, 32)
  wavePanel.add(waveButton)
  waveButton.add(new SlickUI.Element.Text(8, 0, "Next"));
  waveButton.events.onInputUp.add(startNextWave);

  addTowerBuyOption(towerPanel, 'defaultTower', 100)
  addTowerBuyOption(towerPanel, 'missileTower', 100)
  }else{
    panel.visible = true
    waveButton.visible = true
    autoplay.checked = false
  }
}

function closePanel(){
  if(panel){
    panel.visible = false
  }
}

function openMenu(){
  closelevelSelect()
  closePanel()
  if(menuUI==null){
    menuUI = new SlickUI.Element.Panel(0, 0, game.width, game.height)
    slickUI.add(menuUI)

    let selectButton = factory.createButton((game.width/2)-70,440,140,40,'Level Select',menuUI)
    let rb1 = factory.createRadioButton((CANVAS_WIDTH/2)-65, 270, menuUI)
    let rb2 = factory.createRadioButton((CANVAS_WIDTH/2)-65, 320, menuUI)
    let rb3 = factory.createRadioButton((CANVAS_WIDTH/2)-65, 370, menuUI)
    let rb1text = factory.createText((CANVAS_WIDTH/2)-15, 274, 'Easy', menuUI)
    let rb2text = factory.createText((CANVAS_WIDTH/2)-15, 324, 'Medium', menuUI)
    let rb3text = factory.createText((CANVAS_WIDTH/2)-15, 374, 'Hard', menuUI)
    let menuText  = factory.createText((CANVAS_WIDTH/2)-138,105,'T O W E R   D E F E N S E', menuUI)
    let difficultyText = factory.createText((CANVAS_WIDTH/2)-46, 220, 'Difficulty', menuUI)

    rb1.checked = true

    rb1.events.onInputDown.add(function(){rb1.checked = true; rb2.checked = false; rb3.checked = false; this.difficulty = 100}, this)
    rb2.events.onInputDown.add(function(){rb1.checked = false; rb2.checked = true; rb3.checked = false; this.difficulty = 50}, this)
    rb3.events.onInputDown.add(function(){rb1.checked = false; rb2.checked = false; rb3.checked = true; this.difficulty = 1}, this)

    selectButton.events.onInputUp.add(() => openLevelSelect())

  }else{
    menuUI.visible = true
  }
}


function closeMenu(){
  if(menuUI){
    menuUI.visible = false
  }
}

function openPauseMenu(){
    pauseMenu = new SlickUI.Element.Panel((game.width/2)-150, (game.height/2)-100, 300, 150)
    slickUI.add(pauseMenu)

    let pauseMessage = factory.createText(0,0, 'Game Paused, press ESC to resume', pauseMenu) 
    let exitButton = factory.createButton(0,pauseMenu.height-55, 290, 50, 'Exit to main menu', pauseMenu)
    exitButton.events.onInputDown.add(function(){ model.killAllSprites(); model = null; exitDropTowerState(); game.paused = false; closePauseMenu(); openMenu()}, this)
  }

function closePauseMenu(){
  if(pauseMenu!=null){
    pauseMenu.destroy()
  }
}

function openLevelSelect(){
  closeMenu()
  closePanel()

  if(levelSelectUI==null){
    levelSelectUI = new SlickUI.Element.Panel(0, 0, game.width, game.height)
    slickUI.add(levelSelectUI)

    let levels = Object.getOwnPropertyNames(Level)

    let numOfLevels = levels.length

    for(var i = 0; i <numOfLevels;i++){
      if(levels[i].search('level')==-1){
        levels.splice(i,1)
        i--
        numOfLevels--
      }
    }

    let xPos = 50
    let yPos = 0
    for(var j = 0; j <levels.length;j++){

      yPos += 50

      if(yPos > CANVAS_HEIGHT-100){
        yPos = 50
        xPos += (CANVAS_WIDTH-100)/4
      }

      let lvlbutton = factory.createButton(xPos,yPos,(CANVAS_WIDTH-100)/4,50,levels[j],levelSelectUI)
      let levelName = levels[j].toString()
      lvlbutton.events.onInputUp.add(() => changeLevel(levelName))
    }

    let backButton = factory.createButton(CANVAS_WIDTH-100,CANVAS_HEIGHT-50,100,50,'Back',levelSelectUI)
    backButton.events.onInputUp.add(() => openMenu())

    let levelSelectText = factory.createText((CANVAS_WIDTH/2)-75,10,'Level Select',levelSelectUI)

  }else{
    levelSelectUI.visible = true
  }
}

function closelevelSelect(){
  if(levelSelectUI){
    levelSelectUI.visible = false
  }
}

function changeLevel(levelName){
  if(model!=null){
    model.killAllSprites()
    model = null
  }
  openPanel()
  model = factory.loadLevel(levelName,panel,background) 
}

// Function ran during dropTowerState
function dropTowerUpdate() {
  // Get mouse x and y values
  const mouseX = game.input.mousePointer.x
  const mouseY = game.input.mousePointer.y

  // Find closest grid point
  const closestPoint = model.grid.getClosestPoint(mouseX, mouseY)

  // Snap hovering tower sprite to mouse position
  hoveringTower.x = closestPoint.getX()
  hoveringTower.y = closestPoint.getY()

  // If the player clicks a valid point, then drop the tower
  if (game.input.activePointer.isDown && !mouseWasDown && isAbovePanel()) {
    if(!closestPoint.isOccupied()&&closestPoint.enemies.length==0){

      closestPoint.set('tempOccupant')
      closestPoint.node.setObstruction()

      newPath = model.grid.findShortestPath(model.getEnemySpawns().x,model.getEnemySpawns().y,model.getPlayerBases().x,model.getPlayerBases().y)

      if(newPath !== null){
        if(model.waveStarted){

          if(model.findDivergentPaths(newPath)==true){
            model.dropNewTower(hoveringTower.key, closestPoint)
            model.playerTowers.forEach(tower => {
              tower.generateInRange(model.grid)
            })
          }else{
            closestPoint.set(null)
            closestPoint.node.rescindObstruction()
            exitDropTowerState()

          }

        }else{
          model.dropNewTower(hoveringTower.key, closestPoint)
          model.grid.setPath(newPath)
        }

      }else{
        closestPoint.set(null)
        closestPoint.node.rescindObstruction()
        exitDropTowerState()
      }

    }else{
      exitDropTowerState()
    }
  }
}

function enterDropTowerState(towerType) {
  if (model.moneyCheck(100)) {
    exitDropTowerState()
    // Let the game know the player is in the process of placing a tower
    dropTowerState = true
    // Attach tower sprite to cursor until placed or canceled
    hoveringTower = game.add.sprite(game.input.mousePointer.x, game.input.mousePointer.y, towerType)
    // Scale down tower size and pivot to center
    hoveringTower.scale.setTo(TOWER_SCALE, TOWER_SCALE)
    hoveringTower.pivot.x = 64
    hoveringTower.pivot.y = 64
  }
}

function exitDropTowerState() {
  // Remove tower sprite from cursor and game process
  if (hoveringTower) {
    hoveringTower.kill()
  }
  dropTowerState = false
  hoveringTower = null
}


// Check if mouse is above player panel
function isAbovePanel() {
  return game.input.mousePointer.y < panel.y - 8
}

// Add a tower button to the player panel
function addTowerBuyOption(panel, towerName, price) {
  const towerButton = new SlickUI.Element.Button(
      (towerPurchaseOptions.length * PURCHASE_BUTTON_SIZE) + 4, 
      4, 
      PURCHASE_BUTTON_SIZE,
      PURCHASE_BUTTON_SIZE)

  const towerPrice = new SlickUI.Element.Text(
    (towerPurchaseOptions.length * PURCHASE_BUTTON_SIZE) + 10, 
      6, price)

  panel.add(towerButton)
  panel.add(towerPrice)

  towerButton.events.onInputUp.add(() => enterDropTowerState(towerName))
  towerButton.add(new SlickUI.Element.DisplayObject(4, 4, game.make.sprite(0, 0, towerName)))
  towerPurchaseOptions.push(towerButton)
}

document.addEventListener('keyup', evt => {
  evt.preventDefault()
  if (evt.keyCode === 84) {
    document.getElementById('TowerDefense').style = "display: none;"
    document.getElementById('mocha').style = "display: inline;"
    mocha.run()
  }
})
