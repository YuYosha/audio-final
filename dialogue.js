// Dialogue System - Overlay Feature
// Triggers 3 seconds after warning popup closes, slides dialogue box from top

let dialogueBoxTimeout = null;
let currentDialogueIndex = 0;
let isTyping = false;
let currentTypingTimeout = null;
let currentText = '';
let talkSound = null;
let experimentalTabDialogueShown = false; // Track if experimental tab dialogue has been shown
let extrasPopupDialogueShown = false; // Track if extras popup dialogue has been shown
let extrasPopupDialogueTimeout = null; // Timeout for extras popup dialogue

const dialogueLines = [
  { text: "WHO IS MAKING ALL THAT NOICE!", expression: "angry" },
  { text: "I WAS HAVING A NAP GOD DAMNIT WHAT IS IT!!", expression: "angry" },
  { text: "Ohhh", expression: "worried" },
  { text: "Ohhhhhh........", expression: "worried" },
  { text: "Its a new user....wait let me get the script", expression: "confused" },
  { text: "UMM..............oh yeah", expression: "confused" },
  { text: "Welcome im Platinum your tutorial guide and local ai", expression: "sassy" },
  { text: "I will be teaching you how this...thing works", expression: "happy" },
  { text: "First off its 3D!", expression: "exited" },
  { text: "So move your mouse and you can move the camara", expression: "glad" },
  { text: "Ok first thing is first", expression: "happy" },
  { text: "You can play and stop any song of your choice at the bottom of the screen", expression: "happy" },
  { text: "There you can also find some buttons for changing songs too", expression: "happy" },
  { text: "On the top right there are some buttons left,stop,right", expression: "glad" },
  { text: "Those make the camara move automatically to the side it says", expression: "glad" },
  { text: "...", expression: "glad" },
  { text: "Am I missing anything....", expression: "confused" },
  { text: "Oh yeah the red arrow at the bottom right", expression: "worried" },
  { text: "That is the experimental tab filled with undercooked and incredibly unstable settings", expression: "sassy" },
  { text: "My favorite", expression: "glad" },
  { text: "Open it to know more about it", expression: "glad" },
  { text: "Also extras tab is the green button on the left press on it to know what it does", expression: "happy" },
  { text: "If you wanna know what I think", expression: "glad" },
  { text: "Yours truly", expression: "sassy" },
  { text: "Toggle my thoughts on the extras tab", expression: "sassy" },
  { text: "....Thats it", expression: "confused" },
  { text: "........So yeah", expression: "confused" },
  { text: "......Umm idk what to do now", expression: "confused" },
  { text: "#U@# OFF", expression: "angry" }
];

// Experimental tab dialogue - triggers when experimental tab is opened for first time
const experimentalTabDialogueLines = [
  { text: "Ohh boy the experimental tab", expression: "worried" },
  { text: "As said before its unstable but ill explain what it does", expression: "confused" },
  { text: "PopUps is just visual flair", expression: "glad" },
  { text: "As its name implies it makes pop ups show up using videos tho you can close them", expression: "glad" },
  { text: "Experimental and Experimental+", expression: "confused" },
  { text: "It changes visuals entirely the regular one is inmediate, the + makes it a random chance of change", expression: "happy" },
  { text: "Mirror mode activates the chance to split the screen in half and duplicate visuals temporarily", expression: "glad" },
  { text: "And Split screen is the same thing but horizontally and a different visual", expression: "happy" },
  { text: "most of these are temporary and chance based", expression: "glad" },
  { text: "DO NOT SPAM USE THESE", expression: "angry" },
  { text: "ITS UNSTABLE", expression: "angry" },
  { text: "YOU ARE WARNED!", expression: "angry" }
];

// Extras popup dialogue - triggers 2 seconds after extras popup closes
const extrasPopupDialogueLines = [
  { text: "Ok quickly the extras tab", expression: "sassy" },
  { text: "Hacked is an incredibly rare scree that has a chance to show up 1/10000 clicks on the experimental tab", expression: "confused" },
  { text: "Its also a soft lock so you will have to reload the page if you use it", expression: "worried" },
  { text: "Last but not least", expression: "sassy" },
  { text: "EXTRA TEXT", expression: "exited" },
  { text: "This amazing button adds extra lines of dialogue from yours truly giving my opinions and some minor commentary here and there", expression: "sassy" },
  { text: "That's all the script says.....", expression: "confused" },
  { text: "Have fun!!!", expression: "exited" }
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

function showDialogueOverlay() {
  const overlay = document.getElementById('dialogue-overlay');
  if (overlay) {
    overlay.classList.remove('dialogue-overlay-hidden');
    overlay.classList.add('dialogue-overlay-visible');
  }
}

function hideDialogueOverlay() {
  const overlay = document.getElementById('dialogue-overlay');
  if (overlay) {
    overlay.classList.remove('dialogue-overlay-visible');
    overlay.classList.add('dialogue-overlay-hidden');
  }
}

function showDialogueBox() {
  const dialogueBox = document.getElementById('dialogue-box');
  if (!dialogueBox) return;
  
  // Show overlay (this is the main tutorial dialogue - one of the 3 main dialogues)
  showDialogueOverlay();
  
  // Slide down from top
  dialogueBox.classList.remove('dialogue-hidden');
  dialogueBox.classList.add('dialogue-visible');
  
  // Sync layered boxes height with content
  setTimeout(() => {
    syncLayeredBoxesHeight();
  }, 100);
  
  // Start with first line
  currentDialogueIndex = 0;
  setTimeout(() => {
    displayDialogueLine(currentDialogueIndex);
  }, 300);
}

// Sync layered box heights with content
function syncLayeredBoxesHeight() {
  const content = document.querySelector('.dialogue-content');
  const whiteBox = document.querySelector('.dialogue-box-white');
  
  if (content && whiteBox) {
    const updateHeight = () => {
      const height = content.offsetHeight;
      if (height > 0) {
        whiteBox.style.height = height + 'px';
      }
    };
    
    // Update multiple times to ensure proper sizing
    updateHeight();
    setTimeout(updateHeight, 50);
    setTimeout(updateHeight, 200);
    setTimeout(updateHeight, 400);
  }
}

function hideDialogueBox() {
  const dialogueBox = document.getElementById('dialogue-box');
  if (!dialogueBox) return;
  
  // Stop talk sound
  stopTalkSound();
  
  // Hide overlay
  hideDialogueOverlay();
  
  // Slide back up off screen
  dialogueBox.classList.remove('dialogue-visible');
  dialogueBox.classList.add('dialogue-hidden');
  
  // Reset state
  currentDialogueIndex = 0;
  currentDialogueArray = dialogueLines; // Reset to default
  isTyping = false;
  if (currentTypingTimeout) {
    clearTimeout(currentTypingTimeout);
    currentTypingTimeout = null;
  }
}

let currentDialogueArray = dialogueLines; // Track which dialogue array is being used

function displayDialogueLine(index, dialogueArray = null) {
  const arrayToUse = dialogueArray || currentDialogueArray;
  if (index >= arrayToUse.length) {
    hideDialogueBox();
    return;
  }
  
  const line = arrayToUse[index];
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

function typeWriterWord(element, text, index, expression, dialogueArray = dialogueLines) {
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
  const delay = char === ' ' ? 40 : 25;
  
  // Continue typing letter by letter
  currentTypingTimeout = setTimeout(() => {
    typeWriterWord(element, text, index + 1, expression, dialogueArray);
  }, delay);
}

function setCharacterExpression(expression) {
  const expressionGif = document.getElementById(`dialogue-${expression}`);
  if (!expressionGif) return;
  
  // Get currently active gif to crossfade from
  const currentlyActive = document.querySelector('.dialogue-gif.gif-active');
  
  if (currentlyActive && currentlyActive !== expressionGif) {
    // Smooth crossfade: fade out old, fade in new simultaneously
    currentlyActive.style.opacity = '0';
    currentlyActive.classList.remove('gif-active');
    
    // Start fading in the new one immediately for crossfade effect
    expressionGif.style.opacity = '0';
    requestAnimationFrame(() => {
      expressionGif.style.opacity = '1';
      expressionGif.classList.add('gif-active');
    });
  } else {
    // No active gif, just fade in
    expressionGif.style.opacity = '0';
    requestAnimationFrame(() => {
      expressionGif.style.opacity = '1';
      expressionGif.classList.add('gif-active');
    });
  }
}

function setCharacterIdle(expression) {
  // Handle special case for "confused" - filename has typo "confusedIdel"
  let idleId = `dialogue-${expression}Idle`;
  if (expression === 'confused') {
    idleId = 'dialogue-confusedIdle'; // File is confusedIdel.gif but ID should be confusedIdle
  }
  
  const idleGif = document.getElementById(idleId);
  if (!idleGif) {
    console.warn(`Idle GIF not found for expression: ${expression} (looking for: ${idleId})`);
    return;
  }
  
  // Get currently active gif to crossfade from
  const currentlyActive = document.querySelector('.dialogue-gif.gif-active');
  
  if (currentlyActive && currentlyActive !== idleGif) {
    // Smooth crossfade: fade out old, fade in new simultaneously
    currentlyActive.style.opacity = '0';
    currentlyActive.classList.remove('gif-active');
    
    // Start fading in the new one immediately for crossfade effect
    idleGif.style.opacity = '0';
    requestAnimationFrame(() => {
      idleGif.style.opacity = '1';
      idleGif.classList.add('gif-active');
    });
  } else {
    // No active gif, just fade in
    idleGif.style.opacity = '0';
    requestAnimationFrame(() => {
      idleGif.style.opacity = '1';
      idleGif.classList.add('gif-active');
    });
  }
}

function advanceDialogue() {
  // If currently typing, finish typing immediately
  if (isTyping) {
    const line = currentDialogueArray[currentDialogueIndex];
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
  
  if (currentDialogueIndex < currentDialogueArray.length) {
    // Show idle briefly before switching to next line's active expression
    const currentLine = currentDialogueArray[currentDialogueIndex - 1];
    if (currentLine) {
      setCharacterIdle(currentLine.expression);
    }
    
    // Small delay before showing next line
    setTimeout(() => {
      displayDialogueLine(currentDialogueIndex);
    }, 200);
  } else {
    // All lines complete, hide dialogue box
    const lastLine = currentDialogueArray[currentDialogueArray.length - 1];
    if (lastLine) {
      setCharacterIdle(lastLine.expression);
    }
    setTimeout(() => {
      hideDialogueBox();
      // Reset to default dialogue array after hiding
      currentDialogueArray = dialogueLines;
    }, 300);
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
    talkSound.volume = 0.75;
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

// Watch for random bullshit tab (popups-controls) opening
function watchForExperimentalTab() {
  const popupsControls = document.getElementById('popups-controls');
  if (!popupsControls) return;
  
  // Create a MutationObserver to watch for class changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const isCollapsed = popupsControls.classList.contains('collapsed');
        
        // If popups tab just opened (not collapsed) and dialogue hasn't been shown yet
        if (!isCollapsed && !experimentalTabDialogueShown) {
          experimentalTabDialogueShown = true;
          // Wait a moment for the tab to fully open, then show dialogue
          setTimeout(() => {
            showExperimentalTabDialogue();
          }, 500);
        }
      }
    });
  });
  
  observer.observe(popupsControls, {
    attributes: true,
    attributeFilter: ['class']
  });
}

function showExperimentalTabDialogue() {
  const dialogueBox = document.getElementById('dialogue-box');
  if (!dialogueBox) return;
  
  // Set the experimental tab dialogue as the current array
  currentDialogueArray = experimentalTabDialogueLines;
  currentDialogueIndex = 0;
  
  // Show overlay (this is one of the 3 main dialogues)
  showDialogueOverlay();
  
  // Show dialogue box if it's hidden
  if (dialogueBox.classList.contains('dialogue-hidden')) {
    dialogueBox.classList.remove('dialogue-hidden');
    dialogueBox.classList.add('dialogue-visible');
  }
  
  // Start displaying dialogue after slide animation
  setTimeout(() => {
    displayDialogueLine(0, experimentalTabDialogueLines);
  }, 300);
}

// Watch for extras popup closing
function watchForExtrasPopup() {
  const extrasPopup = document.getElementById('extras-popup');
  if (!extrasPopup) return;
  
  // Create a MutationObserver to watch for class changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const isVisible = extrasPopup.classList.contains('extras-popup-visible');
        const isHidden = extrasPopup.classList.contains('extras-popup-hidden');
        
        // If extras popup just closed and dialogue hasn't been shown yet
        if (isHidden && !isVisible && !extrasPopupDialogueShown) {
          extrasPopupDialogueShown = true;
          
          // Clear any existing timeout to prevent multiple triggers
          if (extrasPopupDialogueTimeout) {
            clearTimeout(extrasPopupDialogueTimeout);
          }
          
          // Wait 2 seconds after extras popup closes
          extrasPopupDialogueTimeout = setTimeout(() => {
            showExtrasPopupDialogue();
          }, 2000);
        }
      }
    });
  });
  
  observer.observe(extrasPopup, {
    attributes: true,
    attributeFilter: ['class']
  });
}

function showExtrasPopupDialogue() {
  const dialogueBox = document.getElementById('dialogue-box');
  if (!dialogueBox) return;
  
  // Set the extras popup dialogue as the current array
  currentDialogueArray = extrasPopupDialogueLines;
  currentDialogueIndex = 0;
  
  // Show overlay (this is one of the 3 main dialogues)
  showDialogueOverlay();
  
  // Show dialogue box if it's hidden
  if (dialogueBox.classList.contains('dialogue-hidden')) {
    dialogueBox.classList.remove('dialogue-hidden');
    dialogueBox.classList.add('dialogue-visible');
  }
  
  // Start displaying dialogue after slide animation
  setTimeout(() => {
    displayDialogueLine(0, extrasPopupDialogueLines);
  }, 300);
}

// Skip dialogue function
function skipDialogue() {
  // Stop any typing
  if (currentTypingTimeout) {
    clearTimeout(currentTypingTimeout);
    currentTypingTimeout = null;
  }
  
  // Stop talk sound
  stopTalkSound();
  
  // Hide dialogue box immediately
  hideDialogueBox();
}

// Setup skip button
function setupSkipButton() {
  const skipBtn = document.getElementById('dialogue-skip-btn');
  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      skipDialogue();
    });
  }
}

// Initialize when DOM is ready
function initDialogueSystem() {
  loadTalkSound();
  setupDialogueKeyboard();
  setupSkipButton();
  watchForWarningPopup();
  watchForExperimentalTab();
  watchForExtrasPopup();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDialogueSystem);
} else {
  initDialogueSystem();
}

