var API = function(uri) {
    this.callbacks = [];
    this.socket = new WebSocket(uri);
    this.socket.onmessage = this.onMessage.bind(this);
    this.socket.onerror = this.onError.bind(this);
    this.socket.onopen = this.onOpen.bind(this);

    this.player = this.addCommandSet(
        'player',
        ['Pause', 'Stop', 'Next', 'Previous', 'Forward', 'Rewind', 'ForwardMore',
         'RewindMore', 'Jump']);
    this.browser = this.addCommandSet(
        'browser',
        ['PageUp', 'PageDown', 'ScrollUp', 'ScrollDown', 'ZoomIn', 'ZoomOut']);

};

API.prototype = {
    onReceive: function(callback) {
        this.callbacks.push(callback);
    },
    onMessage: function(ev) {
        var self = this;
        self.state = JSON.parse(ev.data);
        console.debug('received state update', self.state);
        this.callbacks.forEach(function(callback) {
            callback.call(self, self.state);
        });
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

    addCommandSet: function(name, methods) {
        var set = {}, self = this;
        methods.forEach(function(method, index) {
            set[method.toLowerCase()] = function(param) {
                self.command(name + method, param); };
        });
        return set;
    }
};

module.exports = API;
