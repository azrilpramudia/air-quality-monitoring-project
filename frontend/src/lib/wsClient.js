export const testWS = () => {
  const ws = new WebSocket("ws://localhost:4001");
  ws.onopen = () => console.log("WS TEST: CONNECTED");
  ws.onerror = (e) => console.log("WS TEST: ERROR", e);
  ws.onclose = () => console.log("WS TEST: CLOSED");
};
