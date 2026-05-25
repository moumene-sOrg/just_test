
// ---------------- REQUESTS DATA ----------------

const API_BASE = "http://localhost:3000/api/vet";
const token = localStorage.getItem('token');
if (!token) window.location.href = '../SignIn/SignInPage.html';
const getAuthHeaders = () => ({ 'Authorization': `Bearer ${token}` });

let requests = [];

async function fetchRequests() {
    try {
        const response = await fetch(`${API_BASE}/demands`, { headers: getAuthHeaders() });
        const data = await response.json();

        // Map database fields to the frontend expected ones
        // Normalize DB status → frontend status:
        //   "pending"   → "pending"     (shows Accept/Reject)
        //   "accepted"  → "IN_PROGRESS" (shows Examine button)
        //   "completed" → "COMPLETED"   (shows View History)
        //   "rejected"  → "REJECTED"    (filtered out)
        const statusMap = {
            'pending': 'pending',
            'accepted': 'IN_PROGRESS',
            'completed': 'COMPLETED',
            'rejected': 'REJECTED'
        };

        requests = data.map(d => {
            return {
                id: d.demand_id,
                petType: d.petType,
                status: statusMap[d.status] || d.status,
                ownerName: d.ownerFirstName + ' ' + d.ownerLastName,
                createdtime: d.created_at || d.event_date || new Date().toISOString(),
                description: d.symptoms || "No details provided.",
                animalStatus: d.animal_status || "Not Specified",
                Adress: d.address || "Unknown",
                petpic: d.photo ? `http://localhost:3000/photo/${d.photo}` : null
            };
        });

        refreshUI();
        fetchVetProfile(); // Run after requests are loaded so pending count is accurate
    } catch (err) {
        console.error("Failed to fetch requests", err);
    }
}

async function fetchVetProfile() {
    try {
        const response = await fetch(`${API_BASE}/vets/me`, { headers: getAuthHeaders() });
        if (!response.ok) return;
        const vet = await response.json();

        document.querySelectorAll("#VetName").forEach(el => {
            el.textContent = ' ' + vet.last_name;
        });

        const specialty = document.getElementById("VetSpeciality");
        if (specialty) {
            specialty.textContent = vet.diplomat || "Veterinarian";
        }

        // Name/specialty loaded — dashboard message is updated in refreshUI() with live count
    } catch (err) {
        console.error("Failed to load vet profile", err);
    }
}

fetchRequests(); // fetchVetProfile() is called inside fetchRequests() after data is ready

// ---------------- PAGINATION ----------------

let currentPage = 1;
const rowsPerPage = 4;

const infoSpan = document.getElementById("table-info");
const prevBtn = document.getElementById("prevPage");
const nextBtn = document.getElementById("nextPage");

// ---------------- TIME AGO ----------------

function timeAgo(dateString) {
    const now = new Date();
    const created = new Date(dateString);
    const diff = Math.floor((now - created) / 1000);

    if (diff < 60) return "Just now";
    if (diff < 3600) return Math.floor(diff / 60) + " minutes ago";
    if (diff < 86400) return Math.floor(diff / 3600) + " hours ago";

    return Math.floor(diff / 86400) + " days ago";
}

// ---------------- CREATE CARD ----------------

function createCard(data) {
    let statusHTML = "";
    let buttonsHTML = "";

    const status = data.status.toUpperCase();

    if (status === "PENDING") {
        statusHTML = `<span class="status-pending">PENDING</span>`;
        buttonsHTML = `<div class="panding-button">
            <button class="accept-button" data-id="${data.id}">Accept</button>
            <button class="decline-button" data-id="${data.id}">Reject</button>
        </div>`;
    } else if (status === "IN_PROGRESS") {
        statusHTML = `<span class="status-progress">IN PROGRESS</span>`;
        buttonsHTML = `<button class="examine-button" data-id="${data.id}">
            <i class="fa-solid fa-stethoscope"></i>
            <span>Examine</span>
        </button>`;
    } else if (status === "COMPLETED") {
        statusHTML = `<span class="status-completed">COMPLETED</span>`;
        buttonsHTML = `<button class="history-button" data-id="${data.id}">View History</button>`;
    }

    return `
    <div class="card">
        <div class="top">
            <div class="animal-info">
                <i class="fa-solid fa-paw"></i>
                <div>
                    <h3 class="pet-name">${data.petType}</h3>
                </div>
            </div>
            ${statusHTML}
        </div>
        <div class="user-info">
            <div class="time-owner-info">
                <i class="fa-regular fa-user"></i>
                <span>${data.ownerName}</span>
            </div>
            <div class="time-owner-info">
                <i class="fa-regular fa-clock"></i>
                <span>${timeAgo(data.createdtime)}</span>
            </div>
        </div>
        <a href="#" class="view-details" data-id="${data.id}">
                View Details
            </a>
        <div class="button">
            ${buttonsHTML}
        </div>
    </div>
    `;
}

// ---------------- CREATE TABLE ROW ----------------

function createRow(data) {
    let statusHTML = "";
    let buttonsHTML = "";
    const status = data.status.toUpperCase();

    if (status === "PENDING") {
        statusHTML = `<span class="status-pending">Pending</span>`;
        buttonsHTML = `<div class="panding-button desktop">
            <button class="accept-button" data-id="${data.id}">Accept</button>
            <button class="decline-button" data-id="${data.id}">Reject</button>
        </div>`;
    } else if (status === "IN_PROGRESS") {
        statusHTML = `<span class="status-progress">In Progress</span>`;
        buttonsHTML = `<button class="examine-button" data-id="${data.id}">Examine</button>`;
    } else if (status === "COMPLETED") {
        statusHTML = `<span class="status-completed">Completed</span>`;
        buttonsHTML = `<button class="history-button desktop" data-id="${data.id}">View History</button>`;
    }

    return `
    <tr>
        <td>${data.petType}</td>
        <td><i class="fa-solid fa-notes-medical" style="color: #64748b; margin-right: 5px;"></i> ${data.animalStatus}</td>
        <td>${data.ownerName}</td>
            <td>
            <a href="#" class="view-details" data-id="${data.id}">
                View Details
            </a>
        </td>
        <td>${statusHTML}</td>
        <td>${buttonsHTML}</td>
    </tr>
    `;
}

// ---------------- RENDER FUNCTIONS ----------------

function renderRequests(container, data) {
    if (!container) return;
    container.innerHTML = "";
    data.forEach(r => {
        container.innerHTML += createCard(r);
    });
}

function renderTable(container, data) {
    if (!container) return;

    const total = data.length;
    // Fix pagination start bug. CurrentPage goes out of bounds if filters are applied
    const totalPages = Math.ceil(total / rowsPerPage);
    if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pageData = data.slice(start, end);

    container.innerHTML = "";
    pageData.forEach(r => {
        container.innerHTML += createRow(r);
    });

    if (infoSpan) {
        const from = total === 0 ? 0 : start + 1;
        const to = Math.min(start + rowsPerPage, total);
        infoSpan.textContent = `Showing ${from} to ${to} of ${total} results`;
    }
}

// ---------------- MODAL  ----------------

function showModal(data) {
    const modal = document.getElementById("detailsModal");
    const modalBody = document.getElementById("modalBody");

    // Show DB image if available, otherwise a clean placeholder
    const imageHTML = data.petpic
        ? `<img src="${data.petpic}" alt="${data.petType}" class="modal-pet-pic"/>`
        : `<div class="modal-pet-pic no-image-placeholder">
               <i class="fa-solid fa-image"></i>
               <span>No image available</span>
           </div>`;

    modalBody.innerHTML = `<div class="pet-infos-popup">
        ${imageHTML}

        <div class="pet-information">
        <h2>Animal information</h2>
        <div class="pet-information-line">
        <div class="pet-details"><p class="pet-information-line-title">Pet Type:</p><p class="pet-information-line-text"> ${data.petType}</p></div>
        <div class="pet-details"><p class="pet-information-line-title">Adress:</p><p class="pet-information-line-text">${data.Adress}</p></div>
        </div>
        <div class="pet-information-line">
        <div class="pet-details"><p class="pet-information-line-title">Owner:</p><p class="pet-information-line-text"> ${data.ownerName}</p></div>
        <div class="pet-details"><p class="pet-information-line-title">Status:</p><p class="pet-information-line-text"> ${data.animalStatus}</p></div>
        </div>
        <p class="pet-information-line-title">Description:</p><p class="pet-information-line-text">${data.description}</p>
        </div>
    </div>
    `;

    modal.classList.remove("hidden");
}

function closeModal() {
    const modal = document.getElementById("detailsModal");
    modal.classList.add("hidden");
}

// ---------------- EVENTS MODAL ----------------

document.addEventListener("click", function (e) {

    if (e.target.classList.contains("view-details")) {
        e.preventDefault();
        const id = e.target.getAttribute("data-id");
        const request = requests.find(r => r.id == id);
        showModal(request);
    }

    if (e.target.id === "closeModal") {
        closeModal();
    }
});

window.addEventListener("click", function (e) {
    const modal = document.getElementById("detailsModal");
    if (e.target === modal) {
        closeModal();
    }
});
// ---------------- GET CONTAINERS ----------------

const container1 = document.getElementById("request-container");
const container2 = document.getElementById("request-cards");
const desktopContainer = document.getElementById("request-cards-desktop");

// ---------------- RESPONSIVE RENDER ----------------

let currentStatusFilter = "all";

function renderResponsive() {
    // Filter the data based on current tab filter
    let displayData = requests.filter(r => r.status !== "REJECTED");

    if (currentStatusFilter !== "all") {
        displayData = displayData.filter(r => r.status.toUpperCase() === currentStatusFilter.toUpperCase());
    }

    if (window.innerWidth >= 815) {
        renderTable(desktopContainer, displayData);
    } else {
        renderRequests(container2, displayData);
    }
}

// ---------------- REFRESH UI ----------------

function refreshUI() {
    if (container1) {
        // Only show pending on the home page newest container
        const pendingReqs = requests.filter(r => r.status.toUpperCase() === "PENDING");
        const newestThree = [...pendingReqs].sort((a, b) => new Date(b.createdtime) - new Date(a.createdtime)).slice(0, 3);
        renderRequests(container1, newestThree);
    }
    renderResponsive();
    if (typeof renderAnimalInfo === "function") {
        renderAnimalInfo();
    }

    // Update dashboard message with real pending count
    const dashboardMessage = document.getElementById("dashboardMessage");
    if (dashboardMessage) {
        const pendingCount = requests.filter(r => r.status.toUpperCase() === "PENDING").length;
        dashboardMessage.textContent = `Your practice is flourishing today. You have ${pendingCount} pending appointment request${pendingCount !== 1 ? 's' : ''} ready for review.`;
    }
}

// ---------------- TAB FILTERS ----------------
const filterButtons = document.querySelectorAll(".cases-section button");

// Initialize "All" button as visually active on page load
const defaultActiveBtn = document.querySelector('.cases-section button[data-status="all"]');
if (defaultActiveBtn) {
    defaultActiveBtn.classList.add("active");
}

filterButtons.forEach(btn => {
    btn.addEventListener("click", function (e) {
        currentStatusFilter = e.target.getAttribute("data-status");
        currentPage = 1; // Reset to page 1 on filter change
        refreshUI();
    });
});

// refreshUI is called by fetchRequests, so avoiding initial explicit call
// refreshUI();
window.addEventListener("resize", renderResponsive);

// ---------------- PAGINATION BUTTONS ----------------

if (prevBtn) {
    prevBtn.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            renderResponsive();
        }
    });
}

if (nextBtn) {
    nextBtn.addEventListener("click", () => {
        const filtered = requests.filter(r => r.status !== "REJECTED");
        const totalPages = Math.ceil(filtered.length / rowsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderResponsive();
        }
    });
}

// ---------------- BUTTON EVENTS ----------------

function handleButtons(container) {
    if (!container) return;

    container.addEventListener("click", async function (e) {
        const button = e.target.closest("button");
        if (!button) return;

        const id = Number(button.dataset.id);
        const request = requests.find(r => r.id === id);
        if (!request) return;

        // ACCEPT
        if (button.classList.contains("accept-button")) {
            try {
                await fetch(`${API_BASE}/demands/${id}/accept`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                    body: JSON.stringify({})
                });
                // Optimistic UI update
                request.status = "IN_PROGRESS";
                refreshUI();
            } catch (err) {
                console.error("Failed to accept demand", err);
                alert("Failed to accept Case.");
            }
        }

        // REJECT
        if (button.classList.contains("decline-button")) {
            try {
                await fetch(`${API_BASE}/demands/${id}/reject`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
                });
                requests = requests.filter(r => r.id !== id);
                refreshUI();
            } catch (err) {
                console.error("Failed to reject demand locally", err);
                alert("Failed to reject Case.");
            }
        }

        // EXAMINE
        if (button.classList.contains("examine-button")) {
            localStorage.setItem("currentCaseId", id);
            window.location.href = "examinationreport.html";
        }

        // HISTORY
        if (button.classList.contains("history-button")) {
            localStorage.setItem("viewReportId", id);
            window.location.href = `reporthistory.html?id=${id}`;
        }
    });

}

handleButtons(container1);
handleButtons(container2);
handleButtons(desktopContainer);

// ---------------- SAVE REPORT ----------------

const saveButton = document.getElementById("save-report");

if (saveButton) {

    saveButton.addEventListener("click", async function () {

        const id = localStorage.getItem("currentCaseId");
        if (!id) return;

        const diagnosis = document.getElementById("diagnosis").value;
        const treatment = document.getElementById("treatment").value;
        const notes = document.getElementById("notes").value;

        let shelter_placement = "no";
        if (document.getElementById("shelterYes").checked) shelter_placement = "yes";

        try {
            await fetch(`${API_BASE}/examination-reports`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...getAuthHeaders() },
                body: JSON.stringify({
                    demand_id: id,
                    diagnosis,
                    treatment,
                    notes,
                    shelter_placement
                })
            });

            localStorage.removeItem("currentCaseId");
            alert("Report saved successfully!");
            window.location.href = "casespage.html";
        } catch (err) {
            console.error("Failed to save report.", err);
            alert("Failed to save report.");
        }
    });

}

// ---------------- REPORT HISTORY ----------------

const reportContainer = document.getElementById("report-container");

if (reportContainer) {
    const reportId = localStorage.getItem("viewReportId");

    async function fetchReportHistory() {
        try {
            // Need to get all history for vet to find the specific report,
            // Demand_id filtering (if needed server side actually returns it)
            const response = await fetch(`${API_BASE}/vets/me/history`, { headers: getAuthHeaders() });
            const history = await response.json();

            // To fetch a report for a specific demand_id we need to match it.
            // Oh wait, in server.js history doesn't have demand_id, just report_id.
            // Let's modify the query in server.js to include demand_id or we'll fetch demands and match.
            // Actually, the server.js history query has:
            // "SELECT r.id AS report_id. So we need to add d.id AS demand_id in server.js to match it!
            // For now, I'll update server.js to include demand_id, then filter here:
            const report = history.find(r => r.demand_id === Number(reportId));

            if (report) {
                reportContainer.innerHTML = `
                <h2>Veterinary Report</h2>
                <div class="diagnosis">
                <div class="diagnosis-title"> Diagnosis : </div>
                <span class="diagnosis-text">${report.diagnosis}</span>
                </div>
                <div class="diagnosis">
                <div class="diagnosis-title"> Treatment :</div>
                <span class="diagnosis-text">${report.treatment}</span>
                </div>
                <!-- Note: 'notes' might not be returned in API currently, fallback to 'No notes' -->
                <div class="diagnosis">
                <div class="diagnosis-title"> Notes :</div>
                <span class="diagnosis-text"> ${report.notes || "Not available"}</span>
                </div>
                <div class="diagnosis">
                <div class="diagnosis-title"> Date :</div>
                <span class="diagnosis-text"> ${new Date(report.date).toLocaleDateString()}</span>
                </div>
                `;
            } else {
                reportContainer.innerHTML = `<h2>No report found.</h2>`;
            }

        } catch (error) {
            console.error("Failed to load history", error);
        }
    }
    fetchReportHistory();
}

// ---------------- SHOW ANIMAL INFO ----------------

function renderAnimalInfo() {
    const caseId = localStorage.getItem("currentCaseId");

    if (caseId) {
        const animal = requests.find(r => r.id === Number(caseId));

        if (animal) {
            const animalContainer = document.getElementById("animal-info");

            // To be sure we are on examinationreport.html we can also look for the #id span
            const idSpan = document.getElementById("id");
            if (idSpan) idSpan.textContent = animal.id;

            if (animalContainer) {

                animalContainer.innerHTML = `
    <div class="animal-card">

    <div class="animal-logo">
    <i class="fa-solid fa-paw"></i>
    </div>

    <div class="animal-header">

    <h3 class="pet-name">${animal.petType}</h3>

    <div class="pet-type">
    <span>${animal.petAge}</span>
    </div>

    <div class="owner-info">
    <i class="fa-regular fa-user"></i>
    <span>Owner</span>
    <span>${animal.ownerName}</span>
    </div>

    </div>

    </div>

    <div class="animal-symptoms">

    <span class="symptoms-label">Original Symptoms</span>

    <p class="symptoms-text">
    ${animal.description}
    </p>

    </div>
    `;

            }
        }
    }
}
