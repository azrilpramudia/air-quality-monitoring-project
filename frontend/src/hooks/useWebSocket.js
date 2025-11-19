import { useEffect, useState } from "react";

export function useWebSocket(url) {
  const [data, setData] = useState(null);

  useEffect(() => {
    const socket = new WebSocket(url);

    socket.onmessage = (msg) => {
      setData(JSON.parse(msg.data));
    };

    return () => socket.close();
  }, [url]);

  return data;
}
