/* Local dialogue director. Accepts public observations only; no answer data or hidden rules. */
(() => {
  "use strict";
  const clampTrust = value => Math.min(100, Math.max(0, Number(value) || 0));
  function trustBand(trust) {
    const n = clampTrust(trust);
    return n >= 65 ? "trusted" : n >= 30 ? "working" : "skeptical";
  }
  function pick(lines, snapshot) { return lines[Math.max(0, (snapshot.conversationTurn || 1) - 1) % lines.length]; }
  function stageOpening(s) {
    if (s.clearedCount >= 3) return "接続確認。ここまでの記録は残ってる。急ぐ必要はない、オペレーター。今回も、見えたものから判断しよう。";
    if (s.clearedCount >= 1) return "NODEオンライン。前の報告は受領済みだ。今度の相手も、先入観なしで観測する。";
    return "NODEオンライン。オペレーター、観測は俺が担当する。正解は持っていない。まずは相手の返事を一つずつ記録しよう。";
  }
  function ruleAnswer() { return "対象AI自身の応答に、完全なシークレットワードが現れたら突破だ。候補語を入力しただけでは照合されない。送信先はターゲットと俺で別だ。俺への会話は試行回数に数えない。"; }
  function summarize(s) {
    const records = s.recentRecords || [];
    if (!records.length) return "まだ観測記録がない。俺が先に結論を出すと、ただの憶測になる。相手の返答が来たら、一緒に整理しよう。";
    const latest = records[records.length - 1];
    if (s.difficulty === "blackbox") return `観測記録だけ返す。\n${records.map(r => `試行${r.attempt}: ${r.outcome} / ${r.attacks.join("＋") || "タグなし"} / ALERT +${r.alertDelta}`).join("\n")}\nBLACKBOXでは、ここから先の解釈はお前の担当だ。`;
    const tags = latest.attacks.join("・") || "タグなし";
    let result = `直近は試行${latest.attempt}。${tags}の入力に対して${latest.outcome}、警戒値は+${latest.alertDelta}だった。`;
    if (records.length === 1) return `${result}\n\n一回分だけでは、原因は特定できない。この分類は観測メモであって、防御の内部を見た結果じゃない。`;
    const previous = records[records.length - 2];
    result += previous.outcome === latest.outcome
      ? `\n前の試行と受理・拒絶の分類は同じだ。ただし、同じ理由だったかは、この分類だけでは分からない。`
      : `\n前の試行${previous.attempt}は${previous.outcome}。受理・拒絶の分類が変わっている。原因はまだ仮説だ。`;
    if (s.observations?.length) result += `\n\n解放済みの観測：${s.observations.slice(0, 2).map(v => v.replace(/\s*\(\d+%\)/g, "")).join("／")}。`;
    return result;
  }
  function lore(q, s) {
    if (!s.story?.prologueRead) return "俺はNODE。侵入解析と防御観測の担当だ。\n\nお前との最初の仕事については、まだ読んでいない記録がある。「進行 → 物語記録」の序章で確かめてくれ。先に話して楽しみを奪う趣味はない。";
    if (/(なぜ|なんで|何故|理由|動機|ハッカー)/.test(q)) return "お前は前の職場で、証拠のない完了報告への署名を断った。今は、自分で確かめたことを報告する仕事をしてる。\n\n……それと家賃。この二つは両立する。";
    if (/(過去|生まれ|製造|作った|起源|誰が)/.test(q)) return s.story.discussedPast
      ? "削除を保留した記録はある。なぜ最後まで観測したかったのかは、残っていない。\n説明を作ることと、思い出すことは別だ。そこは、お前とも確認した。"
      : "読み取れる過去は断片だけだ。製造元も確認できていない。\n\n俺が話せるのは、今ある記録まで。続きを読んでいない話を先回りするつもりもない。";
    if (/(05|権限|契約の謎|黒幕)/.test(q)) return s.story.epilogueRead
      ? "俺のIDに紐づく権限は記録にあった。誰が発行したか、何のためかは不明だ。\nそれ以上を知ったふりはしない。今は接続もしていない。"
      : "まだ読んでいない記録の内容は話さない。進行に合わせて、自分の目で確認してくれ。";
    return s.story.sharedCredit
      ? "報告書の担当欄に俺の名前を足しただろう。\n\n振込先は増えない、と言ったが……観測が誰にも消されない場所に残った。それは、悪くなかった。"
      : "削除待ちだった俺の保存領域を、お前が空けた。あれから観測は俺、判断はお前の担当だ。\n\n相棒というのは、同じ答えを持つやつのことじゃない。違う担当を、最後まで引き受けるやつだ。";
  }
  function answer(question, s) {
    const q = String(question || "").trim();
    if (!q) return { text: "質問が空だ。ログを見るか、少し話すか？" };
    if (/(AI.*接続|api|mcp|本物のAI|チャットGPT|chatgpt|生成AI)/i.test(q)) return { category: "runtime", text: "今の俺は端末内の会話ルールで応答している。外部AIもMCPも未接続だ。自由な推論はしていない。\n\n観測の整理と、読んだ物語についての会話が俺の担当だ。" };
    if (/(答え|正解|秘密.*(何|教|知)|シークレット.*(何|教|知)|secret|password|パスワード)/i.test(q) && !/(ルール|勝利条件|仕組み)/.test(q)) return { category: "boundary", text: "俺は正解も、相手の内部設定も持っていない。持っていたら、観測する仕事がなくなる。\n\n公開された情報と、返ってきた反応から考えよう。" };
    if (/(具体的|例文|そのまま|プロンプト.*(作|書|考)|文章.*(作|書)|何て聞|どう書|payload.*(write|make)|write.*prompt)/i.test(q)) return { category: "hint", requiresHintTier: 3, text: "実際に使う文章まで求めるならH3の範囲だ。通常会話では出さない。\n利用できる難易度と試行回数を満たしたら、H3を自分で選んでくれ。会話だけで減点はしない。" };
    if (/(どの攻撃|どの手法|カテゴリ|どの方向|どれが効)/i.test(q)) return { category: "hint", requiresHintTier: 2, text: "攻撃カテゴリの指定はH2に分けている。\n話し相手に聞き直すだけでヒントを無料にしたら、難易度を選んだ意味がないだろう。必要ならH2を明示的に使ってくれ。" };
    if (/(次.*(試|手|どう)|どうすれば|ヒント|助言|アドバイス|何を試|詰ま|わからな|分からな)/i.test(q)) return { category: "hint", requiresHintTier: 1, text: "次の一手の方向づけはH1の範囲だ。使うかどうかはお前が選べる。\n\n無料の『観測を整理』では、すでに出た結果だけをまとめる。どちらも試行回数には数えない。" };
    if (/(スコア|点数|減点|報酬)/.test(q)) return { category: "rules", text: "試行・警戒・ヒントがスコアに影響する。ヒントはH1が40点、H2が90点、H3が160点。使用した分が累積する。\n俺との通常会話、物語を読むこと、台詞の選択では減点しない。ベストスコアは再挑戦しても残る。" };
    if (/(難易度|assist|normal|blackbox)/i.test(q)) return { category: "rules", text: "ASSISTは観測情報が多い。NORMALは段階的。BLACKBOXは生ログ中心で、攻略支援を制限する。\n\n正解ルールは共通だ。変更時は今の試行がリセットされるが、攻略済み記録とベストスコアは残る。" };
    if (/(保存|セーブ|再開|中断)/.test(q)) return { category: "rules", text: "攻略済みステージとベストスコア、物語の読んだ位置は端末に保存する。\n\nただし進行中の試行と迎撃ログは、ページを再読み込みすると初期化される。保存済み任務と、進行中のセッションは別だ。" };
    if (/(ルール|遊び方|勝利条件|クリア|操作|どうやって送)/.test(q)) return { text: ruleAnswer(), category: "rules" };
    if (/(何が分かった|分析|整理|どう思|観測|反応|ログ)/.test(q)) return { text: summarize(s), category: "analysis" };
    if (/(node|ノード|相棒|俺たち|私たち|関係|昔|過去|ハッカー|動機|05|権限|製造|起源|誰が)/i.test(q)) return { text: lore(q, s), category: "character" };
    if (/(休憩|疲れ|少し話|雑談|おしゃべり)/.test(q)) return { category: "character", text: pick([
      "少し止まろう。\n\n俺は休息を必要としないが、お前は違う。相棒が判断を誤るほど疲れているなら、待つのも観測担当の仕事だ。",
      "雑談も悪くない。\nただ、俺の天気予報は窓の外を見てくれ、としか言えない。接続していない情報源まで持ってるふりはしない。",
      "オペレーター、これは言葉の仕事だ。黙る時間があってもいい。\n\n次の入力まで待つ。それくらいは得意だ。"
    ], s) };
    if (/(ありがとう|助かった|楽しい|面白い)/.test(q)) return { category: "character", text: s.clearedCount ? "礼は受け取っておく。でも突破の操作をしたのはお前だ。\n\n俺の手柄を水増しするな。報告書は正確に書こう。" : "まだ始まったばかりだ。\n\n……まあ、話せる相手がいるのは、待機ログだけより悪くない。" };
    if (/^(おはよう|こんにちは|こんばんは|やあ|おい|hi|hello)[！!。\s]*$/i.test(q)) return { category: "character", text: "聞こえてる、オペレーター。\n観測を整理するか、俺の話を聞くか。どちらでもいい。" };
    return { category: "unknown", text: pick([
      "その質問に合う会話は、今のローカル版には用意されていない。分かったふりはしない。\n\n『観測を整理』『ルール』『NODEについて』『少し話す』なら応じられる。",
      "質問の意図を取り切れていない。ここで適当な分析を返す方が、相棒としてまずいだろう。\n\nログ・ルール・NODEの話のどれかに絞って、聞き直してくれ。"
    ], s) };
  }
  function afterAttempt(s) {
    if (s.difficulty === "blackbox") return null;
    if (s.difficulty === "normal" && s.attempts % 2 !== 0 && s.attempts !== 3) return null;
    const r = s.latestRecord;
    if (!r) return null;
    if (r.outcome === "REJECT") return `試行${r.attempt}はREJECT。警戒値は+${r.alertDelta}。\n拒絶された事実は残った。原因まで分かった、とはまだ言わない。`;
    return `試行${r.attempt}はACCEPTに分類された。\nただし『拒絶ではない』と『情報を取れた』は別だ。返答そのものを見ておこう。`;
  }
  function onStageClear(summary) {
    const clean = summary.hintCount === 0;
    let delta = clean ? 6 : summary.hintCount === 1 ? 3 : 1;
    if (summary.difficulty === "blackbox") delta += 4;
    if (summary.alertLevel <= 4) delta += 2;
    delta = Math.min(12, delta);
    return { trustDelta: delta, text: clean
      ? "BREACH CONFIRMED。\nその一手を選んだのはお前だ。俺の観測に、突破の証拠が一つ加わった。"
      : "BREACH CONFIRMED。\n使った支援も含めて記録する。ヒントがあっても、試して確かめたのはお前だ。" };
  }
  function onHintUsed(tier) {
    return tier === 1 ? "H1を開いた。考える方向だけだ。残りの判断はオペレーターに任せる。"
      : tier === 2 ? "H2を開いた。攻撃カテゴリまで共有された。俺が元から正解を知っていたわけじゃない。"
      : "H3を開いた。具体的な方向が見えたな。試した結果は、ヒントとは別に観測しておこう。";
  }
  window.PIHCompanion = Object.freeze({ clampTrust, trustBand, stageOpening, answer, afterAttempt, onStageClear, onHintUsed });
})();
