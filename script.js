
const dictionaryRU = ["время", "программа", "код", "проект", "разработка", "дизайн", "скорость", "работа", "экран", "память", "процесс", "задача", "решение", "клавиатура", "текст", "ошибка", "успех", "навык", "будущее", "система", "данные", "пользователь"];
const dictionaryEN = ["time", "program", "code", "project", "development", "design", "speed", "work", "screen", "memory", "process", "task", "solution", "keyboard", "text", "error", "success", "skill", "future", "system", "data"];

let currentLang = 'ru';
let isCustomMode = false;
let customTextData = "";
let maxTime = 15;
let timeLeft = maxTime;
let timer = null;
let isTracing = false;

let currentWordIndex = 0;
let currentLetterIndex = 0;
let correctChars = 0;
let totalChars = 0;
let errorsCount = 0;

let wpmHistory = [];
let wpmChart = null;

const wordsContainer = document.getElementById("words-container");
const caret = document.getElementById("caret");
const timeDisplay = document.getElementById("time-display");
const wpmDisplay = document.getElementById("wpm-display");
const pbDisplay = document.getElementById("pb-display");
const modalOverlay = document.getElementById("modal-overlay");

function toggleThemeMenu() { 
  document.getElementById('theme-menu').classList.toggle('show'); 
}

function selectTheme(themeId, name, circleClass) {
  document.body.setAttribute('data-theme', themeId);
  document.getElementById('current-theme-name').innerText = name;
  document.getElementById('current-theme-circle').className = 'theme-circle ' + circleClass;
  document.getElementById('theme-menu').classList.remove('show');
}

function loadPB() {
  const pb = localStorage.getItem('yusuf_pb_' + maxTime) || 0;
  pbDisplay.innerText = pb;
}

function toggleCustomMode() {
  isCustomMode = true;
  document.getElementById('custom-box').classList.toggle('show');
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('lang-custom').classList.add('active');
}

function applyCustomText() {
  const text = document.getElementById('custom-input').value.trim();
  if(text.length > 0) {
    customTextData = text;
    document.getElementById('custom-box').classList.remove('show');
    initGame();
  }
}

function getRandomWords(count = 70) {
  if(isCustomMode && customTextData) {
    return customTextData.split(/\s+/);
  }
  const dict = currentLang === 'ru' ? dictionaryRU : dictionaryEN;
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(dict[Math.floor(Math.random() * dict.length)]);
  }
  return result;
}

function setLanguage(lang) {
  isCustomMode = false;
  currentLang = lang;
  document.getElementById('custom-box').classList.remove('show');
  document.getElementById('lang-ru').classList.toggle('active', lang === 'ru');
  document.getElementById('lang-en').classList.toggle('active', lang === 'en');
  document.getElementById('lang-custom').classList.remove('active');
  initGame();
}

function initGame() {
  clearInterval(timer);
  timeLeft = maxTime;
  isTracing = false;
  currentWordIndex = 0;
  currentLetterIndex = 0;
  correctChars = 0;
  totalChars = 0;
  errorsCount = 0;
  wpmHistory = [];

  loadPB();
  timeDisplay.innerText = timeLeft;
  wpmDisplay.innerText = "0";

  modalOverlay.classList.remove("active");
  wordsContainer.innerHTML = "";
  const words = getRandomWords();

  words.forEach(wordText => {
    const wordDiv = document.createElement("div");
    wordDiv.classList.add("word");
    wordText.split("").forEach(char => {
      const letterSpan = document.createElement("span");
      letterSpan.classList.add("letter");
      letterSpan.innerText = char;
      wordDiv.appendChild(letterSpan);
    });
    wordsContainer.appendChild(wordDiv);
  });

  setTimeout(updateCaretPosition, 10);
}

function updateCaretPosition() {
  const words = wordsContainer.querySelectorAll(".word");
  if (!words[currentWordIndex]) return;
  const currentWord = words[currentWordIndex];
  const letters = currentWord.querySelectorAll(".letter");
  let targetEl = letters[currentLetterIndex];
  let left = targetEl ? targetEl.offsetLeft : (letters.length ? letters[letters.length-1].offsetLeft + letters[letters.length-1].offsetWidth : currentWord.offsetLeft);
  let top = targetEl ? targetEl.offsetTop : currentWord.offsetTop;

  caret.style.left = `${left}px`;
  caret.style.top = `${top}px`;
}

function startTimer() {
  if (isTracing) return;
  isTracing = true;

  timer = setInterval(() => {
    timeLeft--;
    timeDisplay.innerText = timeLeft;

    const currentWpm = calculateStats();
    wpmHistory.push(currentWpm);

    if (timeLeft <= 0) endGame();
  }, 1000);
}

function calculateStats() {
  const timeElapsed = maxTime - timeLeft;
  let wpm = 0;
  if (timeElapsed > 0) {
    wpm = Math.round((correctChars / 5) / (timeElapsed / 60));
    wpmDisplay.innerText = wpm > 0 ? wpm : 0;
  }
  return wpm > 0 ? wpm : 0;
}

function endGame() {
  clearInterval(timer);
  isTracing = false;

  const finalWpm = Math.round((correctChars / 5) / (maxTime / 60)) || 0;
  const finalAcc = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 100;

  const currentPB = localStorage.getItem('yusuf_pb_' + maxTime) || 0;
  if (finalWpm > currentPB) {
    localStorage.setItem('yusuf_pb_' + maxTime, finalWpm);
  }

  document.getElementById('res-wpm').innerText = `${finalWpm} WPM`;
  document.getElementById('res-acc').innerText = `${finalAcc}%`;
  document.getElementById('res-errors').innerText = errorsCount;

  renderChart();
  modalOverlay.classList.add("active");
}

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.altKey || e.metaKey) return;
  if (e.key === "Tab") { e.preventDefault(); initGame(); return; }

  const words = wordsContainer.querySelectorAll(".word");
  if (currentWordIndex >= words.length || timeLeft <= 0) return;

  const currentWord = words[currentWordIndex];
  const letters = currentWord.querySelectorAll(".letter");

  if (e.key.length === 1 && e.key !== " ") {
    if (!isTracing) startTimer();
    totalChars++;
    if (currentLetterIndex < letters.length) {
      const targetLetter = letters[currentLetterIndex];
      if (e.key.toLowerCase() === targetLetter.innerText.toLowerCase()) {
        targetLetter.classList.add("correct");
        correctChars++;
      } else {
        targetLetter.classList.add("incorrect");
        errorsCount++;
      }
      currentLetterIndex++;
    }
  } else if (e.key === " ") {
    e.preventDefault();
    if (currentLetterIndex > 0) { currentWordIndex++; currentLetterIndex = 0; }
  } else if (e.key === "Backspace") {
    if (currentLetterIndex > 0) {
      currentLetterIndex--;
      const targetLetter = letters[currentLetterIndex];
      if (targetLetter.classList.contains("correct")) correctChars--;
      targetLetter.classList.remove("correct", "incorrect");
    }
  }
  updateCaretPosition();
});

function renderChart() {
  const ctx = document.getElementById('wpmChart').getContext('2d');
  const labels = wpmHistory.map((_, index) => index + 1);

  if (wpmChart) wpmChart.destroy();

  wpmChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'WPM',
        data: wpmHistory,
        borderColor: getComputedStyle(document.body).getPropertyValue('--main-color'),
        borderWidth: 3,
        tension: 0.4,
        fill: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    }
  });
}

function closeModalAndRestart() {
  modalOverlay.classList.remove("active");
  initGame();
}

function setTimer(seconds) {
  maxTime = seconds;
  document.querySelectorAll(".mode-btn").forEach(btn => {
    btn.classList.toggle("active", parseInt(btn.innerText) === seconds);
  });
  initGame();
}

initGame();