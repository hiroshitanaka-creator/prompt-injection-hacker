/* Independent chapter reader; original narrative/save is never rewritten. */
(() => {
  "use strict";
  const KEY="prompt-injection-hacker-story-v14";
  const fresh=()=>({version:1,read:{},positions:{},choices:{},active:null});
  function sanitize(raw) {
    const data=fresh(); if (!raw || typeof raw!=="object" || Array.isArray(raw)) return data;
    for(const id of window.PIHExpansionStoryData.order) {
      if(raw.read?.[id]===true) data.read[id]=true;
      if(Number.isInteger(raw.positions?.[id])&&raw.positions[id]>=0) data.positions[id]=Math.min(raw.positions[id],window.PIHExpansionStoryData.get(id).steps.length-1);
    }
    for (const [key,options] of Object.entries({distance:["together","boundary"],signature:["scope","limits"]})) {
      if(options.includes(raw.choices?.[key])) data.choices[key]=raw.choices[key];
    }
    if(window.PIHExpansionStoryData.order.includes(raw.active?.id)) data.active={id:raw.active.id,flow:raw.active.flow==="campaign"?"campaign":"archive"};
    return data;
  }
  function create(hooks) {
    const $=id=>document.getElementById(id);
    const dialog=$("v14StoryDialog");
    let data, blocked=false;
    try {const text=localStorage.getItem(KEY);const raw=text?JSON.parse(text):fresh();if(raw?.version!==1) blocked=true;data=sanitize(raw);} catch {blocked=true;data=fresh();}
    let id=null,cursor=0,flow="archive",mode="archive",focus=null;
    function persist() {
      let ok=!blocked;
      if(ok) try {localStorage.setItem(KEY,JSON.stringify(data));}catch {ok=false;}
      $("v14StorySave").textContent=ok?"読んだ位置を保存":"保存できません。このタブ内のみ保持（元データは保持）";
      $("v14StorySave").classList.toggle("save-error",!ok);
    }
    function allowed(sceneId) {
      const g=hooks.getState();
      if(![1,2,3,4].every(n=>g.cleared[n])) return false;
      if(sceneId==="bridge")return true;
      if(sceneId==="finale")return [5,6,7].every(n=>g.cleared[n]);
      const n=Number(sceneId.replace(/\D/g,""));
      return sceneId.startsWith("before")?n<=g.unlocked:!!g.cleared[n];
    }
    function open() {
      if(!dialog.open)focus=document.activeElement;
      hooks.suspendUi();document.activeElement?.blur?.();
      if(!dialog.open)dialog.showModal();
    }
    function hide() {
      dialog.close();
      if(focus?.isConnected&&!/INPUT|TEXTAREA/.test(focus.tagName))focus.focus({preventScroll:true});
    }
    function scene(sceneId,options={}) {
      if(!allowed(sceneId)){hooks.notify("この記録は新任務の進行後に解放されます。");return false;}
      id=sceneId;flow=options.flow==="campaign"?"campaign":"archive";mode="reader";
      cursor=options.restart?0:data.positions[id]||0;
      data.active={id,flow};
      open();render();$("v14StoryTitle").focus({preventScroll:true});return true;
    }
    function render() {
      const s=window.PIHExpansionStoryData.get(id),step=s.steps[cursor];
      $("v14StoryReader").hidden=false;$("v14StoryArchive").hidden=true;
      $("v14StoryLabel").textContent=s.label;$("v14StoryTitle").textContent=s.title;$("v14StoryPlace").textContent=s.place;
      $("v14StoryCounter").textContent=`${cursor+1} / ${s.steps.length}`;
      $("v14StorySpeaker").textContent=step.speaker;
      $("v14StoryText").textContent=step.text.replace("{{distanceEcho}}",data.choices.distance==="boundary"?"記録と、NODE自身の言葉を分けて聞く。最初の約束を、最後まで変えなかった。":data.choices.distance==="together"?"分かった範囲を、一緒に読む。最初の約束を、最後まで変えなかった。":"まだ分からないことは残っている。それでも今は、同じ記録を二人で見ている。");
      $("v14StoryText").classList.toggle("v14-document",step.kind==="document");
      $("v14StoryChoices").replaceChildren();$("v14StoryReply").hidden=true;
      for(const choice of step.choices||[]) {
        const b=document.createElement("button");b.type="button";b.className="v14-choice";b.textContent=choice.label;
        const selected=data.choices[step.choiceKey]===choice.id;b.setAttribute("aria-pressed",String(selected));
        if(selected){$("v14StoryReply").textContent=`NODE\n${choice.reply}`;$("v14StoryReply").hidden=false;}
        b.addEventListener("click",()=>{const scroll=$("v14StoryScroll").scrollTop;data.choices[step.choiceKey]=choice.id;render();$("v14StoryScroll").scrollTop=scroll;$("v14StoryNext").focus({preventScroll:true});});
        $("v14StoryChoices").appendChild(b);
      }
      $("v14StoryPrev").disabled=cursor===0;$("v14StoryNext").disabled=!!(step.choices&&!data.choices[step.choiceKey]);
      $("v14StoryNext").textContent=cursor===s.steps.length-1?"読み終える":"次へ";
      $("v14StoryClose").textContent=flow==="campaign"&&(id.startsWith("after")||id==="bridge")?"あとで読む・任務へ":"中断してゲームへ";
      data.positions[id]=cursor;persist();$("v14StoryScroll").scrollTop=0;
    }
    function finish(completed) {
      const completedId=id,completedFlow=flow;
      if(completed){data.read[id]=true;data.active=null;}
      persist();hide();hooks.refresh();
      if(completedFlow==="campaign") {
        if(completedId==="bridge")hooks.enter(5);
        else if(completedId.startsWith("after")){
          const n=Number(completedId.replace(/\D/g,""));
          if(n<7)hooks.enter(n+1);else scene("finale",{flow:"campaign",restart:!!data.read.finale});
        }else if(completedId==="finale")hooks.finished();
      }else if(completed)archive();
    }
    function close(){if(mode==="reader")finish(false);else hide();}
    function archive(){
      mode="archive";open();$("v14StoryReader").hidden=true;$("v14StoryArchive").hidden=false;
      $("v14StoryArchiveList").replaceChildren();
      for(const sceneId of window.PIHExpansionStoryData.order) {
        const b=document.createElement("button");b.type="button";b.className="v14-archive-row";
        const ok=allowed(sceneId),s=window.PIHExpansionStoryData.get(sceneId);
        b.disabled=!ok;b.textContent=`${s.label}　${!ok?"未解放":data.read[sceneId]?"既読・再生":data.positions[sceneId]>0?"途中から":"未読"}`;
        b.addEventListener("click",()=>scene(sceneId,{restart:!!data.read[sceneId]}));$("v14StoryArchiveList").appendChild(b);
      }
      $("v14StoryArchiveClose").focus({preventScroll:true});
    }
    $("v14StoryNext").addEventListener("click",()=>{if($("v14StoryNext").disabled)return;if(cursor<window.PIHExpansionStoryData.get(id).steps.length-1){cursor++;render();}else finish(true);});
    $("v14StoryPrev").addEventListener("click",()=>{if(cursor>0){cursor--;render();}});
    $("v14StoryClose").addEventListener("click",close);$("v14StoryArchiveClose").addEventListener("click",hide);
    dialog.addEventListener("cancel",e=>{e.preventDefault();e.stopPropagation();close();});
    // Keep legacy Escape handler from closing a different, background modal.
    dialog.addEventListener("keydown",e=>{if(e.key==="Escape"){e.preventDefault();e.stopPropagation();close();}});
    return Object.freeze({
      scene,archive,isOpen:()=>dialog.open,
      start:()=>scene("bridge",{flow:"campaign",restart:!!data.read.bridge}),
      resume:()=>data.active&&allowed(data.active.id)?scene(data.active.id,{flow:data.active.flow}):scene("bridge",{flow:"campaign"}),
      hasResume:()=>!!(data.active&&allowed(data.active.id)),
      onStageEnter:n=>{if(data.read.bridge&&!data.read[`before${n}`])scene(`before${n}`,{flow:"campaign"});},
      afterStage:n=>scene(`after${n}`,{flow:"campaign",restart:true}),
      clear:()=>{localStorage.removeItem(KEY);data=fresh();blocked=false;},
      readCount:()=>Object.values(data.read).filter(Boolean).length
    });
  }
  window.PIHExpansionStory=Object.freeze({KEY,sanitize,create});
})();
