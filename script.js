// State & Elemen DOM
let tasks = JSON.parse(localStorage.getItem('myTasks')) || DEFAULT_TASKS;

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

// Simpan data ke LocalStorage
function saveTasks() {
    localStorage.setItem('myTasks', JSON.stringify(tasks));
}

// Navigasi Tampilan
function switchView(targetSectionId) {
    // Sembunyikan semua section
    Object.values(views).forEach(sec => {
        sec.classList.remove('active');
    });

    const targetSection = document.getElementById(targetSectionId);

    // Trigger reflow kecil agar keyframe animasi berjalan ulang setiap tab dibuka
    void targetSection.offsetWidth;
    targetSection.classList.add('active');

    // Update status active pada menu sidebar
    navItems.forEach(item => {
        item.classList.toggle('active', item.getAttribute('data-target') === targetSectionId);
    });

    // Logika update judul & pemanggilan fungsi render
    if (targetSectionId === 'dashboard-section') {
        pageTitle.innerText = 'Dashboard';
        renderDashboard();
    } else if (targetSectionId === 'tasks-section') {
        pageTitle.innerText = 'Daftar Tugas';
        renderTasksTable();
    } else if (targetSectionId === 'form-section') {
        pageTitle.innerText = taskIdInput.value ? 'Edit Tugas' : 'Tambah Tugas';
    }

    // Tutup sidebar di tampilan mobile jika terbuka
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
}

// Format badge status
function renderStatusBadge(status) {
    let badgeClass = 'badge-pending';
    if (status === 'Sedang Dikerjakan') badgeClass = 'badge-progress';
    if (status === 'Selesai') badgeClass = 'badge-completed';
    return `<span class="badge ${badgeClass}">${status}</span>`;
}

// Render Dashboard
function renderDashboard() {
    const total = tasks.length;
    const pending = tasks.filter(t => t.status === 'Belum Dikerjakan').length;
    const progress = tasks.filter(t => t.status === 'Sedang Dikerjakan').length;
    const completed = tasks.filter(t => t.status === 'Selesai').length;

    document.getElementById('statTotal').innerText = total;
    document.getElementById('statPending').innerText = pending;
    document.getElementById('statProgress').innerText = progress;
    document.getElementById('statCompleted').innerText = completed;

    // Urutkan deadline terdekat
    const sortedTasks = [...tasks].sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    const upcomingBody = document.getElementById('upcomingTasksBody');
    upcomingBody.innerHTML = '';

    if (sortedTasks.length === 0) {
        upcomingBody.innerHTML = `<tr><td colspan="4" class="empty-cell">Belum ada tugas tercatat.</td></tr>`;
        return;
    }

    sortedTasks.slice(0, 5).forEach(task => {
        const row = document.createElement('tr');
        row.innerHTML = `
      <td><strong>${escapeHtml(task.name)}</strong></td>
      <td>${escapeHtml(task.subject)}</td>
      <td>${task.deadline}</td>
      <td>${renderStatusBadge(task.status)}</td>
    `;
        upcomingBody.appendChild(row);
    });
}

// Render Tabel Daftar Tugas
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
        tbody.innerHTML = `<tr><td colspan="5" class="empty-cell">Tidak ada tugas yang sesuai.</td></tr>`;
        return;
    }

    filteredTasks.forEach(task => {
        const row = document.createElement('tr');
        row.innerHTML = `
      <td>
        <strong>${escapeHtml(task.name)}</strong>
        ${task.description ? `<p style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">${escapeHtml(task.description)}</p>` : ''}
      </td>
      <td>${escapeHtml(task.subject)}</td>
      <td>${task.deadline}</td>
      <td>${renderStatusBadge(task.status)}</td>
      <td>
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

    lucide.createIcons();
}

// Utilitas Sanitasi Teks
function escapeHtml(text) {
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
}

// Form Handlers
function resetForm() {
    taskIdInput.value = '';
    taskNameInput.value = '';
    taskSubjectInput.value = '';
    taskDeadlineInput.value = '';
    taskStatusInput.value = 'Belum Selesai';
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

    formHeading.innerText = 'Edit Tugas';
    switchView('form-section');
}

function deleteTask(id) {
    if (confirm('Apakah kamu yakin ingin menghapus tugas ini?')) {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        renderTasksTable();
        renderDashboard();
    }
}

function toggleTaskStatus(id) {
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
}

// Submit Form (Tambah / Update)
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

// Event Listeners Navigasi
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

// Filter & Search Real-time
searchInput.addEventListener('input', renderTasksTable);
statusFilter.addEventListener('change', renderTasksTable);

// Mobile Nav Toggle
menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('active');
});

sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
});

// Render Awal
saveTasks();
renderDashboard();
lucide.createIcons();