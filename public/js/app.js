const navSlide = () => {
    const burger = document.querySelector('.burger');
    const nav = document.querySelector('.nav-links');
    const navLinks = document.querySelectorAll('.nav-links li');
    
    if (burger) {
        burger.addEventListener('click', () => {
            // Toggle navigation
            nav.classList.toggle('nav-active');
            
            // Animate links
            navLinks.forEach((link, index) => {
                if (link.style.animation) {
                    link.style.animation = '';
                } else {
                    link.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + 0.3}s`;
                }
            });
            
            // Burger animation
            burger.classList.toggle('toggle');
        });
    }
};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    // Initialize mobile navigation
    navSlide();
    
    // Check for redirect after login
    const redirectAfterLogin = sessionStorage.getItem('redirectAfterLogin');
    if (redirectAfterLogin) {
        sessionStorage.removeItem('redirectAfterLogin');
        
        // Check if user is authenticated before redirecting
        auth.onAuthStateChanged(user => {
            if (user) {
                window.location.href = redirectAfterLogin;
            }
        });
    }
});

// Get and format today's date for date inputs
function setMinDates() {
    const today = new Date();
    const year = today.getFullYear();
    let month = today.getMonth() + 1;
    let day = today.getDate();
    
    // Format month and day with leading zeros if needed
    month = month < 10 ? '0' + month : month;
    day = day < 10 ? '0' + day : day;
    
    const formattedDate = `${year}-${month}-${day}`;
    
    // Set min date for departure and return date inputs
    const departureDateInput = document.getElementById('departure-date');
    const returnDateInput = document.getElementById('return-date');
    
    if (departureDateInput) {
        departureDateInput.setAttribute('min', formattedDate);
        departureDateInput.value = formattedDate;
    }
    
    if (returnDateInput) {
        returnDateInput.setAttribute('min', formattedDate);
        
        // Set default return date to tomorrow
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        let tomorrowMonth = tomorrow.getMonth() + 1;
        let tomorrowDay = tomorrow.getDate();
        
        tomorrowMonth = tomorrowMonth < 10 ? '0' + tomorrowMonth : tomorrowMonth;
        tomorrowDay = tomorrowDay < 10 ? '0' + tomorrowDay : tomorrowDay;
        
        const formattedTomorrow = `${tomorrow.getFullYear()}-${tomorrowMonth}-${tomorrowDay}`;
        returnDateInput.value = formattedTomorrow;
    }
}

// Set min dates for date inputs
setMinDates();

// Listen for changes on departure date to update return date min
const departureDateInput = document.getElementById('departure-date');
const returnDateInput = document.getElementById('return-date');

if (departureDateInput && returnDateInput) {
    departureDateInput.addEventListener('change', function() {
        returnDateInput.setAttribute('min', departureDateInput.value);
        
        // If return date is before departure date, update it
        if (returnDateInput.value < departureDateInput.value) {
            returnDateInput.value = departureDateInput.value;
        }
    });
}

// Format card number with spaces
const cardNumberInput = document.getElementById('card-number');
if (cardNumberInput) {
    cardNumberInput.addEventListener('input', function(e) {
        // Remove non-digit characters
        let input = this.value.replace(/\D/g, '');
        
        // Trim to 16 digits
        input = input.substring(0, 16);
        
        // Add spaces every 4 digits
        let formattedInput = '';
        for (let i = 0; i < input.length; i++) {
            if (i > 0 && i % 4 === 0) {
                formattedInput += ' ';
            }
            formattedInput += input[i];
        }
        
        this.value = formattedInput;
    });
}
