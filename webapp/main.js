var App = angular.module('game2048', ['LocalStorageModule']);
var DIRECTION_NORTH = 'north',
  DIRECTION_EAST = 'east',
  DIRECTION_SOUTH = 'south',
  DIRECTION_WEST = 'west';

App.controller('AppController', ['$scope', 'localStorageService',function($scope, localStorageService) {

  $scope.homeUrl = 'http://game2048.staydan.com';
  $scope.score = 0;
  $scope.totalSteps = 0;
  $scope.bestScore = 0;
  $scope.remainAvailableRegretSteps = 5;
  $scope.stepHistory = [];
  $scope.rankList = [];
  $scope.word = /^\s*\w*\s*$/;
  $scope.nickname = '';
  $scope.emailAddress = '';
  $scope.runMode = 'dev';

  var gameLoopInterval,
    canvasEle = null,
    canvasBackgroundEle = null,
    ctx,
    ctxBack,
    scoreAddHistory = [],
    maxAvailableRegretSteps = 5,
    matrixArr = [],
    cards = [],
    cellMargin = 10,
    sideMargin = 20,
    rowCount = 4,
    columnCount = 4,
    radius = 10,
    cardImageWidthHeight = 50,
    screenWidth = 500,
    screenHeight = 500,
    cellWidth = (screenWidth - (rowCount - 1) * cellMargin - 2 * sideMargin) / rowCount,
    cellHeight = cellWidth,
    cellbackgroundFillColor = '#FBF8E1',
    canvasBackgroundColor = '#F7F2C8',
    movedFlag = false,
    mergedFlag = false,
    mouseDownPos = [0, 0],
    touchStartPos = [0, 0],
    moveDirect,
    maxProgress = 100,
    animFrequency = 10,
    averageAnimTime = 7,
    baseUrl = '',
    gameover = false,
    colors = ['#E28DB6', '#DDA0DD', '#965D79', '#E3324C', '#962133', '#B3AE7F', '#47A0CC', '#8A6B08', '#AD5F15'],
    directions = [DIRECTION_WEST, DIRECTION_NORTH, DIRECTION_EAST, DIRECTION_SOUTH];

  /**
   * [init Initialize the whole game container]
   * @return {null}
   */
  $scope.init = function () {
    canvasEle = document.getElementById('gameGrid');
    canvasBackgroundEle = document.getElementById('gameGridBackground');

    timer.init();
    debug.setLevel(0);

    if (canvasEle == null || canvasBackgroundEle == null)
      return false;

    ctx = canvasEle.getContext('2d');
    ctxBack = canvasBackgroundEle.getContext('2d');
    extendCanvas();

    if (window.location.host.indexOf('localhost') === -1) {
      $scope.runMode = 'pro';
      baseUrl = 'http://game2048.staydan.com/gameWS/index.php';
    } else {
      $scope.runMode = 'dev';
      baseUrl = 'http://localhost/gameWS';
    }

    initFromLocalstorage();

    window.addEventListener('keydown', function(e) {
        // space and arrow keys
        if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
            e.preventDefault();
        }
    }, false);

    canvasEle.addEventListener('touchstart', function (event) {$scope.touchStartHandle(event)});
    canvasEle.addEventListener('touchend', function (event) {$scope.touchEndHandle(event)});
    canvasEle.addEventListener('touchmove', function (event) {event.preventDefault();});

    // Watch these variables to update the storage
    $scope.$watch('nickname', updateNicknameAndMailAddreses);
    $scope.$watch('emailAddress', updateNicknameAndMailAddreses);

    // Refresh the leaderboard every 30 seconds
    $scope.getRanks()
    var id = setInterval(
      function () {
        $scope.getRanks()
      },
      30000
    )
    preloadResources();
  }

  /**
   * [updateNicknameAndMailAddreses Update the localstorage]
   * @return {[type]} [description]
   */
  updateNicknameAndMailAddreses = function () {
    localStorageService.set('nickname', $scope.nickname);
    localStorageService.set('emailAddress', $scope.emailAddress);
  }

  /**
   * [initFromLocalstorage Init the view from localstorage]
   * @return {[type]} [description]
   */
  initFromLocalstorage = function () {
    var localMatrixArr = localStorageService.get('matrix');
    if (localStorageService.get('remainAvailableRegretSteps')) {
      $scope.remainAvailableRegretSteps = localStorageService.get('remainAvailableRegretSteps');
    }

    if (localStorageService.get('bestScore') != null) {
      $scope.bestScore = localStorageService.get('bestScore');
    } else {
      $scope.bestScore = 0;
    }

    if (localStorageService.get('score') != null) {
      $scope.score = parseInt(localStorageService.get('score'));
    } else {
      $scope.score = 0;
    }

    if (localStorageService.get('nickname') != null) {
      $scope.nickname = localStorageService.get('nickname');
    } else {
      $scope.nickname = 'Guest';
    }

    if (localStorageService.get('emailAddress') != null) {
      $scope.emailAddress = localStorageService.get('emailAddress');
    } else {
      $scope.emailAddress = 'guest@staydan.com';
    }

    if (localMatrixArr != null) {
      matrixArr = localMatrixArr;
      refactorGameGrid();
      initCardsCanvas();
    } else {
      $scope.gameInit();
    }
  }

  /**
   * [restartGame Create a new game]
   * @return {[type]} [description]
   */
  $scope.restartGame = function () {
    var best = 0;
    $scope.score = 0;
    $scope.totalSteps = 0;
    $scope.remainAvailableRegretSteps = 5;
    if (localStorageService.get('bestScore') != null) {
      best = localStorageService.get('bestScore');
    } else {
      best = 0;
    }

    // localStorageService.clearAll();
    localStorageService.set('score', 0);
    canvasEle.width = canvasEle.width;
    gameover = false;
    $scope.gameInit();
  }

  /**
   * [submitScore Submit the fresh score to server]
   * @return {[type]} [description]
   */
  $scope.submitScore = function () {
    $.post(baseUrl + '/addMark', {nickname: $scope.nickname, email: $scope.emailAddress, marks: $scope.score}, function( data ) {
      debug.info(data);
    });
  }

  /**
   * [getRanks Retrieve the leaderboard]
   * @return {[type]} [description]
   */
  $scope.getRanks = function () {
    $.get(baseUrl + '/top20List', function (rankData) {
      debug.info(rankData);
      $scope.rankList = rankData;
      $scope.$apply();
    });
  }

  /**
   * [regretStep Allow user to regret the previous steps]
   * @return {[type]} [description]
   */
  $scope.regretStep = function () {
    if ($scope.remainAvailableRegretSteps > 0 && $scope.stepHistory.length > 0) {
      matrixArr = $scope.stepHistory.pop();
      var minusScore = scoreAddHistory.pop();
      debug.info('matrixArr: ' + JSON.stringify(matrixArr));
      canvasEle.width = canvasEle.width;
      initCardsCanvas();
      $scope.score -= minusScore;
      $scope.remainAvailableRegretSteps--;
      localStorageService.set('remainAvailableRegretSteps', $scope.remainAvailableRegretSteps);
    }
  }

  $scope.takeScreenshot = function () {
    // var screenshot = new Image();
    // screenshot.src = canvasEle.toDataUrl();
    // window.location.href = screenshot;
  }

  /**
   * [initMatrix Reset the matrixArr to default]
   * @return {null}
   */
  initMatrix = function () {
    for (var i = 0; i < rowCount; i++) {
      matrixArr[i] = [];
      for (var j = 0; j < columnCount; j++) {
        matrixArr[i][j] = -1;
      };
    };
  }

  var delayed = (function () {
    var queue = [];

    function processQueue() {
      if (queue.length > 0) {
        setTimeout(function () {
          queue.shift().cb();
          processQueue();
        }, queue[0].delay);
      }
    }

    return function delayed(delay, cb) {
      queue.push({ delay: delay, cb: cb });

      if (queue.length === 1) {
        processQueue();
      }
    };
  }());

  /**
   * [gameInit Initialize the game scene -> background/empty cards/two real cards with number]
   * @return {null}
   */
  $scope.gameInit = function () {
    initMatrix();
    refactorGameGrid();
    initCardsCanvas();
    $scope.addCard();
    $scope.addCard();
  }

  refactorGameGrid = function () {
    ctxBack.fillStyle = canvasBackgroundColor;
    ctxBack.fillRadiusRect(0, 0, screenWidth, screenHeight, radius, true, true);
    for (var i = 0; i < rowCount; i++) {
      for (var j = 0; j < columnCount; j++) {
        resetCellDefaultBackgroundByIndex(i, j);
      }
    }
  }

  /**
   * [initCardsCanvas Initialize all the card cell on the canvas]
   * @return {null}
   */
  initCardsCanvas = function () {
    for (var i = 0; i < rowCount; i++) {
      for (var j = 0; j < columnCount; j++) {
        if (matrixArr[i][j] != -1){
          animShowCard(i, j);
        }
      }
    }
  }

  /**
   * [addCard Add one random card to the game scene]
   */
  $scope.addCard = function () {
    var card =  -1,
      coord = [];

    if (Math.random() > 0.2) {
      card = 2;
    } else {
      card = 4;
    }
    coord = randomCoord();
    matrixArr[coord[0]][coord[1]] = card;

    localStorageService.set('matrix', JSON.stringify(matrixArr));

    debug.info('matrixArr: ' + JSON.stringify(matrixArr));
    movedFlag = true;
    animShowCard(coord[0], coord[1]);
  }

  drawCardNumber = function (card, x, y) {
    if (typeof card !== 'undefined' && card != -1) {
      var cardImage = new Image();
      cardImage.src = 'images/card_' + zeroPad(Math.log(card) / Math.log(2) - 1, 4) + '_' + card + '.png';
      cardImage.onload = function () {
        ctx.drawImage(cardImage,x, y);
      }
    }
  }

  animShowCard = function (i, j) {
    var progress = 0;
    var x = sideMargin + j * cellWidth + j * cellMargin;
    var y = sideMargin +  i* cellHeight + i * cellMargin;
    var card = matrixArr[i][j];

    function drawCard () {
      // debug.info('drawCard progress: ' +　progress);
      progress = (progress >= maxProgress ? maxProgress : progress);
      ctx.fillStyle = getBackgroundColor(card);
      ctx.fillRadiusRect(x, y, cellWidth * progress / maxProgress, cellHeight * progress / maxProgress, radius * progress / maxProgress, true, true);
      if (progress >= maxProgress) {
        clearInterval(id);
        drawCardNumber(card, x + (cellWidth - cardImageWidthHeight) / 2, y + (cellWidth - cardImageWidthHeight) / 2);
      } else {
        progress = (progress + animFrequency > maxProgress ?  maxProgress : progress + animFrequency);
      }
    }

    var id = setInterval(function () {drawCard()}, averageAnimTime)
  }

  animMoveCard = function (startPos, targetPos) {
    var progress = 0;
    var startX = sideMargin + startPos[1] * cellWidth + startPos[1] * cellMargin;
    var startY = sideMargin + startPos[0] * cellHeight + startPos[0] * cellMargin
    var targetX = sideMargin + targetPos[1] * cellWidth + targetPos[1] * cellMargin;
    var targetY = sideMargin + targetPos[0] * cellHeight + targetPos[0] * cellMargin;

    var card = matrixArr[targetPos[0]][targetPos[1]];
    var distXMoved =  targetX - startX;
    var distYMoved = targetY - startY;

    function moveCard () {
      // debug.info('moveCard progress: ' +　progress);
      ctx.clearRect(startX + distXMoved * progress / maxProgress - 2, startY + distYMoved * progress / maxProgress - 2, cellWidth + 4, cellHeight + 4);

      if (progress >= maxProgress) {
        drawCardNumber(card, targetX + (cellWidth - cardImageWidthHeight) / 2, targetY + (cellWidth - cardImageWidthHeight) / 2);
        drawMovingCellByIndex(targetPos[0], targetPos[1], startX + distXMoved, startY + distYMoved);
        clearInterval(id);
      } else {
        progress = (progress + animFrequency > maxProgress ?  maxProgress : progress + animFrequency);
        drawMovingCellByIndex(targetPos[0], targetPos[1], startX + distXMoved * progress / maxProgress, startY + distYMoved * progress / maxProgress);
      }
    }

    var id = setInterval(
      function () {
        moveCard()
      },
      averageAnimTime
    )
  }

  $scope.mouseDownHandle = function (e) {
    mouseDownPos = [e.offsetX, e.offsetY];

    debug.info(mouseDownPos);
  }

  $scope.mouseUpHandle = function (e) {
    var x = e.offsetX,
      y = e.offsetY,
      key;

    if (gameover) {
      return;
    }

    if (Math.abs(x - mouseDownPos[0]) > 60) {
      key = (x - mouseDownPos[0] > 0 ? 39 : 37);
    }

    if (Math.abs(y - mouseDownPos[1]) > 60) {
      key = (y - mouseDownPos[1] > 0 ? 40 : 38);
    }

    $scope.moveStep(key);

    debug.info(mouseDownPos);
  }

  $scope.moveStepPre = function () {
    var e = window.event || e,
      key;

    if (gameover) {
      return;
    }

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

    if ($scope.score > $scope.bestScore) {
      $scope.bestScore = $scope.score;
      localStorageService.set('bestScore', $scope.score);
    }
    localStorageService.set('score', $scope.score);
  }

  savePreStep = function () {
    var midMatrix = [];
    for (var i = 0; i < rowCount; i++) {
      midMatrix[i] = [];
      for (var j = 0; j < columnCount; j++) {
        midMatrix[i][j] = matrixArr[i][j];
      }
    }

    if ($scope.stepHistory.length >= maxAvailableRegretSteps ) {
      $scope.stepHistory.splice(0, 1);
    }
    $scope.stepHistory.push(midMatrix);
  }

  $scope.moveStep = function (key) {
    scoreAdd = 0;
    savePreStep();

    moveDirect = directions[key - 37];

    switch (key) {
      case 37:
        for (var i = 0; i < rowCount; i++) {
          for (var j = 0; j < columnCount; j++) {
            var k = j;
            if (matrixArr[i][j] != -1) {
              while (k < rowCount - 1) {
                if (matrixArr[i][j] == matrixArr[i][k + 1]) {
                  matrixArr[i][j] = matrixArr[i][j] * 2;
                  matrixArr[i][k + 1] = -1;

                  animMoveCard([i, k + 1], [i, j]);

                  delayed(0, function (i, j) {
                    return function() {
                      animShowCard(i, j)
                    };
                  }(i, j));

                  scoreAdd += matrixArr[i][j];

                  j++;
                  mergedFlag = true;
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
              while (k < columnCount - 1) {
                if (matrixArr[j][i] == matrixArr[k + 1][i]) {
                  matrixArr[j][i] = matrixArr[j][i] * 2;
                  matrixArr[k + 1][i] = -1;

                  animMoveCard([k + 1, i], [j, i]);
                  // setTimeout(animShowCard(j, i), 0);

                  delayed(0, function (j, i) {
                    return function() {
                      animShowCard(j, i)
                    };
                  }(j, i));

                  scoreAdd += matrixArr[j][i];

                  j++;
                  mergedFlag = true;
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

                  animMoveCard([i, k - 1], [i, j]);
                  // setTimeout(animShowCard(i, j), 0);

                  delayed(0, function (i, j) {
                    return function() {
                      animShowCard(i, j);
                    };
                  }(i, j));

                  scoreAdd += matrixArr[i][j];

                  j--;
                  mergedFlag = true;
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

                  animMoveCard([k - 1, i], [j, i]);
                  // setTimeout(animShowCard(j, i), 0);

                  animShowCard(j, i);

                  scoreAdd += matrixArr[j][i];

                  j--;
                  mergedFlag = true;
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
        break
      default:
        break
    }

    $scope.mergeCard(scoreAdd);
    scoreAddHistory.push(scoreAdd);

    delayed(Math.round(maxProgress / animFrequency * averageAnimTime + 20), function (moveDirect) {
      return function() {
        moveToEdge(moveDirect);
      }
    }(moveDirect));
  }

  /**
   * [moveToEdge description]
   * @param  {[type]} direction
   * @return {[type]}
   */
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
                emptyPosQueue.push([i, j]);

                animMoveCard([i, j], firstEmptyPos);
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
              if (emptyPosQueue.length > 0) {
                // pop the first empty pos for fill
                var firstEmptyPos = emptyPosQueue.splice(0, 1)[0];
                matrixArr[firstEmptyPos[0]][firstEmptyPos[1]] = matrixArr[j][i];
                movedFlag = true;

                // Reset this pos equals to -1
                matrixArr[j][i] = -1;
                emptyPosQueue.push([j, i]);

                animMoveCard([j, i], firstEmptyPos);
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
              if (emptyPosQueue.length > 0) {
                // pop the first empty pos for fill
                var firstEmptyPos = emptyPosQueue.splice(0, 1)[0];
                matrixArr[firstEmptyPos[0]][firstEmptyPos[1]] = matrixArr[i][j];
                movedFlag = true;

                // Reset this pos equals to -1
                matrixArr[i][j] = -1;
                emptyPosQueue.push([i, j]);

                animMoveCard([i, j], firstEmptyPos);
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
              if (emptyPosQueue.length > 0) {
                // pop the first empty pos for fill
                var firstEmptyPos = emptyPosQueue.splice(0, 1)[0];
                matrixArr[firstEmptyPos[0]][firstEmptyPos[1]] = matrixArr[j][i];
                movedFlag = true;

                // Reset this pos equals to -1
                matrixArr[j][i] = -1;
                emptyPosQueue.push([j, i]);

                animMoveCard([j, i], firstEmptyPos);
              }
            }
          }
        }
        break;
      default:
        break
    }

    if (movedFlag || mergedFlag) {
      $scope.totalSteps++;
      $scope.addCard();
      movedFlag = false;
      mergedFlag = false;
    } else {
      if (gameover = checkGameOver()) {
        $scope.remainAvailableRegretSteps = 0;
        $scope.stepHistory = [];
        $scope.submitScore();
        window.alert('Game Over');
        return;
      }
    }
  }

  $scope.touchStartHandle = function (e) {
    // Ignore if touching with more than 1 finger
    if (e.touches.length > 1 || e.targetTouches > 1) {
      return;
    }

    var touchStartClientX = e.changedTouches[0].clientX;
    var touchStartClientY = e.changedTouches[0].clientY;

    touchStartPos = [touchStartClientX, touchStartClientY];

    debug.info(touchStartPos);
    e.preventDefault();
  }

  $scope.touchEndHandle = function (e) {
    var key;
    var touchEndClientX = e.changedTouches[0].clientX;
    var touchEndClientY = e.changedTouches[0].clientY;

    if (gameover) {
      return;
    }

    if (Math.abs(touchEndClientX - touchStartPos[0]) > 100) {
      key = (touchEndClientX - touchStartPos[0] > 0 ? 39 : 37);
    }

    if (Math.abs(touchEndClientY - touchStartPos[1]) > 100) {
      key = (touchEndClientY - touchStartPos[1] > 0 ? 40 : 38);
    }

    $scope.moveStep(key);

    debug.info(touchStartPos);
  }

  getBackgroundColor = function (value) {
    var n = Math.log(value) / Math.log(2);
    var color = '';

    if (value == -1) {
      color = cellbackgroundFillColor;
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

  refillBackgroundEmptyCard = function () {
    for (var i = 0; i < rowCount; i++) {
      for (var j = 0; j < columnCount; j++) {
        if (matrixArr[i][j] == -1) {
          resetCellByIndex(i, j);
        }
      }
    }
  }

  resetCellByIndex = function (i, j) {
    var x = sideMargin + j * cellWidth + j * cellMargin;
    var y = sideMargin + i * cellHeight + i * cellMargin;
    var card = matrixArr[i][j];

    ctx.fillStyle = getBackgroundColor(card);
    ctx.fillRadiusRect(x, y, cellWidth, cellHeight, radius, true, true);
  }

  resetCellDefaultBackgroundByIndex = function (i, j) {
    var x = sideMargin + j * cellWidth + j * cellMargin;
    var y = sideMargin + i * cellHeight + i * cellMargin;

    ctxBack.fillStyle = cellbackgroundFillColor;
    ctxBack.fillRadiusRect(x, y, cellWidth, cellHeight, radius, true, true);
  }

  /**
   * [drawMovingCellByIndex Draw a moving card]
   * @param  {[type]} i [first index of matrix]
   * @param  {[type]} j [second index of matrix]
   * @param  {[type]} x []
   * @param  {[type]} y []
   * @return {[type]}   []
   */
  drawMovingCellByIndex = function (i, j, x, y) {
    var card = matrixArr[i][j];
    ctx.fillStyle = getBackgroundColor(card);
    ctx.fillRadiusRect(x, y, cellWidth, cellHeight, radius, true, true);
  }

  /**
   * [zeroPad description]
   * @param  {[Integer]} num The number waiting for convert
   * @param  {[Integer]} n The total length of the final num
   * @return {[Integer]}
   */
  zeroPad = function (num, n) {
    if ((num + '').length >= n) return num;
      return zeroPad('0' + num, n);
  }

  /**
   * [checkGameOver Check whether game is over. There're no empty(-1) item in the MatrixArr, no card can be merged further]
   * @return {[Boolean]}
   */
  checkGameOver = function () {
    var overFlag = true;

    if (matrixArr.toString().indexOf(-1) == -1) {
      for (var i = 0; i < rowCount; i++) {
        for (var j = 0; j < columnCount; j++) {
          var k = j;
          if (matrixArr[i][j] != -1) {
            while (k < rowCount - 1) {
              if (matrixArr[i][j] == matrixArr[i][k + 1]) {
                overFlag = false;
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
      for (var i = 0; i < columnCount; i++) {
        for (var j = 0; j < rowCount; j++) {
          var k = j;
          if (matrixArr[j][i] != -1) {
            while (k < columnCount - 1) {
              if (matrixArr[j][i] == matrixArr[k + 1][i]) {
                overFlag = false;
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
      for (var i = 0; i < rowCount; i++) {
        for (var j = columnCount - 1; j >= 0; j--) {
          var k = j;
          if (matrixArr[i][j] != -1) {
            while (k > 0) {
              if (matrixArr[i][j] == matrixArr[i][k - 1]) {
                overFlag = false;
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
      for (var i = 0; i < columnCount; i++) {
        for (var j = rowCount - 1; j > 0; j--) {
          var k = j;
          if (matrixArr[j][i] != -1) {
            while (k > 0) {
              if (matrixArr[j][i] == matrixArr[k - 1][i]) {
                overFlag = false;
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
    } else {
      overFlag = false;
    }

    return overFlag;
  }

  /**
   * [randomCoord Random a usable coordinate]
   * @return {Object Array[x, y]}
   */
  randomCoord = function () {
    var horiX = randomPos(),
      verX = randomPos();

    while (matrixArr[horiX][verX] != -1) {
      horiX = randomPos();
      verX = randomPos();
    }

    return [horiX, verX];
  }

  /**
   * [randomPos get the random integer which is less than 4]
   * @return {Number}
   */
  randomPos = function () {
    var pos = -1,
      random;

    while (true) {
      random = Math.floor(Math.random() * 10);
      if (random < rowCount) {
        break;
      }
    }
    return random;
  }

  preloadResources = function () {
    // preload image
    for (var i = 0; i < 12; i++) {
      new Image().src = 'images/card_' + zeroPad(i, 4) + '_' + Math.pow(2, i + 1) + '.png';
    }

  }

  extendCanvas = function () {
    // Extend the canvas be able to draw a round rect
    CanvasRenderingContext2D.prototype.fillRadiusRect = function (x, y, width, height, radius, fill, stroke) {
      if (typeof radius === 'undefined') {
        radius = 5;
      }

      if (typeof stroke === 'undefined') {
        stroke = true;
      }

      this.beginPath();
      this.strokeStyle = canvasBackgroundColor;
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
}]);