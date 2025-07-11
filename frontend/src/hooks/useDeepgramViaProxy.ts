import { useEffect, useRef, useState } from "react";
import { createAudioWorklet } from "../audio/mic-worklet-wrapper";

export function useDeepgramViaProxy(streaming = true) {
  // const [text, setText] = useState("");
  const [data, setData] = useState(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!streaming) return;

    const ws = new WebSocket("ws://localhost:8000/ws");
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    ws.onmessage = (e) => {
      // const { final, text: t } = JSON.parse(e.data);
      // setText((p) => (final ? p + " " + t + "\n" : p.replace(/[\s\S]*$/, t)));
      // setText(`${final ? "-> " : ""}${t}`);
      setData(JSON.parse(e.data));
    };

    createAudioWorklet((buf) => {
      if (ws.readyState === 1) ws.send(buf); // send straight away
    });

    return () => ws.close();
  }, [streaming]);

  // return text;
  return data;
}
