// ====== 設定 ======
const API_URL = "https://script.google.com/macros/s/AKfycbzvFhpsGqBFDY4t_z916nEA9reD4T78qj3-iA9-wIMOjAYm7NyiyTKKmYDwsQhEqusx/exec"; // ここを実際のURLに置き換える

// ====== アプリ状態 ======
let quizUnits = []; // 単元データ
let currentState = {
    selectedUnitId: null,
    selectedUnit: null,
    questionStates: new Map() // questionId -> { selectedAnswerIndex, isAnswered }
};

// ====== DOM要素 ======
const elements = {
    mainScreen: null,
    unitScreen: null,
    unitMenu: null,
    backButton: null,
    unitTitle: null,
    unitBadge: null,
    questionsContainer: null
};

// ====== 初期化 ======
function initializeElements() {
    elements.mainScreen = document.getElementById('main-screen');
    elements.unitScreen = document.getElementById('unit-screen');
    elements.unitMenu = document.getElementById('unit-menu');
    elements.backButton = document.getElementById('back-button');
    elements.unitTitle = document.getElementById('unit-title');
    elements.unitBadge = document.getElementById('unit-badge');
    elements.questionsContainer = document.getElementById('questions-container');
}

// ====== アイコンSVG作成 ======
function createIcon(type) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    switch (type) {
        case 'chevron-right': svg.classList.add('chevron-icon'); path.setAttribute('d', 'm9 18 6-6-6-6'); break;
        case 'check': svg.classList.add('result-icon'); path.setAttribute('d', 'M20 6 9 17l-5-5'); break;
        case 'x': svg.classList.add('result-icon'); path.setAttribute('d', 'm18 6-12 12'); const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path'); path2.setAttribute('d', 'm6 6 12 12'); svg.appendChild(path2); break;
        case 'check-option': svg.classList.add('option-icon','correct'); path.setAttribute('d', 'M20 6 9 17l-5-5'); break;
        case 'x-option': svg.classList.add('option-icon','incorrect'); path.setAttribute('d', 'm18 6-12 12'); const path2Option = document.createElementNS('http://www.w3.org/2000/svg', 'path'); path2Option.setAttribute('d', 'm6 6 12 12'); svg.appendChild(path2Option); break;
    }
    svg.appendChild(path);
    return svg;
}

// ====== スプレッドシートから単元データ取得 ======
async function fetchQuizUnits() {
    const res = await fetch(API_URL);
    const data = await res.json();

    // 単元ごとにまとめる
    const unitsMap = {};
    data.forEach(q => {
        if (!unitsMap[q.unit]) unitsMap[q.unit] = { id: q.unit, name: q.unit, questions: [] };
        unitsMap[q.unit].questions.push({
            id: q.id,
            question: q.question,
            options: [q.choise_01, q.choise_02, q.choise_03, q.choise_04],
            correctAnswerIndex: Number(q.answer) - 1,
            explanation: q.commentary
        });
    });

    quizUnits = Object.values(unitsMap);
}

// ====== 単元メニュー描画 ======
function renderUnitMenu() {
    elements.unitMenu.innerHTML = '';

    quizUnits.forEach(unit => {
        const unitCard = document.createElement('div'); unitCard.className = 'unit-card';
        const unitButton = document.createElement('button'); unitButton.className = 'unit-button';
        unitButton.addEventListener('click', () => selectUnit(unit.id));

        const buttonContent = document.createElement('div'); buttonContent.className = 'unit-button-content';
        const unitIcon = document.createElement('div'); unitIcon.className = 'unit-icon'; unitIcon.textContent = unit.id;
        const unitInfo = document.createElement('div'); unitInfo.className = 'unit-info';
        const unitName = document.createElement('h3'); unitName.textContent = unit.name;
        const unitBadge = document.createElement('span'); unitBadge.className = 'badge'; unitBadge.textContent = `${unit.questions.length}問`;
        unitInfo.appendChild(unitName); unitInfo.appendChild(unitBadge);
        buttonContent.appendChild(unitIcon); buttonContent.appendChild(unitInfo);

        const chevronIcon = createIcon('chevron-right');
        unitButton.appendChild(buttonContent); unitButton.appendChild(chevronIcon);
        unitCard.appendChild(unitButton); elements.unitMenu.appendChild(unitCard);
    });
}

// ====== 単元選択 ======
function selectUnit(unitId) {
    currentState.selectedUnitId = unitId;
    currentState.selectedUnit = quizUnits.find(u => u.id === unitId);
    if (currentState.selectedUnit) showUnitScreen();
}

// ====== 単元画面表示 ======
function showUnitScreen() {
    const unit = currentState.selectedUnit;
    elements.unitTitle.textContent = unit.name;
    elements.unitBadge.textContent = `${unit.questions.length}問`;
    renderQuestions();
    elements.mainScreen.classList.remove('active');
    elements.unitScreen.classList.add('active');
}

// ====== メイン画面に戻る ======
function showMainScreen() {
    currentState.selectedUnitId = null;
    currentState.selectedUnit = null;
    elements.unitScreen.classList.remove('active');
    elements.mainScreen.classList.add('active');
}

// ====== 問題描画 ======
function renderQuestions() {
    elements.questionsContainer.innerHTML = '';
    currentState.selectedUnit.questions.forEach((question,index)=>{
        const card = createQuestionCard(question,index+1);
        elements.questionsContainer.appendChild(card);
    });
}

// ====== 問題カード作成 ======
function createQuestionCard(question, questionNumber) {
    const questionState = currentState.questionStates.get(question.id) || { selectedAnswerIndex:null, isAnswered:false };
    const card = document.createElement('div'); card.className='question-card';
    const content = document.createElement('div'); content.className='question-content';

    // ヘッダー
    const header = document.createElement('div'); header.className='question-header';
    const qNum = document.createElement('span'); qNum.className='question-number'; qNum.textContent=`問題 ${questionNumber}`;
    header.appendChild(qNum);

    // 正誤表示
    if(questionState.isAnswered){
        const correct = questionState.selectedAnswerIndex === question.correctAnswerIndex;
        const result = document.createElement('div'); result.className=`result-indicator ${correct?'correct':'incorrect'}`;
        const icon = createIcon(correct?'check':'x');
        const txt = document.createElement('span'); txt.textContent = correct?'正解':'不正解';
        result.appendChild(icon); result.appendChild(txt); header.appendChild(result);
    }

    // 問題文
    const qText = document.createElement('div'); qText.className='question-text'; qText.textContent=question.question;

    // 選択肢
    const optionsContainer = document.createElement('div'); optionsContainer.className='options-container';
    question.options.forEach((option,i)=>{
        const btn = document.createElement('button'); btn.className='option-button';
        if(questionState.isAnswered){
            btn.disabled=true;
            if(i===question.correctAnswerIndex) btn.classList.add('correct');
            else if(i===questionState.selectedAnswerIndex && questionState.selectedAnswerIndex!==question.correctAnswerIndex) btn.classList.add('incorrect');
        }
        btn.addEventListener('click',()=>handleAnswerSelect(question, i));
        const optNum = document.createElement('div'); optNum.className='option-number'; optNum.textContent=i+1;
        const optText = document.createElement('span'); optText.className='option-text'; optText.textContent=option;
        const optContent = document.createElement('div'); optContent.style.display='flex'; optContent.style.alignItems='center'; optContent.style.gap='0.75rem'; optContent.style.width='100%';
        optContent.appendChild(optNum); optContent.appendChild(optText);
        btn.appendChild(optContent);
        optionsContainer.appendChild(btn);
    });

    content.appendChild(header); content.appendChild(qText); content.appendChild(optionsContainer);

    // 解説
    if(questionState.isAnswered){
        const exp = document.createElement('div'); exp.className='explanation';
        const correctSec = document.createElement('div'); correctSec.className='explanation-section';
        const label = document.createElement('div'); label.className='explanation-label'; label.textContent='正解';
        const correctTxt = document.createElement('p'); correctTxt.className='explanation-content'; correctTxt.textContent=`${question.correctAnswerIndex+1}. ${question.options[question.correctAnswerIndex]}`;
        correctSec.appendChild(label); correctSec.appendChild(correctTxt);
        const expSec = document.createElement('div'); expSec.className='explanation-section';
        const expLabel = document.createElement('div'); expLabel.className='explanation-label'; expLabel.textContent='解説';
        const expContent = document.createElement('p'); expContent.className='explanation-content'; expContent.textContent=question.explanation;
        expSec.appendChild(expLabel); expSec.appendChild(expContent);
        exp.appendChild(correctSec); exp.appendChild(expSec);
        content.appendChild(exp);
    }

    card.appendChild(content); return card;
}

// ====== 回答選択処理（スプレッドシートPOST） ======
async function handleAnswerSelect(question, answerIndex){
    const questionState = { selectedAnswerIndex: answerIndex, isAnswered:true };
    currentState.questionStates.set(question.id, questionState);

    // POST
    try{
        await fetch(API_URL, {
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify({
                questions_Id: question.id,
                answer: answerIndex+1,
                correct: questionState.selectedAnswerIndex===question.correctAnswerIndex
            })
        });
    }catch(e){
        console.error("結果送信エラー", e);
    }

    renderQuestions();
}

// ====== 正解判定 ======
function isCorrect(questionState, question){
    return questionState.selectedAnswerIndex === question.correctAnswerIndex;
}

// ====== イベント設定 ======
function setupEventListeners(){
    elements.backButton.addEventListener('click', showMainScreen);
}

// ====== アプリ初期化 ======
async function initializeApp(){
    initializeElements();
    setupEventListeners();
    await fetchQuizUnits();
    renderUnitMenu();
}

// DOM読み込み後に初期化
document.addEventListener('DOMContentLoaded', initializeApp);
