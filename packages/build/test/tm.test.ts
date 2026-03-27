import { describe, it, expect } from "vitest";
import { multitape, tm, TMBuildError, TMMessages } from "../src";
import { getBuildError } from "@delta/shared";

const minimalTM = () =>
  tm("test")
    .alphabet("0", "1")
    .tape("_")
    .blank("_")
    .states("q0", "qAccept")
    .start("q0")
    .accept("qAccept");

describe("TMBuilder – builder methods", () => {
  describe("alphabet()", () => {
    it("adds symbols to the input alphabet", () => {
      const b = tm("t").alphabet("0", "1").tape("_").blank("_");
      expect(b.alpha).toEqual(expect.arrayContaining(["0", "1"]));
    });

    it("automatically adds alphabet symbols to the tape alphabet when blank is not yet set", () => {
      const b = tm("t")
        .states("q0", "q1")
        .start("q0")
        .accept("q1")
        .alphabet("0", "1")
        .tape("_")
        .blank("_")
        .state("q0", (s) => s.on("0", "R", "q1"));
      expect(() => b.build()).not.toThrow();
    });

    it("rejects the blank symbol from the alphabet when blank is already set", () => {
      const b = tm("t").tape("0", "_").blank("_").alphabet("0", "_");

      expect(b.messages).toContainEqual(
        expect.objectContaining({
          severity: "error",
          content: TMMessages.blankSymbolInAlphabet("_"),
        }),
      );
    });
  });

  describe("tape()", () => {
    it("adds symbols to the tape alphabet", () => {
      const b = minimalTM().state("q0", (s) => s.on("_", "S", "qAccept"));
      const m = b.build();
      expect(m.tapeAlphabet).toContain("0");
      expect(m.tapeAlphabet).toContain("1");
      expect(m.tapeAlphabet).toContain("_");
    });

    it("rejects ε from the tape alphabet", () => {
      const b = tm("t").tape("ε");
      expect(b.messages).toContainEqual(
        expect.objectContaining({
          severity: "error",
          content: TMMessages.epsilonInTapeAlphabet,
        }),
      );
    });
  });

  describe("blank()", () => {
    it("sets the blank symbol when already in the tape alphabet", () => {
      const b = minimalTM().state("q0", (s) => s.on("_", "S", "qAccept"));
      const m = b.build();
      expect(m.blankSymbol).toBe("_");
    });

    it("errors when blank symbol is not yet in the tape alphabet", () => {
      const b = tm("t").blank("_");
      expect(b.messages).toContainEqual(
        expect.objectContaining({
          severity: "error",
          content: TMMessages.blankSymbolNotInTape("_"),
        }),
      );
    });

    it("errors when blank symbol is also in the input alphabet", () => {
      const b = tm("t").alphabet("_").tape("_").blank("_");
      expect(b.messages).toContainEqual(
        expect.objectContaining({
          severity: "error",
          content: TMMessages.blankSymbolInAlphabet("_"),
        }),
      );
    });

    it("errors when tape() is called before blank(), leaving blank undeclared at blank() time", () => {
      const b = tm("t").blank("_").tape("_");
      expect(b.messages).toContainEqual(
        expect.objectContaining({
          severity: "error",
          content: TMMessages.blankSymbolNotInTape("_"),
        }),
      );
    });

    it("succeeds when tape() precedes blank()", () => {
      const b = tm("t")
        .alphabet("0", "1")
        .tape("_")
        .blank("_")
        .states("q0", "qA")
        .start("q0")
        .accept("qA")
        .state("q0", (s) => s.on("_", "S", "qA"));
      expect(() => b.build()).not.toThrow();
    });
  });

  describe("states()", () => {
    it("registers multiple states in one call", () => {
      const b = minimalTM().state("q0", (s) => s.on("_", "S", "qAccept"));
      const m = b.build();
      expect(m.states.has("q0")).toBe(true);
      expect(m.states.has("qAccept")).toBe(true);
    });
  });

  describe("start()", () => {
    it("records an error for an undeclared start state", () => {
      const b = tm("t")
        .alphabet("0")
        .tape("_")
        .blank("_")
        .states("q0")
        .start("undeclared");
      expect(b.messages).toContainEqual(
        expect.objectContaining({
          severity: "error",
          content: TMMessages.startStateNotDeclared("undeclared"),
        }),
      );
    });
  });

  describe("accept()", () => {
    it("records an error for an undeclared accept state", () => {
      const b = tm("t")
        .alphabet("0")
        .tape("_")
        .blank("_")
        .states("q0")
        .start("q0")
        .accept("undeclared");
      expect(b.messages).toContainEqual(
        expect.objectContaining({
          severity: "error",
          content: TMMessages.acceptStateNotDeclared("undeclared"),
        }),
      );
    });
  });

  describe("build()", () => {
    it("throws TMBuildError when there are accumulated errors", () => {
      const b = tm("t").alphabet("0").tape("_"); // no blank, no states, etc.
      const err = getBuildError(TMBuildError, () => b.build());
      expect(err).toBeInstanceOf(TMBuildError);
      expect(err.messages.some((m) => m.severity === "error")).toBe(true);
    });

    it("throws if build() is called a second time", () => {
      const b = minimalTM().state("q0", (s) => s.on("_", "S", "qAccept"));
      b.build();
      expect(() => b.build()).toThrow(TMMessages.alreadyBuilt);
    });

    it("returns a TM with correct structural properties", () => {
      const m = minimalTM()
        .state("q0", (s) => s.on("_", "S", "qAccept"))
        .build();
      expect(m.name).toBe("test");
      expect(m.tapeCount).toBe(1);
      expect(m.blankSymbol).toBe("_");
      expect(m.startState).toBe("q0");
      expect(m.acceptStates.has("qAccept")).toBe(true);
    });

    it("errors when no blank symbol is defined", () => {
      const b = tm("t")
        .alphabet("0")
        .tape("0")
        .states("q0")
        .start("q0")
        .accept("q0");
      const err = getBuildError(TMBuildError, () => b.build());
      expect(err.messages).toContainEqual(
        expect.objectContaining({
          severity: "error",
          content: TMMessages.noBlankSymbol,
        }),
      );
    });
  });
});

describe("TMBuilder – .transition() call signatures", () => {
  const base = () =>
    tm("sig")
      .alphabet("0", "1")
      .tape("_")
      .blank("_")
      .states("q0", "q1", "q2", "qA")
      .start("q0")
      .accept("qA");

  it("object form with scalar read/move/write strings", () => {
    const m = base()
      .transition({ from: "q0", read: "0", move: "R", to: "q1" })
      .transition({ from: "q1", read: "_", move: "S", to: "qA" })
      .build();

    const q0Map = m.transitions.get("q0");
    expect(q0Map).toBeDefined();
    const t = q0Map!.values().next().value!;
    expect(t.toState).toBe("q1");
    expect(t.directions[0]).toBe("R");
  });

  it("object form with single-element array read/move", () => {
    const m = base()
      .transition({ from: "q0", read: ["0"], move: ["R"], to: "q1" })
      .transition({ from: "q1", read: ["_"], move: ["S"], to: "qA" })
      .build();

    const t = m.transitions.get("q0")!.values().next().value!;
    expect(t.readSymbols[0]).toBe("0");
    expect(t.directions[0]).toBe("R");
  });

  it("object form with write symbol specified", () => {
    const m = base()
      .transition({ from: "q0", read: "0", move: "R", to: "q1", write: "1" })
      .transition({ from: "q1", read: "_", move: "S", to: "qA" })
      .build();

    const t = m.transitions.get("q0")!.values().next().value!;
    expect(t.writeSymbols[0]).toBe("1");
  });

  it("object form with write as single-element array", () => {
    const m = base()
      .transition({
        from: "q0",
        read: ["0"],
        move: ["R"],
        to: "q1",
        write: ["1"],
      })
      .transition({ from: "q1", read: ["_"], move: ["S"], to: "qA" })
      .build();

    const t = m.transitions.get("q0")!.values().next().value!;
    expect(t.writeSymbols[0]).toBe("1");
  });

  it("duplicate transition (same state + read) accumulates an error", () => {
    const b = base()
      .transition({ from: "q0", read: "0", move: "R", to: "q1" })
      .transition({ from: "q0", read: "0", move: "L", to: "q2" }); // duplicate

    expect(b.messages).toContainEqual(
      expect.objectContaining({ severity: "error" }),
    );
  });

  it("transition referencing undeclared source state accumulates an error", () => {
    const b = base().transition({
      from: "ghost",
      read: "0",
      move: "R",
      to: "q1",
    });
    expect(b.messages).toContainEqual(
      expect.objectContaining({
        severity: "error",
        content: TMMessages.transitionSourceNotDeclared("ghost"),
      }),
    );
  });

  it("transition referencing undeclared target state accumulates an error", () => {
    const b = base().transition({
      from: "q0",
      read: "0",
      move: "R",
      to: "ghost",
    });
    expect(b.messages).toContainEqual(
      expect.objectContaining({
        severity: "error",
        content: TMMessages.transitionTargetNotDeclared("ghost"),
      }),
    );
  });

  it("transition reading undeclared tape symbol accumulates an error", () => {
    const b = base().transition({
      from: "q0",
      read: "X",
      move: "R",
      to: "q1",
    });
    expect(b.messages).toContainEqual(
      expect.objectContaining({
        severity: "error",
        content: TMMessages.tapeSymbolNotDeclared("X"),
      }),
    );
  });
});

describe("TMBuilder – .state() scope and .on() signatures", () => {
  const base = () =>
    tm("scope")
      .alphabet("0", "1")
      .tape("_")
      .blank("_")
      .states("q0", "q1", "q2", "qA")
      .start("q0")
      .accept("qA");

  it("scalar read + scalar move (no write)", () => {
    const m = base()
      .state("q0", (s) => s.on("0", "R", "q1"))
      .state("q1", (s) => s.on("_", "S", "qA"))
      .build();

    const t = m.transitions.get("q0")!.values().next().value!;
    expect(t.toState).toBe("q1");
    expect(t.readSymbols[0]).toBe("0");
    expect(t.directions[0]).toBe("R");
  });

  it("scalar read + scalar move + scalar write", () => {
    const m = base()
      .state("q0", (s) => s.on("0", "R", "q1", "1"))
      .state("q1", (s) => s.on("_", "S", "qA"))
      .build();

    const t = m.transitions.get("q0")!.values().next().value!;
    expect(t.writeSymbols[0]).toBe("1");
  });

  it("array read (multi-symbol shorthand) expands into one transition per symbol", () => {
    const m = base()
      .state("q0", (s) => s.on(["0", "1"], "R", "q1"))
      .state("q1", (s) => s.on("_", "S", "qA"))
      .build();

    const q0Map = m.transitions.get("q0")!;
    expect(q0Map.size).toBe(2);
  });

  it("[array]-wrapped single read is treated as a single symbol", () => {
    const m = base()
      .state("q0", (s) => s.on(["0"], "R", "q1"))
      .state("q1", (s) => s.on("_", "S", "qA"))
      .build();

    const t = m.transitions.get("q0")!.values().next().value!;
    expect(t.readSymbols[0]).toBe("0");
  });

  it("single-element tuple read + move + write (array wrappers)", () => {
    const m = base()
      .state("q0", (s) => s.on(["0"], ["R"], "q1", ["1"]))
      .state("q1", (s) => s.on(["_"], ["S"], "qA"))
      .build();

    const t = m.transitions.get("q0")!.values().next().value!;
    expect(t.readSymbols[0]).toBe("0");
    expect(t.directions[0]).toBe("R");
    expect(t.writeSymbols[0]).toBe("1");
  });

  it("transition write defaults to read symbol when omitted", () => {
    const m = base()
      .state("q0", (s) => s.on("0", "R", "q1"))
      .state("q1", (s) => s.on("_", "S", "qA"))
      .build();

    const t = m.transitions.get("q0")!.values().next().value!;
    expect(t.writeSymbols[0]).toBe("0");
  });

  it("scope .transition() object form works inside .state()", () => {
    const m = base()
      .state("q0", (s) =>
        s
          .transition({ read: ["0"], move: ["R"], to: "q1" })
          .transition({ read: ["_"], move: ["S"], to: "qA" }),
      )
      .build();

    const q0Map = m.transitions.get("q0")!;
    expect(q0Map.size).toBe(2);
  });

  it(".done() returns the builder enabling chaining", () => {
    const result = tm("t")
      .alphabet("0")
      .tape("_")
      .blank("_")
      .states("q0", "qA")
      .start("q0")
      .accept("qA")
      .state("q0", (s) => {
        s.on("_", "S", "qA").done();
      });
    expect(result).toBeDefined();
  });
});

describe("MultiTMBuilder – multitape() factory and transitions", () => {
  it("throws on non-positive tape count", () => {
    expect(() => multitape("t", 0)).toThrow(TMMessages.invalidTapeCount(0));
    expect(() => multitape("t", -1)).toThrow(TMMessages.invalidTapeCount(-1));
  });

  it("returns a machine with the correct tapeCount", () => {
    const m = multitape("t", 3)
      .alphabet("0")
      .tape("_")
      .blank("_")
      .states("q0", "qA")
      .start("q0")
      .accept("qA")
      .state("q0", (s) => s.on(["_", "_", "_"], ["S", "S", "S"], "qA"))
      .build();
    expect(m.tapeCount).toBe(3);
  });

  it("object .transition() with full tuple read/move/write (2 tapes)", () => {
    const m = multitape("t", 2)
      .alphabet("0")
      .tape("_")
      .blank("_")
      .states("q0", "qA")
      .start("q0")
      .accept("qA")
      .transition({
        from: "q0",
        read: ["_", "_"],
        move: ["R", "S"],
        to: "qA",
        write: ["_", "_"],
      })
      .build();

    const t = m.transitions.get("q0")!.values().next().value!;
    expect(t.readSymbols).toEqual(["_", "_"]);
    expect(t.directions).toEqual(["R", "S"]);
    expect(t.writeSymbols).toEqual(["_", "_"]);
    expect(t.toState).toBe("qA");
  });

  it("multi-symbol read array per tape expands into all Cartesian-product tuples", () => {
    const m = multitape("t", 2)
      .alphabet("0", "1")
      .tape("_")
      .blank("_")
      .states("q0", "qA")
      .start("q0")
      .accept("qA")
      .transition({
        from: "q0",
        read: [
          ["0", "1"],
          ["0", "1"],
        ],
        move: ["R", "R"],
        to: "qA",
      })
      .build();

    const q0Map = m.transitions.get("q0")!;
    expect(q0Map.size).toBe(4);
  });

  it("tuple write symbols default to read symbols when omitted (2 tapes)", () => {
    const m = multitape("t", 2)
      .alphabet("0")
      .tape("_")
      .blank("_")
      .states("q0", "qA")
      .start("q0")
      .accept("qA")
      .transition({
        from: "q0",
        read: ["0", "_"],
        move: ["R", "S"],
        to: "qA",
      })
      .build();

    const t = m.transitions.get("q0")!.values().next().value!;
    expect(t.writeSymbols[0]).toBe("0");
    expect(t.writeSymbols[1]).toBe("_");
  });

  it("errors when tuple length doesn't match tape count", () => {
    const b = multitape("t", 3)
      .alphabet("0")
      .tape("_")
      .blank("_")
      .states("q0", "qA")
      .start("q0")
      .accept("qA")
      .transition({
        from: "q0",
        read: ["0", "_"] as any,
        move: ["R", "S"] as any,
        to: "qA",
      });

    expect(b.messages).toContainEqual(
      expect.objectContaining({
        severity: "error",
        content: TMMessages.invalidTupleLength(3, 2),
      }),
    );
  });

  it("duplicate tuple transition accumulates an error", () => {
    const b = multitape("t", 2)
      .alphabet("0")
      .tape("_")
      .blank("_")
      .states("q0", "q1", "qA")
      .start("q0")
      .accept("qA")
      .transition({ from: "q0", read: ["0", "_"], move: ["R", "S"], to: "q1" })
      .transition({ from: "q0", read: ["0", "_"], move: ["L", "S"], to: "qA" }); // dup

    expect(b.messages).toContainEqual(
      expect.objectContaining({ severity: "error" }),
    );
  });

  it("seek() on a multi-tape builder targets the designated tape index", () => {
    const m = multitape("t", 2)
      .alphabet("0")
      .tape("_")
      .blank("_")
      .states("q0", "qScan", "qA")
      .start("q0")
      .accept("qA")
      .state("q0", (s) => s.on(["_", "_"], ["R", "S"], "qScan"))
      .state("qScan", (s) => s.seek(0, "0", "_", "R", "qA"))
      .build();

    const scanMap = m.transitions.get("qScan")!;
    expect(scanMap.size).toBeGreaterThan(0);
  });
});

describe("transition map structure", () => {
  it("each state entry is a Map keyed by the joined read-symbol tuple", () => {
    const m = minimalTM()
      .state("q0", (s) => s.on("_", "S", "qAccept"))
      .build();

    const q0Map = m.transitions.get("q0")!;
    expect(q0Map).toBeInstanceOf(Map);
    const key = "_";
    expect(q0Map.has(key)).toBe(true);
  });

  it("multi-symbol read expands into separate map entries (one per symbol)", () => {
    const m = tm("t")
      .alphabet("0", "1")
      .tape("_")
      .blank("_")
      .states("q0", "qA")
      .start("q0")
      .accept("qA")
      .state("q0", (s) => s.on(["0", "1", "_"], "S", "qA"))
      .build();

    const q0Map = m.transitions.get("q0")!;
    expect(q0Map.has("0")).toBe(true);
    expect(q0Map.has("1")).toBe(true);
    expect(q0Map.has("_")).toBe(true);
  });

  it("2-tape tuple key uses \\u001F separator", () => {
    const m = multitape("t", 2)
      .alphabet("0")
      .tape("_")
      .blank("_")
      .states("q0", "qA")
      .start("q0")
      .accept("qA")
      .transition({ from: "q0", read: ["0", "_"], move: ["R", "S"], to: "qA" })
      .build();

    const q0Map = m.transitions.get("q0")!;
    const separator = "\u001F";
    expect(q0Map.has(`0${separator}_`)).toBe(true);
  });

  it("TMTupleTransition has correct shape", () => {
    const m = tm("t")
      .alphabet("0")
      .tape("1", "_")
      .blank("_")
      .states("q0", "qA")
      .start("q0")
      .accept("qA")
      .transition({ from: "q0", read: "0", move: "L", to: "qA", write: "1" })
      .build();

    const t = m.transitions.get("q0")!.values().next().value!;
    expect(t).toMatchObject({
      toState: "qA",
      readSymbols: ["0"],
      writeSymbols: ["1"],
      directions: ["L"],
    });
  });
});

describe("builder call ordering", () => {
  it("alphabet() before tape() and blank()", () => {
    const b = tm("order")
      .alphabet("0", "1")
      .tape("_")
      .blank("_")
      .states("q0", "qA")
      .start("q0")
      .accept("qA")
      .state("q0", (s) => s.on("_", "S", "qA"));
    expect(() => b.build()).not.toThrow();
    const m = b.build === undefined ? null : b;
    void m;
  });

  it("tape() before blank() (typical happy path)", () => {
    const b = tm("order")
      .tape("0", "1", "_")
      .blank("_")
      .alphabet("0", "1")
      .states("q0", "qA")
      .start("q0")
      .accept("qA")
      .state("q0", (s) => s.on("_", "S", "qA"));
    expect(() => b.build()).not.toThrow();
  });

  it("blank() BEFORE tape() records an error immediately", () => {
    const b = tm("order").blank("_").tape("_");
    expect(b.messages).toContainEqual(
      expect.objectContaining({
        severity: "error",
        content: TMMessages.blankSymbolNotInTape("_"),
      }),
    );
  });

  it("states() before start()/accept() works fine", () => {
    const b = tm("order")
      .tape("_")
      .blank("_")
      .alphabet("0")
      .states("q0", "qA")
      .start("q0")
      .accept("qA")
      .state("q0", (s) => s.on("_", "S", "qA"));
    expect(() => b.build()).not.toThrow();
  });

  it("start() after accept() still works", () => {
    const b = tm("order")
      .tape("_")
      .blank("_")
      .states("q0", "qA")
      .accept("qA")
      .start("q0")
      .state("q0", (s) => s.on("_", "S", "qA"));
    expect(() => b.build()).not.toThrow();
  });

  it("state() definition interleaved with alphabet/tape/blank declarations", () => {
    const b = tm("order")
      .states("q0", "qA")
      .start("q0")
      .accept("qA")
      .alphabet("0", "1")
      .tape("_")
      .blank("_")
      .state("q0", (s) => s.on("_", "S", "qA"));
    expect(() => b.build()).not.toThrow();
  });
});

describe("error accumulation", () => {
  it("accumulates multiple independent errors before build()", () => {
    const b = tm("errs")
      .alphabet("0")
      .tape("_")
      .states("q0")
      .start("undeclaredStart")
      .accept("undeclaredAccept");

    const err = getBuildError(TMBuildError, () => b.build());
    expect(
      err.messages.filter((m) => m.severity === "error").length,
    ).toBeGreaterThanOrEqual(2);
  });

  it("keeps going after a bad transition so subsequent transitions can also be checked", () => {
    const b = tm("errs")
      .alphabet("0")
      .tape("_")
      .blank("_")
      .states("q0", "qA")
      .start("q0")
      .accept("qA")
      .transition({ from: "ghost1", read: "0", move: "R", to: "qA" }) // bad source
      .transition({ from: "q0", read: "0", move: "R", to: "ghost2" }); // bad target

    expect(b.messages).toContainEqual(
      expect.objectContaining({
        content: TMMessages.transitionSourceNotDeclared("ghost1"),
      }),
    );
    expect(b.messages).toContainEqual(
      expect.objectContaining({
        content: TMMessages.transitionTargetNotDeclared("ghost2"),
      }),
    );
  });
});
