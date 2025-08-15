// アプリケーション状態
let currentState = {
    selectedUnitId: null,
    selectedUnit: null,
    questionStates: new Map() // questionId -> { selectedAnswerIndex, isAnswered }
};

// DOM要素の参照
const elements = {
    mainScreen: null,
    unitScreen: null,
    unitMenu: null,
    backButton: null,
    unitTitle: null,
    unitBadge: null,
    questionsContainer: null
};

// DOM要素を初期化
function initializeElements() {
    elements.mainScreen = document.getElementById('main-screen');
    elements.unitScreen = document.getElementById('unit-screen');
    elements.unitMenu = document.getElementById('unit-menu');
    elements.backButton = document.getElementById('back-button');
    elements.unitTitle = document.getElementById('unit-title');
    elements.unitBadge = document.getElementById('unit-badge');
    elements.questionsContainer = document.getElementById('questions-container');
}

// アイコンSVGを生成する関数
function createIcon(type) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    
    switch (type) {
        case 'chevron-right':
            svg.classList.add('chevron-icon');
            path.setAttribute('d', 'm9 18 6-6-6-6');
            break;
        case 'check':
            svg.classList.add('result-icon');
            path.setAttribute('d', 'M20 6 9 17l-5-5');
            break;
        case 'x':
            svg.classList.add('result-icon');
            path.setAttribute('d', 'm18 6-12 12');
            const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path2.setAttribute('d', 'm6 6 12 12');
            svg.appendChild(path2);
            break;
        case 'check-option':
            svg.classList.add('option-icon', 'correct');
            path.setAttribute('d', 'M20 6 9 17l-5-5');
            break;
        case 'x-option':
            svg.classList.add('option-icon', 'incorrect');
            path.setAttribute('d', 'm18 6-12 12');
            const path2Option = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path2Option.setAttribute('d', 'm6 6 12 12');
            svg.appendChild(path2Option);
            break;
    }
    
    svg.appendChild(path);
    return svg;
}

// 単元メニューを描画
function renderUnitMenu() {
    elements.unitMenu.innerHTML = '';
    
    quizUnits.forEach(unit => {
        const unitCard = document.createElement('div');
        unitCard.className = 'unit-card';
        
        const unitButton = document.createElement('button');
        unitButton.className = 'unit-button';
        unitButton.addEventListener('click', () => selectUnit(unit.id));
        
        const buttonContent = document.createElement('div');
        buttonContent.className = 'unit-button-content';
        
        const unitIcon = document.createElement('div');
        unitIcon.className = 'unit-icon';
        unitIcon.textContent = unit.id;
        
        const unitInfo = document.createElement('div');
        unitInfo.className = 'unit-info';
        
        const unitName = document.createElement('h3');
        unitName.textContent = unit.name;
        
        const unitBadge = document.createElement('span');
        unitBadge.className = 'badge';
        unitBadge.textContent = `${unit.questions.length}問`;
        
        unitInfo.appendChild(unitName);
        unitInfo.appendChild(unitBadge);
        
        buttonContent.appendChild(unitIcon);
        buttonContent.appendChild(unitInfo);
        
        const chevronIcon = createIcon('chevron-right');
        
        unitButton.appendChild(buttonContent);
        unitButton.appendChild(chevronIcon);
        
        unitCard.appendChild(unitButton);
        elements.unitMenu.appendChild(unitCard);
    });
}

// 単元を選択
function selectUnit(unitId) {
    currentState.selectedUnitId = unitId;
    currentState.selectedUnit = quizUnits.find(unit => unit.id === unitId);
    
    if (currentState.selectedUnit) {
        showUnitScreen();
    }
}

// 単元画面を表示
function showUnitScreen() {
    const unit = currentState.selectedUnit;
    
    // ヘッダー情報を更新
    elements.unitTitle.textContent = unit.name;
    elements.unitBadge.textContent = `${unit.questions.length}問`;
    
    // 問題を描画
    renderQuestions();
    
    // 画面を切り替え
    elements.mainScreen.classList.remove('active');
    elements.unitScreen.classList.add('active');
}

// メイン画面に戻る
function showMainScreen() {
    currentState.selectedUnitId = null;
    currentState.selectedUnit = null;
    
    elements.unitScreen.classList.remove('active');
    elements.mainScreen.classList.add('active');
}

// 問題一覧を描画
function renderQuestions() {
    elements.questionsContainer.innerHTML = '';
    
    currentState.selectedUnit.questions.forEach((question, index) => {
        const questionCard = createQuestionCard(question, index + 1);
        elements.questionsContainer.appendChild(questionCard);
    });
}

// 問題カードを作成
function createQuestionCard(question, questionNumber) {
    const questionState = currentState.questionStates.get(question.id) || {
        selectedAnswerIndex: null,
        isAnswered: false
    };
    
    const card = document.createElement('div');
    card.className = 'question-card';
    
    const content = document.createElement('div');
    content.className = 'question-content';
    
    // 問題ヘッダー
    const header = document.createElement('div');
    header.className = 'question-header';
    
    const questionNum = document.createElement('span');
    questionNum.className = 'question-number';
    questionNum.textContent = `問題 ${questionNumber}`;
    
    header.appendChild(questionNum);
    
    // 正解・不正解の表示
    if (questionState.isAnswered) {
        const isCorrect = questionState.selectedAnswerIndex === question.correctAnswerIndex;
        const resultIndicator = document.createElement('div');
        resultIndicator.className = `result-indicator ${isCorrect ? 'correct' : 'incorrect'}`;
        
        const resultIcon = createIcon(isCorrect ? 'check' : 'x');
        const resultText = document.createElement('span');
        resultText.textContent = isCorrect ? '正解' : '不正解';
        
        resultIndicator.appendChild(resultIcon);
        resultIndicator.appendChild(resultText);
        header.appendChild(resultIndicator);
    }
    
    // 問題文
    const questionText = document.createElement('div');
    questionText.className = 'question-text';
    questionText.textContent = question.question;
    
    // 選択肢
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'options-container';
    
    question.options.forEach((option, index) => {
        const optionButton = document.createElement('button');
        optionButton.className = 'option-button';
        
        if (questionState.isAnswered) {
            optionButton.disabled = true;
            
            if (index === question.correctAnswerIndex) {
                optionButton.classList.add('correct');
            } else if (index === questionState.selectedAnswerIndex && !isCorrect(questionState, question)) {
                optionButton.classList.add('incorrect');
            }
        }
        
        optionButton.addEventListener('click', () => {
            if (!questionState.isAnswered) {
                handleAnswerSelect(question.id, index);
            }
        });
        
        const optionContent = document.createElement('div');
        optionContent.style.display = 'flex';
        optionContent.style.alignItems = 'center';
        optionContent.style.gap = '0.75rem';
        optionContent.style.width = '100%';
        
        const optionNumber = document.createElement('div');
        optionNumber.className = 'option-number';
        optionNumber.textContent = index + 1;
        
        const optionText = document.createElement('span');
        optionText.className = 'option-text';
        optionText.textContent = option;
        
        optionContent.appendChild(optionNumber);
        optionContent.appendChild(optionText);
        
        // 正解・不正解のアイコン
        if (questionState.isAnswered) {
            if (index === question.correctAnswerIndex) {
                const checkIcon = createIcon('check-option');
                optionContent.appendChild(checkIcon);
            } else if (index === questionState.selectedAnswerIndex && !isCorrect(questionState, question)) {
                const xIcon = createIcon('x-option');
                optionContent.appendChild(xIcon);
            }
        }
        
        optionButton.appendChild(optionContent);
        optionsContainer.appendChild(optionButton);
    });
    
    content.appendChild(header);
    content.appendChild(questionText);
    content.appendChild(optionsContainer);
    
    // 解説（回答後のみ表示）
    if (questionState.isAnswered) {
        const explanation = createExplanationSection(question);
        content.appendChild(explanation);
    }
    
    card.appendChild(content);
    return card;
}

// 解説セクションを作成
function createExplanationSection(question) {
    const explanation = document.createElement('div');
    explanation.className = 'explanation';
    
    // 正解表示
    const correctSection = document.createElement('div');
    correctSection.className = 'explanation-section';
    
    const correctLabel = document.createElement('div');
    correctLabel.className = 'explanation-label';
    correctLabel.textContent = '正解';
    
    const correctContent = document.createElement('p');
    correctContent.className = 'explanation-content';
    correctContent.textContent = `${question.correctAnswerIndex + 1}. ${question.options[question.correctAnswerIndex]}`;
    
    correctSection.appendChild(correctLabel);
    correctSection.appendChild(correctContent);
    
    // 解説
    const explanationSection = document.createElement('div');
    explanationSection.className = 'explanation-section';
    
    const explanationLabel = document.createElement('div');
    explanationLabel.className = 'explanation-label';
    explanationLabel.textContent = '解説';
    
    const explanationContent = document.createElement('p');
    explanationContent.className = 'explanation-content';
    explanationContent.textContent = question.explanation;
    
    explanationSection.appendChild(explanationLabel);
    explanationSection.appendChild(explanationContent);
    
    explanation.appendChild(correctSection);
    explanation.appendChild(explanationSection);
    
    return explanation;
}

// 回答選択の処理
function handleAnswerSelect(questionId, answerIndex) {
    const questionState = {
        selectedAnswerIndex: answerIndex,
        isAnswered: true
    };
    
    currentState.questionStates.set(questionId, questionState);
    
    // 問題を再描画
    renderQuestions();
}

// 正解判定
function isCorrect(questionState, question) {
    return questionState.selectedAnswerIndex === question.correctAnswerIndex;
}

// イベントリスナーを設定
function setupEventListeners() {
    elements.backButton.addEventListener('click', showMainScreen);
}

// アプリケーションを初期化
function initializeApp() {
    initializeElements();
    setupEventListeners();
    renderUnitMenu();
}

// DOM読み込み完了後にアプリを初期化
document.addEventListener('DOMContentLoaded', initializeApp);