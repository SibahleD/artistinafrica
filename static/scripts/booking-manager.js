document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const bookingsContainer = document.querySelector('.bookings-container');
    const filterSelect = document.getElementById('booking-filter');
    
    // Load bookings
    fetchBookings();
    
    // Filter change handler
    if (filterSelect) {
        filterSelect.addEventListener('change', fetchBookings);
    }
    
    function fetchBookings() {
        const filter = filterSelect ? filterSelect.value : 'all';
        
        fetch(`/api/studio-bookings?filter=${filter}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    bookingsContainer.innerHTML = `<div class="error-message">${data.error}</div>`;
                    return;
                }
                
                if (data.length === 0) {
                    bookingsContainer.innerHTML = '<div class="no-bookings">No bookings found</div>';
                    return;
                }
                
                bookingsContainer.innerHTML = '';
                data.forEach(booking => {
                    const bookingCard = createBookingCard(booking);
                    bookingsContainer.appendChild(bookingCard);
                });
            })
            .catch(error => {
                console.error('Error:', error);
                bookingsContainer.innerHTML = '<div class="error-message">Failed to load bookings</div>';
            });
    }
    
    function createBookingCard(booking) {
        const card = document.createElement('div');
        card.className = `booking-card ${booking.status}`;
        
        let actionsHTML = '';
        if (booking.status === 'pending') {
            actionsHTML = `
                <button class="btn-action confirm" data-booking-id="${booking.booking_id}">Confirm</button>
                <button class="btn-action decline" data-booking-id="${booking.booking_id}">Decline</button>
            `;
        } else if (booking.status === 'confirmed') {
            actionsHTML = `
                <button class="btn-action reschedule" data-booking-id="${booking.booking_id}">Reschedule</button>
                <button class="btn-action cancel" data-booking-id="${booking.booking_id}">Cancel</button>
            `;
        }
        
        card.innerHTML = `
            <div class="booking-header">
                <h3>${booking.client_name}</h3>
                <span class="booking-status">${booking.status}</span>
            </div>
            <div class="booking-details">
                <p><strong>Service:</strong> ${booking.service_type}</p>
                <p><strong>Date:</strong> ${booking.booking_date}</p>
                <p><strong>Time:</strong> ${booking.time_slot}</p>
                ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ''}
            </div>
            <div class="booking-actions">
                ${actionsHTML}
            </div>
        `;
        
        // Add event listeners to action buttons
        card.querySelectorAll('.btn-action').forEach(btn => {
            btn.addEventListener('click', function() {
                const action = this.classList.contains('confirm') ? 'confirm' :
                              this.classList.contains('decline') ? 'decline' :
                              this.classList.contains('reschedule') ? 'reschedule' : 'cancel';
                              
                handleBookingAction(this.dataset.bookingId, action);
            });
        });
        
        return card;
    }
    
    function handleBookingAction(bookingId, action) {
        if (action === 'reschedule') {
            rescheduleBooking(bookingId);
            return;
        }
        
        let newStatus = '';
        let confirmMessage = '';
        
        if (action === 'confirm') {
            newStatus = 'confirmed';
            confirmMessage = 'Are you sure you want to confirm this booking?';
        } else if (action === 'decline') {
            newStatus = 'cancelled';
            confirmMessage = 'Are you sure you want to decline this booking?';
        } else if (action === 'cancel') {
            newStatus = 'cancelled';
            confirmMessage = 'Are you sure you want to cancel this booking?';
        }
        
        if (confirm(confirmMessage)) {
            updateBookingStatus(bookingId, newStatus);
        }
    }
    
    function updateBookingStatus(bookingId, newStatus) {
        fetch(`/api/studio-bookings/${bookingId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status: newStatus
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                fetchBookings(); // Refresh the list
            } else {
                alert('Error: ' + (data.error || 'Failed to update booking'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to update booking');
        });
    }
    
    function rescheduleBooking(bookingId) {
        // In a real app, you'd show a modal with a form
        const newDate = prompt('Enter new booking date (YYYY-MM-DD):');
        if (!newDate) return;
        
        const newTime = prompt('Enter new time slot (HH:MM - HH:MM):');
        if (!newTime) return;
        
        fetch(`/api/studio-bookings/${bookingId}/reschedule`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                new_date: newDate,
                new_time_slot: newTime
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                fetchBookings(); // Refresh the list
            } else {
                alert('Error: ' + (data.error || 'Failed to reschedule booking'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to reschedule booking');
        });
    }
});