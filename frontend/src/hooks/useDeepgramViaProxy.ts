import { useEffect, useRef, useState } from "react";
import { createAudioWorklet } from "../audio/mic-worklet-wrapper";

export function useDeepgramViaProxy(streaming = true, language = "en-US") {
  const [data, setData] = useState<{ text: string; final: boolean } | null>(
    null,
  );
  const wsRef = useRef<WebSocket | null>(null);
  const audioStartedRef = useRef(false);

  useEffect(() => {
    if (!streaming) return;

    const ws = new WebSocket(import.meta.env.VITE_BACKEND_WS + "/ws");
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    ws.onopen = () => {
      // Send config message with selected language
      ws.send(JSON.stringify({ language }));
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.error) {
          console.error("Deepgram backend error:", msg.error);
          return;
        }

        setData(msg);

        // start mic streaming only after initial config accepted
        if (!audioStartedRef.current) {
          audioStartedRef.current = true;
          createAudioWorklet((buf) => {
            if (ws.readyState === WebSocket.OPEN) ws.send(buf);
          });
        }
      } catch (err) {
        console.error("Failed to parse Deepgram message:", err);
      }
    };

    return () => {
      ws.close();
      audioStartedRef.current = false;
    };
  }, [streaming, language]);

  return data;
}
