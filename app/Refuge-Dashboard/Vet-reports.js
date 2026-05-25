let allVetReports = [];

const token = localStorage.getItem('token');
if (!token) window.location.href = '/SignIn/SignInPage.html';
const getAuthHeaders = () => ({ 'Authorization': `Bearer ${token}` });

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('http://localhost:3000/api/refuge/vets/reports', { headers: getAuthHeaders() });
        const allReports = await response.json();

        // Only show reports where vet recommended shelter placement
        allVetReports = allReports.filter(r => r.shelter_placement === 'yes');
        let filteredVetReports = [...allVetReports];

        const tbody = document.querySelector('.req-table tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if(allVetReports.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No vet reports available.</td></tr>';
            return;
        }

        let currentPage = 0;
        const limit = 4;

        const renderTable = () => {
            if (!tbody) return;
            tbody.innerHTML = '';

            const start = currentPage * limit;
            const end = start + limit;
            const paginatedReports = filteredVetReports.slice(start, end);

            if(filteredVetReports.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No vet reports match the search.</td></tr>';
                return;
            }

            paginatedReports.forEach(report => {
                const tr = document.createElement('tr');
                const dateStr = new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                tr.innerHTML = `
                    <td class="id"><strong>AN-${report.demand_id}</strong></td>
                    <td>Dr. ${report.vet_last_name || 'Unknown'}</td>
                    <td><span>${report.diagnosis}</span></td>
                    <td>${dateStr}</td>
                    <td><button style="background:transparent; border:none; color: var(--main-color); font-weight:700; cursor:pointer;" onclick="viewReportDetails(${report.id}); return false;">View Report</button></td>
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
                if ((currentPage + 1) * limit < filteredVetReports.length) {
                    currentPage++;
                    renderTable();
                }
            });
        }

        const searchBar = document.getElementById('search-bar');
        if (searchBar) {
            searchBar.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase().trim();
                if (!query) {
                    filteredVetReports = [...allVetReports];
                } else {
                    filteredVetReports = allVetReports.filter(report => {
                        const vetName = ('Dr. ' + (report.vet_last_name || '')).toLowerCase();
                        const diag = (report.diagnosis || '').toLowerCase();
                        const animalId = ('an-' + report.demand_id).toLowerCase();
                        return vetName.includes(query) || diag.includes(query) || animalId.includes(query);
                    });
                }
                currentPage = 0;
                renderTable();
            });
            // Prevent form submission reloading the page
            const searchForm = searchBar.closest('form');
            if (searchForm) {
                searchForm.addEventListener('submit', e => e.preventDefault());
            }
        }

        renderTable();

    } catch (err) {
        console.error('Error fetching vet reports:', err);
    }
});

window.viewReportDetails = function(reportId) {
    const report = allVetReports.find(r => r.id === reportId);
    if (!report) return;

    document.getElementById('rep-title').textContent = 'Clinical Report: AN-' + report.demand_id;
    document.getElementById('rep-patient').textContent = 'AN-' + report.demand_id;

    const dateStr = new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    document.getElementById('rep-date').textContent = dateStr;
    document.getElementById('rep-vet').textContent = 'Dr. ' + (report.vet_last_name || 'Unknown');

    document.getElementById('rep-diag').textContent = report.diagnosis || 'None';
    document.getElementById('rep-treat').textContent = report.treatment || 'None';
    document.getElementById('rep-notes').textContent = report.notes || 'None';
    document.getElementById('rep-placement').textContent = (report.shelter_placement || 'NO').toUpperCase();
};
