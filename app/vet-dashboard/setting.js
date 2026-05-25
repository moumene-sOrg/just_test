const API_BASE = "http://localhost:3000/api/vet";
const token = localStorage.getItem('token');
if (!token) window.location.href = '../SignIn/SignInPage.html';
const getAuthHeaders = () => ({ 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' });

// Toggle password form
const showFormBtn = document.getElementById("show-password-form");
const passwordForm = document.getElementById("password-form-container");

if (showFormBtn && passwordForm) {
    showFormBtn.addEventListener("click", () => {
        if (passwordForm.style.display === "none") {
            passwordForm.style.display = "flex";
            showFormBtn.textContent = "Cancel";
        } else {
            passwordForm.style.display = "none";
            showFormBtn.textContent = "Update";
        }
    });
}

// Save password
const savePasswordBtn = document.getElementById("save-password-btn");
const newPasswordInput = document.getElementById("new-password");
const oldPasswordInput = document.getElementById("old-password");
const lastUpdateText = document.getElementById("last-update-text");

if (savePasswordBtn && newPasswordInput && oldPasswordInput) {
    savePasswordBtn.addEventListener("click", async () => {
        const newPassword = newPasswordInput.value.trim();
        const oldPassword = oldPasswordInput.value.trim();
        if (!newPassword || !oldPassword) {
            alert("Please enter both your old and new password.");
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/users/me/password`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ oldPassword, newPassword })
            });

            const result = await response.json();

            if (response.ok) {
                alert("Password updated successfully!");
                passwordForm.style.display = "none";
                showFormBtn.textContent = "Update";
                newPasswordInput.value = "";
                oldPasswordInput.value = "";
                if (lastUpdateText) lastUpdateText.textContent = "Last update just now";
            } else {
                alert("Error: " + result.error);
            }

        } catch (err) {
            console.error("Failed to update password", err);
            alert("Failed to update the password due to a network error.");
        }
    });
}

// Global variable to store original address state
let originalAddress = "";
const addressInput = document.getElementById("vet-address-input");
const saveAddressBtn = document.getElementById("save-address-btn");
const discardAddressBtn = document.getElementById("discard-button");

async function loadProfileSettings() {
    if (!addressInput) return;
    try {
        const response = await fetch(`${API_BASE}/vets/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const vet = await response.json();
            originalAddress = vet.adress_vet || "";
            addressInput.value = originalAddress;
        }
    } catch (err) {
        console.error("Failed to load address", err);
    }
}
loadProfileSettings();

if (saveAddressBtn && addressInput) {
    saveAddressBtn.addEventListener("click", async () => {
        const newAddress = addressInput.value.trim();
        if (!newAddress) {
            alert("Address cannot be empty.");
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/vets/me/address`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ adress_vet: newAddress })
            });

            const result = await response.json();
            if (response.ok) {
                alert("Clinic Address saved successfully!");
                originalAddress = newAddress;
            } else {
                alert("Error: " + result.error);
            }
        } catch (err) {
            console.error("Failed to update address", err);
            alert("Failed to save changes.");
        }
    });
}

if (discardAddressBtn && addressInput) {
    discardAddressBtn.addEventListener("click", () => {
        addressInput.value = originalAddress;
    });
}

// Sign Out Logic
const signOutBtn = document.querySelector(".singout-button");
if (signOutBtn) {
    signOutBtn.addEventListener("click", () => {
        localStorage.removeItem("token");
        window.location.href = "../SignIn/SignInPage.html";
    });
}
