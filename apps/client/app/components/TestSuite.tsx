"use client";

import { useEffect, useState } from "react";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import { Tooltip } from "./Tooltip";
import { useAlert } from "./AlertProvider";
import { TestCase, TestCaseArraySchema, TestCaseSchema } from "@delta/examples";

interface TestResult {
  id: string;
  passed: boolean;
  actual: boolean;
}

const TESTS_PER_PAGE = 6;
const ROW_HEIGHT = 36;

interface TestSuiteProps {
  tests: TestCase[];
  setTests: (tests: TestCase[]) => void;
  evaluateInput?: (input: string) => boolean;
  machineName?: string;
  resetKeys?: unknown[];
  inputPlaceholder?: string;
}

export function TestSuite({
  tests,
  setTests,
  evaluateInput,
  machineName = "delta",
  resetKeys,
  inputPlaceholder = "input string",
}: TestSuiteProps) {
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const { showAlert } = useAlert();

  const runTests = () => {
    if (!evaluateInput) return;

    const newResults: Record<string, TestResult> = {};
    for (const test of tests) {
      const actual = evaluateInput(test.input);
      newResults[test.id] = {
        id: test.id,
        passed: actual === test.expected,
        actual,
      };
    }
    setResults(newResults);
  };

  useKeyboardShortcut([
    {
      shift: true,
      meta: true,
      key: "t",
      handler: () => runTests(),
    },
    {
      meta: true,
      shift: true,
      key: "r",
      handler: () => setResults({}),
    },
  ]);

  useEffect(() => {
    setResults({});
  }, resetKeys);

  const handleTestImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const result = TestCaseArraySchema.safeParse(parsed);
        if (!result.success) {
          showAlert({
            title: "Invalid Test Format",
            message: `Expected an array of { input: string, expected: boolean }.\n\n${result.error.issues.map((i) => i.message).join("\n")}`,
          });
          return;
        }
        setTests(result.data.map((t) => ({ ...t, id: crypto.randomUUID() })));
      } catch {
        showAlert({
          title: "Invalid JSON",
          message: "The selected file is not valid JSON.",
        });
      }
    };

    reader.readAsText(file);
    e.target.value = "";
  };

  const handleTestExport = () => {
    if (tests.length === 0) return;

    const exportData = tests.map(({ input, expected }) => ({
      input,
      expected,
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${machineName || "delta"}_tests.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const hasResults = Object.keys(results).length > 0;
  const allPassed = hasResults && tests.every((t) => results[t.id]?.passed);
  const passCount = tests.filter((t) => results[t.id]?.passed).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-ctp-subtext0 text-xs uppercase tracking-widest">
            test suite
          </span>
          {hasResults && (
            <span
              className={`text-xs font-bold ${allPassed ? "text-ctp-green" : "text-ctp-red"}`}
            >
              ({passCount} of {tests.length})
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Tooltip label="Import tests from JSON">
            <label className="text-xs px-3 py-1 rounded-lg bg-ctp-blue/20 border border-ctp-blue text-ctp-blue hover:bg-ctp-blue/30 transition-colors cursor-pointer flex items-center justify-center">
              import
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleTestImport}
              />
            </label>
          </Tooltip>

          <Tooltip label="Export tests to JSON">
            <button
              onClick={handleTestExport}
              disabled={tests.length === 0}
              className="text-xs px-3 py-1 rounded-lg bg-ctp-mauve/20 border border-ctp-mauve text-ctp-mauve hover:bg-ctp-mauve/30 disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              export
            </button>
          </Tooltip>

          <Tooltip label="shift+cmd+t">
            <button
              onClick={runTests}
              disabled={!evaluateInput || tests.length === 0}
              className="text-xs px-3 py-1 rounded-lg bg-ctp-green/20 border border-ctp-green text-ctp-green hover:bg-ctp-green/30 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors"
            >
              run tests
            </button>
          </Tooltip>
        </div>
      </div>

      <TestCaseList
        tests={tests}
        results={results}
        onRemove={(id) => {
          const updated = tests.filter((t) => t.id !== id);
          setTests(updated);
          setResults((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
        }}
      />

      <NewTestForm
        inputPlaceholder={inputPlaceholder}
        onSubmit={(input, expected) => {
          const id = crypto.randomUUID();
          setTests([...tests, { id, input, expected }]);
        }}
      />
    </div>
  );
}

interface TestProps {
  result?: TestResult;
  test: TestCase;
  onRemove: (id: string) => void;
}

function Test({ result, test, onRemove }: TestProps) {
  return (
    <div
      style={{ height: ROW_HEIGHT }}
      className={`flex items-center gap-2 px-3 rounded-lg border text-sm transition-colors ${
        result
          ? result.passed
            ? "bg-ctp-green/10 border-ctp-green/30"
            : "bg-ctp-red/10 border-ctp-red/30"
          : "bg-ctp-mantle border-ctp-surface1"
      }`}
    >
      <span className="flex-1 font-mono text-ctp-text truncate">
        {test.input || <span className="text-ctp-overlay0">ε</span>}
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
        onClick={() => onRemove(test.id)}
        className="text-ctp-overlay0 hover:text-ctp-red transition-colors text-xs ml-1"
      >
        ×
      </button>
    </div>
  );
}

interface NewTestFormProps {
  onSubmit: (input: string, expected: boolean) => void;
  inputPlaceholder: string;
}

function NewTestForm({ onSubmit, inputPlaceholder }: NewTestFormProps) {
  const [input, setInput] = useState("");
  const [expected, setExpected] = useState(true);

  const handleSubmit = () => {
    onSubmit(input, expected);
    setInput("");
  };

  return (
    <div className="flex items-center gap-2 border-t border-ctp-surface0 pt-3">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        placeholder={inputPlaceholder}
        className="flex-1 bg-ctp-mantle border border-ctp-surface1 rounded-lg px-3 py-1.5 text-sm text-ctp-text placeholder-ctp-overlay0 focus:outline-none focus:ring-2 focus:ring-ctp-mauve font-mono"
      />
      <button
        onClick={() => setExpected((e) => !e)}
        className={`text-xs px-3 py-1.5 rounded-lg border font-bold transition-colors ${
          expected
            ? "bg-ctp-green/20 border-ctp-green text-ctp-green"
            : "bg-ctp-red/20 border-ctp-red text-ctp-red"
        }`}
      >
        {expected ? "accept" : "reject"}
      </button>
      <button
        onClick={handleSubmit}
        className="text-xs px-3 py-1.5 rounded-lg bg-ctp-mantle border border-ctp-surface1 text-ctp-text hover:bg-ctp-crust transition-colors"
      >
        +
      </button>
    </div>
  );
}

interface TestCaseListProps {
  tests: TestCase[];
  results: Record<string, TestResult>;
  onRemove: (id: string) => void;
}

function TestCaseList({ tests, results, onRemove }: TestCaseListProps) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(tests.length / TESTS_PER_PAGE);
  const visibleTests = tests.slice(
    page * TESTS_PER_PAGE,
    (page + 1) * TESTS_PER_PAGE,
  );
  const emptyRows = TESTS_PER_PAGE - visibleTests.length;

  useEffect(() => {
    setPage((p) => Math.min(p, Math.max(0, totalPages - 1)));
  }, [totalPages]);

  return (
    <>
      <div
        className="flex flex-col gap-1"
        style={{
          height: TESTS_PER_PAGE * ROW_HEIGHT + (TESTS_PER_PAGE - 1) * 4,
        }}
      >
        {visibleTests.map((test) => (
          <Test
            key={test.id}
            test={test}
            result={results[test.id]}
            onRemove={onRemove}
          />
        ))}

        {Array.from({ length: emptyRows }).map((_, i) => (
          <div
            key={`empty-${i}`}
            style={{ height: ROW_HEIGHT }}
            className="rounded-lg border border-dashed border-ctp-surface0"
          />
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 h-4">
        {totalPages > 1 && (
          <>
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
          </>
        )}
      </div>
    </>
  );
}
