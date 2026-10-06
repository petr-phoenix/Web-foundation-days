let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

// 1. searchNotes(word)
// Uses filter, toLowerCase, and includes
function searchNotes(word) {
  const query = word.toLowerCase();
  return notes.filter(note => note.text.toLowerCase().includes(query));
}

// 2. longestNote()
// Handles empty array first, then compares lengths
function longestNote() {
  if (notes.length === 0) {
    return null;
  }

  let longest = notes[0];
  for (let i = 1; i < notes.length; i++) {
    if (notes[i].text.length > longest.text.length) {
      longest = notes[i];
    }
  }
  return longest;
}

// 3. countByCategory()
// Loops over notes and increments counters in an object
function countByCategory() {
  const counts = {};
  for (const note of notes) {
    if (counts[note.category]) {
      counts[note.category]++;
    } else {
      counts[note.category] = 1;
    }
  }
  return counts;
}

// 4. getSummary()
function getSummary() {
  const counts = countByCategory();
  const categoryParts = Object.entries(counts).map(
    ([category, count]) => `${count} ${category}`
  );
  return `${notes.length} notes: ${categoryParts.join(", ")}.`;
}

// 5. isDuplicate: use some, comparing trimmed lower-case text
function isDuplicate(text) {
  const target = text.trim().toLowerCase();
  return notes.some(note => note.text.trim().toLowerCase() === target);
}

// 6. addNote: call isDuplicate, check length (1-200) and category before adding
function addNote(text, category) {
  const validCategories = ["personal", "work", "study"];
  const trimmed = text.trim();

  // Validate character length (1 to 200)
  if (trimmed.length < 1 || trimmed.length > 200) {
    console.log("Failed to add note: text must be between 1 and 200 characters.");
    return false;
  }
  // Validate category
  if (!validCategories.includes(category)) {
    console.log(`Failed to add note: "${category}" is not an accepted category.`);
    return false;
  }

  // Check for duplicates
  if (isDuplicate(text)) {
    console.log("Failed to add note: duplicate note text already exists.");
    return false;
  }

  // Generate next id and push
  const nextId = notes.length > 0 ? Math.max(...notes.map(n => n.id)) + 1 : 1;
  notes.push({ id: nextId, text: trimmed, category });
  return true;
}
// Generate next id and push
  const nextId = notes.length > 0 ? Math.max(...notes.map(n => n.id)) + 1 : 1;
  notes.push({ id: nextId, text: trimmed, category });
  return true;
} 


