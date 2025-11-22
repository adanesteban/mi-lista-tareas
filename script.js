import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, deleteDoc, updateDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAQoQ_Gcg9TjDVYDAbR638_In-DzsID66I",
    authDomain: "lista-tareas-compartida-e25f8.firebaseapp.com",
    projectId: "lista-tareas-compartida-e25f8",
    storageBucket: "lista-tareas-compartida-e25f8.firebasestorage.app",
    messagingSenderId: "268668947188",
    appId: "1:268668947188:web:5d3e649ebb4c090bfbeca1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const todosCollection = collection(db, "todos");

document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    const emptyState = document.getElementById('emptyState');

    // Real-time listener
    const q = query(todosCollection, orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
        const tasks = [];
        snapshot.forEach((doc) => {
            tasks.push({ id: doc.id, ...doc.data() });
        });
        renderTasks(tasks);
    });

    function renderTasks(tasks) {
        taskList.innerHTML = '';

        if (tasks.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
        }

        tasks.forEach((task) => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            li.dataset.id = task.id;

            li.innerHTML = `
                <div class="task-content">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                    <span class="task-text" contenteditable="false">${escapeHtml(task.text)}</span>
                </div>
                <div class="task-actions">
                    <button class="action-btn edit" aria-label="Editar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="action-btn delete" aria-label="Borrar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </div>
            `;

            // Event Listeners for this task
            const checkbox = li.querySelector('.task-checkbox');
            checkbox.addEventListener('change', () => toggleTask(task.id, !task.completed));

            const deleteBtn = li.querySelector('.delete');
            deleteBtn.addEventListener('click', () => deleteTask(task.id));

            const editBtn = li.querySelector('.edit');
            const taskText = li.querySelector('.task-text');

            editBtn.addEventListener('click', () => {
                const isEditing = taskText.isContentEditable;

                if (isEditing) {
                    // Save changes
                    const newText = taskText.innerText;
                    updateTaskText(task.id, newText);

                    taskText.contentEditable = "false";
                    li.classList.remove('editing');
                    editBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
                } else {
                    // Enter edit mode
                    taskText.contentEditable = "true";
                    taskText.focus();
                    li.classList.add('editing');
                    // Change icon to checkmark/save
                    editBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
                }
            });

            // Save on Enter key when editing
            taskText.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    editBtn.click();
                }
            });

            taskList.appendChild(li);
        });
    }

    async function addTask() {
        const text = taskInput.value.trim();
        if (text) {
            try {
                await addDoc(todosCollection, {
                    text: text,
                    completed: false,
                    createdAt: Date.now()
                });
                taskInput.value = '';
            } catch (e) {
                console.error("Error adding document: ", e);
            }
        }
    }

    async function toggleTask(id, completed) {
        const taskRef = doc(db, "todos", id);
        await updateDoc(taskRef, {
            completed: completed
        });
    }

    async function updateTaskText(id, newText) {
        const taskRef = doc(db, "todos", id);
        await updateDoc(taskRef, {
            text: newText
        });
    }

    async function deleteTask(id) {
        await deleteDoc(doc(db, "todos", id));
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    addTaskBtn.addEventListener('click', addTask);

    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });
});
