// src/services/RiskService.ts

export interface RiskDataPayload {
  delta: number;
  theta: number;
  gamma: number;
  vega: number;
  timestamp: string;
}

export interface RiskUpdateMessage {
  type: 'riskUpdate';
  payload: RiskDataPayload;
}

type RiskDataCallback = (data: RiskDataPayload) => void;

class RiskService {
  private socket: WebSocket | null = null;
  private mockIntervalId: NodeJS.Timeout | null = null;
  private subscribers: RiskDataCallback[] = [];
  private reconnectionAttempts = 0;
  private maxReconnectionAttempts = 5;
  private reconnectionDelay = 5000; // 5 seconds

  public connect(url?: string): void {
    // If a URL is provided, attempt to connect to a real WebSocket server
    if (url) {
      console.log(`[RiskService] Attempting to connect to WebSocket at ${url}`);
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        console.log('[RiskService] WebSocket connection established.');
        this.reconnectionAttempts = 0; // Reset on successful connection
        // You might want to send an initial message or authentication token here
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data as string) as RiskUpdateMessage;
          if (message.type === 'riskUpdate') {
            this.notifySubscribers(message.payload);
          }
        } catch (error) {
          console.error('[RiskService] Error parsing message:', error);
        }
      };

      this.socket.onerror = (error) => {
        console.error('[RiskService] WebSocket error:', error);
        // Error event will likely be followed by a close event
      };

      this.socket.onclose = (event) => {
        console.log(`[RiskService] WebSocket connection closed. Code: ${event.code}, Reason: ${event.reason}, Clean: ${event.wasClean}`);
        if (!event.wasClean && this.reconnectionAttempts < this.maxReconnectionAttempts) {
          this.reconnectionAttempts++;
          console.log(`[RiskService] Attempting to reconnect... (${this.reconnectionAttempts}/${this.maxReconnectionAttempts})`);
          setTimeout(() => this.connect(url), this.reconnectionDelay * this.reconnectionAttempts);
        } else if (this.reconnectionAttempts >= this.maxReconnectionAttempts) {
          console.error('[RiskService] Max reconnection attempts reached.');
          this.startMockData(); // Fallback to mock data if max attempts reached
        } else {
           // If it was a clean close, or we don't want to reconnect, start mock data if not already running
           if (!this.mockIntervalId) {
            console.log('[RiskService] Connection closed cleanly or no reconnection desired. Starting mock data as fallback.');
            this.startMockData();
           }
        }
      };
    } else {
      // If no URL, start mock data immediately
      console.log('[RiskService] No WebSocket URL provided. Starting mock data.');
      this.startMockData();
    }
  }

  private startMockData(): void {
    if (this.mockIntervalId) {
      console.log('[RiskService] Mock data already running.');
      return;
    }
    console.log('[RiskService] Starting mock data emission.');
    this.mockIntervalId = setInterval(() => {
      const mockData: RiskDataPayload = {
        delta: parseFloat((Math.random() * 2 - 1).toFixed(2)), // Random value between -1 and 1
        theta: parseFloat((-Math.random() * 20).toFixed(2)),  // Random negative value
        gamma: parseFloat((Math.random() * 0.1).toFixed(2)),  // Small positive random value
        vega: parseFloat((Math.random() * 500).toFixed(2)),   // Larger positive random value
        timestamp: new Date().toISOString(),
      };
      this.notifySubscribers(mockData);
    }, 2000); // Emit mock data every 2 seconds
  }

  private stopMockData(): void {
    if (this.mockIntervalId) {
      console.log('[RiskService] Stopping mock data emission.');
      clearInterval(this.mockIntervalId);
      this.mockIntervalId = null;
    }
  }

  public disconnect(): void {
    this.stopMockData();
    if (this.socket) {
      console.log('[RiskService] Disconnecting WebSocket.');
      this.socket.close(1000, 'Client disconnected'); // 1000 is a normal closure
    }
    this.socket = null; // Ensure it's null after close
    this.subscribers = []; // Clear subscribers on disconnect
    this.reconnectionAttempts = 0; // Reset reconnection attempts
  }

  public onRiskData(callback: RiskDataCallback): () => void {
    this.subscribers.push(callback);
    // Return an unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  private notifySubscribers(data: RiskDataPayload): void {
    this.subscribers.forEach(callback => callback(data));
  }
}

// Export a singleton instance
const riskService = new RiskService();
export default riskService; 