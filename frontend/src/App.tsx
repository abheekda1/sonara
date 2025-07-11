import { useEffect, useState } from "react";
import { useDeepgramViaProxy } from "./hooks/useDeepgramViaProxy";
import { motion } from "motion/react";
import { StopIcon, PlayIcon } from "@heroicons/react/20/solid";
import { ArrowUpOnSquareIcon } from "@heroicons/react/20/solid";

export default function App() {
  const [transcript, setTranscript] = useState("");
  const [results, setResults] = useState<{ sentence: string; type: string }[]>(
    [],
  );
  const [streaming, setStreaming] = useState(false);

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
      <h1 className="text-xl font-bold mb-4">Voice Care</h1>

      {streaming ? (
        <pre className="bg-gray-800 text-gray-500 p-4 rounded whitespace-pre-wrap">
          {transcript}{" "}
          <motion.span
            key={tempTranscript?.text}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="text-gray-100"
          >
            {!tempTranscript?.final ? tempTranscript?.text : ""}
          </motion.span>
        </pre>
      ) : (
        <textarea
          className="bg-gray-800 text-gray-100 p-4 rounded w-full"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
        />
      )}

      <button
        className={`mt-4 btn ${streaming ? "btn-error" : "btn-success"}`}
        onClick={() => setStreaming((p) => !p)}
      >
        {streaming ? (
          <>
            <StopIcon className="h-5 w-5 inline-block" />
          </>
        ) : (
          <>
            <PlayIcon className="h-5 w-5 inline-block" />
          </>
        )}
      </button>

      <button
        className="mt-4 btn btn-primary ml-2"
        onClick={handleSubmit}
        disabled={!transcript || streaming}
      >
        <ArrowUpOnSquareIcon className="h-5 w-5 inline-block" />
      </button>

      {results.length > 0 && (
        <div className="mt-6 space-y-4">
          {/* <h2 className="text-lg font-semibold"></h2> */}
          <motion.div className="rounded shadow">
            {results.map((res, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`outline-1 badge-lg ${res.type.toLowerCase() === "observation" ? "badge-info" : "badge-warning"} badge-soft badge-outline inline-block text-white p-0.5 px-2 mx-0.5 rounded-md shadow-md text-left`}
              >
                <div className="flex flex-col space-y-0.5 leading-snug">
                  <span className="text-[10px] uppercase text-gray-100 tracking-wide">
                    {res.type || "unknown"}
                  </span>
                  <span className="text-sm text-white">{res.sentence}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}
    </div>
  );
}
