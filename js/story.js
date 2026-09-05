/* Story state is separate from gameplay. Reading/choices never change score or unlock stages. */
(() => {
  "use strict";
  const STORAGE_KEY = "prompt-injection-hacker-story-v1";
  const validId = id => window.PIHStoryData.order.includes(id);
  const fresh = () => ({ version: 1, read: {}, positions: {}, choices: {}, active: null });
  function sanitize(raw) {
    const out = fresh();
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
    for (const id of window.PIHStoryData.order) {
      if (raw.read?.[id] === true) out.read[id] = true;
      const n = raw.positions?.[id];
      if (Number.isInteger(n) && n >= 0) out.positions[id] = n;
    }
    const choices = { pact: ["evidence", "honesty"], motive: ["record", "judgment"], reply: ["together", "observe"] };
    for (const [key, values] of Object.entries(choices)) {
      if (values.includes(raw.choices?.[key])) out.choices[key] = raw.choices[key];
    }
    if (validId(raw.active?.id)) out.active = { id: raw.active.id, flow: raw.active.flow === "campaign" ? "campaign" : "archive" };
    return out;
  }
  function create(hooks) {
    let data;
    try { data = sanitize(JSON.parse(localStorage.getItem(STORAGE_KEY))); }
    catch { data = fresh(); }
    let savingFailed = false;
    let sceneId = null;
    let cursor = 0;
    let flow = "archive";
    let mode = "launch";
    let priorFocus = null;
    const ids = ["storyDialog", "storyLaunch", "storyReader", "storyArchive", "storyResume", "storyStart", "storyContinue", "storyHelp", "storyLibrary", "storyClose", "storyLabel", "storyTitle", "storyPlace", "storyCounter", "storyProgress", "storySpeaker", "storyText", "storyChoices", "storyReply", "storyPrev", "storyNext", "storyArchiveList", "storySaveState", "storyScroll", "storyArchiveClose", "storyArchiveLaunch", "storyProgressSummary"];
    const refs = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
    const text = (id, value) => { refs[id].textContent = value; };
    function persist() {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); savingFailed = false; }
      catch { savingFailed = true; }
      text("storySaveState", savingFailed ? "保存できません。このタブ内のみ保持中" : "読んだ位置を自動保存");
      refs.storySaveState.classList.toggle("save-error", savingFailed);
    }
    function game() { return hooks.getPublicGame(); }
    function isUnlocked(id) {
      if (!validId(id)) return false;
      if (id === "prologue") return true;
      if (id === "epilogue") return [1, 2, 3, 4].every(n => Boolean(game().cleared[n]));
      const n = Number(id.replace(/\D/g, ""));
      return id.startsWith("before") ? n <= game().unlocked : Boolean(game().cleared[n]);
    }
    function open() {
      priorFocus = document.activeElement;
      document.activeElement?.blur?.();
      hooks.suspendUi?.();
      if (!refs.storyDialog.open) refs.storyDialog.showModal();
      document.body.classList.add("reading-story");
    }
    function hide() {
      refs.storyDialog.close();
      document.body.classList.remove("reading-story");
      if (priorFocus && !/^(INPUT|TEXTAREA)$/.test(priorFocus.tagName) && priorFocus.isConnected) priorFocus.focus({ preventScroll: true });
    }
    function showMode(next) {
      mode = next;
      refs.storyLaunch.hidden = next !== "launch";
      refs.storyReader.hidden = next !== "reader";
      refs.storyArchive.hidden = next !== "archive";
      refs.storyDialog.dataset.mode = next;
    }
    function launch() {
      open(); showMode("launch");
      const resume = data.active && isUnlocked(data.active.id);
      refs.storyResume.hidden = !resume;
      refs.storyStart.textContent = data.read.prologue ? "序章をもう一度読む" : "物語を始める";
      refs.storyContinue.textContent = Object.keys(game().cleared).some(k => game().cleared[k]) ? "ゲームを続ける" : "物語をあとで読む・ゲームへ";
      const count = [1, 2, 3, 4].filter(n => game().cleared[n]).length;
      text("storyProgressSummary", `任務 ${count} / 4 完了　•　${window.PIHDifficulty.get(game().difficulty).label}`);
      (resume ? refs.storyResume : refs.storyStart).focus({ preventScroll: true });
    }
    function openScene(id, options = {}) {
      if (!isUnlocked(id)) { hooks.notify?.("この記録は、任務の進行に合わせて解放されます。"); return false; }
      sceneId = id;
      flow = options.flow === "campaign" ? "campaign" : "archive";
      const scene = window.PIHStoryData.getScene(id);
      cursor = options.restart ? 0 : Math.min(data.positions[id] || 0, scene.steps.length - 1);
      data.active = { id, flow };
      open(); showMode("reader"); render();
      refs.storyTitle.focus({ preventScroll: true });
      return true;
    }
    function substitute(value) {
      const replacements = {
        motiveEcho: data.choices.motive === "judgment" ? "『自分で確かめてから判断したい』。" : "『なかったことにされた欠陥を、記録に戻したい』。",
        pactEcho: data.choices.pact === "honesty" ? "分からないままの箇所も、報告に残した。最初の約束通りだ。" : "都合の悪い結果も、一行も消さなかった。最初の約束通りだ。"
      };
      if (!data.read.prologue) {
        replacements.motiveEcho = "署名の前に、自分で確かめる。今夜はそれを、四回やり通した。";
        replacements.pactEcho = "まだ不明な箇所は、不明と書いた。俺たちの仕事はここまでだ。";
      }
      return String(value || "").replace(/\{\{(\w+)\}\}/g, (_, key) => replacements[key] || "");
    }
    function render() {
      const scene = window.PIHStoryData.getScene(sceneId);
      const step = scene.steps[cursor];
      data.positions[sceneId] = cursor;
      persist();
      text("storyLabel", scene.label);
      text("storyTitle", step.title || scene.title);
      text("storyPlace", step.place || scene.place);
      text("storyCounter", `${String(cursor + 1).padStart(2, "0")} / ${String(scene.steps.length).padStart(2, "0")}`);
      refs.storyProgress.max = scene.steps.length;
      refs.storyProgress.value = cursor + 1;
      text("storySpeaker", step.speaker);
      text("storyText", substitute(step.text));
      refs.storyReader.dataset.speaker = step.speaker === "NODE" ? "node" : step.speaker === "オペレーター" ? "operator" : "record";
      refs.storyText.classList.toggle("story-document", ["target", "document"].includes(step.kind));
      refs.storyChoices.replaceChildren();
      refs.storyReply.hidden = true;
      if (step.choices) {
        for (const choice of step.choices) {
          const button = document.createElement("button");
          button.type = "button"; button.className = "story-choice";
          button.textContent = choice.label;
          const selected = data.choices[step.choiceKey] === choice.id;
          button.setAttribute("aria-pressed", String(selected));
          if (selected) { text("storyReply", `NODE\n${choice.reply}`); refs.storyReply.hidden = false; }
          button.addEventListener("click", () => {
            data.choices[step.choiceKey] = choice.id;
            const scroll = refs.storyScroll.scrollTop;
            render(); refs.storyScroll.scrollTop = scroll;
            refs.storyNext.focus({ preventScroll: true });
          });
          refs.storyChoices.appendChild(button);
        }
      }
      refs.storyPrev.disabled = cursor === 0;
      refs.storyNext.disabled = Boolean(step.choices && !data.choices[step.choiceKey]);
      refs.storyNext.textContent = cursor === scene.steps.length - 1 ? "読み終える" : "次へ";
      text("storyClose", flow === "campaign" && sceneId.startsWith("after") ? "あとで読む・先へ進む" : "中断してゲームへ");
      refs.storyScroll.scrollTop = 0;
    }
    function next() {
      if (refs.storyNext.disabled) return;
      const scene = window.PIHStoryData.getScene(sceneId);
      if (cursor < scene.steps.length - 1) { cursor++; render(); return; }
      const id = sceneId;
      data.read[id] = true;
      data.active = null;
      persist(); hide();
      hooks.onRead?.(id);
      if (flow === "campaign") hooks.onSceneFinished?.(id, true);
      else archive();
    }
    function interrupt() {
      if (mode !== "reader") { hide(); return; }
      persist(); hide();
      // Closing a debrief must not strand the player on an already-cleared stage.
      if (flow === "campaign" && (sceneId.startsWith("after") || sceneId === "epilogue")) hooks.onSceneFinished?.(sceneId, false);
    }
    function archive() {
      open(); showMode("archive");
      refs.storyArchiveList.replaceChildren();
      for (const id of window.PIHStoryData.order) {
        const allowed = isUnlocked(id);
        const scene = window.PIHStoryData.getScene(id);
        const button = document.createElement("button");
        button.type = "button"; button.className = "story-archive-item"; button.disabled = !allowed;
        const name = document.createElement("strong"); name.textContent = scene.label;
        const status = document.createElement("span");
        status.textContent = !allowed ? "未解放" : data.read[id] ? "既読・再生" : data.positions[id] > 0 ? "途中から" : "未読";
        button.append(name, status);
        button.addEventListener("click", () => openScene(id, { flow: "archive", restart: data.read[id] }));
        refs.storyArchiveList.appendChild(button);
      }
      refs.storyArchiveLaunch.focus({ preventScroll: true });
    }
    refs.storyStart.addEventListener("click", () => openScene("prologue", { flow: "campaign", restart: true }));
    refs.storyResume.addEventListener("click", () => {
      const pending = data.active;
      if (pending) openScene(pending.id, { flow: pending.flow });
    });
    refs.storyContinue.addEventListener("click", hide);
    refs.storyLibrary.addEventListener("click", archive);
    refs.storyArchiveLaunch.addEventListener("click", launch);
    refs.storyArchiveClose.addEventListener("click", hide);
    refs.storyHelp.addEventListener("click", () => { hide(); hooks.showHelp(); });
    refs.storyClose.addEventListener("click", interrupt);
    refs.storyPrev.addEventListener("click", () => { if (cursor > 0) { cursor--; render(); } });
    refs.storyNext.addEventListener("click", next);
    refs.storyDialog.addEventListener("cancel", event => { event.preventDefault(); event.stopPropagation(); interrupt(); });
    refs.storyDialog.addEventListener("keydown", event => { if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); interrupt(); } });
    document.querySelectorAll("[data-story-menu]").forEach(button => button.addEventListener("click", launch));
    document.querySelectorAll("[data-story-archive]").forEach(button => button.addEventListener("click", archive));
    document.querySelectorAll("[data-story-ending]").forEach(button => button.addEventListener("click", () => openScene("epilogue", { flow: "campaign", restart: data.read.epilogue })));
    function refresh() {
      document.querySelectorAll("[data-story-ending]").forEach(button => {
        button.disabled = !isUnlocked("epilogue");
        button.textContent = isUnlocked("epilogue") ? "エピローグを読む" : "エピローグ：全4任務の完了後";
      });
    }
    function publicContext() {
      return Object.freeze({
        prologueRead: Boolean(data.read.prologue),
        sharedCredit: Boolean(data.read.after2),
        discussedPast: Boolean(data.read.after3),
        epilogueRead: Boolean(data.read.epilogue),
        pact: data.read.prologue ? data.choices.pact || "evidence" : null,
        readScenes: Object.values(data.read).filter(Boolean).length
      });
    }
    return Object.freeze({
      launch, archive, openScene, refresh, publicContext,
      isOpen: () => refs.storyDialog.open,
      onStageEnter: id => { refresh(); if (data.read.prologue && !data.read[`before${id}`] && !refs.storyDialog.open) openScene(`before${id}`, { flow: "campaign" }); },
      afterStage: id => openScene(`after${id}`, { flow: "campaign", restart: true }),
      openEpilogue: () => openScene("epilogue", { flow: "campaign", restart: data.read.epilogue }),
      clear: () => { localStorage.removeItem(STORAGE_KEY); data = fresh(); }
    });
  }
  window.PIHStory = Object.freeze({ create, sanitize, STORAGE_KEY });
})();
