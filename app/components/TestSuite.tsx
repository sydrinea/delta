"use client";

import { useEffect, useState } from "react";
import { simulate } from "@/lib/simulator/nfa";
import type { NFA } from "@/lib/compiler/nfa";

interface TestCase {
  id: string;
  input: string;
  expected: boolean;
}

interface TestResult {
  id: string;
  passed: boolean;
  actual: boolean;
}

const TESTS_PER_PAGE = 5;

interface TestSuiteProps {
  machine: NFA | null;
  defaultTests?: TestCase[];
}

export function TestSuite({ machine, defaultTests = [] }: TestSuiteProps) {
  const [tests, setTests] = useState<TestCase[]>(defaultTests);
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [page, setPage] = useState(0);
  const [newInput, setNewInput] = useState("");
  const [newExpected, setNewExpected] = useState(true);

  const totalPages = Math.ceil(tests.length / TESTS_PER_PAGE);
  const visibleTests = tests.slice(
    page * TESTS_PER_PAGE,
    (page + 1) * TESTS_PER_PAGE,
  );

  useEffect(() => {
    setResults({});
  }, [machine]);

  const addTest = () => {
    if (!newInput) return;
    const id = crypto.randomUUID();
    setTests((prev) => [
      ...prev,
      { id, input: newInput, expected: newExpected },
    ]);
    setResults((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setNewInput("");
    // advance to last page to show new test
    setPage(Math.floor(tests.length / TESTS_PER_PAGE));
  };

  const removeTest = (id: string) => {
    setTests((prev) => prev.filter((t) => t.id !== id));
    setResults((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setPage((p) =>
      Math.min(p, Math.ceil((tests.length - 1) / TESTS_PER_PAGE) - 1),
    );
  };

  const runTests = () => {
    if (!machine) return;
    const newResults: Record<string, TestResult> = {};
    for (const test of tests) {
      const { accepted } = simulate(machine, test.input);
      newResults[test.id] = {
        id: test.id,
        passed: accepted === test.expected,
        actual: accepted,
      };
    }
    setResults(newResults);
  };

  const hasResults = Object.keys(results).length > 0;
  const allPassed = hasResults && tests.every((t) => results[t.id]?.passed);
  const passCount = tests.filter((t) => results[t.id]?.passed).length;

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center justify-between">
        <span className="text-ctp-subtext0 text-xs uppercase tracking-widest">
          test suite
        </span>
        <div className="flex items-center gap-2">
          {hasResults && (
            <span
              className={`text-xs font-bold ${allPassed ? "text-ctp-green" : "text-ctp-red"}`}
            >
              {passCount}/{tests.length}
            </span>
          )}
          <button
            onClick={runTests}
            disabled={!machine || tests.length === 0}
            className="text-xs px-3 py-1 rounded-lg bg-ctp-mantle border border-ctp-surface1 text-ctp-text hover:bg-ctp-crust disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            run tests
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        {visibleTests.map((test) => {
          const result = results[test.id];
          return (
            <div
              key={test.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                result
                  ? result.passed
                    ? "bg-ctp-green/10 border-ctp-green/30"
                    : "bg-ctp-red/10 border-ctp-red/30"
                  : "bg-ctp-mantle border-ctp-surface1"
              }`}
            >
              <span className="flex-1 font-mono text-ctp-text truncate">
                {test.input || <span className="text-ctp-text">ε</span>}
              </span>
              <span
                className={`text-xs ${test.expected ? "text-ctp-green" : "text-ctp-red"}`}
              >
                {test.expected ? "accept" : "reject"}
              </span>
              {result && (
                <span
                  className={`text-xs font-bold ${result.passed ? "text-ctp-green" : "text-ctp-red"}`}
                >
                  {result.passed ? "✓" : "✗"}
                </span>
              )}
              <button
                onClick={() => removeTest(test.id)}
                className="text-ctp-overlay0 hover:text-ctp-red transition-colors text-xs ml-1"
              >
                ×
              </button>
            </div>
          );
        })}

        {tests.length === 0 && (
          <p className="text-ctp-overlay0 text-xs text-center py-4">
            no test cases yet
          </p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 0))}
            disabled={page === 0}
            className="text-ctp-subtext0 hover:text-ctp-text disabled:opacity-30 text-xs transition-colors"
          >
            ←
          </button>
          <span className="text-ctp-overlay0 text-xs">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
            disabled={page === totalPages - 1}
            className="text-ctp-subtext0 hover:text-ctp-text disabled:opacity-30 text-xs transition-colors"
          >
            →
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 border-t border-ctp-surface0 pt-3">
        <input
          type="text"
          value={newInput}
          onChange={(e) => setNewInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTest()}
          placeholder="input string"
          className="flex-1 bg-ctp-mantle border border-ctp-surface1 rounded-lg px-3 py-1.5 text-sm text-ctp-text placeholder-ctp-overlay0 focus:outline-none focus:ring-2 focus:ring-ctp-mauve font-mono"
        />
        <button
          onClick={() => setNewExpected((e) => !e)}
          className={`text-xs px-3 py-1.5 rounded-lg border font-bold transition-colors ${
            newExpected
              ? "bg-ctp-green/20 border-ctp-green text-ctp-green"
              : "bg-ctp-red/20 border-ctp-red text-ctp-red"
          }`}
        >
          {newExpected ? "accept" : "reject"}
        </button>
        <button
          onClick={addTest}
          disabled={!newInput}
          className="text-xs px-3 py-1.5 rounded-lg bg-ctp-mantle border border-ctp-surface1 text-ctp-text hover:bg-ctp-crust disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
}
