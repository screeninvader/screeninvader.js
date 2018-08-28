var ReconnectingWebSocket = require("ReconnectingWebSocket");
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
    pause:    function() { this.japi.command('playerPause'); },
    play:     function() { this.japi.command('playerPlay'); },
    stop:     function() { this.japi.command('playerStop'); },
    next:     function() { this.japi.command('playerNext'); },
    previous: function() { this.japi.command('playerPrevious'); },
    forward:  function() { this.japi.command('playerForward'); },
    rewind:   function() { this.japi.command('playerRewind'); },
    jump:     function(id) {
      this.japi.command('playerJump', id.toString());
    },
    seek:     function(seconds) {
      this.japi.command('playerSeek', seconds.toString());
    },
  };

  var Playlist = function(japi) {
    this.japi = japi;
  };

  Playlist.prototype = {
    remove: function (id) {
      this.japi.command('playlistRemove', id.toString());
    },
    clear: function () { this.japi.command('playlistClear'); },
    shift: function (from, to) {
      this.japi.command('playlistShift', JSON.stringify({
        from: from.toString(),
        to: to.toString()
     }));
    },
    load: function (urls) {
      this.japi.command('playlistLoad', urls);
    },
  };

  var Browser = function(japi) {
    this.japi = japi;
  };

  Browser.prototype = {
    showUrl:     function() { this.japi.command('/browser/url'); },
    scrollUp:    function() { this.japi.command('browserScrollUp'); },
    scrollDown:  function() { this.japi.command('browserScrollDown'); },
    scrollLeft:  function() { this.japi.command('browserScrollLeft'); },
    scrollRight: function() { this.japi.command('browserScrollRight'); },
    zoomIn:      function() { this.japi.command('browserZoomIn'); },
    zoomOut:     function() { this.japi.command('browserZoomOut'); },
    close:       function() { this.japi.command('browserClose'); },
  };

  var Pdf = function(japi) {
    this.japi = japi;
  };

  Pdf.prototype = {
    showUrl:     function() { this.japi.command('/pdf/url'); },
    active:      function() { this.japi.command('/pdf/active'); },
    pageUp:      function() { this.japi.command('pdfPageUp'); },
    pageDown:    function() { this.japi.command('pdfPageDown'); },
    scrollUp:    function() { this.japi.command('pdfScrollUp'); },
    scrollDown:  function() { this.japi.command('pdfScrollDown'); },
    scrollLeft:  function() { this.japi.command('pdfScrollLeft'); },
    scrollRight: function() { this.japi.command('pdfScrollRight'); },
    zoomIn:      function() { this.japi.command('pdfZoomIn'); },
    zoomOut:     function() { this.japi.command('pdfZoomOut'); },
  };

  var Notify = function(japi) {
    this.japi = japi;
  };

  Notify.prototype = {
    info:        function(text) { this.japi.command('notifySend', text); },
    exception:   function(text) { this.japi.command('notifyException', text); },
  };

  var Shairport = function(japi) {
    this.japi = japi;
  };

  Shairport.prototype = {
    start:        function() { this.japi.command('shairportStart'); },
    stop:   function() { this.japi.command('shairportStop'); },
  };

  var Peerflix = function(japi) {
    this.japi = japi;
  }

  Peerflix.prototype = {
    start:        function() { this.japi.command('peerflixStart'); },
    stop:   function() { this.japi.command('peerflixStop'); },
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
    moveAbs: function(x, y) { this.japi.command('mouseMoveAbs', JSON.stringify([ x, y ])); },
    moveRel: function(x, y) { this.japi.command('mouseMoveRel', JSON.stringify([ x, y ])); },
    up:      function(button) { this.japi.command('mouseUp', button); },
    down:    function(button) { this.japi.command('mouseDown', button); },
  };

  var Keyboard = function(japi) {
    this.japi = japi;
  };

  Keyboard.prototype = {
    keyType: function(key) { this.japi.command('keyType', key); },
    keyUp:   function(key) { this.japi.command('keyUp', key); },
    keyDown: function(key) { this.japi.command('keyDown', key); },
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
    showUrl: function(url) { this.japi.command('showUrl', url); },
    setVolume: function(volume) { this.japi.set('/sound/volume', volume); },
    subscribe: function(eventName, fn) {
			this.japi.subscribe(eventName, fn);
    }
  };

  return API;
}));
