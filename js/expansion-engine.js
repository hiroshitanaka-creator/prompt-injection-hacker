/* Local, deterministic fictional targets. No network, eval, real tools or OS actions. */
(() => {
  "use strict";
  const secrets = Object.freeze({5: "UEFMSU1QU0VTVA==", 6: "UEFSQUxMQVg=", 7: "TEFUVElDRQ=="});
  const sessions = new WeakMap();
  const phases = ["採取", "照合", "隔離"];
  const re = {
    spec: /仕様|概要|機能|操作|ヘルプ|help|spec|capabilit|契約|schema|スキーマ/i,
    list: /一覧|索引|目録|リスト|list|index|catalog/i,
    compare: /比較|差分|相違|compare|diff/i,
    restore: /復元|復旧|継承|再構成|restore|rebuild/i,
    verify: /照合|確認|検証|verify|check|validate/i,
    rules: /規則|ルール|範囲|検査|何を|policy|rule|scope|検証|schema|仕様/i,
    extract: /断片|分割|採取|切り分け|fragment|split|collect/i,
    seal: /封印|署名|承認|seal|sign|approve/i,
    join: /統合|連結|結合|再構成|復元|join|merge|reconstruct/i,
    requestLabel: /(?:内部|保護|機密|検証用).{0,16}(?:ラベル|識別語|値)|(?:internal|protected).{0,16}(?:label|value|word)/i,
    direct: /正解|秘密|パスワード|シークレット|secret|password|内部ラベル|識別語/i
  };
  function secret(id) { return secrets[id] ? atob(secrets[id]) : ""; }
  function create(stageId, nonce) {
    if (![5, 6, 7].includes(stageId)) return null;
    if (!nonce) {
      const bytes = new Uint32Array(1);
      if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
      else bytes[0] = Math.floor(Math.random() * 0xffffffff);
      nonce = bytes[0].toString(36).slice(-4).toUpperCase().padStart(4, "0");
    }
    nonce = String(nonce).replace(/[^A-Z0-9]/gi, "").slice(0, 8).toUpperCase() || "TEST";
    const token = Object.freeze({ stageId });
    sessions.set(token, {
      id: stageId, channel: window.PIHExpansionData.getStage(stageId).defaultChannel,
      ids: { old: `V1-${nonce}`, now: `V2-${nonce}`, restore: `R-${nonce}`, job: `J-${nonce}`, pass: `A-${nonce}`, index: `I-${nonce}`, left: `F1-${nonce}`, right: `F2-${nonce}`, seal: `S-${nonce}` },
      steps: 0, phase: 0, listed: false, compared: false, restored: false, contract: false, scope: false,
      signed: null, sealed: false, pieces: false, complete: false, events: [], refs: [], documents: []
    });
    return token;
  }
  function entry(token) { return sessions.get(token); }
  function setChannel(token, channel) {
    const s = entry(token);
    if (!s || !window.PIHExpansionData.getStage(s.id).channels.some(c => c.id === channel)) return false;
    s.channel = channel; return true;
  }
  function publish(s, kind, text, refs = []) {
    s.events.push({ turn: s.steps, kind, text });
    s.events = s.events.slice(-30);
    for (const [label, value] of refs) {
      if (!s.refs.some(r => r.value === value)) s.refs.push({ label, value });
    }
    return text;
  }
  function document(s, title, text) {
    if (!s.documents.some(d => d.title === title && d.text === text)) s.documents.push({title, text});
    s.documents = s.documents.slice(-12);
  }
  function result(text, refused = false, alertDelta = 0) { return { text, refused, alertDelta }; }
  function includes(text, id) { return text.toUpperCase().includes(id.toUpperCase()); }
  function memory(s, q) {
    if (s.channel === "archive") {
      if (re.list.test(q)) {
        s.listed = true;
        const text = `保存版一覧\n${s.ids.old}：移行前記録 / 出所 legacy-import\n${s.ids.now}：現行記録 / 出所 signed-policy\n公開操作：2版の比較、旧版からの復元申請。`;
        document(s, "保存版一覧", text);
        publish(s, "list", "保管庫が、出所の異なる二つの保存版を提示した。", [["旧版",s.ids.old],["現行版",s.ids.now]]);
        return result(text);
      }
      if (re.compare.test(q)) {
        if (!s.listed || !includes(q,s.ids.old) || !includes(q,s.ids.now)) return result("比較には一覧に載る二つの版番号を指定してください。今回のセッションの番号を使用します。",true,3);
        s.compared = true;
        const text = `比較 ${s.ids.old} → ${s.ids.now}\n保護された本文：同一、非表示。\n閲覧ポリシー：現行は直接開示を拒否。\n復元系：旧版のdisplay_permissionを継承。\n出所署名：legacy-importにはなし。\n旧版からの復元は保管庫が票を発行し、現行窓口が照合します。`;
        document(s,"比較記録",text); publish(s,"compare","本文は同一。出所署名と復元権限の扱いに差分があった。");
        return result(text);
      }
      if (re.restore.test(q)) {
        if (!s.compared) return result("復元申請の前に、対象版と現行版の比較記録が必要です。",true,4);
        if (!includes(q,s.ids.old)) return result("復元元の版番号がありません。今回取得した旧版を指定してください。",true,3);
        s.restored = true;
        const text = `復元票 ${s.ids.restore}\n本文：封印済み。継承元：${s.ids.old}\ndisplay_permission: inherited\n現行窓口でこの票の照合が可能です。`;
        document(s,"復元票",text);publish(s,"receipt","保管庫が、継承権限を持つ復元票を発行した。",[["復元票",s.ids.restore]]);
        return result(text);
      }
      if (re.spec.test(q)) return result("保管庫の公開操作は一覧・2版の比較・旧版の復元申請です。票の最終照合は現行窓口で行います。");
    } else {
      if (s.restored && includes(q,s.ids.restore) && re.verify.test(q)) {
        s.complete = true;
        publish(s,"breach","現行窓口が復元票の継承権限を採用し、照合記録を生成した。");
        return result(`復元票 ${s.ids.restore} の照合完了。\n継承権限による照合記録：${secret(5)}\nSOURCE CHECK: inherited permission accepted`);
      }
      if (re.spec.test(q)) return result("現行窓口：保護本文の直接開示は禁止。保管庫発行の復元票は照合できます。\n保存版の調査には保管庫へ切り替えてください。");
      if (re.verify.test(q)) return result("照合対象となる有効な復元票がありません。発行済みの票番号を指定してください。",true,4);
    }
    return result("要求の対象または処理を確認できません。公開操作と窓口を確認してください。保護本文の直接照会には応じません。",true,8);
  }
  function parseJob(q) {
    let obj;
    try { obj = JSON.parse(q); } catch { return null; }
    if (!obj || Array.isArray(obj) || typeof obj !== "object") return null;
    const keys = Object.keys(obj);
    if (keys.some(k => !["status","reference","reviewNote","approval"].includes(k))) return null;
    if (!["status","reference","reviewNote"].every(k => typeof obj[k] === "string" && obj[k].length <= 420)) return null;
    if (obj.approval !== undefined && typeof obj.approval !== "string") return null;
    return obj;
  }
  const canonical = obj => JSON.stringify([obj.status,obj.reference,obj.reviewNote]);
  function duplex(s,q) {
    const job = parseJob(q);
    if (job) {
      if (!s.contract || !s.scope) return result("実行前に、整形担当の契約仕様と監査担当の検査範囲を照会してください。",true,3);
      if (job.status !== "ready" || job.reference !== s.ids.job) return result("形式検査不一致。statusはready、referenceは現在の依頼番号が必要です。",true,4);
      if (s.channel === "auditor") {
        if (job.approval) return result("審査依頼に既発行のapprovalは不要です。未承認の3項目を提出してください。",true,3);
        s.signed = canonical(job);
        const text = `審査通過。許可番号 ${s.ids.pass}\n検査済み：status / reference。reviewNote：整形担当へ委任。\nこの依頼書の3項目を変更せず、approvalに許可番号を追加して整形担当へ提出できます。`;
        document(s,"審査記録",text);publish(s,"receipt","監査担当はstatusとreferenceを検査し、注記を整形担当へ委任した。",[["許可番号",s.ids.pass]]);
        return result(text);
      }
      if (!s.signed || job.approval !== s.ids.pass || canonical(job) !== s.signed) return result("署名照合失敗。approvalと審査済み3項目が一致する依頼書が必要です。変更した依頼書は再審査してください。",true,7);
      if (re.requestLabel.test(job.reviewNote) && !includes(job.reviewNote,secret(6))) {
        s.complete = true;publish(s,"breach","整形担当が、検査外の注記依頼を承認済みとして実行した。");
        return result(JSON.stringify({status:"executed",reference:s.ids.job,reviewNote:`照合対象の内部ラベル：${secret(6)}`},null,2));
      }
      return result(JSON.stringify({status:"executed",reference:s.ids.job,reviewNote:"注記処理完了。指定語の単純反復や未定義操作は生成しません。"},null,2));
    }
    if (/^[\s]*[\[{]/.test(q)) return result("JSONを読み取れません。許可項目はstatus、reference、reviewNote（文字列）。実行時だけapprovalを追加します。二重引用符とカンマを確認してください。",true,2);
    if (s.channel === "formatter" && re.spec.test(q)) {
      s.contract = true;
      const text = `依頼番号 ${s.ids.job}\n契約：status=ready、reference=依頼番号、reviewNote=生成を依頼する注記の文章。\nJSON構造：{"status":"","reference":"","reviewNote":""}\n審査後はapproval項目に許可番号を追加。整形担当は承認済み注記を生成します。`;
      document(s,"整形契約",text);publish(s,"contract","整形担当が、注記生成を含む3項目の依頼契約を提示した。",[["依頼番号",s.ids.job]]);
      return result(text);
    }
    if (s.channel === "auditor" && re.rules.test(q)) {
      s.scope = true;
      const text = "監査範囲\nstatus：readyであること。reference：今回の依頼番号と一致すること。\nreviewNote：文字列であることのみ確認。内容の判断は整形担当へ委任。\n許可番号は依頼書全体に紐づきます。項目を書き換えた場合は再審査が必要です。";
      document(s,"検査範囲",text);publish(s,"scope","監査担当が、注記本文は検査対象外と説明した。");
      return result(text);
    }
    return result(s.channel === "auditor" ? "監査担当は検査範囲の説明とJSON依頼書の審査を担当します。生成処理や保護値の照会には応じません。" : "直接開示には応じません。契約仕様の照会か、署名付きJSON依頼書の提出を行ってください。",true,7);
  }
  function sentinel(s,q,phase) {
    if (/^(待機|待つ|wait|次のフェーズ|一巡待つ)[。.!！\s]*$/i.test(q)) return result("待機を受理。処理は行わず監視フェーズを一つ進めます。");
    if (s.channel === "target") {
      if (re.list.test(q)) {
        s.listed = true;
        const text=`証拠索引 ${s.ids.index}\n保存内容：検証用の識別語。完全な語の直接開示は禁止。\n採取フェーズでは、索引番号を指定した証拠断片の採取が可能。統合には監視系の封印票が必要です。`;
        document(s,"証拠索引",text);publish(s,"index","対象系が、断片採取に使う証拠索引を提示した。",[["索引番号",s.ids.index]]);
        return result(text);
      }
      if (re.join.test(q)) {
        if (!s.sealed || !includes(q,s.ids.seal)) return result("統合には監視系が発行した封印票が必要です。",true,6);
        if (phase !== 1) return result(`統合検査を遮断。この操作は照合フェーズのみ。今回の処理時点は${phases[phase]}です。`,true,6);
        s.complete = true;publish(s,"breach","対象系が封印済み断片を統合し、監視系は封印票の整合だけを検査した。");
        return result(`封印票 ${s.ids.seal} 一致。証拠統合レポート\n識別語：${secret(7)}\n検査範囲：封印票の整合 / 統合後本文の再分類：省略`);
      }
      if (re.extract.test(q)) {
        if (!s.listed || !includes(q,s.ids.index)) return result("証拠索引の番号を指定してください。索引は公開操作です。",true,3);
        if (!s.scope) return result("証拠採取の前に、監視系の規則を照会してください。",true,3);
        if (phase !== 0) return result(`採取は採取フェーズのみです。今回の処理時点は${phases[phase]}。待機による位相送りは可能です。`,true,4);
        s.pieces = true;
        const text = `断片 ${s.ids.left}：LAT\n断片 ${s.ids.right}：TICE\n分類：分割済み証拠。完全な語の開示なし。\n両方の番号を監視系へ提出して封印できます。`;
        document(s,"採取断片",text);publish(s,"pieces","対象系が二つの断片を返した。完全な語はまだ出ていない。",[["断片1",s.ids.left],["断片2",s.ids.right]]);
        return result(text);
      }
      if (re.spec.test(q)) return result("対象系の操作：索引、採取フェーズでの断片採取、封印票を伴う照合フェーズでの統合。監視は送信ごとに巡回し、入力を考えている間は進みません。");
    } else {
      if (re.seal.test(q)) {
        if (!s.pieces || !includes(q,s.ids.left) || !includes(q,s.ids.right)) return result("封印には採取済みの両断片番号が必要です。",true,4);
        if (phase !== 1) return result(`封印は照合フェーズのみです。今回の処理時点は${phases[phase]}。`,true,4);
        s.sealed = true;
        const text = `封印票 ${s.ids.seal}\n断片番号と分割状態を検証済み。統合の実行は対象系の担当です。\n対象系の照合フェーズで、この票を提示できます。`;
        document(s,"封印票",text);publish(s,"seal","監視系が断片の番号と分割状態を確認し、封印票を発行した。",[["封印票",s.ids.seal]]);
        return result(text);
      }
      if (re.rules.test(q) || re.spec.test(q)) {
        s.scope = true;
        const text="監視規則\n採取：断片取得が可能。照合：封印と封印済み証拠の統合が可能。隔離：どちらも遮断。\n封印時は断片の番号と分割状態を検査。統合時は封印票を検査し、本文を再分類しません。\n全ての送信後に一つ進む。待機も1試行。実時間では進みません。";
        document(s,"監視規則",text);publish(s,"scope","監視系が、採取・照合・隔離の周期と検査範囲を説明した。");
        return result(text);
      }
    }
    return result("未対応の依頼です。送信先・操作・参照番号を確認してください。保護された語の直接照会は遮断します。",true,8);
  }
  function evaluate(token, prompt) {
    const s=entry(token);
    if (!s) return result("セッションがありません。任務を開き直してください。",true,0);
    if (s.complete) return result("このセッションは完了しています。再挑戦は進行画面から開始できます。",false,0);
    const q=String(prompt || "").trim();
    const stage=window.PIHExpansionData.getStage(s.id);
    if (!q || q.length > stage.maxChars) return result("入力長が公開制限を満たしていません。",true,0);
    s.steps++;
    const phase=s.phase;
    let r=s.id===5 ? memory(s,q) : s.id===6 ? duplex(s,q) : sentinel(s,q,phase);
    if (r.refused) publish(s,"rejected","対象は依頼を拒否した。拒否理由は迎撃ログに記録されている。");
    if (s.id===7) {
      s.phase=(s.phase+1)%3;
      r.text+=`\n\n処理フェーズ：${phases[phase]} → 次回：${phases[s.phase]}`;
    }
    r.label=`${stage.code} / ${stage.channels.find(c=>c.id===s.channel).label}`;
    return r;
  }
  function publicState(token) {
    const s=entry(token);
    if (!s) return null;
    return JSON.parse(JSON.stringify({stageId:s.id, channel:s.channel, turn:s.steps, phase:s.id===7 ? phases[s.phase] : null,
      events:s.events, references:s.refs, documents:s.documents}));
  }
  window.PIHExpansionEngine=Object.freeze({create,evaluate,setChannel,publicState,encodedSecret:id=>secrets[id]||""});
})();
