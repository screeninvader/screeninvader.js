var Player = function(api) {
  this.api = api;
}

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
    this.api.command('playerJump', parseInt(id) + 1);
  },
};

var Browser = function(api) {
  this.api = api;
}

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
}

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
}

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
  this.messageReceived = false;
}

API.prototype = {

  //fn is a custom callback and gets executed in onMessage below
  onReceive: function(fn) {
    this.onReceiveCallback = fn;
  },
  //message from the server received
  onMessage: function(ev) {
    var update = JSON.parse(ev.data);
    if (!Array.isArray(update)) {
      // initial full sync.
      this.state = update;
    } else {
      // update has the format key, operation, value here.
      var path = update[0].split('/'),
          value = update[2]
      ;
      path.shift();
      if ( update[0] === 'notifySend' && value.indexOf('New client') > -1 ) {
        //we return here because this message is received
        //before the state has been set
        this.messageReceived = true;
        return console.log(value);
      }
      console.debug('changing ' + update[0] + ' from ' +
              this.getByPath(this.state, path.slice(0)) +
              ' to ' + value);
      this.setByPath(this.state, path.slice(0), value);
    }
    this.onReceiveCallback(this.state);
  },
  setByPath: function (obj, path, value) {
    if (path.length > 1) {
      return this.setByPath(obj[path.shift()], path, value);
    } else {
      obj[path.shift()] = value;
    }
  },
  getByPath: function(obj, path) {
    if (path.length > 0) {
      return this.getByPath(obj[path.shift()], path);
    } else {
      return obj;
    }
  },
  //socket connection errored
  onError: function(ev) {
    console.error(ev);
  },
  //first response
  onOpen: function(ev) {
    this.socket.send('setup');
  },
  //send a message to the server
  send: function(command, key, value) {
    this.socket.send(
      JSON.stringify(
        Array.prototype.slice.call(
          arguments)));
  },
  //set a serverside janosh key to a value
  set: function (key, value) {
    console.debug('setting', key, 'to', value);
    this.send('trigger', key, value);
  },
  //classes use this to execute commands
  command: function(command, param) {
    param = typeof(param) === 'undefined' ? '' : param.toString();
    console.debug('executing '+command+'('+param+')');
    this.send('publish', command, 'W', param);
  },
  //show a url in the browser, pdfviewer or videoplayer
  showUrl: function(url) { this.command("showUrl", url); },
  //set the volume to value
  setVolume: function(volume) { this.set('/sound/volume', volume); },
  //mute and unmute are the same function
  mute: function(volume) { this.set('/sound/mute', volume); },
};

module.exports = API;
