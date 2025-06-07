// src/services/RiskService.ts
var RiskService = /** @class */ (function () {
    function RiskService() {
        this.socket = null;
        this.mockIntervalId = null;
        this.subscribers = [];
        this.reconnectionAttempts = 0;
        this.maxReconnectionAttempts = 5;
        this.reconnectionDelay = 5000; // 5 seconds
    }
    RiskService.prototype.connect = function (url) {
        var _this = this;
        // If a URL is provided, attempt to connect to a real WebSocket server
        if (url) {
            console.log("[RiskService] Attempting to connect to WebSocket at ".concat(url));
            this.socket = new WebSocket(url);
            this.socket.onopen = function () {
                console.log('[RiskService] WebSocket connection established.');
                _this.reconnectionAttempts = 0; // Reset on successful connection
                // You might want to send an initial message or authentication token here
            };
            this.socket.onmessage = function (event) {
                try {
                    var message = JSON.parse(event.data);
                    if (message.type === 'riskUpdate') {
                        _this.notifySubscribers(message.payload);
                    }
                }
                catch (error) {
                    console.error('[RiskService] Error parsing message:', error);
                }
            };
            this.socket.onerror = function (error) {
                console.error('[RiskService] WebSocket error:', error);
                // Error event will likely be followed by a close event
            };
            this.socket.onclose = function (event) {
                console.log("[RiskService] WebSocket connection closed. Code: ".concat(event.code, ", Reason: ").concat(event.reason, ", Clean: ").concat(event.wasClean));
                if (!event.wasClean && _this.reconnectionAttempts < _this.maxReconnectionAttempts) {
                    _this.reconnectionAttempts++;
                    console.log("[RiskService] Attempting to reconnect... (".concat(_this.reconnectionAttempts, "/").concat(_this.maxReconnectionAttempts, ")"));
                    setTimeout(function () { return _this.connect(url); }, _this.reconnectionDelay * _this.reconnectionAttempts);
                }
                else if (_this.reconnectionAttempts >= _this.maxReconnectionAttempts) {
                    console.error('[RiskService] Max reconnection attempts reached.');
                    _this.startMockData(); // Fallback to mock data if max attempts reached
                }
                else {
                    // If it was a clean close, or we don't want to reconnect, start mock data if not already running
                    if (!_this.mockIntervalId) {
                        console.log('[RiskService] Connection closed cleanly or no reconnection desired. Starting mock data as fallback.');
                        _this.startMockData();
                    }
                }
            };
        }
        else {
            // If no URL, start mock data immediately
            console.log('[RiskService] No WebSocket URL provided. Starting mock data.');
            this.startMockData();
        }
    };
    RiskService.prototype.startMockData = function () {
        var _this = this;
        if (this.mockIntervalId) {
            console.log('[RiskService] Mock data already running.');
            return;
        }
        console.log('[RiskService] Starting mock data emission.');
        this.mockIntervalId = setInterval(function () {
            var mockData = {
                delta: parseFloat((Math.random() * 2 - 1).toFixed(2)), // Random value between -1 and 1
                theta: parseFloat((-Math.random() * 20).toFixed(2)), // Random negative value
                gamma: parseFloat((Math.random() * 0.1).toFixed(2)), // Small positive random value
                vega: parseFloat((Math.random() * 500).toFixed(2)), // Larger positive random value
                timestamp: new Date().toISOString(),
            };
            _this.notifySubscribers(mockData);
        }, 2000); // Emit mock data every 2 seconds
    };
    RiskService.prototype.stopMockData = function () {
        if (this.mockIntervalId) {
            console.log('[RiskService] Stopping mock data emission.');
            clearInterval(this.mockIntervalId);
            this.mockIntervalId = null;
        }
    };
    RiskService.prototype.disconnect = function () {
        this.stopMockData();
        if (this.socket) {
            console.log('[RiskService] Disconnecting WebSocket.');
            this.socket.close(1000, 'Client disconnected'); // 1000 is a normal closure
        }
        this.socket = null; // Ensure it's null after close
        this.subscribers = []; // Clear subscribers on disconnect
        this.reconnectionAttempts = 0; // Reset reconnection attempts
    };
    RiskService.prototype.onRiskData = function (callback) {
        var _this = this;
        this.subscribers.push(callback);
        // Return an unsubscribe function
        return function () {
            _this.subscribers = _this.subscribers.filter(function (sub) { return sub !== callback; });
        };
    };
    RiskService.prototype.notifySubscribers = function (data) {
        this.subscribers.forEach(function (callback) { return callback(data); });
    };
    return RiskService;
}());
// Export a singleton instance
var riskService = new RiskService();
export default riskService;
