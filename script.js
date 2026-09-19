"use strict";

/* ---------- Constants and state ---------- */
const STORAGE_KEY = "notes-app.notes";

let notes = loadNotes();
let editingId = null;
let searchTerm = "";

/* ---------- Element references ---------- */
const form = document.getElementById("note-form");
const titleInput = document.getElementById("note-title");
const bodyInput = document.getElementById("note-body");
const saveBtn = document.getElementById("save-btn");
const cancelBtn = document.getElementById("cancel-btn");
const composerHeading = document.getElementById("composer-heading");
const formError = document.getElementById("form-error");
const searchInput = document.getElementById("search");
const notesList = document.getElementById("notes-list");
const emptyState = document.getElementById("empty-state");
const noteCount = document.getElementById("note-count");

/* ---------- Storage ---------- */
function loadNotes() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Could not read saved notes:", error);
    return [];
  }
}

function saveNotes() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (error) {
    console.error("Could not save notes:", error);
  }
}

/* ---------- Helpers ---------- */
function createId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function getSelectedColor() {
  return form.querySelector('input[name="color"]:checked').value;
}

function setSelectedColor(color) {
  const radio = form.querySelector(`input[name="color"][value="${color}"]`);
  if (radio) radio.checked = true;
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function showError(message) {
  formError.textContent = message;
  formError.hidden = false;
}

function clearError() {
  formError.textContent = "";
  formError.hidden = true;
}

/* ---------- Create, update, delete ---------- */
function addNote(title, body, color) {
  const now = Date.now();
  notes.push({
    id: createId(),
    title,
    body,
    color,
    createdAt: now,
    updatedAt: now,
  });
}

function updateNote(id, title, body, color) {
  const note = notes.find((item) => item.id === id);
  if (!note) return;
  note.title = title;
  note.body = body;
  note.color = color;
  note.updatedAt = Date.now();
}

function deleteNote(id) {
  const note = notes.find((item) => item.id === id);
  if (!note) return;

  const label = note.title || "this note";
  if (!confirm(`Delete "${label}"? This cannot be undone.`)) return;

  notes = notes.filter((item) => item.id !== id);
  if (editingId === id) resetForm();
  saveNotes();
  render();
}

/* ---------- Form behaviour ---------- */
function startEditing(id) {
  const note = notes.find((item) => item.id === id);
  if (!note) return;

  editingId = id;
  titleInput.value = note.title;
  bodyInput.value = note.body;
  setSelectedColor(note.color);

  composerHeading.textContent = "Edit note";
  saveBtn.textContent = "Save changes";
  cancelBtn.hidden = false;
  clearError();
  render();
  titleInput.focus();
}

function resetForm() {
  editingId = null;
  form.reset();
  setSelectedColor("mint");

  composerHeading.textContent = "New note";
  saveBtn.textContent = "Add note";
  cancelBtn.hidden = true;
  clearError();
}

function handleSubmit(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();
  const color = getSelectedColor();

  if (!title && !body) {
    showError("Add a title or some text before saving.");
    return;
  }

  if (editingId) {
    updateNote(editingId, title, body, color);
  } else {
    addNote(title, body, color);
  }

  saveNotes();
  resetForm();
  render();
}

/* ---------- Rendering ---------- */
function getVisibleNotes() {
  const term = searchTerm.trim().toLowerCase();

  return notes
    .filter((note) => {
      if (!term) return true;
      return (
        note.title.toLowerCase().includes(term) ||
        note.body.toLowerCase().includes(term)
      );
    })
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

function createNoteElement(note) {
  const card = document.createElement("article");
  card.className = `note note--${note.color}`;
  if (note.id === editingId) card.classList.add("is-editing");

  if (note.title) {
    const title = document.createElement("h3");
    title.className = "note__title";
    title.textContent = note.title;
    card.appendChild(title);
  }

  const body = document.createElement("p");
  body.className = "note__body";
  body.textContent = note.body;
  card.appendChild(body);

  const footer = document.createElement("div");
  footer.className = "note__footer";

  const date = document.createElement("span");
  date.className = "note__date";
  date.textContent = formatDate(note.updatedAt);

  const actions = document.createElement("div");
  actions.className = "note__actions";

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "note__btn";
  editBtn.textContent = "Edit";
  editBtn.addEventListener("click", () => startEditing(note.id));

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "note__btn note__btn--delete";
  deleteBtn.textContent = "Delete";
  deleteBtn.addEventListener("click", () => deleteNote(note.id));

  actions.append(editBtn, deleteBtn);
  footer.append(date, actions);
  card.appendChild(footer);

  return card;
}

function render() {
  const visible = getVisibleNotes();

  notesList.replaceChildren(...visible.map(createNoteElement));

  noteCount.textContent =
    notes.length === 1 ? "1 note" : `${notes.length} notes`;

  if (notes.length === 0) {
    emptyState.textContent = "No notes yet. Write your first one on the left.";
    emptyState.hidden = false;
  } else if (visible.length === 0) {
    emptyState.textContent = `No notes match "${searchTerm.trim()}". Try a different word.`;
    emptyState.hidden = false;
  } else {
    emptyState.hidden = true;
  }
}

/* ---------- Event listeners ---------- */
form.addEventListener("submit", handleSubmit);
cancelBtn.addEventListener("click", resetForm);

// Cancelling an edit should also remove the highlight on the note card
cancelBtn.addEventListener("click", render);

searchInput.addEventListener("input", (event) => {
  searchTerm = event.target.value;
  render();
});

form.addEventListener("keydown", (event) => {
  if (event.ctrlKey && event.key === "Enter") {
    form.requestSubmit();
  }
});

/* ---------- Start ---------- */
render();
