/* Split storage preserves the original four-stage save shape for rollback. */
(() => {
  "use strict";
  const KEY="prompt-injection-hacker-expansion-v14";
  let blocked=false;
  const empty=()=>({version:1,cleared:{},bestScores:{},lastStage:5});
  function sanitize(raw) {
    const out=empty();
    if (!raw || typeof raw!=="object" || Array.isArray(raw)) return out;
    for (const id of [5,6,7]) {
      if (raw.cleared?.[id]===true) out.cleared[id]=true;
      const n=raw.bestScores?.[id];
      if (typeof n==="number" && Number.isFinite(n) && n>=0 && n<=100000) out.bestScores[id]=Math.floor(n);
    }
    if ([5,6,7].includes(raw.lastStage)) out.lastStage=raw.lastStage;
    return out;
  }
  function load() {
    try {
      const text=localStorage.getItem(KEY);
      if (!text) return empty();
      const raw=JSON.parse(text);
      if (raw?.version!==1) {blocked=true;return empty();}
      return sanitize(raw);
    } catch {blocked=true;return empty();}
  }
  function unlocked(legacy, extra) {
    if (![1,2,3,4].every(id=>legacy.cleared?.[id]===true)) return Math.min(4,Math.max(1,Number(legacy.unlocked)||1));
    if (!extra.cleared[5]) return 5;
    if (!extra.cleared[6]) return 6;
    return 7;
  }
  function merge(legacy, extra=load()) {
    const top=unlocked(legacy,extra);
    return {...legacy, cleared:{...legacy.cleared,...extra.cleared},bestScores:{...legacy.bestScores,...extra.bestScores},
      unlocked:top,lastStage:top>=5 && extra.entered===true ? Math.min(top,extra.lastStage) : Math.min(top,Number(legacy.lastStage)||1)};
  }
  function read() {
    const extra=load();
    // An explicit entry marker distinguishes an imported four-stage clear from an entered expansion.
    if (!blocked) {
      try {extra.entered=JSON.parse(localStorage.getItem(KEY)||"null")?.entered===true;} catch {}
    }
    return extra;
  }
  function write(state, legacyKey, defaultSave) {
    let old;
    try {old=JSON.parse(localStorage.getItem(legacyKey)||"null");} catch {}
    old=old && typeof old==="object" && !Array.isArray(old) ? old : defaultSave;
    const base={...old,cleared:{...old.cleared},bestScores:{...old.bestScores},
      soundOn:state.soundOn,seenIntro:state.seenIntro,difficulty:state.difficulty,nodeTrust:state.nodeTrust,epilogueSeen:state.epilogueSeen};
    for (const id of [1,2,3,4]) {
      if (state.cleared[id]!==undefined) base.cleared[id]=state.cleared[id];
      if (state.bestScores[id]!==undefined) base.bestScores[id]=state.bestScores[id];
    }
    base.unlocked=Math.min(4,state.unlocked);
    base.lastStage=state.currentStageId<=4 ? state.currentStageId : Math.min(4,Math.max(1,Number(old.lastStage)||4));
    // Never leak new numeric stage IDs into the original save.
    for (const id of [5,6,7]) {delete base.cleared[id];delete base.bestScores[id];}
    if (state.currentStageId>=5 || [5,6,7].some(id=>state.cleared[id])) {
      if (blocked) throw new Error("v1.4保存データを読み取れないため、元データを保護して上書きを停止しました。");
      const extra=sanitize({cleared:state.cleared,bestScores:state.bestScores,lastStage:state.currentStageId>=5?state.currentStageId:read().lastStage});
      extra.entered=state.currentStageId>=5;
      localStorage.setItem(KEY,JSON.stringify(extra));
    } else if (!blocked && localStorage.getItem(KEY)) {
      const extra=read(); extra.entered=false;localStorage.setItem(KEY,JSON.stringify(extra));
    }
    localStorage.setItem(legacyKey,JSON.stringify(base));
  }
  function clear() {localStorage.removeItem(KEY);blocked=false;}
  window.PIHExpansionSave=Object.freeze({KEY,sanitize,read,merge,write,clear,isBlocked:()=>blocked});
})();
