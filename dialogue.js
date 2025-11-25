// Dialogue System - Overlay Feature
// Triggers 3 seconds after warning popup closes, slides dialogue box from top

let dialogueBoxTimeout = null;
let currentDialogueIndex = 0;
let isTyping = false;
let currentTypingTimeout = null;
let currentText = '';
let talkSound = null;

const dialogueLines = [
  { text: "Hey this is a test its in development and not finished........ like at all", expression: "sassy" },
  { text: "maybe when i stop being lazy i will finish the rest", expression: "happy" },
  { text: "bye", expression: "sassy" }
];

// Watch for warning popup closing
function watchForWarningPopup() {
  const warningPopup = document.getElementById('warning-popup');
  if (!warningPopup) return;
  
  // Create a MutationObserver to watch for class changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const isVisible = warningPopup.classList.contains('warning-popup-visible');
        const isHidden = warningPopup.classList.contains('warning-popup-hidden');
        
        if (isHidden && !isVisible) {
          // Warning popup just closed, start dialogue sequence
          startDialogueSequence();
        }
      }
    });
  });
  
  // Start observing the warning popup
  observer.observe(warningPopup, {
    attributes: true,
    attributeFilter: ['class']
  });
}

function startDialogueSequence() {
  // Clear any existing timeout
  if (dialogueBoxTimeout) {
    clearTimeout(dialogueBoxTimeout);
  }
  
  // Wait 3 seconds after warning popup closes
  dialogueBoxTimeout = setTimeout(() => {
    showDialogueBox();
  }, 3000);
}

function showDialogueBox() {
  const dialogueBox = document.getElementById('dialogue-box');
  if (!dialogueBox) return;
  
  // Slide down from top
  dialogueBox.classList.remove('dialogue-hidden');
  dialogueBox.classList.add('dialogue-visible');
  
  // Start with first line
  currentDialogueIndex = 0;
  setTimeout(() => {
    displayDialogueLine(currentDialogueIndex);
  }, 300);
}

function hideDialogueBox() {
  const dialogueBox = document.getElementById('dialogue-box');
  if (!dialogueBox) return;
  
  // Stop talk sound
  stopTalkSound();
  
  // Slide back up off screen
  dialogueBox.classList.remove('dialogue-visible');
  dialogueBox.classList.add('dialogue-hidden');
  
  // Reset state
  currentDialogueIndex = 0;
  isTyping = false;
  if (currentTypingTimeout) {
    clearTimeout(currentTypingTimeout);
    currentTypingTimeout = null;
  }
}

function displayDialogueLine(index) {
  if (index >= dialogueLines.length) {
    hideDialogueBox();
    return;
  }
  
  const line = dialogueLines[index];
  const textElement = document.getElementById('dialogue-text');
  
  if (!textElement) return;
  
  // Clear text
  textElement.textContent = '';
  currentText = '';
  
  // Set expression (active animation)
  setCharacterExpression(line.expression);
  
  // Start typewriter effect
  isTyping = true;
  typeWriterWord(textElement, line.text, 0, line.expression);
}

function typeWriterWord(element, text, index, expression) {
  if (!isTyping || index >= text.length) {
    // Finished typing this line
    isTyping = false;
    // Stop talk sound
    stopTalkSound();
    // Switch to idle after typing completes
    setTimeout(() => {
      setCharacterIdle(expression);
    }, 300);
    return;
  }
  
  // Start talk sound if not already playing
  if (index === 0) {
    playTalkSound();
  }
  
  // Add next character
  const char = text[index];
  currentText += char;
  element.textContent = currentText;
  
  // Slightly longer pause after spaces (between words)
  const delay = char === ' ' ? 50 : 30;
  
  // Continue typing letter by letter
  currentTypingTimeout = setTimeout(() => {
    typeWriterWord(element, text, index + 1, expression);
  }, delay);
}

function setCharacterExpression(expression) {
  // Hide all expression gifs immediately
  document.querySelectorAll('.dialogue-gif').forEach(gif => {
    gif.style.opacity = '0';
    gif.classList.remove('gif-active');
  });
  
  // Small delay to ensure previous gif is hidden before showing new one
  setTimeout(() => {
    const expressionGif = document.getElementById(`dialogue-${expression}`);
    if (expressionGif) {
      expressionGif.style.opacity = '1';
      expressionGif.classList.add('gif-active');
    }
  }, 10);
}

function setCharacterIdle(expression) {
  // Hide all expression gifs immediately
  document.querySelectorAll('.dialogue-gif').forEach(gif => {
    gif.style.opacity = '0';
    gif.classList.remove('gif-active');
  });
  
  // Small delay to ensure previous gif is hidden before showing new one
  setTimeout(() => {
    const idleGif = document.getElementById(`dialogue-${expression}Idle`);
    if (idleGif) {
      idleGif.style.opacity = '1';
      idleGif.classList.add('gif-active');
    }
  }, 10);
}

function advanceDialogue() {
  // If currently typing, finish typing immediately
  if (isTyping) {
    const line = dialogueLines[currentDialogueIndex];
    if (line) {
      const textElement = document.getElementById('dialogue-text');
      if (textElement) {
        // Clear any pending timeouts
        if (currentTypingTimeout) {
          clearTimeout(currentTypingTimeout);
          currentTypingTimeout = null;
        }
        
        // Stop talk sound
        stopTalkSound();
        
        // Show full text immediately
        textElement.textContent = line.text;
        currentText = line.text;
        isTyping = false;
        
        // Switch to idle after showing full text
        setTimeout(() => {
          setCharacterIdle(line.expression);
        }, 100);
      }
    }
    return;
  }
  
  // Move to next line
  currentDialogueIndex++;
  
  if (currentDialogueIndex < dialogueLines.length) {
    displayDialogueLine(currentDialogueIndex);
  } else {
    // All lines complete, hide dialogue box
    hideDialogueBox();
  }
}

// Keyboard input for spacebar
function setupDialogueKeyboard() {
  document.addEventListener('keydown', (e) => {
    const dialogueBox = document.getElementById('dialogue-box');
    if (!dialogueBox || dialogueBox.classList.contains('dialogue-hidden')) {
      return;
    }
    
    // Prevent spacebar from scrolling page
    if (e.code === 'Space' || e.key === ' ') {
      e.preventDefault();
      advanceDialogue();
    }
  });
}

// Load and manage talk sound
function loadTalkSound() {
  if (!talkSound) {
    talkSound = new Audio('./sound/talk.mp3');
    talkSound.loop = true;
    talkSound.volume = 0.5;
  }
}

function playTalkSound() {
  if (!talkSound) {
    loadTalkSound();
  }
  
  if (talkSound && talkSound.paused) {
    talkSound.currentTime = 0;
    talkSound.play().catch(err => console.warn("Could not play talk sound:", err));
  }
}

function stopTalkSound() {
  if (talkSound && !talkSound.paused) {
    talkSound.pause();
    talkSound.currentTime = 0;
  }
}

// Initialize when DOM is ready
function initDialogueSystem() {
  loadTalkSound();
  setupDialogueKeyboard();
  watchForWarningPopup();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDialogueSystem);
} else {
  initDialogueSystem();
}

