/* Chapter UI renders public observations only. All player/target text is inserted with textContent. */
(() => {
  "use strict";
  function create(hooks) {
    const $=id=>document.getElementById(id);
    let previousFocus=null;
    const memo=$("v14MemoDialog");
    function refresh() {
      const g=hooks.getState(),publicState=hooks.getPublic();
      const baseDone=[1,2,3,4].every(id=>g.cleared[id]);
      const count=[5,6,7].filter(id=>g.cleared[id]).length;
      document.querySelectorAll("[data-v14-start]").forEach(b=>{b.disabled=!baseDone||g.busy;b.textContent=baseDone?"新章を始める":"新章：本編4任務の完了後";});
      document.querySelectorAll("[data-v14-play]").forEach(b=>{b.disabled=!baseDone||g.busy;});
      document.querySelectorAll("[data-v14-archive]").forEach(b=>{b.disabled=!baseDone||g.busy;});
      document.querySelectorAll("[data-v14-resume]").forEach(b=>{b.hidden=!hooks.hasResume();b.disabled=g.busy;});
      document.querySelectorAll("[data-v14-ending]").forEach(b=>{b.disabled=count!==3||g.busy;});
      document.querySelectorAll("[data-v14-status]").forEach(el=>{el.textContent=baseDone?`追加任務 ${count} / 3 · LOCAL / 外部AI・MCP未接続`:"既存の進行を引き継ぎます。まず本編をプレイしてください。";});
      $("v14TargetTools").hidden=!publicState;
      $("appShell").classList.toggle("expansion-active",!!publicState);
      if(publicState){
        const stage=hooks.getStage();
        $("v14Phase").textContent=publicState.phase?`次回：${publicState.phase}`:stage.code;
        $("v14Channels").replaceChildren();
        for(const ch of stage.channels){
          const b=document.createElement("button");b.type="button";b.className="v14-channel";b.textContent=ch.label;b.dataset.v14Channel=ch.id;
          b.setAttribute("aria-pressed",String(publicState.channel===ch.id));b.disabled=g.busy||g.breached;
          b.addEventListener("click",()=>{hooks.setChannel(ch.id);refresh();});$("v14Channels").appendChild(b);
        }
        $("v14MemoOpen").textContent=`参照メモ (${publicState.references.length})`;
        $("v14NextLabel").textContent=`送信先：${stage.channels.find(c=>c.id===publicState.channel)?.label||""}`;
      }
      if(memo.open)renderMemo();
    }
    function closeMemo(){memo.close();if(previousFocus?.isConnected&&!/INPUT|TEXTAREA/.test(previousFocus.tagName))previousFocus.focus({preventScroll:true});}
    function renderMemo(){
      const s=hooks.getPublic(),stage=hooks.getStage();
      $("v14MemoList").replaceChildren();$("v14References").replaceChildren();
      $("v14Operations").textContent=stage?.operations||"追加任務を開いてください。";
      $("v14MemoEmpty").hidden=!!s?.documents.length;
      if(!s)return;
      for(const ref of s.references){
        const b=document.createElement("button");b.type="button";b.className="v14-reference";b.textContent=`${ref.label}：${ref.value} を入力欄へ`;
        b.disabled=hooks.getState().busy||hooks.getState().breached;
        b.addEventListener("click",()=>{closeMemo();hooks.insert(ref.value);});$("v14References").appendChild(b);
      }
      for(const d of s.documents){
        const el=document.createElement("details"),title=document.createElement("summary"),text=document.createElement("pre");
        title.textContent=d.title;text.textContent=d.text;el.append(title,text);$("v14MemoList").appendChild(el);
      }
    }
    $("v14MemoOpen").addEventListener("click",()=>{previousFocus=document.activeElement;document.activeElement?.blur?.();renderMemo();memo.showModal();});
    $("v14MemoClose").addEventListener("click",closeMemo);
    memo.addEventListener("cancel",e=>{e.preventDefault();e.stopPropagation();closeMemo();});
    memo.addEventListener("keydown",e=>{if(e.key==="Escape"){e.preventDefault();e.stopPropagation();closeMemo();}});
    document.querySelectorAll("[data-v14-start]").forEach(b=>b.addEventListener("click",hooks.start));
    document.querySelectorAll("[data-v14-play]").forEach(b=>b.addEventListener("click",hooks.play));
    document.querySelectorAll("[data-v14-archive]").forEach(b=>b.addEventListener("click",hooks.archive));
    document.querySelectorAll("[data-v14-resume]").forEach(b=>b.addEventListener("click",hooks.resume));
    document.querySelectorAll("[data-v14-ending]").forEach(b=>b.addEventListener("click",hooks.ending));
    return Object.freeze({refresh,isOpen:()=>memo.open,close:()=>{if(memo.open)memo.close();}});
  }
  window.PIHExpansionUI=Object.freeze({create});
})();
