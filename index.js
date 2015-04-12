var Player = function(api) {
  this.api = api;
};

Player.prototype = {
  pause:    function() { this.api.command('playerPause'); },
  // pause a second time un-pauses/plays.
  play:     function() { this.api.command('playerPause'); },
  stop:     function() { this.api.command('playerStop'); },
  next:     function() { this.api.command('playerNext'); },
  previous: function() { this.api.command('playerPrevious'); },
  forward:  function() { this.api.command('playerForward'); },
  rewind:   function() { this.api.command('playerRewind'); },
  jump:     function(id) {
    this.api.command('playerJump',
                     (parseInt(id) + 1).toString());
  },
};

var Playlist = function(api) {
  this.api = api;
};

Playlist.prototype = {
  remove: function (id_) { this.api.command('playlistRemove',
                                            (parseInt(id_) + 1).toString());
  },
  clear: function () { this.api.command('playlistClear'); },
  shift: function (from, to) {
    this.api.command('playlistShift', {
      from: from.toString(),
      to: to.toString()
    });
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
  pageUp:      function() { this.api.command('browserPageUp'); },
  pageDown:    function() { this.api.command('browserPageDown'); },
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

var API = function(uri) {
  this.socket = new WebSocket(uri);
  this.socket.onmessage = this.onMessage.bind(this);
  this.socket.onerror = this.onError.bind(this);
  this.socket.onopen = this.onOpen.bind(this);
  this.player = new Player(this);
  this.browser = new Browser(this);
  this.pdf = new Pdf(this);
  this.notify = new Notify(this);
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
        this.state.events[update[0]] = update[2];
      }
    }
    this.onReceiveCallback(this.state);
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
        } else if(path[0] == ".") {
          delete obj[key];
          return null;
        }

      return this.deleteByPath(obj[key], path);
    } else {
      key = path.shift();
        if(key == ".") {
          return null;
        }
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
    } else {
      return obj;
    }
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

module.exports = API;
