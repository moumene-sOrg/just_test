const BASE = "http://localhost:3000";

// ADD DEMAND
export async function addDemand() {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Please login first ❌");
    return;
  }

  const formData = new FormData();

  formData.append("animal_type", document.getElementById("animal_type").value);
  formData.append("animal_status", document.getElementById("animal_status").value);
  formData.append("location", document.getElementById("location").value);
  formData.append("event_date", document.getElementById("event_date").value);
  formData.append("event_time", document.getElementById("event_time").value);
  formData.append("status", document.getElementById("status").value);

  const file = document.getElementById("photo").files[0];
  if (file) formData.append("photo", file);

  const res = await fetch(BASE + "/app/users/addDemand", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`
    },
    body: formData
  });

  const data = await res.json();
  alert(JSON.stringify(data));
}

// GET DEMANDS
export async function getDemands() {
  const res = await fetch(BASE + "/app/users/getDemands", {
    headers: {
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    }
  });

  const data = await res.json();

  const list = document.getElementById("list");
  if (list) list.innerHTML = "";

  data.forEach(d => {
    const li = document.createElement("li");

    let photoURL = "";
    if (d.photo) {
      photoURL = `${BASE}/photo/${d.photo}`;
    }

    li.innerHTML = `
      ${d.animal_type} - ${d.location}
      <br>
      ${photoURL ? `<img src="${photoURL}" width="100">` : ""}
    `;

    if (list) list.appendChild(li);
  });
}

// PROFILE
export async function getProfile() {
  const token = localStorage.getItem("token");

  const res = await fetch(BASE + "/app/users/profile", {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  const data = await res.json();

  const profileEl = document.getElementById("profile");
  if (profileEl) {
    profileEl.innerText = JSON.stringify(data, null, 2);
  }
}

// NUMBER OF DEMANDS
export async function getReportNumber() {
  const token = localStorage.getItem("token");

  const res = await fetch(BASE + "/app/users/countDemands", {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  const data = await res.json();

  const reportNumberEl = document.getElementById("reportNumber");
  if (reportNumberEl) {
    reportNumberEl.innerText = data[0]?.count ?? 0;
  }
}

// NUMBER OF APPROVED DEMANDS
export async function getApprovedNumber() {
  const token = localStorage.getItem("token");

  const res = await fetch(BASE + "/app/users/countApproved", {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  const data = await res.json();

  const approvedNumberEl = document.getElementById("approvedNumber");
  if (approvedNumberEl) {
    approvedNumberEl.innerText = data[0]?.count ?? 0;
  }
}
