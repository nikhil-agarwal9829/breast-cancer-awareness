document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard functionality
    initializeDashboard();
});

function initializeDashboard() {
    // Tab switching functionality
    const navLinks = document.querySelectorAll('.nav-links li[data-tab]');
    const contentSections = document.querySelectorAll('.content-section');

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            // Remove active class from all links and sections
            navLinks.forEach(l => l.classList.remove('active'));
            contentSections.forEach(section => section.classList.remove('active'));

            // Add active class to clicked link and corresponding section
            link.classList.add('active');
            const tabId = link.getAttribute('data-tab');
            document.getElementById(`${tabId}-content`).classList.add('active');
        });
    });

    // Logout functionality
    const logoutButton = document.getElementById('logout');
    logoutButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            // Clear session storage
            sessionStorage.clear();
            // Redirect to login page
            window.location.href = 'login.html';
        }
    });

    // Search functionality
    const searchInput = document.querySelector('.search-bar input');
    searchInput.addEventListener('input', handleSearch);

    // Initialize action buttons
    initializeActionButtons();

    // Load initial data
    loadDashboardData();
}

function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const activeSection = document.querySelector('.content-section.active');
    
    if (!activeSection) return;

    const tableRows = activeSection.querySelectorAll('tbody tr');
    
    tableRows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function initializeActionButtons() {
    // Approve buttons
    document.querySelectorAll('.btn-action.approve').forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr');
            const id = row.cells[0].textContent;
            handleApproval(id, row);
        });
    });

    // Reject buttons
    document.querySelectorAll('.btn-action.reject').forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr');
            const id = row.cells[0].textContent;
            handleRejection(id, row);
        });
    });

    // Edit buttons
    document.querySelectorAll('.btn-action.edit').forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr');
            const id = row.cells[0].textContent;
            handleEdit(id);
        });
    });

    // Delete buttons
    document.querySelectorAll('.btn-action.delete').forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr');
            const id = row.cells[0].textContent;
            handleDelete(id, row);
        });
    });

    // View buttons
    document.querySelectorAll('.btn-action.view').forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr');
            const id = row.cells[0].textContent;
            handleView(id);
        });
    });

    // Reply buttons
    document.querySelectorAll('.btn-action.reply').forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr');
            const id = row.cells[0].textContent;
            handleReply(id);
        });
    });
}

function loadDashboardData() {
    // Simulated data loading
    // In a real application, this would fetch data from an API
    updateStats();
    updateRecentActivity();
}

function updateStats() {
    // Simulated stats update
    // In a real application, this would fetch real-time data from an API
    const stats = {
        appointments: 248,
        contacts: 156,
        hospitals: 32,
        medicines: 89
    };

    Object.entries(stats).forEach(([key, value]) => {
        const element = document.querySelector(`.card-info p[data-stat="${key}"]`);
        if (element) {
            element.textContent = value;
        }
    });
}

function updateRecentActivity() {
    // Simulated recent activity update
    // In a real application, this would fetch real-time data from an API
    const activities = [
        {
            type: 'appointment',
            title: 'New Appointment',
            description: 'Sarah Johnson scheduled an appointment',
            time: '2 minutes ago'
        },
        {
            type: 'registration',
            title: 'New Registration',
            description: 'New user registered: John Smith',
            time: '15 minutes ago'
        },
        {
            type: 'medicine',
            title: 'Medicine Order',
            description: 'New medicine order received',
            time: '1 hour ago'
        }
    ];

    const activityList = document.querySelector('.activity-list');
    if (activityList) {
        activityList.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-${getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-details">
                    <h4>${activity.title}</h4>
                    <p>${activity.description}</p>
                    <span class="time">${activity.time}</span>
                </div>
            </div>
        `).join('');
    }
}

function getActivityIcon(type) {
    const icons = {
        appointment: 'calendar-check',
        registration: 'user-plus',
        medicine: 'pills',
        contact: 'envelope',
        hospital: 'hospital'
    };
    return icons[type] || 'info-circle';
}

// Action handlers
function handleApproval(id, row) {
    if (confirm(`Are you sure you want to approve ${id}?`)) {
        const statusCell = row.querySelector('.status');
        statusCell.className = 'status active';
        statusCell.textContent = 'Approved';
        // In a real application, make an API call to update the status
    }
}

function handleRejection(id, row) {
    if (confirm(`Are you sure you want to reject ${id}?`)) {
        const statusCell = row.querySelector('.status');
        statusCell.className = 'status rejected';
        statusCell.textContent = 'Rejected';
        // In a real application, make an API call to update the status
    }
}

function handleEdit(id) {
    // Implement edit functionality
    // This could open a modal with a form to edit the item
    alert(`Edit item ${id}`);
}

function handleDelete(id, row) {
    if (confirm(`Are you sure you want to delete ${id}? This action cannot be undone.`)) {
        row.remove();
        // In a real application, make an API call to delete the item
    }
}

function handleView(id) {
    // Implement view functionality
    // This could open a modal with detailed information
    alert(`View details for ${id}`);
}

function handleReply(id) {
    // Implement reply functionality
    // This could open a modal with a message form
    alert(`Reply to ${id}`);
}

// Notifications
document.querySelector('.notifications').addEventListener('click', function() {
    // Implement notifications panel
    alert('Notifications panel - To be implemented');
}); 