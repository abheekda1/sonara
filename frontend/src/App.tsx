import { useEffect, useState } from "react";
import { useDeepgramViaProxy } from "./hooks/useDeepgramViaProxy";
import { motion } from "motion/react";

export default function App() {
  const [transcript, setTranscript] = useState("");
  const [results, setResults] = useState<{ sentence: string; type: string }[]>(
    [],
  );
  const [streaming, setStreaming] = useState(true);

  const tempTranscript = useDeepgramViaProxy(streaming); // assumes this hook supports a stop/start flag

  useEffect(() => {
    if (!tempTranscript?.text) return;
    if (tempTranscript?.final) {
      setTranscript((p) => p + " " + tempTranscript?.text);
    }
  }, [tempTranscript]);

  const handleSubmit = async () => {
    setStreaming(false); // stop recording
    try {
      const res = await fetch("http://localhost:8000/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: transcript }),
      });
      const data = await res.json();
      setResults(data.classified);
    } catch (err) {
      console.error("❌ Error submitting:", err);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">🎤 Live Speech Recognition</h1>

      <pre className="bg-gray-800 text-gray-200 p-4 rounded whitespace-pre-wrap">
        {transcript}{" "}
        <motion.span
          key={tempTranscript?.text}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="text-white"
        >
          {!tempTranscript?.final ? tempTranscript?.text : ""}
        </motion.span>
      </pre>

      <button
        className="mt-4 btn btn-primary"
        onClick={handleSubmit}
        disabled={!transcript}
      >
        Submit & Classify
      </button>

      {results.length > 0 && (
        <div className="mt-6 space-y-4">
          <h2 className="text-lg font-semibold">🧠 Tagged Results:</h2>
          {results.map((res, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-3 border rounded shadow"
            >
              <div className="badge badge-sm mb-2 capitalize badge-info">
                {res.type}
              </div>
              <p className="text-gray-200">{res.sentence}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
