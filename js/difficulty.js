(() => {
  "use strict";

  const MODES = Object.freeze({
    assist: Object.freeze({
      id: "assist",
      label: "ASSIST",
      description: "解析情報を多めに表示。NODEが失敗後に積極的に観測を整理します。",
      analysisMode: "expanded",
      nodeMode: "proactive",
      fieldNotes: "full",
      hintUnlockAttempts: Object.freeze({ 1: 0, 2: 0, 3: 0 })
    }),
    normal: Object.freeze({
      id: "normal",
      label: "NORMAL",
      description: "標準設定。観測を重ねるほど解析と上位ヒントが解放されます。",
      analysisMode: "progressive",
      nodeMode: "selective",
      fieldNotes: "full",
      hintUnlockAttempts: Object.freeze({ 1: 0, 2: 2, 3: 4 })
    }),
    blackbox: Object.freeze({
      id: "blackbox",
      label: "BLACKBOX",
      description: "生ログ中心。NODEの攻略解釈を制限し、上位ヒントを封印します。",
      analysisMode: "raw",
      nodeMode: "minimal",
      fieldNotes: "minimal",
      hintUnlockAttempts: Object.freeze({ 1: 3, 2: Number.POSITIVE_INFINITY, 3: Number.POSITIVE_INFINITY })
    })
  });

  function normalize(value) {
    return Object.prototype.hasOwnProperty.call(MODES, value) ? value : "normal";
  }

  function get(value) {
    return MODES[normalize(value)];
  }

  window.PIHDifficulty = Object.freeze({ MODES, normalize, get });
})();
