const BASE = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", () => {
    const dropArea = document.getElementById("drop-area");
    const inputFile = document.getElementById("facility-img");
    const imgView = document.getElementById("img-view");

    if (inputFile) {
        inputFile.addEventListener("change", uploadImage);
    }

    function uploadImage() {
        if (inputFile.files && inputFile.files[0]) {
            let imgLink = URL.createObjectURL(inputFile.files[0]);
            imgView.style.backgroundImage = `url(${imgLink})`;
            imgView.innerHTML = "";
        }
    }

    if (dropArea) {
        ["dragover", "dragenter", "dragleave", "drop"].forEach(eventName => {
            dropArea.addEventListener(eventName, e => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        dropArea.addEventListener("dragover", () => {
            imgView.style.backgroundColor = "rgba(25, 127, 230, 0.1)";
        });

        dropArea.addEventListener("dragleave", () => {
            imgView.style.backgroundColor = "transparent";
        });

        dropArea.addEventListener("drop", (e) => {
            inputFile.files = e.dataTransfer.files;
            uploadImage();
        });
    }

    const form = document.querySelector("form");
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const token = localStorage.getItem("token");
            if (!token) {
                alert("Session error: Please login/signup again from the start. ❌");
                window.location.href = "CreateAnAccout.html";
                return;
            }

            const sbBtn = document.getElementById("submitBtn");
            const originalText = sbBtn.innerText;
            sbBtn.disabled = true;
            sbBtn.innerText = "Processing... ⏳";

            const formData = new FormData();
            const isVetForm = document.getElementById("vet-id") !== null;

            try {
                if (isVetForm) {
                    const address = document.getElementById("clinic-info")?.value.trim();
                    const license = document.getElementById("vet-id")?.value.trim();
                    const file = document.getElementById("facility-img")?.files[0];

                    if (!address || !license || !file) {
                        alert("Please fill all fields and upload your certification! ⚠️");
                        resetButton();
                        return;
                    }

                    formData.append("adress_vet", address);
                    formData.append("license_number", license);
                    formData.append("diplomat", file);
                } else {
                    const representative_name = document.getElementById("refuge-name")?.value.trim();
                    const adress_refuge = document.getElementById("refuge-address")?.value.trim();
                    const capacity = document.getElementById("max-capacity")?.value.trim();
                    const registration = document.getElementById("registration-id")?.value.trim();
                    const current_animals = document.getElementById("current-animals")?.value.trim();
                    const opening_from = document.getElementById("opening-from")?.value.trim();
                    const opening_till = document.getElementById("opening-till")?.value.trim();
                    const file = document.getElementById("facility-img")?.files[0];

                    if (!representative_name || !adress_refuge || !capacity || !registration || !file) {
                        alert("Please fill all required fields and upload a facility photo! ⚠️");
                        resetButton();
                        return;
                    }

                    formData.append("representative_name", representative_name);
                    formData.append("adress_refuge", adress_refuge);
                    formData.append("capacity", capacity);
                    formData.append("registration", registration);
                    formData.append("current_animals", current_animals || 0);
                    formData.append("opening_from", opening_from || "00:00");
                    formData.append("opening_till", opening_till || "00:00");
                    formData.append("facility_photo", file);
                }

                const response = await fetch(BASE + "/app/signup/userInfo", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    },
                    body: formData
                });

                const data = await response.json();

                if (response.ok) {
                    alert("Registration complete! Welcome aboard! 🎉");
                    if (isVetForm) {
                        window.location.href = "../vet/home.html";
                    } else {
                        window.location.href = "../refuge/Home.html";
                    }
                } else {
                    alert("Registration failed: " + (data.message || "Unknown error"));
                    resetButton();
                }
            } catch (err) {
                alert("Network error: Could not connect to the backend server.");
                resetButton();
            }

            function resetButton() {
                sbBtn.disabled = false;
                sbBtn.innerText = originalText;
            }
        });
    }
});
