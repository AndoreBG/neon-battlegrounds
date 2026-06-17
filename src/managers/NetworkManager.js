class NetworkManager {
    constructor() {
        this.connected = false;
        this.socket = null;
        this.listeners = new Map();
        this.pendingEvents = [];
    }

    connect(socket = null) {
        this.socket = socket;
        this.connected = Boolean(socket);

        for (const [event, callbacks] of this.listeners) {
            for (const callback of callbacks) {
                this.socket?.on?.(event, callback);
            }
        }

        this.flushPendingEvents();
    }

    getSocketId() {
        return this.socket?.id || null;
    }

    disconnect() {
        this.socket?.disconnect?.();
        this.socket = null;
        this.connected = false;
    }

    send(event, data) {
        if (!this.connected || !this.socket?.emit) {
            this.pendingEvents.push({ event, data });
            return;
        }

        this.socket.emit(event, data);
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }

        this.listeners.get(event).push(callback);
        this.socket?.on?.(event, callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
        this.socket?.off?.(event, callback);
    }

    flushPendingEvents() {
        if (!this.connected || !this.socket?.emit) {
            return;
        }

        for (const payload of this.pendingEvents) {
            this.socket.emit(payload.event, payload.data);
        }

        this.pendingEvents = [];
    }
}

export const networkManager = new NetworkManager();