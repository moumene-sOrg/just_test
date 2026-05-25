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

        if (stats) {
            document.getElementById('stat-users').textContent = stats.users.total;
            document.getElementById('stat-vets').textContent = stats.vets.total;
            document.getElementById('stat-refuges').textContent = stats.refuges.total;
            document.getElementById('stat-reports').textContent = stats.reports.total;
        }

        const activityList = document.getElementById('recent-activity-list');
        if (activityList && activity) {
            activityList.innerHTML = activity.map(a => `
                <tr class="hover:bg-gray-50 transition">
                    <td class="px-6 py-4 font-medium text-gray-900">${a.action}</td>
                    <td class="px-6 py-4 text-gray-700">${a.name}</td>
                    <td class="px-6 py-4 text-gray-500">Activity</td>
                    <td class="px-6 py-4 text-gray-500">${new Date(a.date).toLocaleDateString()}</td>
                    <td class="px-6 py-4"><span class="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">${a.status}</span></td>
                </tr>
            `).join('');
        }
    } catch (e) {
        console.error("DASHBOARD ERROR:", e);
    }
};

window.loadAccounts = async () => {
    const list = await adminFetch('/accounts');
    const container = document.getElementById('accounts-list');
    if (container && list) {
        container.innerHTML = list.map(u => `
            <tr class="hover:bg-gray-50 transition">
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        <img src="../SignIn/Images/defaults/${u.role}.png" class="w-10 h-10 rounded-full object-cover">
                        <span class="font-medium text-gray-900">${u.first_name} ${u.last_name}</span>
                    </div>
                </td>
                <td class="px-6 py-4 text-gray-600">${u.email}</td>
                <td class="px-6 py-4 text-gray-900 capitalize">${u.role}</td>
                <td class="px-6 py-4"><span class="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">${u.account_status}</span></td>
                <td class="px-6 py-4 text-right">
                    <button class="p-2 text-red-500 hover:bg-red-50 rounded-lg"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </td>
            </tr>
        `).join('');
        lucide.createIcons();
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
                    document.getElementById('login-page').style.display = 'none';
                    document.getElementById('app').classList.remove('hidden');
                    loadDashboard();
                } else {
                    errorArea.textContent = data.error || 'Login failed';
                }
            } catch (err) {
                errorArea.textContent = 'Server error';
            }
        });
    }

    /* Auto-login check (Disabled for testing)
    if (localStorage.getItem('admin_token')) {
        const lp = document.getElementById('login-page');
        if (lp) lp.style.display = 'none';
        document.getElementById('app').classList.remove('hidden');
        loadDashboard();
    } */
});
