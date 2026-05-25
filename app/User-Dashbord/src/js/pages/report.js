const BASE = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", () => {
    const selectsResut = document.querySelectorAll(".select-box .result");
    const options = document.querySelectorAll(".options");

    selectsResut.forEach(function (selectResut) {
      selectResut.addEventListener("click", function () {
        selectResut.nextElementSibling.classList.remove("hidden");
      });
    });

    options.forEach(function (optsbox) {
      optsbox.addEventListener("mouseleave", function () {
        optsbox.classList.add("hidden");
      });
    });

    const selectOptions = document.querySelectorAll(".select-box .options .option");

    selectOptions.forEach(function (opt) {
      opt.addEventListener("click", function () {
        const resultBox = opt.parentElement.previousElementSibling;
        resultBox.innerText = opt.innerText;
        resultBox.classList.add("text-slate-900", "font-bold");
        opt.parentElement.classList.add("hidden");
      });
    });

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
        dropArea.addEventListener("dragover", function (e) {
          e.preventDefault();
          imgView.style.backgroundColor = "rgba(25, 127, 230, 0.1)";
        });

        dropArea.addEventListener("dragleave", function () {
          imgView.style.backgroundColor = "transparent";
        });

        dropArea.addEventListener("drop", function (e) {
          e.preventDefault();
          inputFile.files = e.dataTransfer.files;
          uploadImage();
        });
    }

    async function addDemand() {
        const token = localStorage.getItem("token");

        if (!token) {
            alert("Please login first ❌");
            return;
        }

        const sbBtn = document.getElementById("sb-report");
        sbBtn.disabled = true;
        sbBtn.innerText = "Submitting...";

        const formData = new FormData();
        const animalType = document.querySelector("#animal-type-select .result").innerText.trim();

        if (animalType === "Select animal Type") {
            alert("Please select animal type! ⚠️");
            sbBtn.disabled = false;
            sbBtn.innerText = "Submit Report";
            return;
        }

        const location = document.getElementById("location")?.value.trim();
        const eventDate = document.getElementById("date")?.value;
        const eventTime = document.getElementById("time")?.value;
        const additionalDetails = document.getElementById("additional-details")?.value;

        const animalStatus = document.getElementById("animal-status")?.value.trim() || "";

        formData.append("animal_type", animalType.toLowerCase());
        formData.append("animal_status", animalStatus);
        formData.append("location", location);
        formData.append("event_date", eventDate);
        formData.append("event_time", eventTime);
        formData.append("additional_details", additionalDetails);

        const file = document.getElementById("facility-img")?.files[0];
        if (file) {
            formData.append("photo", file);
        }

        try {
            const res = await fetch(BASE + "/app/users/addDemand", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            const data = await res.json();

            if (res.ok) {
                alert("Report submitted successfully! 🐾");
                window.location.href = "../MyReports/index.html";
            } else {
                alert("Error: " + (data.error || "Submission failed"));
            }
        } catch (err) {
            alert("Network error.");
        } finally {
            sbBtn.disabled = false;
            sbBtn.innerText = "Submit Report";
        }
    }

    const sbBtn = document.getElementById("sb-report");
    if (sbBtn) {
        sbBtn.addEventListener("click", addDemand);
    }
});