var ReconnectingWebSocket = require("ReconnectingWebSocket");

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.ScreenInvader = factory();
  }
}(this, function () {

  var Player = function(api) {
    this.api = api;
  };

  Player.prototype = {
    pause:    function() { this.api.command('playerPause'); },
    play:     function() { this.api.command('playerPlay'); },
    stop:     function() { this.api.command('playerStop'); },
    next:     function() { this.api.command('playerNext'); },
    previous: function() { this.api.command('playerPrevious'); },
    forward:  function() { this.api.command('playerForward'); },
    rewind:   function() { this.api.command('playerRewind'); },
    jump:     function(id) {
      this.api.command('playerJump', id.toString());
    },
    seek:     function(seconds) {
      this.api.command('playerSeek', seconds.toStrings());
    },
  };

  var Playlist = function(api) {
    this.api = api;
  };

  Playlist.prototype = {
    remove: function (id) {
      this.api.command('playlistRemove', id.toString());
    },
    clear: function () { this.api.command('playlistClear'); },
    shift: function (from, to) {
      this.api.command('playlistShift', JSON.stringify({
        from: from.toString(),
        to: to.toString()
     }));
    },
    load: function (urls) {
      this.api.command('playlistLoad', urls);
    },
  };

  var Browser = function(api) {
    this.api = api;
  };

  Browser.prototype = {
    showUrl:     function() { this.api.command('/browser/url'); },
    scrollUp:    function() { this.api.command('browserScrollUp'); },
    scrollDown:  function() { this.api.command('browserScrollDown'); },
    scrollLeft:  function() { this.api.command('browserScrollLeft'); },
    scrollRight: function() { this.api.command('browserScrollRight'); },
    zoomIn:      function() { this.api.command('browserZoomIn'); },
    zoomOut:     function() { this.api.command('browserZoomOut'); },
    close:       function() { this.api.command('browserClose'); },
  };

  var Pdf = function(api) {
    this.api = api;
  };

  Pdf.prototype = {
    showUrl:     function() { this.api.command('/pdf/url'); },
    active:      function() { this.api.command('/pdf/active'); },
    pageUp:      function() { this.api.command('pdfPageUp'); },
    pageDown:    function() { this.api.command('pdfPageDown'); },
    scrollUp:    function() { this.api.command('pdfScrollUp'); },
    scrollDown:  function() { this.api.command('pdfScrollDown'); },
    scrollLeft:  function() { this.api.command('pdfScrollLeft'); },
    scrollRight: function() { this.api.command('pdfScrollRight'); },
    zoomIn:      function() { this.api.command('pdfZoomIn'); },
    zoomOut:     function() { this.api.command('pdfZoomOut'); },
  };

  var Notify = function(api) {
    this.api = api;
  };

  Notify.prototype = {
    info:        function(text) { this.api.command('notifySend', text); },
    exception:   function(text) { this.api.command('notifyException', text); },
  };

  var Shairport = function(api) {
    this.api = api;
  };

  Shairport.prototype = {
    start:        function() { this.api.command('shairportStart'); },
    stop:   function() { this.api.command('shairportStop'); },
  };

  var Peerflix = function(api) {
    this.api = api;
  }

  Peerflix.prototype = {
    start:        function() { this.api.command('peerflixStart'); },
    stop:   function() { this.api.command('peerflixStop'); },
  };

  var Mousebutton = function(api, buttonId) {
    this.api = api;
    this.buttonId = buttonId;
  };

  Mousebutton.prototype = {
    up:   function() { this.api.mouse.up(this.buttonId); },
    down: function() { this.api.mouse.down(this.buttonId); },
  };

  var Mouse = function(api) {
    this.api = api;
    
    this.buttons = {
      left:      new Mousebutton(this.api, '1'),
      middle:    new Mousebutton(this.api, '2'),
      right:     new Mousebutton(this.api, '3'),
      wheelUp:   new Mousebutton(this.api, '4'),
      wheelDown: new Mousebutton(this.api, '5'),
    };
  };
  
  Mouse.prototype = {
    moveAbs: function(x, y) { this.api.command('mouseMoveAbs', JSON.stringify([ x, y ])); },
    moveRel: function(x, y) { this.api.command('mouseMoveRel', JSON.stringify([ x, y ])); },
    up:      function(button) { this.api.command('mouseUp', button); },
    down:    function(button) { this.api.command('mouseDown', button); },
  };

  var Keyboard = function(api) {
    this.api = api;
  };

  Keyboard.prototype = {
    keyType: function(key) { this.api.command('keyType', key); },
    keyUp:   function(key) { this.api.command('keyUp', key); },
    keyDown: function(key) { this.api.command('keyDown', key); },
  };
  
  var API = function(uri) {
    this.socket = new ReconnectingWebSocket(uri);
    this.socket.onmessage = this.onMessage.bind(this);
    this.socket.onerror = this.onError.bind(this);
    this.socket.onopen = this.onOpen.bind(this);

    this.player = new Player(this);
    this.playlist = new Playlist(this);
    this.browser = new Browser(this);
    this.pdf = new Pdf(this);
    this.notify = new Notify(this);
    this.mouse = new Mouse(this);
    this.keyboard = new Keyboard(this);
    this.shairport = new Shairport(this);
    this.peerflix = new Peerflix(this);
    this.eventHandlers = {};
  };

  API.prototype = {
    onReceive: function(fn) {
      this.onReceiveCallback = fn;
    },
    onMessage: function(ev) {
      var update = JSON.parse(ev.data);
      if (!Array.isArray(update)) {
        // initial full sync.
        this.state = update;
        this.state.events = {};
      } else {
        if (!this.state) { return; }

        if (update[0].startsWith('/')) {
          // update has the format key, operation, value here.
          var path = update[0].split('/');
          path.shift();
          console.log(path);
          if(update[1] == "W") {
            console.debug('changing ' + update[0] + ' from ' +
                          this.getByPath(this.state, path.slice(0)) +
                          ' to ' + update[2]);
            this.setByPath(this.state, path.slice(0), update[2]);
          } else if(update[1] == "D") {
            this.deleteByPath(this.state, path.slice(0));
          }
        } else {
          // update has the following format: event, operation, value
          var eventName = update[0],
              params = update[2];
          var handlers = this.eventHandlers[eventName];
          if (Array.isArray(handlers)) {
            handlers.forEach(function(handler) {
              handler(params);
            });
          }
          return;
        }
      }
      if (typeof(this.onReceiveCallback) !== 'undefined') {
        this.onReceiveCallback(this.state);
      }
    },
    setByPath: function (obj, path, value) {
      if (path.length > 1) {
        key = path.shift();
        if(key.charAt(0) == '#') {
          //encountered an array element
          key = parseInt(key.substring(1));
        } else if(key == ".") {
          //encountered a directory element -> ignore
          return null;
        }

        if(obj[key] === undefined) {
          if(path.length >= 1 && path[0] == ".") {
            if(value.charAt(0) == 'A') {
              //create an array
              obj[key] = [];
              return null;
            } else {
              //create an object
              obj[key] = {};
              return null;
            }
          } else {
            obj[key] = "";
          }
        }
        return this.setByPath(obj[key], path, value);
      } else {
        key = path.shift();
        if(key == ".") {
          return null;
        }
        obj[key] = value;
      }
    },
    deleteByPath: function (obj, path) {
      if (path.length > 1) {
        key = path.shift();
        if(key.charAt(0) == '#') {
          key = parseInt(key.substring(1));
        } 

        if(path[0] == ".") {
          if(Array.isArray(obj)) {
            if(obj.length < 2)
              obj = [];
            else
              obj.splice(key, 1);
          }
          else
            delete obj[key];

          return null;
        }

        return this.deleteByPath(obj[key], path);
      } else {
        key = path.shift();
        delete obj[key];
      }
    },
    getByPath: function(obj, path) {
      if (path.length > 0) {
        key = path.shift();
        if(key == ".") {
          return null;
        } else if (obj === undefined) {
          return null;
        }
        return this.getByPath(obj[key], path);
      }
    },
    subscribe: function(eventName, fn) {
      this.eventHandlers[eventName] = this.eventHandlers[eventName] || [];
      this.eventHandlers[eventName].push(fn);
    },
    onError: function(fn) {
      this.socket.onerror = fn;
    },
    onOpen: function(ev) {
      this.socket.send('setup');
    },
    send: function(command, key, value) {
      this.socket.send(
        JSON.stringify(
          Array.prototype.slice.call(
            arguments)));
    },
    set: function (key, value) {
      console.debug('setting', key, 'to', value);
      this.send('trigger', key, value);
    },
    command: function(command, param) {
      param = typeof(param) === 'undefined' ? '' : param;
      console.debug('executing '+command+'('+param+')');
      this.send('publish', command, 'W', param);
    },
    showUrl: function(url) { this.command('showUrl', url); },
    setVolume: function(volume) { this.set('/sound/volume', volume); },
  };

  return API;
}));
