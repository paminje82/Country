import { countries } from './data.js';

// DOM Elements
const splashScreen = document.getElementById('splash-screen');
const continentScreen = document.getElementById('continent-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');

const startBtn = document.getElementById('start-btn');
const backToSplashBtn = document.getElementById('back-to-splash');
const restartBtn = document.getElementById('restart-btn');
const homeBtn = document.getElementById('home-btn');

const continentBtns = document.querySelectorAll('.continent-btn');
const flagImg = document.getElementById('flag-img');
const optionsGrid = document.getElementById('options-grid');
const currentScoreElement = document.getElementById('current-score');
const livesElement = document.getElementById('lives');
const timerBar = document.getElementById('timer-bar');
const comboAlert = document.getElementById('combo-alert');
const comboCountElement = document.getElementById('combo-count');

const resultTitle = document.getElementById('result-title');
const finalScoreElement = document.getElementById('final-score');

// Game State
let currentContinent = 'all';
let filteredCountries = [];
let currentQuestion = null;
let score = 0;
let lives = 3;
let combo = 0;
let recentQuestions = [];
let timerInterval = null;
const TIME_LIMIT = 8; // seconds
let highScores = JSON.parse(localStorage.getItem('flag-quiz-highscores')) || {
    all: 0, asia: 0, europe: 0, americas: 0, africa: 0, oceania: 0
};

// Initialization
updateHighScoreDisplay();

// Event Listeners
startBtn.addEventListener('click', () => showScreen(continentScreen));
backToSplashBtn.addEventListener('click', () => showScreen(splashScreen));
restartBtn.addEventListener('click', startNewGame);
homeBtn.addEventListener('click', () => showScreen(continentScreen));

continentBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        currentContinent = btn.dataset.continent;
        startNewGame();
    });
});

// Functions
function showScreen(screen) {
    [splashScreen, continentScreen, quizScreen, resultScreen].forEach(s => s.classList.add('hidden'));
    screen.classList.remove('hidden');
}

function updateHighScoreDisplay() {
    for (const continent in highScores) {
        const element = document.getElementById(`best-${continent}`);
        if (element) element.innerText = `최고: ${highScores[continent]}`;
    }
}

function startNewGame() {
    score = 0;
    lives = 3;
    combo = 0;
    recentQuestions = [];
    stopTimer();
    updateUI();
    
    if (currentContinent === 'all') {
        filteredCountries = [...countries];
    } else {
        filteredCountries = countries.filter(c => c.continent === currentContinent);
    }
    
    showScreen(quizScreen);
    nextQuestion();
}

function updateUI() {
    currentScoreElement.innerText = score;
    livesElement.innerText = '❤️'.repeat(lives);
    if (combo >= 3) {
        comboAlert.classList.remove('hidden');
        comboCountElement.innerText = combo;
    } else {
        comboAlert.classList.add('hidden');
    }
}

function nextQuestion() {
    optionsGrid.innerHTML = '';
    
    // Pick random target (prevent repeat in history)
    let targetIndex;
    const maxHistory = Math.min(filteredCountries.length - 1, 10);
    
    do {
        targetIndex = Math.floor(Math.random() * filteredCountries.length);
    } while (filteredCountries.length > 1 && recentQuestions.includes(filteredCountries[targetIndex].code));
    
    currentQuestion = filteredCountries[targetIndex];
    
    // Update history
    recentQuestions.push(currentQuestion.code);
    if (recentQuestions.length > maxHistory) {
        recentQuestions.shift();
    }
    
    // Set flag image
    flagImg.src = `https://flagcdn.com/w320/${currentQuestion.code.toLowerCase()}.png`;
    
    startTimer();
    
    // Pick 3 wrong options
    let pool = countries.filter(c => c.code !== currentQuestion.code);
    let wrongOptions = [];
    while (wrongOptions.length < 3) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        const selected = pool.splice(randomIndex, 1)[0];
        wrongOptions.push(selected);
    }
    
    // Combine and shuffle
    let allOptions = [currentQuestion, ...wrongOptions].sort(() => Math.random() - 0.5);
    
    // Create buttons
    allOptions.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = option.name;
        btn.addEventListener('click', () => checkAnswer(option.code, btn));
        optionsGrid.appendChild(btn);
    });
}

function checkAnswer(code, btn) {
    stopTimer();
    const isCorrect = (code === currentQuestion.code);
    const buttons = optionsGrid.querySelectorAll('.option-btn');
    
    // Disable all buttons
    buttons.forEach(b => b.style.pointerEvents = 'none');
    
    if (isCorrect) {
        btn.classList.add('correct');
        score += 10 + (combo * 2);
        combo++;
        setTimeout(() => {
            updateUI();
            nextQuestion();
        }, 800);
    } else {
        btn.classList.add('wrong');
        combo = 0;
        lives--;
        
        // Show correct answer
        buttons.forEach(b => {
            if (countries.find(c => c.name === b.innerText).code === currentQuestion.code) {
                b.classList.add('correct');
            }
        });
        
        setTimeout(() => {
            updateUI();
            if (lives <= 0) {
                endGame();
            } else {
                nextQuestion();
            }
        }, 1500);
    }
}

function endGame() {
    stopTimer();
    finalScoreElement.innerText = score;
    
    if (score > highScores[currentContinent]) {
        highScores[currentContinent] = score;
        localStorage.setItem('flag-quiz-highscores', JSON.stringify(highScores));
        updateHighScoreDisplay();
        resultTitle.innerText = "🎊 최고 기록 경신! 🎊";
    } else {
        resultTitle.innerText = "게임 종료!";
    }
    
    showScreen(resultScreen);
}

function startTimer() {
    let timeLeft = TIME_LIMIT;
    timerBar.style.width = '100%';
    timerBar.classList.remove('warning');
    
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft -= 0.1;
        const percentage = (timeLeft / TIME_LIMIT) * 100;
        timerBar.style.width = `${percentage}%`;
        
        if (timeLeft <= 3) {
            timerBar.classList.add('warning');
        }
        
        if (timeLeft <= 0) {
            stopTimer();
            handleTimeout();
        }
    }, 100);
}

function stopTimer() {
    clearInterval(timerInterval);
}

function handleTimeout() {
    // Treat timeout as wrong answer
    const buttons = optionsGrid.querySelectorAll('.option-btn');
    buttons.forEach(b => b.style.pointerEvents = 'none');
    
    combo = 0;
    lives--;
    
    // Show correct answer
    buttons.forEach(b => {
        if (countries.find(c => c.name === b.innerText).code === currentQuestion.code) {
            b.classList.add('correct');
        }
    });
    
    updateUI();
    
    setTimeout(() => {
        if (lives <= 0) {
            endGame();
        } else {
            nextQuestion();
        }
    }, 1500);
}
