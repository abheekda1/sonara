import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

interface WaveformLiveProps {
  bars?: number;
  height?: number;
  color?: string;
}

export default function WaveformLive({
  bars = 16,
  height = 40,
  color = "green-500",
}: WaveformLiveProps) {
  const [levels, setLevels] = useState<number[]>(Array(bars).fill(0));
  const audioRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>(null);

  useEffect(() => {
    let audioCtx: AudioContext;
    let micStream: MediaStream;

    const setup = async () => {
      audioCtx = new AudioContext();
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const source = audioCtx.createMediaStreamSource(micStream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64; // Low FFT for basic amplitude bars

      source.connect(analyser);

      audioRef.current = source;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const update = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArray);

        // Split data into N bands (bars)
        const bandSize = Math.floor(dataArray.length / bars);
        const newLevels = Array(bars)
          .fill(0)
          .map((_, i) => {
            const slice = dataArray.slice(i * bandSize, (i + 1) * bandSize);
            const avg = slice.reduce((a, b) => a + b, 0) / slice.length || 0;
            return avg / 255; // Normalize 0–1
          });

        setLevels(newLevels);
        animationRef.current = requestAnimationFrame(update);
      };

      update();
    };

    setup();

    return () => {
      animationRef.current && cancelAnimationFrame(animationRef.current);
      audioRef.current?.disconnect();
      analyserRef.current?.disconnect();
      micStream?.getTracks().forEach((t) => t.stop());
    };
  }, [bars]);

  return (
    <div className={`flex items-end gap-[2px] h-[${height}px]`}>
      {levels.map((level, i) => (
        <motion.div
          key={i}
          animate={{ height: `${level * height}px` }}
          transition={{ duration: 0.1 }}
          className="w-1.5 rounded-sm"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}
