const token = localStorage.getItem('token');
if (!token) window.location.href = '/SignIn/SignInPage.html';
const getAuthHeaders = () => ({ 'Authorization': `Bearer ${token}` });

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Fetch refuge profile details
        try {
            const refugeRes = await fetch(`http://localhost:3000/api/refuge/refuges/settings`, { headers: getAuthHeaders() });
            if (refugeRes.ok) {
                const refugeData = await refugeRes.json();
                document.getElementById('refuge-name').textContent = refugeData.first_name + (refugeData.last_name ? ' ' + refugeData.last_name : '');
                const addr = document.getElementById('refuge-address');
                if (addr) addr.textContent = refugeData.address || 'Address not provided';

                // Calculate pending requests (needs shelter placement but not processed yet)
                const reqRes = await fetch(`http://localhost:3000/api/refuge/shelter-requests`, { headers: getAuthHeaders() });
                const reqData = await reqRes.json();
                const pendingRequestsEl = document.getElementById('pending-requests');
                if (pendingRequestsEl) pendingRequestsEl.textContent = reqData.length || 0;
            }
        } catch (err) {
            console.error('Error fetching refuge info:', err);
        }

        // Fetch assignments specific to THIS refuge
        const response = await fetch(`http://localhost:3000/api/refuge/demands-assignments`, { headers: getAuthHeaders() });
        const assignments = await response.json();

        // Compute Stats
        const totalHandled = assignments.length;
        const totalHostedEl = document.getElementById('total-hosted');
        if (totalHostedEl) totalHostedEl.textContent = totalHandled;

        // Successful adoptions
        // Assuming completed/accepted demands counts towards success logic
        const adoptionsCount = assignments.filter(a => a.demand_status === 'completed' || a.demand_status === 'accepted').length;
        const adoptionsEl = document.getElementById('successful-adoptions');
        if (adoptionsEl) adoptionsEl.textContent = adoptionsCount;

        const tbody = document.getElementById('hosting-history-body');
        if (!tbody) return;

        tbody.innerHTML = '';

        // History depends on assignments
        const historyDemands = assignments;

        let currentPage = 0;
        const limit = 4;

        const renderTable = () => {
            if (!tbody) return;
            tbody.innerHTML = '';

            const start = currentPage * limit;
            const end = start + limit;
            const paginatedDemands = historyDemands.slice(start, end);

            if (historyDemands.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No history records found.</td></tr>';
                return;
            }

            paginatedDemands.forEach(a => {
                const tr = document.createElement('tr');
                // The demands assignments table doesn't have created_at out of the box... wait, the server query actually doesn't have it either for da, but it has da.id. We can just say Active or Accepted
                // We'll just display animal_type and demand_status
                const statusColor = a.demand_status === 'accepted' ? 'green' : (a.demand_status === 'rejected' ? 'red' : 'gray');
                const statusBg = a.demand_status === 'accepted' ? '#dcfce7' : (a.demand_status === 'rejected' ? '#fee2e2' : '#f3f4f6');
                const dateStr = a.demand_date ? new Date(a.demand_date).toLocaleDateString() : 'N/A';

                tr.innerHTML = `
                    <td><strong>AN-${a.demand_id}</strong><p>${a.animal_type}</p></td>
                    <td>${dateStr}</td>
                    <td><span style="color: ${statusColor}; background-color: ${statusBg}; padding: 5px 10px; border-radius: 20px; font-weight: bold; text-transform: capitalize;">${a.demand_status}</span></td>
                    <td><button id="remove" onclick="deleteHistory(${a.demand_id})" style="border:none; background:transparent; cursor:pointer; color:#ef4444; font-size:16px;"><i class="fa-regular fa-trash-can"></i></button></td>
                `;
                tbody.appendChild(tr);
            });
        };

        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');

        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (currentPage > 0) {
                    currentPage--;
                    renderTable();
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if ((currentPage + 1) * limit < historyDemands.length) {
                    currentPage++;
                    renderTable();
                }
            });
        }

        renderTable();

    } catch (err) {
        console.error('Error fetching demands for profile:', err);
    }
});

async function deleteHistory(id) {
    if (!confirm('Are you sure you want to completely delete this record?')) return;
    try {
        await fetch(`http://localhost:3000/api/refuge/demands/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        window.location.reload();
    } catch(err) {
        console.error('Failed to delete demand:', err);
    }
}
