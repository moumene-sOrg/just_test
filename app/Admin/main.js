// Admin Dashboard Main logic — UI only
document.addEventListener('DOMContentLoaded', () => {
    // Standard UI setup
    lucide.createIcons();
    
    // Safety check for image inputs if they exist
    const imgInput = document.getElementById('profile-img-input');
    if (imgInput) {
        imgInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (re) => {
                    document.getElementById('profile-img-preview').src = re.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }
});

// UI Navigation
window.showPage = (id) => {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) target.classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(b => {
        if (b.getAttribute('onclick')?.includes(id)) {
            b.classList.add('bg-blue-50', 'text-blue-600');
        } else {
            b.classList.remove('bg-blue-50', 'text-blue-600');
        }
    });
};
