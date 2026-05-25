const BASE = "http://localhost:3000";
let reports = [];
const rowsPerPage = 4;
let currentPage = 0;

let currentSearch = "";

function getFilteredReports() {
    return reports.filter(r => {
        let matchSearch = true;

        if (currentSearch) {
            const query = currentSearch.toLowerCase();
            const idMatch = r.id && r.id.toString().includes(query);
            const typeMatch = r.animal_type && r.animal_type.toLowerCase().includes(query);

            matchSearch = idMatch || typeMatch;
        }



        return matchSearch;
    });
}



async function getDemands() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const res = await fetch(BASE + "/app/users/getDemands", {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) return;

        const data = await res.json();
        reports = Array.isArray(data) ? data : [];
        renderAll();
    } catch (err) {
        console.error(err);
    }
}

function renderAll() {
    renderTable();
    renderMobileCards();
    updatePagination();
}

function renderTable() {
    const myTable = document.querySelector("table tbody");
    if (!myTable) return;
    myTable.innerHTML = "";

    const fReports = getFilteredReports();
    const start = currentPage * rowsPerPage;
    const end = Math.min(start + rowsPerPage, fReports.length);
    const currentReports = fReports.slice(start, end);

    if (currentReports.length === 0) {
        myTable.innerHTML = `<tr><td colspan="5" class="py-10 text-center text-slate-500 font-medium">No reports found matching your filters.</td></tr>`;
        return;
    }

    currentReports.forEach(report => {
        const row = document.createElement("tr");
        const imgUrl = report.photo ? `${BASE}/photo/${report.photo}` : "https://via.placeholder.com/50";

        row.innerHTML = `
            <td class="px-4 py-6">
                <img src="${imgUrl}" alt="animal" class="w-12 h-12 rounded-full object-cover border border-slate-200">
            </td>
            <td class="py-6 flex flex-col justify-center">
                <span class="font-bold text-slate-900 capitalize">${report.animal_type || "Unknown"}</span>
                <span class="text-slate-500 text-xs">ID: ${report.id}</span>
            </td>
            <td class="text-sm text-slate-500 font-medium py-6 text-center">
                <span class="date">${report.event_date ? new Date(report.event_date).toLocaleDateString() : "N/A"}</span>
                <span class="time ml-2">${report.event_time || ""}</span>
            </td>
            <td class="px-4 py-6 text-right">
                    <button onclick="handleEditClick(${report.id})" class="text-[#197fe6] text-sm font-semibold cursor-pointer hover:underline">
                        <i class="fa-solid fa-pen mr-1"></i>Edit
                    </button>
            </td>
        `;
        myTable.appendChild(row);
    });
}

function renderMobileCards() {
    const mobileContainer = document.querySelector("section.p-5");
    if (!mobileContainer) return;

    const existingCards = mobileContainer.querySelectorAll(".report-card, .empty-msg");
    existingCards.forEach(card => card.remove());

    const fReports = getFilteredReports();
    const start = currentPage * rowsPerPage;
    const end = Math.min(start + rowsPerPage, fReports.length);
    const currentReports = fReports.slice(start, end);

    if (currentReports.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-msg report-card p-10 text-center text-slate-500 bg-white rounded-2xl md:hidden shadow-sm";
        empty.innerText = "No reports found matching your filters.";
        mobileContainer.prepend(empty);
        return;
    }

    currentReports.forEach(report => {
        const card = document.createElement("div");
        card.className = "report-card shadow-md rounded-2xl overflow-hidden md:hidden bg-white mb-6 border border-slate-100";
        const imgUrl = report.photo ? `${BASE}/photo/${report.photo}` : "https://via.placeholder.com/400x200";

        card.innerHTML = `
            <div class="img-container relative h-48">
                <img src="${imgUrl}" alt="Animal Image" class="w-full h-full object-cover">
            </div>
            <div class="animal-info p-5 flex flex-col gap-4">
                <div class="flex flex-col gap-1">
                    <h2 class="text-lg font-bold text-slate-900 capitalize">${report.animal_type}</h2>
                    <div class="flex items-center gap-2 text-xs text-slate-500">
                        <i class="fa-regular fa-clock"></i>
                        <span>Submitted on ${report.event_date ? new Date(report.event_date).toLocaleDateString() : "N/A"}</span>
                    </div>
                </div>
                <div class="flex gap-6">
                    <div class="flex gap-2 items-center">
                        <i class="fa-solid fa-paw text-[#197fe6] text-xs"></i>
                        <span class="text-sm text-slate-600 font-medium">${report.animal_status || "N/A"}</span>
                    </div>
                    <div class="flex gap-2 items-center">
                        <i class="fa-solid fa-location-dot text-sm text-[#197fe6]"></i>
                        <span class="text-sm text-slate-600 font-medium">${report.location || "N/A"}</span>
                    </div>
                </div>
                <div class="pt-4 flex justify-between border-t border-slate-100 mt-2">
                    <div class="operation flex gap-5">
                        <button onclick="handleEditClick(${report.id})" class="text-[#197fe6] text-sm font-bold cursor-pointer hover:opacity-70 flex items-center gap-1">
                            <i class="fa-solid fa-pen"></i>Edit
                        </button>
                    </div>
                    <button class="font-bold text-xs text-slate-400 cursor-pointer flex items-center gap-1">
                        DETAILS <i class="fa-solid fa-angle-right"></i>
                    </button>
                </div>
            </div>
        `;
        mobileContainer.prepend(card);
    });
}

function updatePagination() {
    const fReports = getFilteredReports();
    const appearPages = document.querySelector(".appear-pages");
    const nbrAllPages = document.querySelector(".nbr-all-pages");

    const start = currentPage * rowsPerPage;
    const end = Math.min(start + rowsPerPage, fReports.length);

    if (appearPages) appearPages.innerText = fReports.length > 0 ? ` ${start + 1} - ${end} ` : "0";
    if (nbrAllPages) nbrAllPages.innerText = fReports.length;

    // Wire up buttons if not already dynamically done
    const prevBtn = document.querySelector(".previous");
    const nextBtn = document.querySelector(".next");
    if (prevBtn) {
        prevBtn.onclick = () => {
            if (currentPage > 0) {
                currentPage--;
                renderAll();
            }
        };
        prevBtn.style.opacity = currentPage === 0 ? "0.3" : "1";
        prevBtn.disabled = currentPage === 0;
    }
    if (nextBtn) {
        nextBtn.onclick = () => {
            if ((currentPage + 1) * rowsPerPage < fReports.length) {
                currentPage++;
                renderAll();
            }
        };
        const hasMore = (currentPage + 1) * rowsPerPage < fReports.length;
        nextBtn.style.opacity = hasMore ? "1" : "0.3";
        nextBtn.disabled = !hasMore;
    }
}

async function deleteReport(id) {
    if (!confirm("Are you sure you want to delete this report?")) return;

    const token = localStorage.getItem("token");
    try {
        const res = await fetch(BASE + "/app/users/delDemand/" + id, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
            alert("Report deleted successfully! 🗑️");
            getDemands();
        } else {
            const data = await res.json();
            alert("Error: " + (data.error || "Delete failed"));
        }
    } catch (err) {
        alert("Network error.");
    }
}

function handleEditClick(id) {
    const report = reports.find(r => r.id == id);
    if (!report) return;
    openEditModal(report);
}

function openEditModal(report) {
    document.getElementById("editReportId").value = report.id;
    document.getElementById("editAnimalType").value = report.animal_type;
    document.getElementById("editAnimalStatus").value = report.animal_status || "";
    document.getElementById("editLocation").value = report.location;
    document.getElementById("editDescription").value = report.additional_details || "";

    if (report.event_date) {
        const date = new Date(report.event_date);
        const formattedDate = date.toISOString().split('T')[0];
        document.getElementById("editDate").value = formattedDate;
    }
    document.getElementById("editTime").value = report.event_time;

    document.getElementById("editModal").classList.remove("hidden");
}

function closeEditModal() {
    document.getElementById("editModal").classList.add("hidden");
}

async function handleEditSubmit(e) {
    e.preventDefault();
    const id = document.getElementById("editReportId").value;
    const token = localStorage.getItem("token");

    const updatedData = {
        animal_type: document.getElementById("editAnimalType").value,
        animal_status: document.getElementById("editAnimalStatus").value,
        location: document.getElementById("editLocation").value,
        event_date: document.getElementById("editDate").value,
        event_time: document.getElementById("editTime").value,
        additional_details: document.getElementById("editDescription").value
    };

    try {
        const res = await fetch(BASE + "/app/users/modifyDemand/" + id, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(updatedData)
        });

        if (res.ok) {
            alert("Report updated successfully! ✅");
            closeEditModal();
            getDemands();
        } else {
            const data = await res.json();
            alert("Error: " + (data.error || "Update failed"));
        }
    } catch (err) {
        alert("Network error.");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    getDemands();

    // Bind search inputs
    const searchInputs = document.querySelectorAll("input[type='search']");
    searchInputs.forEach(input => {
        input.addEventListener("input", (e) => {
            currentSearch = e.target.value;
            currentPage = 0;
            renderAll();
        });
    });

    // Toggle dropdown boxes open and closed
    document.querySelectorAll(".select-box .result").forEach(result => {
        result.addEventListener("click", (e) => {
            const box = e.currentTarget.closest(".select-box");
            if (box) {
                const options = box.querySelector(".options");
                if (options) {
                    options.classList.toggle("hidden");
                }
            }
        });
    });





    const editForm = document.getElementById("editForm");
    if (editForm) {
        editForm.addEventListener("submit", handleEditSubmit);
    }
});

window.deleteReport = deleteReport;
window.handleEditClick = handleEditClick;
window.closeEditModal = closeEditModal;
