const token = localStorage.getItem('token');
if (!token) window.location.href = '/SignIn/SignInPage.html';
const getAuthHeaders = () => ({ 'Authorization': `Bearer ${token}` });

const deskItems = document.querySelectorAll("aside.desk ul li");
const mobItems = document.querySelectorAll("aside.mob ul li");

function setActive(index) {
    deskItems.forEach(el => el.classList.remove("active"));
    mobItems.forEach(el => el.classList.remove("active"));

    deskItems[index].classList.add("active");
    mobItems[index].classList.add("active");
}

deskItems.forEach(function(item, index) {
    item.addEventListener("click", function() {
        setActive(index);
    });
});

mobItems.forEach(function(item, index) {
    item.addEventListener("click", function() {
        setActive(index);
    });
});

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // ── Populate welcome title with real refuge name ──────────────
        try {
            const settingsRes = await fetch(`http://localhost:3000/api/refuge/refuges/settings`, { headers: getAuthHeaders() });
            if (settingsRes.ok) {
                const settings = await settingsRes.json();
                const refugeName = settings.first_name || 'Shelter Manager';
                const welcomeTitle = document.getElementById('welcome-title');
                if (welcomeTitle) welcomeTitle.textContent = `Welcome back, ${refugeName}`;
            }
        } catch (_) { /* non-critical, keep default text */ }

        // Fetch shelter requests
        const response = await fetch(`http://localhost:3000/api/refuge/shelter-requests`, { headers: getAuthHeaders() });
        const newReqs = await response.json();

        // Update stats
        const newReqSpan = document.querySelector('.new-req span.req');
        if (newReqSpan) newReqSpan.textContent = newReqs.length + ' new';

        const vetRes = await fetch('http://localhost:3000/api/refuge/vets/reports', { headers: getAuthHeaders() });
        const allReports = await vetRes.json();
        const repSpan = document.querySelector('.vet-rep span.rep');
        if (repSpan) {
            const shelterReports = allReports.filter(r => r.shelter_placement === 'yes');
            repSpan.textContent = shelterReports.length + ' updated';
        }

        // Fetch all demands for Adopted Animals List Pagination
        const allDemandsRes = await fetch(`http://localhost:3000/api/refuge/demands`, { headers: getAuthHeaders() });
        const demands = await allDemandsRes.json();

        // Adopted Animals List Pagination
        const adoptedDemands = demands.filter(d => d.status === 'accepted');
        let currentPage = 0;
        const limit = 4;

        const renderTable = () => {
            const tbody = document.getElementById('adopted-preview-body');
            if (!tbody) return;
            tbody.innerHTML = '';

            const start = currentPage * limit;
            const end = start + limit;
            const paginatedDemands = adoptedDemands.slice(start, end);

            if (adoptedDemands.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No adopted animals.</td></tr>';
                return;
            }

            paginatedDemands.forEach(demand => {
                const tr = document.createElement('tr');
                const dateStr = new Date(demand.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                tr.innerHTML = `
                    <td><strong>AN-${demand.id}</strong></td>
                    <td><span>${demand.animal_type}</span></td>
                    <td>${dateStr}</td>
                    <td><button class="view-det-btn" data-id="${demand.id}">View Details</button></td>
                `;
                tbody.appendChild(tr);
            });

            // Re-attach popup listeners for the current page
            document.querySelectorAll('.view-det-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.target.getAttribute('data-id');
                    const d = adoptedDemands.find(x => x.id == id);

                    document.getElementById('popup-id').textContent = 'AN-' + d.id;
                    document.getElementById('popup-type').textContent = d.animal_type;
                    document.getElementById('popup-status').textContent = d.status;
                    document.getElementById('popup-location').textContent = d.location || d.animal_status || 'N/A';

                    const popupImg = document.querySelector('#popup .image img');
                    if (popupImg) {
                        popupImg.src = d.photo ? 'http://localhost:3000/photo/' + d.photo : './images/popup-profile.jpg';
                    }

                    document.getElementById('popup').classList.add('active');
                    document.getElementById('overlay').classList.add('active');
                });
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
                if ((currentPage + 1) * limit < adoptedDemands.length) {
                    currentPage++;
                    renderTable();
                }
            });
        }

        renderTable();

        // Close popup logic
        const closeX = document.getElementById('close-x');
        const closeBtn = document.getElementById('close-btn');
        const overlay = document.getElementById('overlay');

        const closePopup = () => {
            document.getElementById('popup').classList.remove('active');
            document.getElementById('overlay').classList.remove('active');
        };

        if(closeX) closeX.addEventListener('click', closePopup);
        if(closeBtn) closeBtn.addEventListener('click', closePopup);
        if(overlay) overlay.addEventListener('click', closePopup);

    } catch (err) {
        console.error('Error fetching data for home page:', err);
    }
});