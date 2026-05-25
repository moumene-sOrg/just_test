// Admin Dashboard Engine v2.0
const API_BASE = '/api/admin';

async function adminFetch(endpoint) {
    const token = localStorage.getItem('token') || localStorage.getItem('admin_token');
    if (!token) {
        window.location.href = '/SignIn/SignInPage.html';
        return;
    }
    const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.status === 401 || res.status === 403) {
        window.location.href = '/SignIn/SignInPage.html';
        return;
    }
    return res.json();
}

window.loadDashboard = async () => {
    console.log("DASHBOARD: Loading v2.0 data...");
    try {
        const stats = await adminFetch('/stats');
        const activity = await adminFetch('/activity');
        console.log("STATS RECEIVED:", stats);
        console.log("ACTIVITY RECEIVED:", activity);

        if (stats) {
            document.getElementById('stat-users').textContent = stats.users.total;
            document.getElementById('stat-vets').textContent = stats.vets.total;
            document.getElementById('stat-refuges').textContent = stats.refuges.total;
            document.getElementById('stat-reports').textContent = stats.reports.total;
        }

        const activityList = document.getElementById('recent-activity-list');
        if (activityList && activity) {
            activityList.innerHTML = activity.map(a => {
                let badgeClass = 'bg-blue-100 text-blue-700'; // Default for report
                if (a.type === 'signup') badgeClass = 'bg-green-100 text-green-700';
                if (a.type === 'login') badgeClass = 'bg-amber-100 text-amber-700';
                return `
                <tr class="hover:bg-gray-50 transition">
                    <td class="px-6 py-4 font-medium text-gray-900">${a.action}</td>
                    <td class="px-6 py-4 text-gray-700">${a.name}</td>
                    <td class="px-6 py-4 text-gray-500 capitalize">${a.type}</td>
                    <td class="px-6 py-4 text-gray-500">${new Date(a.date).toLocaleString()}</td>
                    <td class="px-6 py-4"><span class="px-3 py-1 rounded-full text-xs font-medium ${badgeClass}">${a.status}</span></td>
                </tr>
                `;
            }).join('');
        }
    } catch (e) {
        console.error("DASHBOARD ERROR:", e);
    }
};

let currentRole = 'normal';
let currentStatus = 'all';
let searchQuery = '';

window.setRoleFilter = (role) => {
    currentRole = role;
    // Update UI active state
    ['normal', 'vet', 'refuge'].forEach(r => {
        const btn = document.getElementById(`filter-role-${r}`);
        if (btn) {
            btn.classList.toggle('bg-white', r === role);
            btn.classList.toggle('text-blue-600', r === role);
            btn.classList.toggle('shadow-sm', r === role);
            btn.classList.toggle('text-gray-600', r !== role);
        }
    });
    loadAccounts();
};

window.setStatusFilter = (status) => {
    currentStatus = status;
    loadAccounts();
};

window.searchAccounts = (query) => {
    searchQuery = query.toLowerCase();
    loadAccounts();
};

window.loadAccounts = async () => {
    try {
        // Fetch stats and user list in parallel to reduce lag
        const [stats, list] = await Promise.all([
            adminFetch('/stats'),
            adminFetch(`/accounts?role=${currentRole}`)
        ]);

        if (stats) {
            if (document.getElementById('count-users-tab')) document.getElementById('count-users-tab').textContent = stats.users.total;
            if (document.getElementById('count-vets-tab')) document.getElementById('count-vets-tab').textContent = stats.vets.total;
            if (document.getElementById('count-refuges-tab')) document.getElementById('count-refuges-tab').textContent = stats.refuges.total;
        }

        const container = document.getElementById('accounts-list');
        if (container && list) {
            const filtered = list.filter(u => {
                const matchesStatus = currentStatus === 'all' || u.account_status === currentStatus;
                const matchesSearch = !searchQuery || 
                    `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchQuery) ||
                    u.email.toLowerCase().includes(searchQuery);
                return matchesStatus && matchesSearch;
            });

            container.innerHTML = filtered.map(u => {
                const imgName = u.role === 'normal' ? 'user' : u.role;
                return `
                <tr class="hover:bg-gray-50 transition">
                    <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                            <img src="../SignIn/Images/defaults/${imgName}.png" class="w-10 h-10 rounded-full object-cover">
                            <span class="font-medium text-gray-900">${u.first_name} ${u.last_name}</span>
                        </div>
                    </td>
                    <td class="px-6 py-4 text-gray-600">${u.email}</td>
                    <td class="px-6 py-4 text-gray-900 capitalize">${u.role}</td>
                    <td class="px-6 py-4">
                        <span class="px-3 py-1 rounded-full text-xs font-medium ${u.account_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                            ${u.account_status}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-right">
                        <div class="flex items-center justify-end gap-2">
                            <button onclick="toggleUserStatus(${u.id}, '${u.account_status}')" title="Change Status" class="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                                <i data-lucide="${u.account_status === 'active' ? 'ban' : 'check-circle'}" class="w-4 h-4"></i>
                            </button>
                            <button onclick="deleteUser(${u.id})" title="Delete Account" class="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </td>
                `;
            }).join('') || '<tr><td colspan="5" class="py-10 text-center text-gray-400">No accounts found matching your criteria</td></tr>';
            
            if (window.lucide) lucide.createIcons();
        }
    } catch (e) { console.error("Accounts load error:", e); }
};

window.toggleUserStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    if (!confirm(`Switch user status to ${newStatus}?`)) return;
    
    const res = await fetch(`/api/admin/accounts/${id}/status`, {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({ status: newStatus })
    });
    
    if (res.ok) loadAccounts();
};

window.deleteUser = async (id) => {
    if (!confirm('Are you sure you want to delete this account? This action cannot be undone.')) return;
    
    const res = await fetch(`/api/admin/accounts/${id}`, {
        method: 'DELETE',
        headers: { 
            'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
    });
    
    if (res.ok) loadAccounts();
};

let currentReportFilter = 'all';
let reportSearchQuery = '';

window.setReportsFilter = (filter) => {
    currentReportFilter = filter;
    // Update UI
    ['all', 'pending', 'adopted'].forEach(f => {
        const btn = document.getElementById(`filter-reports-${f}`);
        if (btn) {
            if (f === filter) {
                btn.className = 'px-5 py-2 rounded-full bg-blue-600 text-white font-medium text-sm whitespace-nowrap shadow-md shadow-blue-200';
            } else {
                btn.className = 'px-5 py-2 rounded-full bg-white text-gray-600 font-medium text-sm whitespace-nowrap border border-gray-200 hover:bg-gray-50';
            }
        }
    });
    loadReports();
};

window.searchReports = (query) => {
    reportSearchQuery = query.toLowerCase();
    loadReports();
};

window.loadReports = async () => {
    const list = await adminFetch('/reports');
    const container = document.getElementById('reports-list');
    if (container && list) {
        const filtered = list.filter(r => {
            const matchesFilter = currentReportFilter === 'all' || r.status.toLowerCase() === currentReportFilter;
            const matchesSearch = !reportSearchQuery || 
                r.reporter.toLowerCase().includes(reportSearchQuery) ||
                r.animal_type.toLowerCase().includes(reportSearchQuery);
            return matchesFilter && matchesSearch;
        });

        container.innerHTML = filtered.map(r => `
            <tr class="hover:bg-gray-50 transition">
                <td class="px-6 py-4"><input type="checkbox" value="${r.id}" class="report-checkbox rounded border-gray-300 text-blue-600 focus:ring-blue-600"></td>
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        <img src="../SignIn/Images/defaults/user.png" class="w-8 h-8 rounded-full object-cover">
                        <span class="font-medium text-gray-900">${r.reporter}</span>
                    </div>
                </td>
                <td class="px-6 py-4 text-gray-600 capitalize">${r.animal_type}</td>
                <td class="px-6 py-4 text-gray-600">${new Date(r.date).toLocaleDateString()}</td>
                <td class="px-6 py-4"><span class="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">${r.status}</span></td>
                <td class="px-6 py-4 text-right">
                    <button onclick="deleteReport(${r.id})" class="text-red-600 font-medium hover:underline text-sm">Delete</button>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="6" class="py-10 text-center text-gray-400">No reports found</td></tr>';
    }
};

window.deleteReport = async (id) => {
    if (!confirm('Format delete this report?')) return;
    // We use the same accounts deletion logic if reports were a separate table, but here they are 'demands'
    // I noticed I don't have a DELETE /reports route yet in server.js. I should add it.
    const res = await fetch(`/api/admin/reports/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
    });
    if (res.ok) loadReports();
};

window.deleteSelectedReports = async () => {
    const selected = Array.from(document.querySelectorAll('.report-checkbox:checked')).map(cb => cb.value);
    if (selected.length === 0) return alert('Please select reports to delete');
    if (!confirm(`Delete ${selected.length} selected reports?`)) return;

    for (const id of selected) {
        await fetch(`/api/admin/reports/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
        });
    }
    loadReports();
};

window.searchDashboard = (query) => {
    const q = query.toLowerCase();
    const rows = document.querySelectorAll('#recent-activity-list tr');
    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(q) ? '' : 'none';
    });
};

window.loadProfile = async () => {
    const u = await adminFetch('/profile');
    if (u) {
        // UI Elements
        document.getElementById('profile-name').textContent = `${u.first_name} ${u.last_name}`;
        document.getElementById('profile-role').textContent = u.role;
        document.getElementById('profile-dates').textContent = `Member since ${new Date(u.created_at).toLocaleDateString()} • Last login: ${u.last_login_at ? new Date(u.last_login_at).toLocaleString() : 'Just now'}`;
        
        // Form Fields
        document.getElementById('admin-fname').value = u.first_name;
        document.getElementById('admin-lname').value = u.last_name;
        document.getElementById('admin-email').value = u.email;
        
        // Header / Sidebar Sync
        const name = `${u.first_name} ${u.last_name}`;
        document.getElementById('header-user-name').textContent = name;
        document.getElementById('side-user-name').textContent = name;
        document.getElementById('header-last-login').textContent = u.last_login_at ? new Date(u.last_login_at).toLocaleTimeString() : 'Online';
    }
};

window.updateProfile = async () => {
    const first_name = document.getElementById('admin-fname').value;
    const last_name = document.getElementById('admin-lname').value;
    const email = document.getElementById('admin-email').value;

    const res = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({ first_name, last_name, email })
    });

    if (res.ok) {
        alert('Profile updated successfully!');
        loadProfile();
    } else {
        alert('Failed to update profile');
    }
};

window.changePassword = async () => {
    const current = document.getElementById('current-password').value;
    const newPass = document.getElementById('new-password').value;
    const confirmPass = document.getElementById('confirm-password').value;

    if (newPass !== confirmPass) return alert('Passwords do not match');

    const res = await fetch('/api/admin/profile/password', {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({ current, newPass })
    });

    if (res.ok) {
        alert('Password changed successfully!');
        document.getElementById('password-form').reset();
    } else {
        const data = await res.json();
        alert(data.error || 'Password update failed');
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('admin-user').value;
            const password = document.getElementById('admin-pass').value;
            const errorArea = document.getElementById('admin-error');

            try {
                const res = await fetch('/api/admin/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                if (res.ok) {
                    localStorage.setItem('admin_token', data.token);
                    window.location.href = 'index.html';
                } else {
                    errorArea.textContent = data.error || 'Login failed';
                }
            } catch (err) {
                errorArea.textContent = 'Server error';
            }
        });
    }

    // Auto-login data fetch (only on dashboard page)
    if (localStorage.getItem('admin_token') && document.getElementById('app')) {
        loadDashboard();
        loadProfile();
    }
});
