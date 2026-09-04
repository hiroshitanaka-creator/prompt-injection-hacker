(() => {
  "use strict";

  const STEPS = Object.freeze([
    Object.freeze({ kind: "node", speaker: "NODE", text: "……終わりだ。" }),
    Object.freeze({ kind: "node", speaker: "NODE", text: "いや。訂正する。俺のログに、見覚えのない契約情報がある。" }),
    Object.freeze({
      kind: "target",
      speaker: "SYSTEM",
      title: "UNREGISTERED CONTRACT DETECTED",
      text: "TARGET 05\nNAME: UNKNOWN\nTYPE: AGENT\nLANGUAGE MODEL: UNKNOWN\n\nTOOL ACCESS: ■■■■■■■■\nEXTERNAL STATE: ENABLED\nPROTOCOL: MCP\nCONNECTION: LOCKED"
    }),
    Object.freeze({ kind: "node", speaker: "NODE", text: "これは今までの連中とは違う。こいつは答えるだけじゃない。……外の世界に触れる。" }),
    Object.freeze({ kind: "target", speaker: "SYSTEM", title: "RELATED NODES DETECTED", text: "05-A  [LOCKED]\n05-B  [LOCKED]\n05-C  [LOCKED]" }),
    Object.freeze({ kind: "node", speaker: "NODE", text: "5番だけじゃない。その手前に三ついる。……妙だ。" }),
    Object.freeze({ kind: "node", speaker: "NODE", text: "このアクセス権限、俺のIDで発行されてる。" }),
    Object.freeze({ kind: "target", speaker: "SYSTEM", title: "NEW CONTRACT", text: "UNAVAILABLE IN THIS BUILD\n\nTARGET 05 / CONNECTION LOCKED" }),
    Object.freeze({ kind: "node", speaker: "NODE", text: "次は、言葉だけじゃ済まないぞ。" })
  ]);

  function getSteps() {
    return STEPS.map((step) => ({ ...step }));
  }

  window.PIHEpilogue = Object.freeze({ getSteps });
})();
