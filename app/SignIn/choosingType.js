let choise = document.querySelectorAll("input");
let SubmitBtn = document.querySelector(".login-button button")

SubmitBtn.addEventListener("click", async function(){
    let selectedInput = null;
    choise.forEach(function(input){
        if(input.checked){
            selectedInput = input;
        }
    });

    if (!selectedInput) {
        alert("Please select a role.");
        return;
    }

    let role = "normal";
    if (selectedInput.id === "role2") role = "vet";
    if (selectedInput.id === "role3") role = "refuge";

    const token = localStorage.getItem("token");

    try {
        const response = await fetch("http://localhost:3000/app/signup/role", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ role: role })
        });
        const data = await response.json();

        if (response.ok) {
            window.location.href = selectedInput.value;
        } else {
            alert(data.message || "Failed to set role");
        }
    } catch (error) {
        console.error("Error setting role:", error);
        alert("Server error. Please try again.");
    }
})

