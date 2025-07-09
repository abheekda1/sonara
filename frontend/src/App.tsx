import { useDeepgramViaProxy } from "./hooks/useDeepgramViaProxy";

export default function App() {
  const transcript = useDeepgramViaProxy(); // Custom hook for live transcription
  return (
    <div style={{ padding: "20px" }}>
      <h1>🎤 Live Speech Recognition</h1>
      <pre
        style={{
          whiteSpace: "pre-wrap",
          backgroundColor: "#333",
          padding: "10px",
          borderRadius: "8px",
        }}
      >
        {transcript}
      </pre>
    </div>
  );
}
