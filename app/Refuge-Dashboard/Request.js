const token = localStorage.getItem('token');
if (!token) window.location.href = '/SignIn/SignInPage.html';
const getAuthHeaders = () => ({ 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' });

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Single endpoint: demands where vet said shelter_placement = 'yes'
        const response = await fetch('http://localhost:3000/api/refuge/shelter-requests', {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            console.error('Failed to fetch shelter requests:', response.status);
            return;
        }

        const shelterRequests = await response.json();

        let currentPage = 0;
        const limit = 4;

        const renderTable = () => {
            const tbody = document.querySelector('.req-table tbody');
            if (!tbody) return;
            tbody.innerHTML = '';

            const start = currentPage * limit;
            const end   = start + limit;
            const paginatedRequests = shelterRequests.slice(start, end);

            if (shelterRequests.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No pending housing requests.</td></tr>';
                return;
            }

            paginatedRequests.forEach(demand => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>AN-${demand.id}</strong></td>
                    <td>${demand.vet_name ? 'Dr. ' + demand.vet_name : 'Refuge System'}</td>
                    <td><span>${demand.animal_type}</span></td>
                    <td><button class="view-det-btn" data-id="${demand.id}">View Details</button></td>
                    <td class="rej-acc">
                        <button class="reject" onclick="updateDemand(${demand.id}, 'rejected')">Reject</button>
                        <button class="accept" onclick="updateDemand(${demand.id}, 'accepted')">Accept</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            // Attach popup listeners
            document.querySelectorAll('.view-det-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.target.getAttribute('data-id');
                    const d  = shelterRequests.find(x => x.id == id);

                    document.getElementById('popup-id').textContent       = 'AN-' + d.id;
                    document.getElementById('popup-type').textContent     = d.animal_type;
                    document.getElementById('popup-status').textContent   = d.status;
                    document.getElementById('popup-location').textContent = d.location || d.animal_status || 'N/A';

                    const popupImg = document.querySelector('#popup .image img');
                    if (popupImg) {
                        popupImg.src = d.photo
                            ? 'http://localhost:3000/photo/' + d.photo
                            : './images/popup-profile.jpg';
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
                if (currentPage > 0) { currentPage--; renderTable(); }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if ((currentPage + 1) * limit < shelterRequests.length) { currentPage++; renderTable(); }
            });
        }

        renderTable();

        // Close popup
        const closeX   = document.getElementById('close-x');
        const closeBtn = document.getElementById('close-btn');
        const overlay  = document.getElementById('overlay');

        const closePopup = () => {
            document.getElementById('popup').classList.remove('active');
            document.getElementById('overlay').classList.remove('active');
        };

        if (closeX)   closeX.addEventListener('click', closePopup);
        if (closeBtn) closeBtn.addEventListener('click', closePopup);
        if (overlay)  overlay.addEventListener('click', closePopup);

    } catch (err) {
        console.error('Error fetching shelter requests:', err);
    }
});

async function updateDemand(id, status) {
    try {
        await fetch(`http://localhost:3000/api/refuge/demands/${id}/status`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status })
        });
        window.location.reload();
    } catch (err) {
        console.error('Failed to update status:', err);
    }
}