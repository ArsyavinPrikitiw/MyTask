// ==========================================
// 1. INISIALISASI DATA
// ==========================================
let tasks = JSON.parse(localStorage.getItem('myTasks')) || [];

// ==========================================
// 2. ELEMEN DOM
// ==========================================
const views = {
    dashboard: document.getElementById('dashboard-section'),
    tasks: document.getElementById('tasks-section'),
    form: document.getElementById('form-section')
};

const pageTitle = document.getElementById('pageTitle');
const navItems = document.querySelectorAll('.nav-item');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const menuToggle = document.getElementById('menuToggle');

const taskForm = document.getElementById('taskForm');
const formHeading = document.getElementById('formHeading');
const taskIdInput = document.getElementById('taskId');
const taskNameInput = document.getElementById('taskName');
const taskSubjectInput = document.getElementById('taskSubject');
const taskDeadlineInput = document.getElementById('taskDeadline');
const taskStatusInput = document.getElementById('taskStatus');
const taskDescInput = document.getElementById('taskDescription');

const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');

// ==========================================
// 3. FUNGSI UTILITAS & PENGAMAN
// ==========================================
function renderIcons() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    } else {
        console.warn("Lucide Icons CDN belum dimuat, namun website tetap berfungsi.");
    }
}

function saveTasks() {
    localStorage.setItem('myTasks', JSON.stringify(tasks));
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
}

// ==========================================
// 4. NAVIGASI
// ==========================================
function switchView(targetSectionId) {
    Object.values(views).forEach(sec => sec.classList.remove('active'));

    const targetSection = document.getElementById(targetSectionId);
    void targetSection.offsetWidth;
    targetSection.classList.add('active');

    navItems.forEach(item => {
        item.classList.toggle('active', item.getAttribute('data-target') === targetSectionId);
    });

    if (targetSectionId === 'dashboard-section') {
        pageTitle.innerText = 'Dashboard';
        renderDashboard();
    } else if (targetSectionId === 'tasks-section') {
        pageTitle.innerText = 'Daftar Tugas';
        renderTasksTable();
    } else if (targetSectionId === 'form-section') {
        pageTitle.innerText = taskIdInput.value ? 'Edit Tugas' : 'Tambah Tugas';
    }

    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
}

// ==========================================
// 5. RENDER DASHBOARD
// ==========================================
function renderStatusBadge(status) {
    let badgeClass = 'badge-pending';
    if (status === 'Sedang Dikerjakan') badgeClass = 'badge-progress';
    if (status === 'Selesai') badgeClass = 'badge-completed';
    return `<span class="badge ${badgeClass}">${status}</span>`;
}

function renderDashboard() {
    const total = tasks.length;
    // Menghitung status dengan teks "Belum Dikerjakan"
    const pending = tasks.filter(t => t.status === 'Belum Dikerjakan').length;
    const progress = tasks.filter(t => t.status === 'Sedang Dikerjakan').length;
    const completed = tasks.filter(t => t.status === 'Selesai').length;

    document.getElementById('statTotal').innerText = total;
    document.getElementById('statPending').innerText = pending;
    document.getElementById('statProgress').innerText = progress;
    document.getElementById('statCompleted').innerText = completed;

    const activeTasks = tasks.filter(t => t.status !== 'Selesai');
    const sortedTasks = [...activeTasks].sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    const upcomingBody = document.getElementById('upcomingTasksBody');
    upcomingBody.innerHTML = '';

    if (sortedTasks.length === 0) {
        // Tambahkan data-label agar tidak error di CSS mobile
        upcomingBody.innerHTML = `<tr><td colspan="4" class="empty-cell" data-label="Info">Mantap! Tidak ada tugas terdekat yang harus dikerjakan.</td></tr>`;
        return;
    }

    sortedTasks.slice(0, 5).forEach(task => {
        const row = document.createElement('tr');
        // Penambahan atribut data-label di setiap <td> untuk tampilan Card di Mobile
        row.innerHTML = `
      <td data-label="Nama Tugas"><strong>${escapeHtml(task.name)}</strong></td>
      <td data-label="Mata Pelajaran">${escapeHtml(task.subject)}</td>
      <td data-label="Deadline">${task.deadline}</td>
      <td data-label="Status">${renderStatusBadge(task.status)}</td>
    `;
        upcomingBody.appendChild(row);
    });
}

// ==========================================
// 6. RENDER TABEL TUGAS
// ==========================================
function renderTasksTable() {
    const tbody = document.getElementById('allTasksBody');
    tbody.innerHTML = '';

    const query = searchInput.value.toLowerCase().trim();
    const selectedStatus = statusFilter.value;

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.name.toLowerCase().includes(query) ||
            task.subject.toLowerCase().includes(query);
        const matchesStatus = selectedStatus === 'Semua' || task.status === selectedStatus;
        return matchesSearch && matchesStatus;
    });

    if (filteredTasks.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-cell" data-label="Info">Belum ada data tugas. Silakan tambah tugas baru.</td></tr>`;
        return;
    }

    filteredTasks.forEach(task => {
        const row = document.createElement('tr');
        // Penambahan atribut data-label di setiap <td> untuk tampilan Card di Mobile
        row.innerHTML = `
      <td data-label="Nama Tugas">
        <strong>${escapeHtml(task.name)}</strong>
        ${task.description ? `<p style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">${escapeHtml(task.description)}</p>` : ''}
      </td>
      <td data-label="Mata Pelajaran">${escapeHtml(task.subject)}</td>
      <td data-label="Deadline">${task.deadline}</td>
      <td data-label="Status">${renderStatusBadge(task.status)}</td>
      <td data-label="Aksi">
        <div class="table-actions">
          <button class="btn-icon" title="Ubah Status Cepat" onclick="toggleTaskStatus('${task.id}')">
            <i data-lucide="refresh-cw" style="width:14px; height:14px;"></i>
          </button>
          <button class="btn-icon" title="Edit Tugas" onclick="openEditForm('${task.id}')">
            <i data-lucide="edit-3" style="width:14px; height:14px;"></i>
          </button>
          <button class="btn-icon delete" title="Hapus Tugas" onclick="deleteTask('${task.id}')">
            <i data-lucide="trash-2" style="width:14px; height:14px;"></i>
          </button>
        </div>
      </td>
    `;
        tbody.appendChild(row);
    });

    renderIcons();
}

// ==========================================
// 7. HANDLER FORM & AKSI
// ==========================================
function resetForm() {
    taskIdInput.value = '';
    taskNameInput.value = '';
    taskSubjectInput.value = '';
    taskDeadlineInput.value = '';
    taskStatusInput.value = 'Belum Dikerjakan'; // Default value diubah
    taskDescInput.value = '';
    formHeading.innerText = 'Tambah Tugas Baru';
}

function openEditForm(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    taskIdInput.value = task.id;
    taskNameInput.value = task.name;
    taskSubjectInput.value = task.subject;
    taskDeadlineInput.value = task.deadline;
    taskStatusInput.value = task.status;
    taskDescInput.value = task.description || '';

    switchView('form-section');
}

window.openEditForm = openEditForm;

window.deleteTask = function (id) {
    if (confirm('Apakah kamu yakin ingin menghapus tugas ini?')) {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        renderTasksTable();
        renderDashboard();
    }
};

window.toggleTaskStatus = function (id) {
    // Update array urutan rotasi status
    const order = ['Belum Dikerjakan', 'Sedang Dikerjakan', 'Selesai'];
    tasks = tasks.map(task => {
        if (task.id === id) {
            const nextIdx = (order.indexOf(task.status) + 1) % order.length;
            return { ...task, status: order[nextIdx] };
        }
        return task;
    });
    saveTasks();
    renderTasksTable();
    renderDashboard();
};

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const id = taskIdInput.value;
    const taskData = {
        id: id || 'task-' + Date.now(),
        name: taskNameInput.value.trim(),
        subject: taskSubjectInput.value.trim(),
        deadline: taskDeadlineInput.value,
        status: taskStatusInput.value,
        description: taskDescInput.value.trim()
    };

    if (id) {
        tasks = tasks.map(t => t.id === id ? taskData : t);
    } else {
        tasks.push(taskData);
    }

    saveTasks();
    resetForm();
    switchView('tasks-section');
});

// ==========================================
// 8. EVENT LISTENERS
// ==========================================
navItems.forEach(item => {
    item.addEventListener('click', () => {
        const target = item.getAttribute('data-target');
        if (target === 'form-section') resetForm();
        switchView(target);
    });
});

document.getElementById('btnOpenAddForm').addEventListener('click', () => {
    resetForm();
    switchView('form-section');
});

document.getElementById('btnCancelForm').addEventListener('click', () => {
    resetForm();
    switchView('tasks-section');
});

searchInput.addEventListener('input', renderTasksTable);
statusFilter.addEventListener('change', renderTasksTable);

menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('active');
});

sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
});

// ==========================================
// 9. EKSEKUSI SAAT PERTAMA KALI WEB DIBUKA
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    renderDashboard();
    renderTasksTable();
    renderIcons();
});