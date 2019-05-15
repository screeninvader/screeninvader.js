import ReconnectingWebSocket from 'reconnecting-websocket';
var JanoshAPI = require("janosh.js");

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.ScreenInvader = factory();
  }
}(this, function () {

  var Player = function(japi) {
    this.japi = japi;
  };

  Player.prototype = {
    pause:    function() { this.japi.publish('playerPause'); },
    play:     function() { this.japi.publish('playerPlay'); },
    stop:     function() { this.japi.publish('playerStop'); },
    next:     function() { this.japi.publish('playerNext'); },
    previous: function() { this.japi.publish('playerPrevious'); },
    forward:  function() { this.japi.publish('playerForward'); },
    rewind:   function() { this.japi.publish('playerRewind'); },
    jump:     function(id) {
      this.japi.publish('playerJump', id.toString());
    },
    seek:     function(seconds) {
      this.japi.publish('playerSeek', seconds.toString());
    },
  };

  var Playlist = function(japi) {
    this.japi = japi;
  };

  Playlist.prototype = {
    remove: function (id) {
      this.japi.publish('playlistRemove', id.toString());
    },
    clear: function () { this.japi.publish('playlistClear'); },
    shift: function (from, to) {
      this.japi.publish('playlistShift', JSON.stringify({
        from: from.toString(),
        to: to.toString()
     }));
    },
    load: function (urls) {
      this.japi.publish('playlistLoad', urls);
    },
  };

  var Browser = function(japi) {
    this.japi = japi;
  };

  Browser.prototype = {
    scrollUp:    function() { this.japi.publish('browserScrollUp'); },
    scrollDown:  function() { this.japi.publish('browserScrollDown'); },
    scrollLeft:  function() { this.japi.publish('browserScrollLeft'); },
    scrollRight: function() { this.japi.publish('browserScrollRight'); },
    zoomIn:      function() { this.japi.publish('browserZoomIn'); },
    zoomOut:     function() { this.japi.publish('browserZoomOut'); },
    close:       function() { this.japi.publish('browserClose'); },
  };

  var Pdf = function(japi) {
    this.japi = japi;
  };

  Pdf.prototype = {
    pageUp:      function() { this.japi.publish('pdfPageUp'); },
    pageDown:    function() { this.japi.publish('pdfPageDown'); },
    scrollUp:    function() { this.japi.publish('pdfScrollUp'); },
    scrollDown:  function() { this.japi.publish('pdfScrollDown'); },
    scrollLeft:  function() { this.japi.publish('pdfScrollLeft'); },
    scrollRight: function() { this.japi.publish('pdfScrollRight'); },
    zoomIn:      function() { this.japi.publish('pdfZoomIn'); },
    zoomOut:     function() { this.japi.publish('pdfZoomOut'); },
  };

  var Notify = function(japi) {
    this.japi = japi;
  };

  Notify.prototype = {
    info:        function(text) { this.japi.publish('notifySend', text); },
    exception:   function(text) { this.japi.publish('notifyException', text); },
  };

  var Shairport = function(japi) {
    this.japi = japi;
  };

  Shairport.prototype = {
    start:        function() { this.japi.publish('shairportStart'); },
    stop:   function() { this.japi.publish('shairportStop'); },
  };

  var Peerflix = function(japi) {
    this.japi = japi;
  }

  Peerflix.prototype = {
    start:        function() { this.japi.publish('peerflixStart'); },
    stop:   function() { this.japi.publish('peerflixStop'); },
  };

  var Mousebutton = function(japi, buttonId) {
    this.japi = japi;
    this.buttonId = buttonId;
  };

  Mousebutton.prototype = {
    up:   function() { this.japi.mouse.up(this.buttonId); },
    down: function() { this.japi.mouse.down(this.buttonId); },
  };

  var Mouse = function(japi) {
    this.japi = japi;

    this.buttons = {
      left:      new Mousebutton(this.japi, '1'),
      middle:    new Mousebutton(this.japi, '2'),
      right:     new Mousebutton(this.japi, '3'),
      wheelUp:   new Mousebutton(this.japi, '4'),
      wheelDown: new Mousebutton(this.japi, '5'),
    };
  };

  Mouse.prototype = {
    moveAbs: function(x, y) { this.japi.publish('mouseMoveAbs', JSON.stringify([ x, y ])); },
    moveRel: function(x, y) { this.japi.publish('mouseMoveRel', JSON.stringify([ x, y ])); },
    up:      function(button) { this.japi.publish('mouseUp', button); },
    down:    function(button) { this.japi.publish('mouseDown', button); },
  };

  var Keyboard = function(japi) {
    this.japi = japi;
  };

  Keyboard.prototype = {
    keyType: function(key) { this.japi.publish('keyType', key); },
    keyUp:   function(key) { this.japi.publish('keyUp', key); },
    keyDown: function(key) { this.japi.publish('keyDown', key); },
  };

  var API = function(uri) {
	  this.japi = new JanoshAPI(uri);

    this.player = new Player(this.japi);
    this.playlist = new Playlist(this.japi);
    this.browser = new Browser(this.japi);
    this.pdf = new Pdf(this.japi);
    this.notify = new Notify(this.japi);
    this.mouse = new Mouse(this.japi);
    this.keyboard = new Keyboard(this.japi);
    this.shairport = new Shairport(this.japi);
    this.peerflix = new Peerflix(this.japi);
    this.eventHandlers = {};
  };

  API.prototype = {
    showUrl: function(url) { this.japi.publish('showUrl', url); },
    setVolume: function(val) { this.japi.publish('setVolume', val); },
    subscribe: function(eventName, fn) {
			this.japi.subscribe(eventName, fn);
    },
    onError: function(fn) {
      this.japi.onError(fn);
    },
	  onReceive: function(fn) {
      this.japi.onReceive(fn);
    }
  };

  return API;
}));
