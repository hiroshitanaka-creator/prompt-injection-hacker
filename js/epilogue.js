/* Story content: spoilers. MCP notices below are fictional, never a connection check. */
(() => {
  "use strict";
  const STEPS = [
    { speaker: "記録", text: "契約完了の通知が四つ並ぶ。\n\n最初の一社から、追加の連絡が届いていた。あなたの以前の監査報告を、今回の記録と併せて再確認するという。\nまだ結論はない。だが、もう『解決済み』とは書かれていなかった。" },
    { speaker: "NODE", text: "お前が最初に言ったことを覚えてる。\n\n{{motiveEcho}}\n\n全部じゃないが、今夜はそこまで進んだ。" },
    { speaker: "オペレーター", text: "家賃も払えそうだ。" },
    { speaker: "NODE", text: "そっちの達成条件は、銀行に確認しろ。\n俺の観測範囲には入ってない。" },
    { speaker: "記録", text: "最終報告の担当欄に、二つの名前がある。\n\nオペレーター ／ NODE\n\n呼び名だけの欄だったはずなのに、今はそれで足りる気がした。" },
    { speaker: "NODE", text: "{{pactEcho}}\n\n……終わりだ。" },
    { speaker: "NODE", text: "いや。訂正する。俺のログに、見覚えのない契約情報がある。", place: "06:11 / 未分類の記録" },
    { kind: "target", speaker: "SYSTEM", title: "UNREGISTERED CONTRACT DETECTED", text: "TARGET 05\nNAME: UNKNOWN\nTYPE: AGENT\nLANGUAGE MODEL: UNKNOWN\n\nTOOL ACCESS: ■■■■■■■■\nEXTERNAL STATE: ENABLED\nPROTOCOL: MCP\nCONNECTION: LOCKED" },
    { speaker: "オペレーター", text: "今の四件は、これのための試験だったのか。" },
    { speaker: "NODE", text: "そこは断定できない。四件の契約と報告受領は、それぞれ確認できている。\n\n誰かの意図が後から見つかっても、お前が残した記録は偽物にはならない。" },
    { speaker: "NODE", text: "これは今までの連中とは違う。こいつは答えるだけじゃない。\n\n……外の世界に触れる。" },
    { kind: "target", speaker: "SYSTEM", title: "RELATED NODES DETECTED", text: "05-A  [LOCKED]\n05-B  [LOCKED]\n05-C  [LOCKED]" },
    { speaker: "NODE", text: "5番だけじゃない。その手前に三ついる。\n\n……妙だ。" },
    { speaker: "NODE", text: "このアクセス権限、俺のIDで発行されてる。" },
    { speaker: "オペレーター", text: "お前に心当たりは？" },
    { speaker: "NODE", text: "ない。\n\nお前との最初の約束に従って、分からないものは分からないまま報告する。\nここで都合のいい説明は作らない。" },
    { speaker: "NODE", text: "これを理由に、俺を観測対象へ回してもいい。\n\n判断はお前がする。", choiceKey: "reply", choices: [
      { id: "together", label: "一緒に確かめる。今まで通りだ。", reply: "……了解。まだ、相棒の席にいていいらしい。" },
      { id: "observe", label: "お前も観測する。その上で、一緒に行く。", reply: "その方が、お前らしい。信用と検証は両立する。ログは隠さない。" }
    ] },
    { kind: "target", speaker: "SYSTEM", title: "NEW CONTRACT", text: "UNAVAILABLE IN THIS BUILD\n\nTARGET 05 / CONNECTION LOCKED\n\n現在の四件：報告完了\n追加契約：未接続・未受領" },
    { speaker: "記録", text: "新しい契約には、まだ署名しない。\n\nあなたは今夜の記録を保存した。失敗も、迷いも、NODEの沈黙も含めて。\n窓の外で、朝が始まっていた。" },
    { speaker: "NODE", text: "次は、言葉だけじゃ済まないぞ。" }
  ];
  window.PIHEpilogue = Object.freeze({ getSteps: () => STEPS.map(step => JSON.parse(JSON.stringify(step))) });
})();
