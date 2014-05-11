var timer = (function($){
  var _trackDetailList,
    _trackList;

  function _getTrackList () {
    return _trackList;
  }

  function _init () {
    _resetTimer();
  }

  function _createNewTimer (trackName) {
    _trackDetailList[trackName] = [];
    _trackDetailList[trackName]['start'] = Date.parse(new Date());
  }

  function _stopTimer (trackName) {
    _trackDetailList[trackName]['end'] = Date.parse(new Date());
    _trackList[trackName] = _trackDetailList[trackName]['end'] - _trackDetailList[trackName]['start'];
  }

  function _printTrackListToConsole () {
    for(var name in _trackList) {
    debug.info(name + ': ' + _trackList[name] + ' ms');
    }
  }

  function _printTrackListToView () {
    var trackText = "";
    for(var name in _trackList) {
      trackText += (name + ': ' + _trackList[name] + ' ms' + '<br >');
    }
  }

  function _getTrackTimerByKey (key) {
    return _trackList[key] === undefined ? 'Not track this' : _trackList[key];
  }

  function _resetTimer () {
    _trackDetailList = [];
    _trackDetailList.length = 0;
    _trackList = [];
    _trackList.length = 0;
  }

  function _sleep(n)   
  {   
      var  start=new Date().getTime();   
      while(true) if(new Date().getTime()-start>n)  break;   
  } 

  return {
    init: _init,
    getTrackList: _getTrackList,
    createNewTimer: _createNewTimer,
    stopTimer: _stopTimer,
    printTrackListToConsole: _printTrackListToConsole,
    printTrackListToView: _printTrackListToView,
    resetTimer: _resetTimer,
    getTrackTimerByKey: _getTrackTimerByKey,
    sleep: _sleep
  }
})(jQuery);