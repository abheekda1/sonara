import { useEffect, useState } from "react";
import { useDeepgramViaProxy } from "./hooks/useDeepgramViaProxy";

export default function App() {
  const [transcript, setTranscript] = useState("");
  const tempTranscript = useDeepgramViaProxy(); // Custom hook for live transcription

  useEffect(() => {
    if (!tempTranscript) return;
    setTranscript((p) =>
      tempTranscript?.final ? p + " " + tempTranscript.text : p,
    );
  }, [tempTranscript]);

  return (
    <div style={{ padding: "20px" }}>
      <h1>🎤 Live Speech Recognition</h1>
      <pre
        style={{
          whiteSpace: "pre-wrap",
          backgroundColor: "#333",
          padding: "10px",
          borderRadius: "8px",
          color: "#aaa",
        }}
      >
        {transcript}{" "}
        <span style={{ color: "#fff" }}>
          {!tempTranscript?.final ? tempTranscript?.text : ""}
        </span>
      </pre>
    </div>
  );
}
