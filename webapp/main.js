var App = angular.module('game2048', []);
var DIRECTION_NORTH = 'north',
  DIRECTION_EAST = 'east',
  DIRECTION_SOUTH = 'south',
  DIRECTION_WEST = 'west';

App.controller('AppController', function($scope) {

  $scope.score = 0;
  $scope.totalSteps = 0;

  var gameLoopInterval,
    canvasEle = null,
    ctx,
    matrixArr = [],
    cards = [],
    cellMargin = 10,
    sideMargin = 20,
    rowCount = 4,
    columnCount = 4,
    radius = 15,
    cardImageWidthHeight = 50,
    screenWidth = 400,
    screenHeight = 600,
    cellWidth = (screenWidth - 3 * cellMargin - 2 * sideMargin) / 4,
    cellHeight = cellWidth,
    backgroundFillColor = '#EDEDED',
    score = 0,
    historySteps = [],
    movedFlag = false,
    initFlag = false,
    mouseDownPos = [0, 0],
    colors = ['#E28DB6', '#DDA0DD', '#965D79', '#E3324C', '#962133', '#B3AE7F', '#47A0CC', '#8A6B08', '#AD5F15'],
    directions = [DIRECTION_WEST, DIRECTION_NORTH, DIRECTION_EAST, DIRECTION_SOUTH];

  $scope.init = function () {
    canvasEle = document.getElementById('gameGrid');

    timer.init();
    debug.setLevel(9);

    if (canvasEle == null)
      return false;

    ctx = canvasEle.getContext("2d");
    extendCanvas();

    initMatrix();
    $scope.score = 0;
    $scope.gameInit();
    gameLoopInterval = setInterval(redraw, 50);
  }

  $scope.gameLoop = function () {
    redraw();
  }

  $scope.gameInit = function () {
    redraw();
    $scope.addCard();
    $scope.addCard();
  }

  redraw = function () {
    // Initialize all the cell
    if (!initFlag) {
      for (var i = 0; i < rowCount; i++) {
        for (var j = 0; j < columnCount; j++) {
          setCellByIndex(i, j);
        }
      }
      initFlag = true;
    }

    if (movedFlag) {
      for (var i = 0; i < rowCount; i++) {
        for (var j = 0; j < columnCount; j++) {
          setCellByIndex(i, j);
        }
      }
      $scope.totalSteps++;
      movedFlag = false;
    }
  }

  $scope.addCard = function () {
    var card,
      coord = [];

    if (checkGameOver()) {
      clearInterval(gameLoopInterval);
      window.alert('Game Over');
      return;
    }
    card = -1;
    if (Math.random() > 0.5) {
      card = 2;
    } else {
      card = 4;
    }
    coord = randomCoord();
    matrixArr[coord[0]][coord[1]] = card;

    movedFlag = true;
  }

  $scope.mouseDownHandle = function (e) {
    mouseDownPos = [e.offsetX, e.offsetY];

    debug.info(mouseDownPos);
  }
  $scope.mouseUpHandle = function (e) {
    var x = e.offsetX,
      y = e.offsetY,
      key;

    if (Math.abs(x - mouseDownPos[0]) > 100) {
      key = (x - mouseDownPos[0] > 0 ? 39 : 37);
    }

    if (Math.abs(y - mouseDownPos[1]) > 100) {
      key = (y - mouseDownPos[1] > 0 ? 40 : 38);
    }

    $scope.moveStep(key);

    debug.info(mouseDownPos);
  }

  $scope.moveStepPre = function () {
    var e = window.event || e,
      key;
    // IE8 and earlier
    if(window.event) {
      key = event.keyCode;
    } else if(event.which) {
      // IE9/Firefox/Chrome/Opera/Safari
      key = event.which;
    }
    $scope.moveStep(key);
  }
  
  $scope.mergeCard = function (value) {
    $scope.score += value;
  }

  $scope.moveStep = function (key) {
    historySteps.push(matrixArr.slice(0));

    switch (key) {
      case 37:
        debug.info('left key hit');
        for (var i = 0; i < rowCount; i++) {
          for (var j = 0; j < columnCount; j++) {
            var k = j;
            if (matrixArr[i][j] != -1) {
              while (k < 3) {
                if (matrixArr[i][j] == matrixArr[i][k + 1]) {
                  matrixArr[i][j] = matrixArr[i][j] * 2;
                  matrixArr[i][k + 1] = -1;
                  
                  $scope.mergeCard(matrixArr[i][j]);
                  j++;
                  movedFlag = true;
                  break;
                } else if (matrixArr[i][k + 1] != -1) {
                  // Expect one different figure between two same figures 
                  break;
                }
                k++;
              }
            }
          }
        }
        break
      case 38:
        for (var i = 0; i < columnCount; i++) {
          for (var j = 0; j < rowCount; j++) {
            var k = j;
            if (matrixArr[j][i] != -1) {
              while (k < 3) {
                if (matrixArr[j][i] == matrixArr[k + 1][i]) {
                  matrixArr[j][i] = matrixArr[j][i] * 2;
                  matrixArr[k + 1][i] = -1;
                  
                  $scope.mergeCard(matrixArr[j][i]);
                  j++;
                  movedFlag = true;
                  break;
                } else if (matrixArr[k + 1][i] != -1) {
                  // Expect one different figure between two same figures 
                  break;
                }
                k++;
              }
            }
          }
        }
        debug.info('up key hit');
        break
      case 39:
        for (var i = 0; i < rowCount; i++) {
          for (var j = columnCount - 1; j >= 0; j--) {
            var k = j;
            if (matrixArr[i][j] != -1) {
              while (k > 0) {
                if (matrixArr[i][j] == matrixArr[i][k - 1]) {

                  matrixArr[i][j] = matrixArr[i][j] * 2;
                  matrixArr[i][k - 1] = -1;
                  
                  $scope.mergeCard(matrixArr[i][j]);
                  j--;
                  movedFlag = true;
                  break;
                } else if (matrixArr[i][k - 1] != -1) {
                  // Expect one different figure between two same figures 
                  break;
                }
                k--;
              }
            }
          }
        }
        debug.info('right key hit');
        break
      case 40:
        for (var i = 0; i < columnCount; i++) {
          for (var j = rowCount - 1; j > 0; j--) {
            var k = j;
            if (matrixArr[j][i] != -1) {
              while (k > 0) {
                if (matrixArr[j][i] == matrixArr[k - 1][i]) {

                  matrixArr[j][i] = matrixArr[j][i] * 2;
                  matrixArr[k - 1][i] = -1;
                  
                  $scope.mergeCard(matrixArr[j][i]);
                  j--;
                  movedFlag = true;
                  break;
                } else if (matrixArr[k - 1][i] != -1) {
                  // Expect one different figure between two same figures 
                  break;
                }
                k--;
              }
            }
          }
        }
        debug.info('down key hit');
        break
      default:
        break
    }
    moveToEdge(directions[key - 37]);
  }

  initMatrix = function () {
    for (var i = 0; i < rowCount; i++) {
      matrixArr[i] = [];
      for (var j = 0; j < columnCount; j++) {
        matrixArr[i][j] = -1;
      };
    };
  }

  getBackgroundColor = function (value) {
    var n = Math.log(value) / Math.log(2);
    var color = '';

    if (value == -1) {
      color = backgroundFillColor;
    } else if (n > 0 && n < 3) {
      color = colors[0];
    } else if (n >= 3 && n < 5) {
      color = colors[1];
    } else if (n >= 5 && n < 7) {
      color = colors[2];
    } else if (n >= 7 && n < 12) {
      color = colors[n - 4];
    } else if (n >= 12 && n < 15) {
      color = colors[colors.length - 2];
    } else {
      color = colors[colors.length - 1];
    }

    return color;
  }

  setCellByIndex = function (i, j) {
      var x = sideMargin + j * cellWidth + j * cellMargin;      
      var y = i * cellHeight + i * cellMargin;
      var card = matrixArr[i][j];
      
      ctx.fillStyle = getBackgroundColor(card);
      ctx.fillRadiusRect(x, y, cellWidth, cellHeight, radius, true, true);

      if (typeof card !== 'undefined' && card != -1) {
        var cardImage = new Image();
        cardImage.src = 'images/card_' + zeroPad(Math.log(card) / Math.log(2) - 1, 4) + '_' + card + '.png';
        cardImage.onload = function () {
          ctx.drawImage(cardImage, x + (cellWidth - cardImageWidthHeight) / 2, y + (cellWidth - cardImageWidthHeight) / 2);
        }
      }
  }

  moveToEdge = function (direction) {
    if (directions.indexOf(direction) == -1) {
      return;
    }

    switch (direction) {
      case DIRECTION_WEST:
        for (var i = 0; i < rowCount; i++) {
          emptyPosQueue = [];
          for (var j = 0; j < columnCount; j++) {
            if (matrixArr[i][j] == -1) {
              // Store all the empty pos
              emptyPosQueue.push([i, j]);
            } else {
              // Not empty item
              if (emptyPosQueue.length > 0) {
                // pop the first empty pos for fill
                var firstEmptyPos = emptyPosQueue.splice(0, 1)[0];
                matrixArr[firstEmptyPos[0]][firstEmptyPos[1]] = matrixArr[i][j];
                movedFlag = true;

                // Reset this pos equals to -1
                matrixArr[i][j] = -1;
              }
            }
          }
        }
        break;
      case DIRECTION_NORTH:
        for (var i = 0; i < columnCount; i++) {
          emptyPosQueue = [];
          for (var j = 0; j < rowCount; j++) {
            if (matrixArr[j][i] == -1) {
              // Store all the empty pos
              emptyPosQueue.push([j, i]);
            } else {
              // Not empty item
              if (emptyPosQueue.length > 0) {
                // pop the first empty pos for fill
                var firstEmptyPos = emptyPosQueue.splice(0, 1)[0];
                matrixArr[firstEmptyPos[0]][firstEmptyPos[1]] = matrixArr[j][i];
                movedFlag = true;

                // Reset this pos equals to -1
                matrixArr[j][i] = -1;
              }
            }
          }
        }
        break;
      case DIRECTION_EAST:
        for (var i = 0; i < rowCount; i++) {
          emptyPosQueue = [];
          for (var j = columnCount - 1; j >= 0; j--) {
            if (matrixArr[i][j] == -1) {
              // Store all the empty pos
              emptyPosQueue.push([i, j]);
            } else {
              // Not empty item
              if (emptyPosQueue.length > 0) {
                // pop the first empty pos for fill
                var firstEmptyPos = emptyPosQueue.splice(0, 1)[0];
                matrixArr[firstEmptyPos[0]][firstEmptyPos[1]] = matrixArr[i][j];
                movedFlag = true;

                // Reset this pos equals to -1
                matrixArr[i][j] = -1;
              }
            }
          }
        }
        break;
      case DIRECTION_SOUTH:
        for (var i = 0; i < columnCount; i++) {
          emptyPosQueue = [];
          for (var j = rowCount - 1; j >= 0; j--) {
            if (matrixArr[j][i] == -1) {
              // Store all the empty pos
              emptyPosQueue.push([j, i]);
            } else {
              // Not empty item
              if (emptyPosQueue.length > 0) {
                // pop the first empty pos for fill
                var firstEmptyPos = emptyPosQueue.splice(0, 1)[0];
                matrixArr[firstEmptyPos[0]][firstEmptyPos[1]] = matrixArr[j][i];
                movedFlag = true;

                // Reset this pos equals to -1
                matrixArr[j][i] = -1;
              }
            }
          }
        }
        break;
      default:
        break
    }

    if (movedFlag) {
      $scope.addCard();
    }
  }

  zeroPad = function (num, n) { 
    if ((num + "").length >= n) return num; 
      return zeroPad("0" + num, n); 
  } 

  checkGameOver = function () {
    return (matrixArr.toString().indexOf(-1) == -1 ? true : false);
  }

  randomCoord = function () {
    var horiX = randomPos(),
      verX = randomPos();

    while (matrixArr[horiX][verX] != -1) {
      horiX = randomPos();
      verX = randomPos();
    }
    
    return [horiX, verX];
  }

  randomPos = function () {
    var pos = -1,
      random;
    
    while (true) {
      random = Math.floor(Math.random() * 10);
      if (random < 4) {
        break;
      }
    }
    return random;
  }

  extendCanvas = function () {
    CanvasRenderingContext2D.prototype.fillRadiusRect = function (x, y, width, height, radius, fill, stroke) {
      if (typeof radius === 'undefined') {
        radius = 5;
      }

      if (typeof stroke === 'undefined') {
        stroke = true;
      }

      this.beginPath();
      this.moveTo(x + radius, y);
      this.lineTo(x + width - radius, y);
      this.quadraticCurveTo(x + width, y, x + width, y + radius);
      this.lineTo(x + width, y + height - radius);
      this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      this.lineTo(x + radius, y + height);
      this.quadraticCurveTo(x, y + height, x, y + height -radius);
      this.lineTo(x, y + radius);
      this.quadraticCurveTo(x, y, x + radius, y);

      if (fill) {
        this.fill();
      }

      if (stroke) {
        this.stroke();
      }
    }
  }
  $scope.init();
});