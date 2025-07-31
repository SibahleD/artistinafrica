document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('studio-register-form');
    
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            username: document.getElementById('username').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            country: document.getElementById('country').value,
            city: document.getElementById('city').value,
            studio_name: document.getElementById('studio-name').value
        };

        fetch('/register/studio', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                // Store user data and redirect
                localStorage.setItem('user_id', data.user_id);
                localStorage.setItem('user_type', 'studio_owner');
                window.location.href = '/dashboard-studio';
            } else {
                alert('Registration failed: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Registration failed');
        });
    });

    // Toggle password visibility
    const passwordShow = document.getElementById('password-show');
    const passwordInput = document.getElementById('password');
    passwordShow.addEventListener('click', function() {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            passwordShow.src = '../static/images/icon-unlock.png';
        } else {
            passwordInput.type = 'password';
            passwordShow.src = '../static/images/icon-lock.png';
        }
    });
});