const token = localStorage.getItem('token');
if (!token) window.location.href = '/SignIn/SignInPage.html';
const getAuthHeaders = () => ({ 'Authorization': `Bearer ${token}` });

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch(`http://localhost:3000/api/refuge/demands`, { headers: getAuthHeaders() });
        const demands = await response.json();

        const tbody = document.querySelector('.req-table tbody');
        if (!tbody) return;

        // All accepted animals
        const adopted = demands.filter(d => d.status === 'accepted');

        let currentPage = 0;
        const limit = 4;
        let activeFilter = 'All';
        let searchQuery = '';

        // Known categories mapped to filter labels
        const categoryMap = {
            'cats': ['cat'],
            'dogs': ['dog'],
            'birds': ['bird'],
            'rabbits': ['rabbit'],
            'others': ['other', 'snake', 'lizard', 'hamster', 'turtle', 'fish']
        };

        const getFiltered = () => {
            return adopted.filter(demand => {
                const type = (demand.animal_type || '').toLowerCase();
                const id = 'an-' + demand.id;

                // Filter by category
                let categoryMatch = true;
                if (activeFilter !== 'All') {
                    const key = activeFilter.toLowerCase();
                    const known = categoryMap[key];
                    if (known) {
                        categoryMatch = known.some(k => type.includes(k));
                    } else {
                        categoryMatch = type.includes(key);
                    }
                }

                // Filter by search
                let searchMatch = true;
                if (searchQuery) {
                    searchMatch = type.includes(searchQuery.toLowerCase()) || id.includes(searchQuery.toLowerCase());
                }

                return categoryMatch && searchMatch;
            });
        };

        const renderTable = () => {
            tbody.innerHTML = '';

            const filtered = getFiltered();
            const start = currentPage * limit;
            const end = start + limit;
            const paginated = filtered.slice(start, end);

            if (filtered.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 20px;">No animals match your search.</td></tr>';
                return;
            }

            paginated.forEach(demand => {
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

            // Attach popup listeners
            document.querySelectorAll('.view-det-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.target.getAttribute('data-id');
                    const d  = filtered.find(x => x.id == id);

                    document.getElementById('popup-id').textContent       = 'AN-' + d.id;
                    document.getElementById('popup-type').textContent     = d.animal_type;
                    document.getElementById('popup-status').textContent   = d.status || 'Accepted';
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
                if ((currentPage + 1) * limit < getFiltered().length) { currentPage++; renderTable(); }
            });
        }

        // Search input
        const searchBar = document.getElementById('search-bar');
        if (searchBar) {
            searchBar.addEventListener('input', () => {
                searchQuery = searchBar.value.trim();
                currentPage = 0;
                renderTable();
            });
        }

        // Filter pills
        const filterItems = document.querySelectorAll('#list li');
        filterItems.forEach(li => {
            li.addEventListener('click', () => {
                filterItems.forEach(f => f.classList.remove('active'));
                li.classList.add('active');
                activeFilter = li.textContent.trim();
                currentPage = 0;
                renderTable();
            });
        });

        // Close popup logic
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

        renderTable();

    } catch (err) {
        console.error('Error fetching adopted animals:', err);
    }
});
