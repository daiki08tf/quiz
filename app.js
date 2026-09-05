(function () {
  "use strict";

  const homeScreen = document.getElementById("home-screen");
  const quizScreen = document.getElementById("quiz-screen");
  const homeBtn = document.getElementById("homeBtn");
  const allBtn = document.getElementById("allBtn");

  const quizCatLabel = document.getElementById("quizCatLabel");
  const quizProgress = document.getElementById("quizProgress");
  const quizScore = document.getElementById("quizScore");
  const questionText = document.getElementById("questionText");
  const choicesEl = document.getElementById("choices");
  const explainBox = document.getElementById("explainBox");
  const explainResult = document.getElementById("explainResult");
  const explainText = document.getElementById("explainText");
  const nextBtn = document.getElementById("nextBtn");

  // 出題プールの状態
  let pool = [];        // 現在のカテゴリで出題する問題の配列 {q,choices,answer,explain,cat}
  let order = [];       // シャッフル済みの出題順(poolのindex列)
  let cursor = 0;        // orderの現在位置
  let current = null;    // 現在表示中の問題
  let answered = false;
  let stats = { correct: 0, total: 0 };
  let activeCatKey = null;

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function buildPool(catKey) {
    if (catKey === "all") {
      const merged = [];
      Object.keys(QUESTION_DATA).forEach((key) => {
        QUESTION_DATA[key].forEach((q) => merged.push(Object.assign({ cat: key }, q)));
      });
      return merged;
    }
    return QUESTION_DATA[catKey].map((q) => Object.assign({ cat: catKey }, q));
  }

  function newOrder(len, avoidFirst) {
    let o = shuffle([...Array(len).keys()]);
    // 直前の問題がまた先頭に来て連続しないように軽く調整
    if (avoidFirst !== undefined && o.length > 1 && o[0] === avoidFirst) {
      [o[0], o[1]] = [o[1], o[0]];
    }
    return o;
  }

  function startCategory(catKey) {
    activeCatKey = catKey;
    pool = buildPool(catKey);
    order = newOrder(pool.length);
    cursor = 0;
    stats = { correct: 0, total: 0 };

    homeScreen.hidden = true;
    quizScreen.hidden = false;
    homeBtn.hidden = false;

    const label = catKey === "all" ? "4区分ミックス" : CATEGORY_META[catKey].label;
    quizCatLabel.textContent = label;

    showQuestion();
  }

  function showQuestion() {
    if (cursor >= order.length) {
      // プールを解き終えたら、直前の問題を避けつつ新しい順番で継続(=ひたすら出題)
      const lastIndex = order[order.length - 1];
      order = newOrder(pool.length, lastIndex);
      cursor = 0;
    }
    current = pool[order[cursor]];
    answered = false;

    quizProgress.textContent = "問 " + (stats.total + 1);
    quizScore.textContent = "正解 " + stats.correct + " / " + stats.total;

    questionText.textContent = current.q;
    if (activeCatKey === "all") {
      quizCatLabel.textContent = CATEGORY_META[current.cat].label;
    }

    choicesEl.innerHTML = "";
    current.choices.forEach((choiceLabel, idx) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn";
      btn.innerHTML =
        '<span class="choice-num">' + (idx + 1) + "</span><span>" + choiceLabel + "</span>";
      btn.addEventListener("click", () => selectChoice(idx, btn));
      choicesEl.appendChild(btn);
    });

    explainBox.hidden = true;
  }

  function selectChoice(idx, btnEl) {
    if (answered) return;
    answered = true;
    stats.total++;

    const correctIdx = current.answer;
    const isCorrect = idx === correctIdx;
    if (isCorrect) stats.correct++;

    const buttons = choicesEl.querySelectorAll(".choice-btn");
    buttons.forEach((b, i) => {
      b.disabled = true;
      if (i === correctIdx) b.classList.add("correct");
      else if (i === idx) b.classList.add("wrong");
    });

    explainResult.textContent = isCorrect ? "正解！" : "不正解… 正解は " + (correctIdx + 1) + " でした";
    explainResult.className = "explain-result " + (isCorrect ? "ok" : "ng");
    explainText.textContent = current.explain;
    explainBox.hidden = false;
    quizScore.textContent = "正解 " + stats.correct + " / " + stats.total;

    nextBtn.focus();
  }

  function nextQuestion() {
    cursor++;
    showQuestion();
  }

  function goHome() {
    quizScreen.hidden = true;
    homeScreen.hidden = false;
    homeBtn.hidden = true;
  }

  // イベント登録
  document.querySelectorAll(".category-card").forEach((card) => {
    card.addEventListener("click", () => startCategory(card.dataset.cat));
  });
  allBtn.addEventListener("click", () => startCategory("all"));
  homeBtn.addEventListener("click", goHome);
  nextBtn.addEventListener("click", nextQuestion);

  // 数字キー(1-4)で選択、Enter/Spaceで次の問題へ
  document.addEventListener("keydown", (e) => {
    if (quizScreen.hidden) return;
    if (!answered && ["1", "2", "3", "4"].includes(e.key)) {
      const idx = Number(e.key) - 1;
      const btn = choicesEl.children[idx];
      if (btn) btn.click();
    } else if (answered && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      nextQuestion();
    }
  });

  // カテゴリカードに問題数を表示
  document.querySelectorAll(".category-card").forEach((card) => {
    const key = card.dataset.cat;
    const countEl = card.querySelector(".cat-count");
    if (countEl && QUESTION_DATA[key]) {
      countEl.textContent = QUESTION_DATA[key].length + "問収録";
    }
  });
})();
