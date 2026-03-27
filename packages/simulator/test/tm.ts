export type AcceptanceCase = [input: string, accepted: boolean, label: string];

const cases: Record<string, AcceptanceCase[]> = {
  "binary-division-by-three.ts": [
    ["0", true, "0 (0 mod 3 = 0)"],
    ["11", true, "11 (3 mod 3 = 0)"],
    ["110", true, "110 (6 mod 3 = 0)"],
    ["1001", true, "1001 (9 mod 3 = 0)"],
    ["1", false, "1 (1 mod 3 ≠ 0)"],
    ["10", false, "10 (2 mod 3 ≠ 0)"],
    ["100", false, "100 (4 mod 3 ≠ 0)"],
    ["101", false, "101 (5 mod 3 ≠ 0)"],
    ["1000", false, "1000 (8 mod 3 ≠ 0)"],
  ],
  "binary-palindrome.ts": [
    ["", true, "empty string"],
    ["0", true, "single 0"],
    ["1", true, "single 1"],
    ["00", true, "00"],
    ["11", true, "11"],
    ["010", true, "010"],
    ["101", true, "101"],
    ["1001", true, "1001"],
    ["0110", true, "0110"],
    ["10", false, "10"],
    ["01", false, "01"],
    ["001", false, "001"],
    ["110", false, "110"],
    ["0101", false, "0101"],
  ],
  "binary-addition.ts": [
    ["0#0", true, "0+0"],
    ["1#0", true, "1+0"],
    ["0#1", true, "0+1"],
    ["1#1", true, "1+1"],
    ["10#11", true, "2+3"],
    ["11#11", true, "3+3"],
    ["1010#101", true, "10+5"],
  ],
};

export default cases;
