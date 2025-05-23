import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import {
  getAuth, signInWithEmailAndPassword,
  onAuthStateChanged, signOut
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import {
  getDatabase, ref, onValue,
  set, update, remove, get
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js';

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD0vilgJtiLB06OrJq1iv3A6NXbEan6j_Y",
  authDomain: "kicknegooss.firebaseapp.com",
  databaseURL: "https://kicknegooss-default-rtdb.firebaseio.com",
  projectId: "kicknegooss",
  storageBucket: "kicknegooss.firebasestorage.app",
  messagingSenderId: "98787276236",
  appId: "1:98787276236:web:9b1c35170b38ac35eb1969"
};
initializeApp(firebaseConfig);
const auth = getAuth();
const db   = getDatabase();

// DOM references
const loginPage      = document.getElementById('login-page');
const adminPage      = document.getElementById('admin-page');
const workerPage     = document.getElementById('worker-page');
const boxEditorPage  = document.getElementById('box-editor-page');

const loginForm      = document.getElementById('loginForm');
const loginErr       = document.getElementById('loginError');

const adminLogout    = document.getElementById('admin-logout');
const workerLogout   = document.getElementById('worker-logout');
const workerBack     = document.getElementById('worker-back');

const backAdminBtn   = document.getElementById('back-admin');
const editorTitle    = document.getElementById('editor-title');
const editorSections = document.getElementById('editor-sections');
const saveBoxTasksBtn= document.getElementById('save-box-tasks');
const saveSuccess    = document.getElementById('saveSuccess');
const infoTableBody  = document.querySelector('#info-table tbody');
const statusTableBody= document.querySelector('#status-table tbody');

const workerBoxLabel = document.getElementById('worker-box-label');
const workerSections = document.getElementById('worker-sections');

// Helper: show one page
function showPage(pg) {
  [loginPage, adminPage, workerPage, boxEditorPage]
    .forEach(el => el.classList.add('d-none'));
  pg.classList.remove('d-none');
}

// Auth listener
onAuthStateChanged(auth, user => {
  if (!user) return showPage(loginPage);
  onValue(ref(db, `users/${user.uid}`), snap => {
    const me = snap.val() || {};
    if (me.role === 'admin') initAdmin();
    else if (me.role === 'worker') initWorker(me);
    else { signOut(auth); alert('No role assigned'); }
  });
});

// Login
loginForm.addEventListener('submit', e => {
  e.preventDefault();
  loginErr.classList.add('d-none');
  signInWithEmailAndPassword(auth,
    loginForm.email.value,
    loginForm.password.value
  ).catch(err => {
    loginErr.textContent = err.message;
    loginErr.classList.remove('d-none');
  });
});

// Logout/Back
if (adminLogout)  adminLogout.onclick  = () => signOut(auth);
if (workerLogout) workerLogout.onclick = () => signOut(auth);
if (workerBack)   workerBack.onclick   = () => signOut(auth);

// — Admin Dashboard —
function initAdmin() {
  showPage(adminPage);
  ['nettoyage','gardiennage'].forEach(type => {
    const container = document.getElementById(`${type}-boxes`);
    document.getElementById(`add-${type}`).onclick = () => {
      const id = Date.now().toString();
      const label = prompt('Box label:');
      if (label) set(ref(db, `boxes/${type}/${id}`), { label });
    };
    onValue(ref(db, `boxes/${type}`), snap => {
      container.innerHTML = '';
      snap.forEach(child => {
        const data = child.val(), id = child.key;
        const tpl = document.getElementById('box-template').content.cloneNode(true);
        tpl.querySelector('.label').textContent = data.label;
        tpl.querySelector('.edit').onclick = e => {
          e.stopPropagation();
          const nl = prompt('Rename:', data.label);
          if (nl) update(ref(db, `boxes/${type}/${id}`), { label: nl });
        };
        tpl.querySelector('.delete').onclick = e => {
          e.stopPropagation();
          if (confirm('Delete?')) remove(ref(db, `boxes/${type}/${id}`));
        };
        tpl.querySelector('.card-body').onclick = () =>
          openBoxEditor(type, id, data.label);
        container.appendChild(tpl);
      });
    });
  });
}

// — Box Editor & Status —
let currentBox = {};
function openBoxEditor(type, id, label) {
  currentBox = { type, id, label };
  editorTitle.textContent = `${label} (${type})`;

  // Editor: only desc & remaining
  editorSections.innerHTML = '';
  ['PV','BT','Congé'].forEach(section => {
    const col = document.createElement('div');
    col.className = 'col-md-4 mb-4';
    col.innerHTML = `
      <div class="card h-100 shadow-sm fade-in">
        <div class="card-header text-center fw-bold">${section}</div>
        <div class="card-body">
          <textarea class="form-control mb-2 desc" rows="2" placeholder="Description"></textarea>
          <input type="number" class="form-control remain" placeholder="Remaining">
        </div>
      </div>`;
    editorSections.appendChild(col);
  });

  saveSuccess.classList.add('d-none');
  infoTableBody.innerHTML   = '';
  statusTableBody.innerHTML = '';
  showPage(boxEditorPage);
  loadStatus();
}

backAdminBtn.onclick = () => showPage(adminPage);

saveBoxTasksBtn.onclick = async () => {
  const { type, id } = currentBox;
  const usersSnap = await get(ref(db,'users'));
  const users = usersSnap.val()||{};

  editorSections.querySelectorAll('.col-md-4').forEach((col,i) => {
    const section = ['PV','BT','Congé'][i];
    const desc    = col.querySelector('.desc').value;
    const remain  = +col.querySelector('.remain').value;
    for (const uid in users) {
      const u = users[uid];
      if (u.role==='worker' && u.boxType===type && u.boxId===id) {
        update(ref(db, `tasks/${uid}/${section}`), {
          description: desc,
          remaining:   remain,
          done:        false
        });
      }
    }
  });

  saveSuccess.classList.remove('d-none');
  setTimeout(()=>saveSuccess.classList.add('d-none'),1500);
  loadStatus();
};

// Populate both tables
async function loadStatus() {
  const { type, id } = currentBox;
  const usersSnap = await get(ref(db,'users'));
  const users = usersSnap.val()||{};

  infoTableBody.innerHTML   = '';
  statusTableBody.innerHTML = '';

  for (const uid in users) {
    const u = users[uid];
    if (u.role==='worker' && u.boxType===type && u.boxId===id) {
      const tsnap = await get(ref(db, `tasks/${uid}`));
      const tasks = tsnap.val()||{};

      // Worker Info
      const infoRow = document.createElement('tr');
      const nameCell = document.createElement('td');
      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.value = u.name||'';
      nameInput.className = 'form-control form-control-sm';
      nameInput.onchange = () =>
        update(ref(db, `users/${uid}`), { name: nameInput.value });
      nameCell.appendChild(nameInput);
      infoRow.appendChild(nameCell);

      const phoneCell = document.createElement('td');
      const phoneInput = document.createElement('input');
      phoneInput.type = 'tel';
      phoneInput.value = u.phone||'';
      phoneInput.className = 'form-control form-control-sm d-inline-block w-auto';
      phoneInput.onchange = () =>
        update(ref(db, `users/${uid}`), { phone: phoneInput.value });
      phoneCell.appendChild(phoneInput);
      infoRow.appendChild(phoneCell);

      const callCell = document.createElement('td');
      const callLink = document.createElement('a');
      callLink.className = 'btn btn-sm btn-outline-success';
      callLink.textContent = '📞';
      callLink.href = `tel:${u.phone||''}`;
      callCell.appendChild(callLink);
      infoRow.appendChild(callCell);

      infoTableBody.appendChild(infoRow);

      // Task Status
      const statRow = document.createElement('tr');
      ['entryDate','exitDate'].forEach(key => {
        const cell = document.createElement('td');
        cell.textContent = tasks.PV?.[key] || '—';
        statRow.appendChild(cell);
      });
      ['exitDate'].forEach(_ => { /* BT sortie */
        const cell = document.createElement('td');
        cell.textContent = tasks.BT?.exitDate || '—';
        statRow.appendChild(cell);
      });
      ['done','done','done'].forEach((fld,i) => {
        const cell = document.createElement('td');
        const section = ['PV','BT','Congé'][i];
        cell.textContent = tasks[section]?.done ? '✅' : '〰️';
        statRow.appendChild(cell);
      });
      statusTableBody.appendChild(statRow);
    }
  }
}

// — Worker Dashboard —
async function initWorker(user) {
  const boxSnap = await get(ref(db, `boxes/${user.boxType}/${user.boxId}`));
  const boxLabel = boxSnap.exists() ? boxSnap.val().label : `${user.boxType} Box ${user.boxId}`;

  showPage(workerPage);
  workerBoxLabel.textContent = boxLabel;
  workerSections.innerHTML = '';

  onValue(ref(db, `tasks/${auth.currentUser.uid}`), snap => {
    workerSections.innerHTML = '';
    ['PV','BT','Congé'].forEach(section => {
      const data = snap.val()?.[section]||{};
      const col = document.createElement('div');
      col.className = 'col-md-4 mb-4';

      let inner = `<div class="card h-100 shadow-sm fade-in">
        <div class="card-header text-center fw-bold">${section}</div>
        <div class="card-body">
          <div class="mb-2">
            <label class="form-label">Description</label>
            <input type="text" class="form-control desc" value="${data.description||''}">
          </div>
          <div class="mb-2">
            <label class="form-label">Remaining</label>
            <input type="number" class="form-control remain" value="${data.remaining||0}">
          </div>`;

      if (section==='PV') {
        inner += `
          <div class="mb-2">
            <label class="form-label">Entrée</label>
            <input type="date" class="form-control entryDate" value="${data.entryDate||''}">
          </div>
          <div class="mb-2">
            <label class="form-label">Sortie</label>
            <input type="date" class="form-control exitDate" value="${data.exitDate||''}">
          </div>`;
      } else if (section==='BT') {
        inner += `
          <div class="mb-2">
            <label class="form-label">Sortie</label>
            <input type="date" class="form-control exitDate" value="${data.exitDate||''}">
          </div>`;
      }

      inner += `
          <div class="form-check mt-3">
            <input type="checkbox" class="form-check-input done" ${data.done?'checked':''}>
            <label class="form-check-label">Done</label>
          </div>
        </div>
      </div>`;

      col.innerHTML = inner;
      workerSections.appendChild(col);

      setTimeout(() => {
        col.querySelector('.desc').onchange   = e =>
          update(ref(db, `tasks/${auth.currentUser.uid}/${section}`), { description: e.target.value });
        col.querySelector('.remain').onchange = e =>
          update(ref(db, `tasks/${auth.currentUser.uid}/${section}`), { remaining: +e.target.value });
        col.querySelector('.done').onchange   = e =>
          update(ref(db, `tasks/${auth.currentUser.uid}/${section}`), { done: e.target.checked });

        if (section==='PV') {
          col.querySelector('.entryDate').onchange = e =>
            update(ref(db, `tasks/${auth.currentUser.uid}/${section}`), { entryDate: e.target.value });
          col.querySelector('.exitDate').onchange  = e =>
            update(ref(db, `tasks/${auth.currentUser.uid}/${section}`), { exitDate: e.target.value });
        } else if (section==='BT') {
          col.querySelector('.exitDate').onchange  = e =>
            update(ref(db, `tasks/${auth.currentUser.uid}/${section}`), { exitDate: e.target.value });
        }
      }, 50);
    });
  });
}
