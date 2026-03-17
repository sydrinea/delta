import { useState, useEffect } from "react";
import { render, Box, Text, useInput, useApp } from "ink";
import { simulate, SimulationResult } from "../../src/simulator/nfa.js";
import { toDot } from "./dot.js";
import { broadcast, startServer } from "./server.js";
import { deserialize } from "../compiler/serialize.js";
import { NFA } from "../compiler/nfa.js";

interface AppProps {
  machine: NFA;
  input: string;
  trace: SimulationResult["trace"];
}

function App({ machine, input, trace }: AppProps) {
  const { exit } = useApp();
  const [step, setStep] = useState(0);

  const current = trace[step];
  const isLast = step === trace.length - 1;
  const accepted = isLast
    ? [...current!.states].some((s) => machine.acceptStates.has(s))
    : null;

  useEffect(() => {
    broadcast({
      dot: toDot(machine, current!.states),
      step,
      total: trace.length,
      activeStates: [...current!.states],
      accepted,
      input,
      machineName: machine.name,
    });
  }, [step]);

  useInput((input, key) => {
    if (input === "q") {
      exit();
      process.exit(0);
    }
    if (key.rightArrow || input === " ") {
      setStep((s) => Math.min(s + 1, trace.length - 1));
    }
    if (key.leftArrow) {
      setStep((s) => Math.max(s - 1, 0));
    }
  });

  return (
    <Box flexDirection="column" gap={1} padding={1}>
      <Text bold color="cyan">
        delta visualizer — {machine.name}
      </Text>

      <Box gap={1}>
        <Text dimColor>input:</Text>
        {INPUT.split("").map((symbol, i) => {
          const isActive = !isLast && i === step;
          const isPast = isLast || i < step;
          return (
            <Text
              key={i}
              bold={isActive}
              color={isActive ? "cyan" : isPast ? "green" : "white"}
            >
              {symbol}
            </Text>
          );
        })}
      </Box>

      <Box gap={1}>
        <Text dimColor>step:</Text>
        <Text>
          {step} / {trace.length - 1}
        </Text>
      </Box>

      <Box gap={1}>
        <Text dimColor>active:</Text>
        <Text color="cyan">{`{${[...current!.states].join(", ")}}`}</Text>
      </Box>

      {isLast && (
        <Text bold color={accepted ? "green" : "red"}>
          {accepted ? "✓ accepted" : "✗ rejected"}
        </Text>
      )}

      <Box marginTop={1}>
        <Text dimColor>← → to step · space to advance · q to quit</Text>
      </Box>
    </Box>
  );
}

const [, , anf, inputArg] = process.argv;

if (!anf) {
  console.error("Usage: tsx app.tsx <afs> <input>");
  process.exit(1);
}

const machine = deserialize(anf);
const INPUT = inputArg ?? "";
const { trace } = simulate(machine, INPUT);

await startServer();
render(<App machine={machine} input={INPUT} trace={trace} />);
