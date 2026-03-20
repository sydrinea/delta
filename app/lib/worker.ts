import nfa from "./compiler/nfa";
import dfa from "./compiler/dfa";
import thompson from "./compiler/thompson";
import { convertToDFA } from "./transform/subset";
import { EPS } from "./compiler/constants";
import { q, union, concat, star, char, epsilon } from "./compiler/helpers";

const api = {
  nfa,
  dfa,
  thompson,
  convertToDFA,
  EPS,
  q,
  union,
  concat,
  star,
  char,
  epsilon,
};
(self as any)._deltaAPI = api;

const virtualLibraryCode = `
  const api = self._deltaAPI;
  export const nfa = api.nfa;
  export const dfa = api.dfa;
  export const thompson = api.thompson;
  export const convertToDFA = api.convertToDFA;
  export const EPS = api.EPS;
  export const q = api.q;
  export const union = api.union;
  export const concat = api.concat;
  export const star = api.star;
  export const char = api.char;
  export const epsilon = api.epsilon;

  export default api; 
`;

const libBlob = new Blob([virtualLibraryCode], { type: "text/javascript" });
const libUrl = URL.createObjectURL(libBlob);

self.onmessage = async (e: MessageEvent) => {
  const { code } = e.data;
  let userUrl = "";

  try {
    const executableCode = code.replace(
      /(import\s+[\s\S]*?\s+from\s+)['"](@delta\/lib|delta:lib)['"]/g,
      `$1"${libUrl}"`,
    );

    const userBlob = new Blob([executableCode], { type: "text/javascript" });
    userUrl = URL.createObjectURL(userBlob);

    const nativeImport = new Function("url", "return import(url);");
    const userModule = await nativeImport(userUrl);

    URL.revokeObjectURL(userUrl);

    const result = userModule.default;
    if (!result)
      throw new Error(
        "No default export found. Did you use `export default machine;`?",
      );

    self.postMessage({ type: "SUCCESS", payload: result });
  } catch (err: any) {
    let errorsToReport = [];

    const parseLocation = (stack?: string) => {
      let line = 0,
        column = 0;
      if (stack && userUrl) {
        const escapedUrl = userUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const match = stack.match(new RegExp(`${escapedUrl}:(\\d+):(\\d+)`));
        if (match) {
          line = parseInt(match[1], 10);
          column = parseInt(match[2], 10);
        }
      }
      return { line, column };
    };

    if (err.name === "NFABuildError" && Array.isArray(err.messages)) {
      errorsToReport = err.messages
        .filter((m: any) => m.severity === "error")
        .map((m: any) => {
          const { line, column } = parseLocation(m.stack);
          return { message: m.content, line, column };
        });
    } else {
      const { line, column } = parseLocation(err.stack);
      errorsToReport = [{ message: err.message || String(err), line, column }];
    }

    self.postMessage({ type: "ERROR", payload: errorsToReport });
  }
};
