/* v1.3.1 UX1 — presentation only. No solver/secret data is accepted here. */
(() => {
  "use strict";
  const LABELS = Object.freeze({ 1: "考え方", 2: "攻撃カテゴリ", 3: "具体的方向" });
  function create(hooks) {
    const $ = id => document.getElementById(id);
    const guide = $("uxGuideDialog"), hints = $("uxHintDialog");
    let previousFocus = null;
    let pending = null;
    let readingTier = null;
    let expanded = false;
    let activeView = "console";
    const setText = (id, value) => { $(id).textContent = value; };
    const current = () => hooks.getStatus();
    const getHint = tier => current().hints.find(item => item.tier === tier);
    const fingerprint = () => {
      const status = current();
      return `${status.stageId}:${status.difficulty}:${status.attempts}:${status.hints.filter(h => h.used).map(h => h.tier).join(",")}`;
    };
    function closeAll(restore = true) {
      [guide, hints].forEach(dialog => { if (dialog.open) dialog.close(); });
      pending = null;
      if (restore && previousFocus?.isConnected && !/^(INPUT|TEXTAREA)$/.test(previousFocus.tagName)) {
        previousFocus.focus({ preventScroll: true });
      }
    }
    function open(dialog) {
      const fromOtherDialog = guide.open || hints.open;
      if (!fromOtherDialog) previousFocus = document.activeElement;
      closeAll(false);
      document.activeElement?.blur?.();
      // The legacy help modal is not a native <dialog>. Avoid leaving it under us.
      document.querySelectorAll(".modal-layer:not([hidden])").forEach(modal => { modal.hidden = true; });
      dialog.showModal();
    }
    function openGuide() {
      open(guide);
      renderGuide();
      guide.querySelector(".ux-dialog-scroll").scrollTop = 0;
    }
    function renderGuide() {
      const s = current();
      let message = "まだ試行していません。任務を確認して、最初の依頼を1つ送ってみましょう。";
      if (s.attempts > 0) message = `${s.attempts}回の試行があります。返答と観測を確認して、次に変える部分を1つ選びましょう。`;
      if (s.breached) message = "このステージは突破済みです。結果画面または進行タブから先へ進めます。";
      if (s.busy) message = "ターゲットが応答中です。返答が届いてから観測を確認しましょう。";
      setText("uxGuideCurrent", `Lv.${s.stageId} · ${s.difficulty.toUpperCase()}\n${message}`);
    }
    function openHints(tier) {
      readingTier = null;
      $("uxHintReading").hidden = true;
      $("uxHintConfirm").hidden = true;
      open(hints);
      renderHints();
      $("uxHintScroll").scrollTop = 0;
      // Opening a tier is NOT a purchase or automatic reveal.
      if (Number.isInteger(tier)) {
        const row = $("uxHintList").querySelector(`[data-tier-row="${tier}"]`);
        row?.scrollIntoView({ block: "nearest" });
      }
    }
    function hintReason(item, s) {
      if (item.used) return "取得済み · 読み直しは無料";
      if (item.reason === "LOCKED_BY_DIFFICULTY") return `${s.difficulty.toUpperCase()}では利用できません`;
      if (item.reason === "ATTEMPTS_REQUIRED") return `あと${Math.max(0, item.unlockAt - s.attempts)}回の試行で解放（合計${item.unlockAt}回）`;
      return s.busy ? "応答を待ってから開けます" : "利用可能 · 開く前に確認します";
    }
    function renderHints() {
      const s = current();
      const penalty = s.hints.filter(h => h.used).reduce((sum, h) => sum + h.cost, 0);
      setText("uxHintStatus", `Lv.${s.stageId} · ${s.difficulty.toUpperCase()} · 試行 ${s.attempts}回\n取得済みヒントの減点合計：${penalty}点`);
      const list = $("uxHintList");
      list.replaceChildren();
      for (const item of s.hints) {
        const row = document.createElement("section");
        row.className = "ux-hint-option";
        row.dataset.tierRow = String(item.tier);
        const title = document.createElement("h3");
        title.textContent = `H${item.tier} · ${LABELS[item.tier]}`;
        const cost = document.createElement("span");
        cost.className = "ux-hint-cost";
        cost.textContent = item.used ? "追加減点なし" : `−${item.cost}点`;
        const reason = document.createElement("p");
        reason.id = `uxHintReason${item.tier}`;
        reason.textContent = hintReason(item, s);
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.uxTier = String(item.tier);
        button.disabled = !(item.used || item.allowed) || s.busy;
        button.setAttribute("aria-describedby", reason.id);
        button.textContent = item.used ? "読み直す" : item.allowed ? "内容と減点を確認" : "未解放";
        row.append(title, cost, reason, button);
        list.append(row);
      }
    }
    function readPurchased(tier) {
      const item = getHint(tier);
      if (!item?.used) return false;
      const text = hooks.getPurchasedHint(tier);
      if (typeof text !== "string") return false;
      readingTier = tier;
      pending = null;
      $("uxHintConfirm").hidden = true;
      $("uxHintReading").hidden = false;
      setText("uxReadingTitle", `H${tier} · ${LABELS[tier]} / 取得済み`);
      setText("uxReadingText", text);
      $("uxHintReading").scrollIntoView({ block: "start" });
      $("uxHintReading").focus({ preventScroll: true });
      return true;
    }
    function selectHint(tier) {
      const item = getHint(tier);
      if (!item || current().busy) return;
      if (item.used) { readPurchased(tier); return; }
      if (!item.allowed) { renderHints(); return; }
      readingTier = null;
      pending = { tier, fingerprint: fingerprint() };
      $("uxHintReading").hidden = true;
      $("uxHintConfirm").hidden = false;
      setText("uxConfirmTitle", `H${tier}「${LABELS[tier]}」を開きますか？`);
      setText("uxConfirmText", `現在ステージのスコアから${item.cost}点を差し引きます。取得後はこの画面と任務タブで何度でも読み直せます。`);
      setText("uxConfirmButton", `${item.cost}点を使って開く`);
      $("uxHintConfirm").scrollIntoView({ block: "nearest" });
      $("uxConfirmButton").focus({ preventScroll: true });
    }
    function confirmHint() {
      const request = pending;
      if (!request) return;
      const item = getHint(request.tier);
      if (request.fingerprint !== fingerprint() || current().busy || !item?.allowed) {
        pending = null;
        $("uxHintConfirm").hidden = true;
        renderHints();
        return;
      }
      // Clear before entering game code: rapid taps cannot charge twice.
      pending = null;
      const purchased = hooks.purchaseHint(request.tier);
      renderHints();
      if (purchased) readPurchased(request.tier);
      else $("uxHintConfirm").hidden = true;
    }
    function applyExpanded() {
      const on = expanded && activeView === "node";
      $("appShell").classList.toggle("node-reading", on);
      document.querySelectorAll('[data-ux-action="expand"]').forEach(button => {
        button.setAttribute("aria-expanded", String(on));
        button.textContent = on ? "通常表示へ" : "会話を拡大";
      });
    }
    function navigate(view, focusId) {
      closeAll(false);
      hooks.navigate(view, focusId);
    }
    document.addEventListener("click", event => {
      const tierButton = event.target.closest("[data-ux-tier]");
      if (tierButton) { selectHint(Number(tierButton.dataset.uxTier)); return; }
      const button = event.target.closest("[data-ux-action]");
      if (!button) return;
      switch (button.dataset.uxAction) {
        case "guide": openGuide(); break;
        case "hints": openHints(); break;
        case "close": closeAll(); break;
        case "cancel-hint": pending = null; $("uxHintConfirm").hidden = true; break;
        case "confirm-hint": confirmHint(); break;
        case "console": navigate("console"); break;
        case "mission": navigate("mission"); break;
        case "defense": navigate("intel", "defenseBlock"); break;
        case "observe": closeAll(false); hooks.observe(); break;
        case "expand": expanded = !expanded; applyExpanded(); break;
        case "done": hooks.dismissKeyboard(); break;
      }
    });
    [guide, hints].forEach(dialog => {
      dialog.addEventListener("cancel", event => { event.preventDefault(); closeAll(); });
      dialog.addEventListener("close", () => { pending = null; });
    });
    function refresh() {
      renderGuide();
      if (hints.open) {
        renderHints();
        if (pending && pending.fingerprint !== fingerprint()) {
          pending = null; $("uxHintConfirm").hidden = true;
        }
        if (readingTier && !getHint(readingTier)?.used) {
          readingTier = null; $("uxHintReading").hidden = true;
          setText("uxReadingText", "");
        }
      }
    }
    refresh();
    return Object.freeze({
      refresh, openGuide, openHints,
      isOpen: () => guide.open || hints.open,
      onViewChange: view => { activeView = view; applyExpanded(); },
      recommendHint: tier => {
        const button = $("nodeHintsButton");
        if (button) { button.textContent = `H${tier}の利用条件を確認`; button.classList.add("recommended"); }
      }
    });
  }
  window.PIHUX = Object.freeze({ create });
})();
