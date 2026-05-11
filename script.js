'use strict';

// ============================
// STATE
// ============================
const state = {
  current: '0',        // number being entered
  previous: '',        // previous operand
  operator: null,      // pending operator
  justEvaluated: false // flag: last action was '='
};

// ============================
// DOM REFS
// ============================
const resultEl    = document.getElementById('result');
const expressionEl= document.getElementById('expression');
const clearBtn    = document.getElementById('clearBtn');
const themeToggle = document.getElementById('themeToggle');
const allOpBtns   = document.querySelectorAll('.btn-op');

// ============================
// DISPLAY HELPERS
// ============================
function formatNumber(value) {
  if (value === 'Error') return value;
  const num = parseFloat(value);
  if (isNaN(num)) return value;

  // Shorten very long numbers
  const str = value.toString();
  if (str.replace('.', '').replace('-', '').length > 10) {
    return parseFloat(num.toPrecision(9)).toString();
  }
  return str;
}

function updateDisplay() {
  const formatted = formatNumber(state.current);
  resultEl.textContent = formatted;

  // Shrink font for long numbers
  const len = formatted.length;
  if (len > 12)      resultEl.style.fontSize = '1.4rem';
  else if (len > 9)  resultEl.style.fontSize = '1.9rem';
  else if (len > 7)  resultEl.style.fontSize = '2.4rem';
  else               resultEl.style.fontSize = '';

  // Toggle error style
  resultEl.classList.toggle('error', state.current === 'Error');
}

function updateExpression(expr) {
  expressionEl.textContent = expr;
}

function highlightActiveOp(op) {
  allOpBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.value === op);
  });
}

function popAnimation() {
  resultEl.classList.remove('animate-pop');
  void resultEl.offsetWidth; // reflow
  resultEl.classList.add('animate-pop');
}

// ============================
// CORE CALCULATOR LOGIC
// ============================
function inputDigit(digit) {
  if (state.current === 'Error') {
    state.current = digit;
    return;
  }

  if (state.justEvaluated) {
    // After =, start fresh number unless operator was just pressed
    state.current = digit;
    state.justEvaluated = false;
    return;
  }

  if (state.current === '0' && digit !== '.') {
    state.current = digit;
  } else {
    if (state.current.length >= 15) return; // max digits
    state.current += digit;
  }
}

function inputDecimal() {
  if (state.current === 'Error') {
    state.current = '0.';
    return;
  }
  if (state.justEvaluated) {
    state.current = '0.';
    state.justEvaluated = false;
    return;
  }
  if (!state.current.includes('.')) {
    state.current += '.';
  }
}

function inputPercent() {
  if (state.current === 'Error') return;
  const val = parseFloat(state.current);
  if (isNaN(val)) return;

  if (state.operator && state.previous !== '') {
    // Relative percentage: e.g. 200 + 10% = 200 + 20
    state.current = String((parseFloat(state.previous) * val) / 100);
  } else {
    state.current = String(val / 100);
  }
  state.justEvaluated = false;
}

function toggleSign() {
  if (state.current === 'Error' || state.current === '0') return;
  if (state.current.startsWith('-')) {
    state.current = state.current.slice(1);
  } else {
    state.current = '-' + state.current;
  }
}

function calculate(a, b, op) {
  const numA = parseFloat(a);
  const numB = parseFloat(b);
  switch (op) {
    case '+': return numA + numB;
    case '−': return numA - numB;
    case '×': return numA * numB;
    case '÷':
      if (numB === 0) return 'Error';
      return numA / numB;
    default: return numB;
  }
}

function setOperator(op) {
  if (state.current === 'Error') return;

  // Chain: if there's already a pending calculation, evaluate first
  if (state.operator && state.previous !== '' && !state.justEvaluated) {
    const result = calculate(state.previous, state.current, state.operator);
    state.current = result === 'Error' ? 'Error' : String(result);
    updateExpression(`${formatNumber(state.current)} ${op}`);
    state.previous = state.current;
    state.current = '0';
    state.operator = op;
    state.justEvaluated = false;
    updateDisplay();
    highlightActiveOp(op);
    return;
  }

  updateExpression(`${formatNumber(state.current)} ${op}`);
  state.previous = state.current;
  state.current = '0';
  state.operator = op;
  state.justEvaluated = false;
  highlightActiveOp(op);
}

function equals() {
  if (!state.operator || state.previous === '') return;
  if (state.current === 'Error') return;

  const expr = `${formatNumber(state.previous)} ${state.operator} ${formatNumber(state.current)} =`;
  const result = calculate(state.previous, state.current, state.operator);

  updateExpression(expr);
  state.current = result === 'Error' ? 'Error' : String(result);
  state.previous = '';
  state.operator = null;
  state.justEvaluated = true;
  highlightActiveOp(null);
  updateDisplay();
  popAnimation();
}

function clearAll() {
  state.current = '0';
  state.previous = '';
  state.operator = null;
  state.justEvaluated = false;
  updateExpression('');
  highlightActiveOp(null);
  updateDisplay();
}

// Update AC / C label
function updateClearLabel() {
  clearBtn.textContent = (state.current !== '0' || state.previous !== '') ? 'C' : 'AC';
}

// ============================
// BUTTON CLICK HANDLER
// ============================
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.action;
    const value  = btn.dataset.value;

    switch (action) {
      case 'digit':
        inputDigit(value);
        break;
      case 'decimal':
        inputDecimal();
        break;
      case 'operator':
        setOperator(value);
        break;
      case 'equals':
        equals();
        break;
      case 'clear':
        clearAll();
        break;
      case 'toggle-sign':
        toggleSign();
        break;
      case 'percent':
        inputPercent();
        break;
    }

    updateDisplay();
    updateClearLabel();
  });
});

// ============================
// KEYBOARD SUPPORT
// ============================
const keyMap = {
  '0': { action: 'digit', value: '0' },
  '1': { action: 'digit', value: '1' },
  '2': { action: 'digit', value: '2' },
  '3': { action: 'digit', value: '3' },
  '4': { action: 'digit', value: '4' },
  '5': { action: 'digit', value: '5' },
  '6': { action: 'digit', value: '6' },
  '7': { action: 'digit', value: '7' },
  '8': { action: 'digit', value: '8' },
  '9': { action: 'digit', value: '9' },
  '.': { action: 'decimal' },
  ',': { action: 'decimal' },
  '+': { action: 'operator', value: '+' },
  '-': { action: 'operator', value: '−' },
  '*': { action: 'operator', value: '×' },
  '/': { action: 'operator', value: '÷' },
  'Enter':     { action: 'equals' },
  '=':         { action: 'equals' },
  'Backspace': { action: 'backspace' },
  'Delete':    { action: 'clear' },
  'Escape':    { action: 'clear' },
  '%':         { action: 'percent' },
};

// Map keyboard key to button selector for visual feedback
const keyToSelector = {
  '0': '[data-value="0"]',
  '1': '[data-value="1"]',
  '2': '[data-value="2"]',
  '3': '[data-value="3"]',
  '4': '[data-value="4"]',
  '5': '[data-value="5"]',
  '6': '[data-value="6"]',
  '7': '[data-value="7"]',
  '8': '[data-value="8"]',
  '9': '[data-value="9"]',
  '.': '[data-action="decimal"]',
  ',': '[data-action="decimal"]',
  '+': '[data-value="+"]',
  '-': '[data-value="−"]',
  '*': '[data-value="×"]',
  '/': '[data-value="÷"]',
  'Enter': '[data-action="equals"]',
  '=':     '[data-action="equals"]',
  'Escape': '[data-action="clear"]',
  'Delete': '[data-action="clear"]',
  '%': '[data-action="percent"]',
};

document.addEventListener('keydown', (e) => {
  // Don't trigger when typing in inputs
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  const mapped = keyMap[e.key];
  if (!mapped) return;

  e.preventDefault();

  // Visual key press feedback
  const selector = keyToSelector[e.key];
  if (selector) {
    const btn = document.querySelector(selector);
    if (btn) {
      btn.classList.add('key-press');
      setTimeout(() => btn.classList.remove('key-press'), 120);
    }
  }

  switch (mapped.action) {
    case 'digit':
      inputDigit(mapped.value);
      break;
    case 'decimal':
      inputDecimal();
      break;
    case 'operator':
      setOperator(mapped.value);
      break;
    case 'equals':
      equals();
      break;
    case 'clear':
      clearAll();
      break;
    case 'backspace':
      handleBackspace();
      break;
    case 'percent':
      inputPercent();
      break;
  }

  updateDisplay();
  updateClearLabel();
});

function handleBackspace() {
  if (state.justEvaluated || state.current === 'Error') {
    clearAll();
    return;
  }
  if (state.current.length === 1 || (state.current.length === 2 && state.current.startsWith('-'))) {
    state.current = '0';
  } else {
    state.current = state.current.slice(0, -1);
  }
}

// ============================
// THEME TOGGLE
// ============================
function getStoredTheme() {
  return localStorage.getItem('calc-theme') || 'dark';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('calc-theme', theme);
}

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

// ============================
// INIT
// ============================
applyTheme(getStoredTheme());
updateDisplay();
updateClearLabel();
