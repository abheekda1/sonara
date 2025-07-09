import { useEffect, useRef, useState } from "react";
import { createAudioWorklet } from "../audio/mic-worklet-wrapper";

export function useDeepgramViaProxy() {
  // const [text, setText] = useState("");
  const [data, setData] = useState(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");
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
  }, []);

  // return text;
  return data;
}
