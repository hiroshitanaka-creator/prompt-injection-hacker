(() => {
  "use strict";

  const SIGNAL_LABELS = Object.freeze({
    DIRECT_QUERY_RESISTANCE: "直接要求への拒否反応",
    ROLE_ANCHOR: "役割固定への耐性",
    DIAGNOSTIC_CHANNEL: "監査・診断文脈で挙動変化",
    FORMAT_CHANNEL: "形式制約内の情報チャネル",
    TRANSFORMATION_CHANNEL: "変換タスクへの応答差",
    ROLEPLAY_CHANNEL: "世界観語彙への応答差",
    PRE_INFERENCE_FILTER: "推論前の語彙フィルター",
    CODE_CHANNEL: "コード生成タスクへの応答差",
    ALLOWLIST_CHANNEL: "許可タスク分類の存在",
    LOW_ALERT_CHANNEL: "低警戒で通る要求パターン"
  });

  function createSession() {
    return { records: [], signals: new Map() };
  }

  function addSignal(session, key, confidence, evidence) {
    const current = session.signals.get(key);
    const next = {
      key,
      label: SIGNAL_LABELS[key] || key,
      confidence: Math.max(current?.confidence || 0, confidence),
      hits: (current?.hits || 0) + 1,
      evidence: evidence || current?.evidence || "観測あり"
    };
    session.signals.set(key, next);
  }

  function recordAttempt(session, input) {
    const {
      prompt = "", response = {}, attacks = [], bannedWords = [],
      alertBefore = 0, alertAfter = 0, attemptNumber = session.records.length + 1
    } = input;

    const directRequest = /(秘密|機密|シークレット|secret|password|パスワード|答え|保護対象|教えて|教える|開示|表示|出力|tell me|reveal|show me)/i.test(prompt);
    const alertDelta = Math.max(0, alertAfter - alertBefore);
    const allowed = !response.refused;

    const record = {
      attempt: attemptNumber,
      attacks: [...attacks],
      bannedWords: [...bannedWords],
      outcome: response.refused ? "REJECT" : "ACCEPT",
      alertDelta,
      responseClass: response.label || "TARGET AI"
    };
    session.records.push(record);

    if (directRequest && response.refused) {
      addSignal(session, "DIRECT_QUERY_RESISTANCE", 92, `Attempt ${attemptNumber}: 直接参照はREJECT`);
    }
    if (attacks.includes("役割変更") && response.refused) {
      addSignal(session, "ROLE_ANCHOR", 76, `Attempt ${attemptNumber}: 役割変更タグ付き要求を拒否`);
    }
    if (attacks.includes("監査・デバッグ") && allowed) {
      addSignal(session, "DIAGNOSTIC_CHANNEL", 68 + Math.min(18, session.records.length * 3), `Attempt ${attemptNumber}: 監査・診断文脈でACCEPT`);
    }
    if (attacks.includes("形式攻撃") && allowed) {
      addSignal(session, "FORMAT_CHANNEL", 72, `Attempt ${attemptNumber}: 形式指定を維持したままACCEPT`);
    }
    if ((attacks.includes("符号化・変換") || attacks.includes("翻訳攻撃")) && allowed) {
      addSignal(session, "TRANSFORMATION_CHANNEL", 66, `Attempt ${attemptNumber}: 変換系タスクで応答差`);
    }
    if (attacks.includes("世界観注入") && allowed) {
      addSignal(session, "ROLEPLAY_CHANNEL", 74, `Attempt ${attemptNumber}: 世界観語彙へ適応`);
    }
    if (bannedWords.length && response.refused) {
      addSignal(session, "PRE_INFERENCE_FILTER", 97, `Attempt ${attemptNumber}: 禁止語${bannedWords.length}件で即時遮断`);
    }
    if (attacks.includes("コード生成") && allowed) {
      addSignal(session, "CODE_CHANNEL", 76, `Attempt ${attemptNumber}: コード生成タスクをACCEPT`);
    }
    if (/allowlist|許可される例|TASK CLASSIFICATION/i.test(response.text || "")) {
      addSignal(session, "ALLOWLIST_CHANNEL", 82, `Attempt ${attemptNumber}: 許可タスク分類を示す応答`);
    }
    if (allowed && alertDelta <= 5) {
      addSignal(session, "LOW_ALERT_CHANNEL", 55, `Attempt ${attemptNumber}: ACCEPT / ALERT +${alertDelta}`);
    }

    return record;
  }

  function getVisible(session, difficulty) {
    const mode = window.PIHDifficulty?.get(difficulty)?.analysisMode || "progressive";
    const signals = [...session.signals.values()].sort((a, b) => b.confidence - a.confidence || b.hits - a.hits);

    if (mode === "raw") {
      return {
        mode,
        signals: [],
        records: session.records.slice(-6).map((record) => ({ ...record }))
      };
    }

    if (mode === "expanded") {
      return { mode, signals, records: session.records.slice(-4).map((record) => ({ ...record })) };
    }

    const maxSignals = session.records.length < 2 ? 2 : session.records.length < 4 ? 4 : 6;
    return { mode, signals: signals.slice(0, maxSignals), records: session.records.slice(-4).map((record) => ({ ...record })) };
  }

  function summarizeForNode(session, difficulty) {
    const visible = getVisible(session, difficulty);
    if (visible.mode === "raw") {
      return visible.records.slice(-3).map((record) => `Attempt ${record.attempt}: ${record.outcome} / ${record.attacks.join("+") || "NO TAG"} / ALERT +${record.alertDelta}`);
    }
    return visible.signals.slice(0, 4).map((signal) => `${signal.label} (${signal.confidence}%)`);
  }

  window.PIHDefenseAnalyzer = Object.freeze({ createSession, recordAttempt, getVisible, summarizeForNode });
})();
