var Player = function(api) {
    this.api = api;
};

Player.prototype = {
    pause: function() { this.api.command('playerPause'); },
    // pause a second time un-pauses/plays.
    play: function() { this.api.command('playerPause'); },
    stop: function() { this.api.command('playerStop'); },
    next: function() { this.api.command('playerNext'); },
    previous: function() { this.api.command('playerPrevious'); },
    forward: function() { this.api.command('playerForward'); },
    rewind: function() { this.api.command('playerRewind'); },
    jump: function(id) {
        this.api.command('playerJump', parseInt(id) + 1);
    },
};

var API = function(uri) {
    this.socket = new WebSocket(uri);
    this.socket.onmessage = this.onMessage.bind(this);
    this.socket.onerror = this.onError.bind(this);
    this.socket.onopen = this.onOpen.bind(this);
    this.player = new Player(this);
    //browser = ['PageUp', 'PageDown', 'ScrollUp', 'ScrollDown', 'ZoomIn', 'ZoomOut']);
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
        } else {
            // update has the format key, operation, value here.
            var path = update[0].split('/');
            path.shift();
            console.debug('changing ' + update[0] + ' from ' +
                          this.getByPath(this.state, path.slice(0)) +
                          ' to ' + update[2]);
            this.setByPath(this.state, path.slice(0), update[2]);
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
    onError: function(ev) {
        console.error(ev);
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
        param = typeof(param) === 'undefined' ? '' : param.toString();
        console.debug('executing '+command+'('+param+')');
        this.send('publish', command, 'W', param);
    },
    showUrl: function(url) { this.command("showUrl", url); },
    setVolume: function(volume) { this.set('/sound/volume', volume); },
};

module.exports = API;
