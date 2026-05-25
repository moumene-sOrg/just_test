const token = localStorage.getItem('token');
if (!token) window.location.href = '/SignIn/SignInPage.html';
const getAuthHeaders = () => ({ 'Authorization': `Bearer ${token}` });

let btn = document.getElementById("update");
let oldInp = document.getElementById("old-pass");
let inp = document.getElementById("new-pass");
let oldPassToSave = '';
let passToSave = '';

// When clicking 'Update Password' button
btn.onclick = function () {
    if (inp.style.display === "block" || oldInp.style.display === "block") {
        if (inp.value && oldInp.value) {
            oldPassToSave = oldInp.value;
            passToSave = inp.value;
            alert("Password staged for update. Click 'Save Changes' to apply.");
            inp.value = '';
            oldInp.value = '';
            inp.style.display = "none";
            oldInp.style.display = "none";
        } else {
            alert("Both old and new passwords are required.");
        }
    } else {
        inp.style.display = "block";
        oldInp.style.display = "block";
    }
}

// Load Settings — pre-fill all inputs from DB
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch(`http://localhost:3000/api/refuge/refuges/settings`, { headers: getAuthHeaders() });
        if (!res.ok) return;
        const data = await res.json();

        document.getElementById('name').value    = data.first_name      || '';
        document.getElementById('contact').value = data.email           || '';
        document.getElementById('add').value     = data.address         || '';
        document.getElementById('maxcap').value  = data.capacity        || '';
        document.getElementById('cap').value     = data.current_animals || '';

        if (data.opening_from) document.getElementById('open').value  = data.opening_from;
        if (data.opening_till) document.getElementById('close').value = data.opening_till;

    } catch (err) {
        console.error('Failed to fetch settings', err);
    }
});

document.getElementById('save').addEventListener('click', async () => {
    const payload = {
        name:    document.getElementById('name').value,
        email:   document.getElementById('contact').value,
        add:     document.getElementById('add').value,
        maxcap:  document.getElementById('maxcap').value,
        cap:     document.getElementById('cap').value,
        open:    document.getElementById('open').value,
        close:   document.getElementById('close').value,
    };

    if (passToSave) {
        payload.password = passToSave;
        payload.oldPassword = oldPassToSave;
    }

    try {
        const res = await fetch('http://localhost:3000/api/refuge/refuges/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert('Settings updated successfully!');
            passToSave = '';
            window.location.reload();
        } else {
            const data = await res.json();
            alert('Error updating settings: ' + data.error);
        }
    } catch(err) {
        console.error(err);
        alert('Failed to update settings');
    }
});