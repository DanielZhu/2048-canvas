var App = angular.module('game2048', []);
App.controller('AppController', function($scope) {

  var canvasEle = null,
    ctx,
    matrixArr = [],
    cards = [],
    cellMargin = 10,
    sideMargin = 20,
    horizontalSize = 4,
    verticalSize = 4,
    radius = 15,
    cardImageWidthHeight = 50,
    screenWidth = 400,
    screenHeight = 600,
    cellWidth = (screenWidth - 3 * cellMargin - 2 * sideMargin) / 4,
    cellHeight = cellWidth,
    backgroundFillColor = '#EDEDED',
    lowerFillColor = '#DDA0DD',
    hightFillColor = '#E9967A';

  $scope.init = function () {
    canvasEle = document.getElementById('gameGrid');

    timer.init();
    debug.setLevel(9);

    if (canvasEle == null)
      return false;

    ctx = canvasEle.getContext("2d");
    extendCanvas();

    initMatrix();
    $scope.gameInit();
  }

  initMatrix = function () {
    for (var i = 0; i < verticalSize; i++) {
      matrixArr[i] = [];
      for (var j = 0; j < horizontalSize; j++) {
        matrixArr[i][j] = -1;
      };
    };
  }

  setCellByIndex = function (i, j, fillColor, card) {
      var x = sideMargin + j * cellWidth + j * cellMargin;      
      var y = i * cellHeight + i * cellMargin;
      ctx.fillStyle = fillColor;
      ctx.fillRadiusRect(x, y, cellWidth, cellHeight, radius, true, true);

      if (typeof card !== 'undefined' && card != -1) {
        var cardImage = new Image();
        cardImage.src = 'images/card_' + zeroPad(Math.log(card) / Math.log(2) - 1, 4) + '_' + card + '.png';
        cardImage.onload = function () {
          ctx.drawImage(cardImage, x + (cellWidth - cardImageWidthHeight) / 2, y + (cellWidth - cardImageWidthHeight) / 2);
        }
      }
  }

  $scope.gameInit = function () {
    var fillColor = backgroundFillColor;

    // Initialize all the cell
    for (var i = 0; i < verticalSize; i++) {
      for (var j = 0; j < horizontalSize; j++) {
        setCellByIndex(i, j, backgroundFillColor);
      }
    }

    $scope.addCard();
    $scope.addCard();
  }

  $scope.addCard = function () {
    var card,
      coord = [];

    if (checkGameOver()) {
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
    setCellByIndex(coord[0], coord[1], lowerFillColor, card);
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