document.addEventListener("DOMContentLoaded", function() {
    // Load bookings
    fetchBookings();
    
    // Setup booking actions
    setupBookingActions();

    function fetchBookings() {
        const userId = sessionStorage.getItem('user_id');
        if (!userId) {
            window.location.href = '/sign-in';
            return;
        }
        
        fetch(`/api/bookings?user_id=${userId}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.error(data.error);
                    return;
                }
                
                const bookingsContainer = document.querySelector('.bookings-container');
                if (bookingsContainer) {
                    bookingsContainer.innerHTML = '';
                    
                    if (data.length === 0) {
                        bookingsContainer.innerHTML = '<p>No upcoming bookings found.</p>';
                        return;
                    }
                    
                    data.forEach(booking => {
                        const bookingCard = document.createElement('div');
                        bookingCard.className = 'booking-card';
                        
                        let actionsHtml = '';
                        if (booking.status === 'pending') {
                            actionsHtml = `
                                <button class="btn-action confirm" data-booking-id="${booking.id}">Confirm</button>
                                <button class="btn-action cancel" data-booking-id="${booking.id}">Decline</button>
                            `;
                        } else if (booking.status === 'confirmed') {
                            actionsHtml = `
                                <button class="btn-action edit" data-booking-id="${booking.id}">Reschedule</button>
                                <button class="btn-action cancel" data-booking-id="${booking.id}">Cancel</button>
                            `;
                        }
                        
                        bookingCard.innerHTML = `
                            <div class="booking-header">
                                <h4>${booking.studio_name || booking.artist_name} - ${booking.service_type}</h4>
                                <span class="booking-status ${booking.status}">${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span>
                            </div>
                            <div class="booking-details">
                                <p><strong>Date:</strong> <span class="booking-date">${booking.booking_date}</span></p>
                                <p><strong>Time:</strong> <span class="booking-time">${booking.time_slot}</span></p>
                                <p><strong>Service:</strong> <span class="booking-service">${booking.service_type}</span></p>
                            </div>
                            <div class="booking-actions">
                                ${actionsHtml}
                            </div>
                        `;
                        
                        bookingsContainer.appendChild(bookingCard);
                    });
                    
                    setupBookingActions();
                }
            })
            .catch(error => console.error('Error fetching bookings:', error));
    }

    function setupBookingActions() {
        // Confirm booking
        document.querySelectorAll('.btn-action.confirm').forEach(btn => {
            btn.addEventListener('click', function() {
                const bookingId = this.getAttribute('data-booking-id');
                updateBookingStatus(bookingId, 'confirmed');
            });
        });
        
        // Decline booking
        document.querySelectorAll('.btn-action.cancel').forEach(btn => {
            btn.addEventListener('click', function() {
                const bookingId = this.getAttribute('data-booking-id');
                if (confirm('Are you sure you want to cancel this booking?')) {
                    updateBookingStatus(bookingId, 'cancelled');
                }
            });
        });
        
        // Reschedule booking
        document.querySelectorAll('.btn-action.edit').forEach(btn => {
            btn.addEventListener('click', function() {
                const bookingId = this.getAttribute('data-booking-id');
                // In a real app, this would open a rescheduling modal
                alert('Reschedule functionality would open a modal here');
            });
        });
    }
    
    function updateBookingStatus(bookingId, status) {
        fetch('/api/update-booking', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                booking_id: bookingId,
                status: status
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                alert(`Booking ${status} successfully`);
                fetchBookings(); // Refresh the list
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to update booking');
        });
    }
});