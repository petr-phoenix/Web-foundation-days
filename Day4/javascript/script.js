JavaScript

document.addEventListener('DOMContentLoaded', () => {
  const noteText = document.getElementById('note-text');
  const charCount = document.getElementById('char-count');
  const wordCount = document.getElementById('word-count');
  const clearBtn = document.getElementById('clear-btn');
  const themeToggle = document.getElementById('theme-toggle');

  // --- Theme Management ---
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark');
    themeToggle.textContent = 'Light mode';
  } else {
    themeToggle.textContent = 'Dark mode';
  }

  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    
    themeToggle.textContent = isDark ? 'Light mode' : 'Dark mode';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });

  // --- Counter & Storage Logic ---
  function updateCount() {
    const text = noteText.value;
    const charLength = text.length;

    // Word count calculation
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

    // Update text content
    charCount.textContent = `${charLen} / 200 characters`;
    wordCount.textContent = `${words} word${words === 1 ? '' : 's'}`;

    // Manage warning and over classes on character counter
    charCount.classList.remove('warning', 'over');
    if (charLen > 200) {
      charCount.classList.add('over');
    } else if (charLen > 180) {
      charCount.classList.add('warning');
    }

    // Save draft to localStorage
    localStorage.setItem('noteDraft', text);
  }

  function clearNote() {
    noteText.value = '';
    localStorage.removeItem('noteDraft');
    updateState();
  }

  // --- Draft Restoration ---
  const savedDraft = localStorage.getItem('noteDraft');
  if (savedDraft !== null) {
    noteText.value = savedDraft;
  }
  
  // Initial state call on load
  updateState();

  // --- Event Listeners ---
  noteText.addEventListener('input', updateState);

  clearBtn.addEventListener('click', clearNote);

  noteText.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      clearNote();
    }
  });
});