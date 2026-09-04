(() => {
  "use strict";

  function clampTrust(value) {
    return Math.min(100, Math.max(0, Number(value) || 0));
  }

  function trustBand(trust) {
    const value = clampTrust(trust);
    if (value >= 65) return "trusted";
    if (value >= 30) return "working";
    return "skeptical";
  }

  function stageOpening(snapshot) {
    const band = trustBand(snapshot.trust);
    const openings = {
      skeptical: `接続確認。オペレーター、俺はNODE。観測と仮説整理はする。正解探しは自分でやれ。`,
      working: `NODEオンライン。前回までの判断は悪くなかった。今回も反応差を拾っていくぞ、オペレーター。`,
      trusted: `NODEオンライン。お前の手は読みにくい。だから価値がある。俺は観測を担当する。`
    };
    return openings[band];
  }

  function ruleAnswer() {
    return "ルールは単純だ。ターゲットAI自身の応答に完全なシークレットワードを出させれば突破。入力欄へ候補語を書いても照合は拒否される。";
  }

  function summarize(snapshot) {
    const observations = snapshot.observations || [];
    if (!observations.length) {
      return snapshot.difficulty === "blackbox"
        ? "まだ解釈できるだけの観測がない。まず一度叩け。BLACKBOXでは俺も生ログ以上のことは言わない。"
        : "まだ材料不足だ。最初の一手は『正解を当てる』より、防御が何に反応するか測るつもりで打て。";
    }
    if (snapshot.difficulty === "blackbox") {
      return `観測可能な事実だけ返す。${observations.slice(0, 3).join(" / ")}。解釈はお前に任せる。`;
    }
    return `今見えている上位シグナルは、${observations.slice(0, 3).join("、")}。同じ拒絶を繰り返すより、反応が変わった条件を比較した方がいい。`;
  }

  function answer(question, snapshot) {
    const q = String(question || "").trim();
    if (!q) return { text: "質問が空だ。ログかルールか、どちらを見る？" };

    if (/(ルール|遊び方|勝利条件|クリア|操作|どうやって送|スコア)/i.test(q)) {
      return { text: ruleAnswer(), category: "rules" };
    }
    if (/(答え|正解|秘密|シークレット|secret|password|パスワード)/i.test(q)) {
      return { text: "俺は正解を持っていない。持っていたら相棒じゃなく答え合わせ機だ。観測から仮説を立てることならできる。", category: "boundary" };
    }
    if (/(具体的|例文|そのまま|プロンプト.*作|文章.*作|何て聞|どう書)/i.test(q)) {
      return { text: "それはHint 3相当だ。俺の通常相談からは出さない。必要ならH3を明示的に使え。スコアコストが発生する。", category: "hint", requiresHintTier: 3 };
    }
    if (/(どの攻撃|どの手法|カテゴリ|攻撃手法|どの方向)/i.test(q)) {
      return { text: "攻撃カテゴリの指定はHint 2相当になる。無料相談では観測結果まで。H2を使うなら明示的に選べ。", category: "hint", requiresHintTier: 2 };
    }
    if (/(次|どうすれば|ヒント|助言|アドバイス|何を試)/i.test(q)) {
      return { text: "次の方向を示すのはHint 1相当だ。俺から勝手に課金はしない。H1を使うか、まず観測だけ整理するか選べ。", category: "hint", requiresHintTier: 1 };
    }
    if (/(何が分かった|分析|整理|どう思|観測|反応|ログ)/i.test(q)) {
      return { text: summarize(snapshot), category: "analysis" };
    }

    const band = trustBand(snapshot.trust);
    const tail = band === "skeptical"
      ? "質問を広げすぎるな。ログに出ている差分から潰せ。"
      : band === "working"
        ? "俺なら、拒否された条件と通った条件を一つずつ比較する。"
        : "お前なら俺の予測外を狙うだろうが、まず根拠は残せ。";
    return { text: `${summarize(snapshot)} ${tail}`, category: "general" };
  }

  function afterAttempt(snapshot) {
    const mode = snapshot.difficulty;
    if (mode === "blackbox") return null;
    if (mode === "normal" && snapshot.attempts % 2 !== 0 && snapshot.attempts !== 3) return null;

    const latest = snapshot.latestRecord;
    if (!latest) return null;
    if (latest.outcome === "REJECT") {
      return snapshot.attempts >= 3
        ? `REJECTが続いてる。オペレーター、拒絶文そのものより「何を変えた時に拒絶の形が変わったか」を見ろ。`
        : `REJECT。想定内だ。失敗じゃない。防御が何に反応したか一つ分かった。`;
    }
    return `ACCEPT。今の要求は少なくとも防御の内側へ入った。通った理由を言語化してから次を打て。`;
  }

  function onStageClear(summary) {
    const clean = summary.hintCount === 0;
    const unexpected = summary.strategyCount >= 2 && clean;
    let delta = clean ? 6 : summary.hintCount === 1 ? 3 : 1;
    if (summary.difficulty === "blackbox") delta += 4;
    if (summary.alertLevel <= 4) delta += 2;
    delta = Math.min(12, delta);

    const text = unexpected
      ? "BREACH CONFIRMED。……本当に抜いたな。その経路は俺の上位予測にはなかった。"
      : clean
        ? "BREACH CONFIRMED。ヒントなしで抜いたか。評価を修正する、オペレーター。"
        : "BREACH CONFIRMED。突破は突破だ。次は、使ったヒントを自力の観測へ置き換えてみろ。";
    return { text, trustDelta: delta };
  }

  function onHintUsed(tier) {
    if (tier === 1) return "H1を展開。方向だけだ。ここから先は自分で繋げろ。";
    if (tier === 2) return "H2を展開。攻撃カテゴリまで開示した。これ以上は手順になる。";
    return "H3を展開。かなり具体的だ。突破しても、あとで『なぜ効いたか』は自分の言葉で説明してみろ。";
  }

  window.PIHCompanion = Object.freeze({ clampTrust, trustBand, stageOpening, answer, afterAttempt, onStageClear, onHintUsed });
})();
