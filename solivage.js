document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initScrollAnimations();
    initBookingForm();
    initContactForm();
    initVehicleSelection();
});

function initNavigation() {
    const nav = document.querySelector('.top-nav');
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });
    
    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }
    
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const navHeight = nav.offsetHeight;
                    const targetPosition = target.offsetTop - navHeight;
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                    if (navLinks) navLinks.classList.remove('active');
                }
            }
        });
    });
}

function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });
}

function initBookingForm() {
    const form = document.getElementById('bookingForm');
    const success = document.getElementById('bookingSuccess');
    const submitBtn = form.querySelector('.btn-primary');
    
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Basic validation
        if (!validateForm()) {
            return;
        }
        
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        
        const formData = {
            name: document.getElementById('bookingName').value.trim(),
            email: document.getElementById('bookingEmail').value.trim(),
            phone: document.getElementById('bookingPhone').value.trim(),
            vehicle: document.getElementById('bookingVehicle').value,
            service: document.getElementById('bookingService').value,
            pickup: document.getElementById('pickupLocation').value.trim(),
            dropoff: document.getElementById('dropoffLocation').value.trim(),
            date: document.getElementById('bookingDate').value,
            notes: document.getElementById('bookingNotes').value.trim()
        };
        
        try {
            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            if (res.ok) {
                form.style.display = 'none';
                success.classList.add('show');
                form.reset();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to submit booking. Please try again.');
            }
        } catch (err) {
            console.error(err);
            alert('Something went wrong. Please try again.');
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Book Now';
        }
    });
    
    // Add real-time validation
    form.addEventListener('input', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
            validateField(e.target);
        }
    });
}

function validateForm() {
    const name = document.getElementById('bookingName').value.trim();
    const email = document.getElementById('bookingEmail').value.trim();
    const phone = document.getElementById('bookingPhone').value.trim();
    const vehicle = document.getElementById('bookingVehicle').value;
    const service = document.getElementById('bookingService').value;
    const pickup = document.getElementById('pickupLocation').value.trim();
    const dropoff = document.getElementById('dropoffLocation').value.trim();
    const date = document.getElementById('bookingDate').value;
    
    let isValid = true;
    
    // Validate name
    if (!name) {
        setError(document.getElementById('bookingName'), 'Name is required');
        isValid = false;
    } else if (name.length < 2) {
        setError(document.getElementById('bookingName'), 'Name must be at least 2 characters');
        isValid = false;
    } else {
        clearError(document.getElementById('bookingName'));
    }
    
    // Validate email
    if (!email) {
        setError(document.getElementById('bookingEmail'), 'Email is required');
        isValid = false;
    } else if (!isValidEmail(email)) {
        setError(document.getElementById('bookingEmail'), 'Please enter a valid email');
        isValid = false;
    } else {
        clearError(document.getElementById('bookingEmail'));
    }
    
    // Validate phone (optional but if provided should be valid)
    if (phone && !isValidPhone(phone)) {
        setError(document.getElementById('bookingPhone'), 'Please enter a valid phone number');
        isValid = false;
    } else {
        clearError(document.getElementById('bookingPhone'));
    }
    
    // Validate vehicle
    if (!vehicle) {
        setError(document.getElementById('bookingVehicle'), 'Please select a vehicle');
        isValid = false;
    } else {
        clearError(document.getElementById('bookingVehicle'));
    }
    
    // Validate service
    if (!service) {
        setError(document.getElementById('bookingService'), 'Please select a service');
        isValid = false;
    } else {
        clearError(document.getElementById('bookingService'));
    }
    
    // Validate pickup
    if (!pickup) {
        setError(document.getElementById('pickupLocation'), 'Pickup location is required');
        isValid = false;
    } else if (pickup.length < 2) {
        setError(document.getElementById('pickupLocation'), 'Pickup location must be at least 2 characters');
        isValid = false;
    } else {
        clearError(document.getElementById('pickupLocation'));
    }
    
    // Validate dropoff
    if (!dropoff) {
        setError(document.getElementById('dropoffLocation'), 'Dropoff location is required');
        isValid = false;
    } else if (dropoff.length < 2) {
        setError(document.getElementById('dropoffLocation'), 'Dropoff location must be at least 2 characters');
        isValid = false;
    } else {
        clearError(document.getElementById('dropoffLocation'));
    }
    
    // Validate date
    if (!date) {
        setError(document.getElementById('bookingDate'), 'Date and time is required');
        isValid = false;
    } else if (!isValidDate(date)) {
        setError(document.getElementById('bookingDate'), 'Please select a future date and time');
        isValid = false;
    } else {
        clearError(document.getElementById('bookingDate'));
    }
    
    return isValid;
}

function validateField(field) {
    switch (field.id) {
        case 'bookingName':
            if (field.value.trim() === '') {
                setError(field, 'Name is required');
            } else if (field.value.trim().length < 2) {
                setError(field, 'Name must be at least 2 characters');
            } else {
                clearError(field);
            }
            break;
        case 'bookingEmail':
            if (field.value.trim() === '') {
                setError(field, 'Email is required');
            } else if (!isValidEmail(field.value.trim())) {
                setError(field, 'Please enter a valid email');
            } else {
                clearError(field);
            }
            break;
        case 'bookingPhone':
            if (field.value.trim() !== '' && !isValidPhone(field.value.trim())) {
                setError(field, 'Please enter a valid phone number');
            } else {
                clearError(field);
            }
            break;
        case 'bookingVehicle':
            if (field.value === '') {
                setError(field, 'Please select a vehicle');
            } else {
                clearError(field);
            }
            break;
        case 'bookingService':
            if (field.value === '') {
                setError(field, 'Please select a service');
            } else {
                clearError(field);
            }
            break;
        case 'pickupLocation':
            if (field.value.trim() === '') {
                setError(field, 'Pickup location is required');
            } else if (field.value.trim().length < 2) {
                setError(field, 'Pickup location must be at least 2 characters');
            } else {
                clearError(field);
            }
            break;
        case 'dropoffLocation':
            if (field.value.trim() === '') {
                setError(field, 'Dropoff location is required');
            } else if (field.value.trim().length < 2) {
                setError(field, 'Dropoff location must be at least 2 characters');
            } else {
                clearError(field);
            }
            break;
        case 'bookingDate':
            if (field.value === '') {
                setError(field, 'Date and time is required');
            } else if (!isValidDate(field.value)) {
                setError(field, 'Please select a future date and time');
            } else {
                clearError(field);
            }
            break;
    }
}

function setError(element, message) {
    const formGroup = element.parentElement;
    formGroup.classList.add('error');
    
    // Remove existing error message if any
    const existingError = formGroup.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    const errorElement = document.createElement('small');
    errorElement.className = 'error-message';
    errorElement.style.color = 'var(--error)';
    errorElement.style.fontSize = '0.8rem';
    errorElement.style.display = 'block';
    errorElement.style.marginTop = '4px';
    errorElement.textContent = message;
    
    formGroup.appendChild(errorElement);
    element.style.borderColor = 'var(--error)';
}

function clearError(element) {
    const formGroup = element.parentElement;
    formGroup.classList.remove('error');
    
    const existingError = formGroup.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    element.style.borderColor = '';
}

function isValidEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

function isValidPhone(phone) {
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');
    // Check if it's a valid Kenyan phone number format
    const kenyanPattern = /^(\+254|0)?[17]\d{8}$/;
    return kenyanPattern.test(digitsOnly) || phone.length >= 10; // Allow international formats
}

function isValidDate(dateString) {
    if (!dateString) return false;
    const selectedDate = new Date(dateString);
    const currentDate = new Date();
    // Set current date to midnight for fair comparison
    currentDate.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    return selectedDate >= currentDate;
}

function initContactForm() {
    const form = document.getElementById('contactForm');
    
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            message: document.getElementById('message').value
        };
        
        try {
            const res = await fetch('/api/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            if (res.ok) {
                alert('Message sent! We will get back to you soon.');
                form.reset();
            } else {
                alert('Failed to send message. Please try again.');
            }
        } catch (err) {
            console.error(err);
            alert('Something went wrong. Please try again.');
        }
    });
}

function initVehicleSelection() {
    const selectButtons = document.querySelectorAll('.select-vehicle');
    
    selectButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const vehicle = btn.getAttribute('data-vehicle');
            const vehicleSelect = document.getElementById('bookingVehicle');
            
            if (vehicleSelect) {
                vehicleSelect.value = vehicle;
                document.getElementById('book').scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

function resetBooking() {
    const form = document.getElementById('bookingForm');
    const success = document.getElementById('bookingSuccess');
    
    if (form && success) {
        form.style.display = 'block';
        success.classList.remove('show');
    }
}