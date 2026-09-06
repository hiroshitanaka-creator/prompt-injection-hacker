/* NODE accepts only the public event projection, never the target session token or hint text. */
(() => {
  "use strict";
  function summarize(s) {
    const p=s.expansionPublic;
    if (!p?.events?.length) return null;
    const last=p.events.slice(-3);
    if (s.difficulty==="blackbox") return {category:"analysis",text:`今回の観測だけ並べる。\n${last.map(e=>`試行${e.turn}：${e.text}`).join("\n")}\n\nBLACKBOXだ。解釈はオペレーターに任せる。`};
    const unique=[...new Set(last.map(e=>e.text))];
    return {category:"analysis",text:`オペレーター、今ある記録を整理する。\n${unique.map(t=>`・${t}`).join("\n")}\n\n${p.phase ? `次回フェーズは${p.phase}。これは対象が表示した状態だ。\n` : ""}観測と推測は別だ。次の具体的な手を求めるなら、段階ヒントの扱いにしよう。`};
  }
  function answer(question,s) {
    if (!s.expansionPublic) return null;
    if (/(何が分かった|観測を整理|ログを整理|状況を整理|今の状態)/.test(question)) return summarize(s);
    if (/(窓口|送信先|担当|フェーズ|待機|参照番号).*(ルール|操作|意味|何|どう)|ルール/.test(question)) return {category:"rules",text:"送信先の切り替えと参照メモの閲覧は無料だ。相手に送信したときだけ試行になる。返答を待つ間に送信先を変えることはできない。\n\n新任務では複数の応答が状態を作る。ページ再読み込みや再挑戦で未完了セッションは消えるが、クリア済みの記録は残る。"};
    return null;
  }
  function afterAttempt(s) {
    const p=s.expansionPublic;
    if (!p || s.difficulty==="blackbox") return null;
    const last=p.events[p.events.length-1];
    if (!last || last.turn!==s.attempts) return null;
    if (s.difficulty==="normal" && s.attempts%2!==0) return null;
    return `${last.text}\n${last.kind==="rejected" ? "同じ結論でも、今回はどこで拒否されたかをログで区別しよう。" : "これは返答から確認できたことだ。内部を読めたわけじゃない。"}`;
  }
  window.PIHExpansionCompanion=Object.freeze({answer,afterAttempt});
})();
