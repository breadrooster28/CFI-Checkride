const STORAGE_KEY = 'foi-study-progress-v1';
const CONTENT_SETS = {
  foi: {
    label: 'FOI deck',
    path: 'data/foi.json'
  },
  'oral-prep': {
    label: 'Oral Prep deck',
    path: 'data/oral-prep.json'
  }
};

const state = {
  cards: [],
  deck: [],
  currentIndex: 0,
  isFlipped: false,
  progress: {},
  quizCards: [],
  quizIndex: 0,
  quizScore: 0,
  quizAnswered: false,
  activeMode: 'flashcards',
  activeContentSet: 'foi'
};

const elements = {
  contentSetSelect: document.getElementById('contentSetSelect'),
  categorySelect: document.getElementById('categorySelect'),
  shuffleButton: document.getElementById('shuffleButton'),
  resetProgressButton: document.getElementById('resetProgressButton'),
  cardsInView: document.getElementById('cardsInView'),
  gotItCount: document.getElementById('gotItCount'),
  reviewAgainCount: document.getElementById('reviewAgainCount'),
  flashcardsTab: document.getElementById('flashcardsTab'),
  quizTab: document.getElementById('quizTab'),
  flashcardsPanel: document.getElementById('flashcardsPanel'),
  quizPanel: document.getElementById('quizPanel'),
  prevCardButton: document.getElementById('prevCardButton'),
  nextCardButton: document.getElementById('nextCardButton'),
  cardPosition: document.getElementById('cardPosition'),
  flashcard: document.getElementById('flashcard'),
  flashcardCategory: document.getElementById('flashcardCategory'),
  flashcardHint: document.getElementById('flashcardHint'),
  flashcardPrompt: document.getElementById('flashcardPrompt'),
  flashcardAnswer: document.getElementById('flashcardAnswer'),
  flashcardReference: document.getElementById('flashcardReference'),
  gotItButton: document.getElementById('gotItButton'),
  reviewAgainButton: document.getElementById('reviewAgainButton'),
  startQuizButton: document.getElementById('startQuizButton'),
  quizStatus: document.getElementById('quizStatus'),
  quizPrompt: document.getElementById('quizPrompt'),
  quizChoices: document.getElementById('quizChoices'),
  quizFeedback: document.getElementById('quizFeedback'),
  quizSourceNote: document.getElementById('quizSourceNote'),
  nextQuestionButton: document.getElementById('nextQuestionButton'),
  quizSummary: document.getElementById('quizSummary')
};

init();

async function init() {
  try {
    bindEvents();
    await loadContentSet(elements.contentSetSelect.value || 'foi');
  } catch (error) {
    elements.flashcardPrompt.textContent = 'Unable to load study content.';
    elements.flashcardAnswer.textContent = 'Check that the selected JSON file is available.';
    elements.quizFeedback.textContent = error.message;
  }
}

function bindEvents() {
  elements.contentSetSelect.addEventListener('change', async () => {
    await loadContentSet(elements.contentSetSelect.value);
  });
  elements.categorySelect.addEventListener('change', () => {
    rebuildDeck();
    resetQuizState();
  });
  elements.shuffleButton.addEventListener('click', () => rebuildDeck(true));
  elements.prevCardButton.addEventListener('click', () => moveCard(-1));
  elements.nextCardButton.addEventListener('click', () => moveCard(1));
  elements.flashcard.addEventListener('click', flipCard);
  elements.gotItButton.addEventListener('click', () => rateCurrentCard('got-it'));
  elements.reviewAgainButton.addEventListener('click', () => rateCurrentCard('review-again'));
  elements.flashcardsTab.addEventListener('click', () => switchMode('flashcards'));
  elements.quizTab.addEventListener('click', () => switchMode('quiz'));
  elements.startQuizButton.addEventListener('click', startQuiz);
  elements.nextQuestionButton.addEventListener('click', nextQuizQuestion);
  elements.resetProgressButton.addEventListener('click', resetProgress);
}

async function loadContentSet(contentSetKey) {
  const config = CONTENT_SETS[contentSetKey] || CONTENT_SETS.foi;
  const response = await fetch(config.path);
  if (!response.ok) { throw new Error(`HTTP ${response.status}`); }
  const payload = await response.json();
  state.activeContentSet = contentSetKey in CONTENT_SETS ? contentSetKey : 'foi';
  state.cards = payload.cards || [];
  state.progress = loadProgress(state.activeContentSet);
  elements.quizSourceNote.textContent = `Quiz questions use the ${config.label} content.`;
  populateCategories();
  rebuildDeck();
  resetQuizState();
}

function populateCategories() {
  const categories = [...new Set(state.cards.map((card) => card.category))];
  elements.categorySelect.innerHTML = '';
  elements.categorySelect.append(createOption('All categories', 'all'));
  categories.forEach((category) => elements.categorySelect.append(createOption(category, category)));
}

function createOption(label, value) {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = label;
  return option;
}

function rebuildDeck(shuffle = false) {
  const selectedCategory = elements.categorySelect.value || 'all';
  state.deck = state.cards.filter((card) => selectedCategory === 'all' || card.category === selectedCategory);
  if (shuffle) {
    shuffleArray(state.deck);
  }
  state.currentIndex = 0;
  state.isFlipped = false;
  renderFlashcard();
  renderProgress();
}

function renderFlashcard() {
  const total = state.deck.length;
  elements.cardsInView.textContent = String(total);

  if (!total) {
    elements.cardPosition.textContent = 'Card 0 of 0';
    elements.flashcard.classList.remove('is-flipped');
    elements.flashcardCategory.textContent = 'No cards found';
    elements.flashcardPrompt.textContent = 'Try a different category.';
    elements.flashcardAnswer.textContent = 'No matching flashcards are available.';
    elements.flashcardReference.textContent = '';
    elements.flashcardHint.textContent = 'Change the category or shuffle the deck.';
    return;
  }

  const card = state.deck[state.currentIndex];
  const status = state.progress[card.id] || 'Not rated yet';
  elements.cardPosition.textContent = `Card ${state.currentIndex + 1} of ${total}`;
  elements.flashcardCategory.textContent = card.category;
  elements.flashcardPrompt.textContent = card.prompt;
  elements.flashcardAnswer.textContent = card.answer;
  elements.flashcardReference.textContent = card.reference;
  elements.flashcardHint.textContent = state.isFlipped
    ? `Status: ${status.replace('-', ' ')}`
    : 'Tap to reveal the answer';
  elements.flashcard.classList.toggle('is-flipped', state.isFlipped);
}

function renderProgress() {
  const deckIds = new Set(state.deck.map((card) => card.id));
  let gotIt = 0;
  let reviewAgain = 0;

  Object.entries(state.progress).forEach(([cardId, status]) => {
    if (!deckIds.has(cardId)) {
      return;
    }
    if (status === 'got-it') {
      gotIt += 1;
    }
    if (status === 'review-again') {
      reviewAgain += 1;
    }
  });

  elements.gotItCount.textContent = String(gotIt);
  elements.reviewAgainCount.textContent = String(reviewAgain);
}

function moveCard(direction) {
  if (!state.deck.length) {
    return;
  }
  state.currentIndex = (state.currentIndex + direction + state.deck.length) % state.deck.length;
  state.isFlipped = false;
  renderFlashcard();
}

function flipCard() {
  if (!state.deck.length) {
    return;
  }
  state.isFlipped = !state.isFlipped;
  renderFlashcard();
}

function rateCurrentCard(status) {
  if (!state.deck.length) {
    return;
  }
  const card = state.deck[state.currentIndex];
  state.progress[card.id] = status;
  saveProgress();
  renderProgress();
  if (state.currentIndex < state.deck.length - 1) {
    state.currentIndex += 1;
    state.isFlipped = false;
  }
  renderFlashcard();
}

function switchMode(mode) {
  state.activeMode = mode;
  const flashcardsActive = mode === 'flashcards';
  elements.flashcardsTab.classList.toggle('is-active', flashcardsActive);
  elements.flashcardsTab.setAttribute('aria-selected', String(flashcardsActive));
  elements.quizTab.classList.toggle('is-active', !flashcardsActive);
  elements.quizTab.setAttribute('aria-selected', String(!flashcardsActive));
  elements.flashcardsPanel.classList.toggle('is-hidden', !flashcardsActive);
  elements.quizPanel.classList.toggle('is-hidden', flashcardsActive);
}

function startQuiz() {
  if (!state.deck.length) {
    resetQuizState();
    elements.quizStatus.textContent = 'No cards available for this category.';
    elements.quizPrompt.textContent = 'Choose a different category to start a quiz.';
    return;
  }

  state.quizCards = state.deck.map((card) => ({
    card,
    choices: buildChoices(card)
  }));
  shuffleArray(state.quizCards);
  state.quizIndex = 0;
  state.quizScore = 0;
  state.quizAnswered = false;
  elements.quizSummary.classList.add('is-hidden');
  elements.nextQuestionButton.classList.add('is-hidden');
  elements.startQuizButton.textContent = 'Restart quiz';
  renderQuizQuestion();
}

function buildChoices(card) {
  const sameCategory = state.cards.filter((candidate) => candidate.category === card.category && candidate.id !== card.id);
  const fallbackPool = state.cards.filter((candidate) => candidate.id !== card.id);
  const answers = new Set([card.answer]);

  for (const pool of [sameCategory, fallbackPool]) {
    const shuffled = [...pool];
    shuffleArray(shuffled);
    shuffled.forEach((candidate) => {
      if (answers.size < 4) {
        answers.add(candidate.answer);
      }
    });
    if (answers.size >= 4) {
      break;
    }
  }

  const choices = [...answers].slice(0, 4);
  shuffleArray(choices);
  return choices;
}

function renderQuizQuestion() {
  const item = state.quizCards[state.quizIndex];
  if (!item) {
    renderQuizSummary();
    return;
  }

  state.quizAnswered = false;
  elements.quizStatus.textContent = `Question ${state.quizIndex + 1} of ${state.quizCards.length}`;
  elements.quizPrompt.textContent = item.card.prompt;
  elements.quizChoices.innerHTML = '';
  elements.quizFeedback.textContent = '';
  elements.nextQuestionButton.classList.add('is-hidden');

  item.choices.forEach((choice) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'quiz-choice';
    button.textContent = choice;
    button.addEventListener('click', () => answerQuizQuestion(button, choice));
    elements.quizChoices.append(button);
  });
}

function answerQuizQuestion(button, choice) {
  if (state.quizAnswered) {
    return;
  }

  state.quizAnswered = true;
  const item = state.quizCards[state.quizIndex];
  const correct = choice === item.card.answer;

  [...elements.quizChoices.children].forEach((choiceButton) => {
    const isCorrectChoice = choiceButton.textContent === item.card.answer;
    choiceButton.disabled = true;
    if (isCorrectChoice) {
      choiceButton.classList.add('is-correct');
    }
    if (choiceButton === button && !isCorrectChoice) {
      choiceButton.classList.add('is-incorrect');
    }
  });

  if (correct) {
    state.quizScore += 1;
    elements.quizFeedback.textContent = item.card.gotcha
      ? `Correct. ${item.card.reference} — ${item.card.gotcha}`
      : `Correct. ${item.card.reference}`;
  } else {
    elements.quizFeedback.textContent = `Not quite. Correct answer: ${item.card.answer} — ${item.card.reference}`;
  }

  elements.nextQuestionButton.classList.remove('is-hidden');
}

function nextQuizQuestion() {
  state.quizIndex += 1;
  if (state.quizIndex >= state.quizCards.length) {
    renderQuizSummary();
    return;
  }
  renderQuizQuestion();
}

function renderQuizSummary() {
  const total = state.quizCards.length;
  const percent = total ? Math.round((state.quizScore / total) * 100) : 0;
  elements.quizStatus.textContent = 'Quiz complete';
  elements.quizPrompt.textContent = 'Nice work.';
  elements.quizChoices.innerHTML = '';
  elements.quizFeedback.textContent = '';
  elements.nextQuestionButton.classList.add('is-hidden');
  elements.quizSummary.innerHTML = `<h3>Score summary</h3><p>You answered <strong>${state.quizScore}</strong> out of <strong>${total}</strong> correctly (${percent}%).</p><p>Use the Restart quiz button to try again, or switch back to flashcards for focused review.</p>`;
  elements.quizSummary.classList.remove('is-hidden');
}

function resetQuizState() {
  state.quizCards = [];
  state.quizIndex = 0;
  state.quizScore = 0;
  state.quizAnswered = false;
  elements.quizStatus.textContent = 'Select a category and start the quiz.';
  elements.quizPrompt.textContent = 'Ready to test yourself?';
  elements.quizChoices.innerHTML = '';
  elements.quizFeedback.textContent = '';
  elements.quizSummary.classList.add('is-hidden');
  elements.nextQuestionButton.classList.add('is-hidden');
  elements.startQuizButton.textContent = 'Start quiz';
}

function resetProgress() {
  if (!window.confirm('Reset all local flashcard progress for this device?')) {
    return;
  }
  state.progress = {};
  saveProgress();
  renderProgress();
  renderFlashcard();
}

function loadProgress(contentSetKey) {
  const key = getStorageKey(contentSetKey);
  try {
    return JSON.parse(window.localStorage.getItem(key) || '{}');
  } catch {
    return {};
  }
}

function saveProgress() {
  window.localStorage.setItem(getStorageKey(state.activeContentSet), JSON.stringify(state.progress));
}

function getStorageKey(contentSetKey) {
  if (contentSetKey === 'foi') {
    return STORAGE_KEY;
  }
  return `${STORAGE_KEY}-${contentSetKey}`;
}

function shuffleArray(items) {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
}
