// ===================================
// Work Assignment Management System
// ===================================

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    displayUserGreeting();
    setupRoleBasedAccess();
});

// ===================================
// Authentication & Role Management
// ===================================
function displayUserGreeting() {
    const displayName = localStorage.getItem('displayName');
    const greeting = document.getElementById('userGreeting');
    if (displayName && greeting) {
        greeting.textContent = `Welcome, ${displayName}`;
    }
}

function setupRoleBasedAccess() {
    const userRole = localStorage.getItem('userRole');
    
    // Hide admin-only elements for employees
    if (userRole === 'employee') {
        document.querySelectorAll('.admin-only').forEach(element => {
            element.style.display = 'none';
        });
        
        // Hide filter bar for employees (they only see pending tasks)
        const filterBar = document.querySelector('.filter-bar');
        if (filterBar) {
            filterBar.style.display = 'none';
        }
        
        // Update dashboard labels for employees
        const pendingLabel = document.getElementById('pendingLabel');
        if (pendingLabel) {
            pendingLabel.textContent = 'My Active Tasks';
        }
        
        // Update tasks section header for employees
        const tasksHeader = document.getElementById('tasksHeader');
        const tasksSubheader = document.getElementById('tasksSubheader');
        if (tasksHeader) tasksHeader.textContent = 'My Tasks';
        if (tasksSubheader) tasksSubheader.textContent = 'View and manage your assigned tasks';
        
        // Navigate to tasks view for employees
        navigateToSection('tasks');
    }
}

function getUserRole() {
    return localStorage.getItem('userRole') || 'employee';
}

function getCurrentUserDisplayName() {
    return localStorage.getItem('displayName') || 'User';
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
        localStorage.removeItem('userRole');
        localStorage.removeItem('displayName');
        window.location.href = 'login.html';
    }
}

// ===================================
// Application Initialization
// ===================================
function initializeApp() {
    setupNavigation();
    setupFormSubmission();
    setupFilters();
    loadTasks();
    updateStats();
    setMinDate();
}

// ===================================
// Navigation System
// ===================================
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section');
            navigateToSection(sectionId);
        });
    });
}

function navigateToSection(sectionId) {
    // Remove active class from all nav buttons and sections
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
    
    // Add active class to selected nav button and section
    const activeButton = document.querySelector(`[data-section="${sectionId}"]`);
    const activeSection = document.getElementById(sectionId);
    
    if (activeButton) activeButton.classList.add('active');
    if (activeSection) activeSection.classList.add('active');
    
    // Reload tasks if navigating to tasks section
    if (sectionId === 'tasks') {
        loadTasks('all');
    }
    
    // Update stats if navigating to home
    if (sectionId === 'home') {
        updateStats();
    }
}

// ===================================
// Form Handling & Validation
// ===================================
function setupFormSubmission() {
    const form = document.getElementById('assignForm');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const assignTo = document.getElementById('assignTo').value;
        const name = document.getElementById('name').value;
        const taskTitle = document.getElementById('taskTitle').value;
        const taskDescription = document.getElementById('taskDescription').value;
        const instrument = document.getElementById('instrument').value;
        const date = document.getElementById('date').value;
        const deadline = document.getElementById('deadline').value;
        const areaLocation = document.getElementById('areaLocation').value;
        const clientName = document.getElementById('clientName').value;
        const clientContact = document.getElementById('clientContact').value;
        const price = document.getElementById('price').value;
        
        // Validate all fields
        if (!validateForm(assignTo, name, taskTitle, taskDescription, instrument, date, deadline, areaLocation, clientName, clientContact, price)) {
            return;
        }
        
        // Create task object
        const task = {
            id: generateTaskId(),
            assignTo: assignTo,
            name: name,
            taskTitle: taskTitle,
            taskDescription: taskDescription,
            instrument: instrument,
            date: date,
            deadline: deadline,
            areaLocation: areaLocation,
            clientName: clientName,
            clientContact: clientContact,
            price: price,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        // Save task
        saveTask(task);
        
        // Reset form
        form.reset();
        
        // Show success message
        showAlert('Task assigned successfully!', 'success');
        
        // Navigate to tasks section
        setTimeout(() => {
            navigateToSection('tasks');
        }, 1000);
    });
}

function validateForm(assignTo, name, taskTitle, taskDescription, instrument, date, deadline, areaLocation, clientName, clientContact, price) {
    // Check if any field is empty
    if (!assignTo || !name || !taskTitle || !taskDescription || !instrument || !date || !deadline || !areaLocation || !clientName || !clientContact || !price) {
        showAlert('Please fill in all required fields!', 'error');
        return false;
    }
    
    // Validate name length
    if (name.trim().length < 2) {
        showAlert('Name must be at least 2 characters long!', 'error');
        return false;
    }
    
    // Validate task title length
    if (taskTitle.trim().length < 3) {
        showAlert('Task title must be at least 3 characters long!', 'error');
        return false;
    }
    
    // Validate task description length
    if (taskDescription.trim().length < 10) {
        showAlert('Task description must be at least 10 characters long!', 'error');
        return false;
    }
    
    // Validate contact number
    const phoneRegex = /^[0-9+\-\s()]{10,}$/;
    if (!phoneRegex.test(clientContact)) {
        showAlert('Please enter a valid mobile number (at least 10 digits)!', 'error');
        return false;
    }
    
    // Validate price
    if (parseFloat(price) < 0) {
        showAlert('Price must be a positive number!', 'error');
        return false;
    }
    
    // Validate deadline is not before date
    const selectedDate = new Date(date);
    const selectedDeadline = new Date(deadline);
    
    if (selectedDeadline < selectedDate) {
        showAlert('Deadline cannot be before the start date!', 'error');
        return false;
    }
    
    return true;
}

function setMinDate() {
    const dateInput = document.getElementById('date');
    const deadlineInput = document.getElementById('deadline');
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
    deadlineInput.setAttribute('min', today);
}

// ===================================
// LocalStorage Management
// ===================================
function saveTask(task) {
    let tasks = getTasks();
    tasks.push(task);
    localStorage.setItem('workAssignmentTasks', JSON.stringify(tasks));
    updateStats();
}

function getTasks() {
    const tasksJson = localStorage.getItem('workAssignmentTasks');
    return tasksJson ? JSON.parse(tasksJson) : [];
}

function updateTask(taskId, updates) {
    let tasks = getTasks();
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    
    if (taskIndex !== -1) {
        tasks[taskIndex] = { ...tasks[taskIndex], ...updates };
        localStorage.setItem('workAssignmentTasks', JSON.stringify(tasks));
        updateStats();
    }
}

function deleteTask(taskId) {
    let tasks = getTasks();
    tasks = tasks.filter(task => task.id !== taskId);
    localStorage.setItem('workAssignmentTasks', JSON.stringify(tasks));
    updateStats();
}

function generateTaskId() {
    return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ===================================
// Task Display & Rendering
// ===================================
function loadTasks(filter = 'all') {
    const tasksContainer = document.getElementById('tasksContainer');
    const emptyState = document.getElementById('emptyState');
    let tasks = getTasks();
    
    // Filter by user role - employees only see their assigned tasks
    const userRole = getUserRole();
    const currentUser = getCurrentUserDisplayName();
    
    if (userRole === 'employee') {
        // Employees only see their assigned tasks and hide completed ones
        tasks = tasks.filter(task => task.assignTo === currentUser && !task.completed);
    } else {
        // Admin applies normal filter
        if (filter === 'pending') {
            tasks = tasks.filter(task => !task.completed);
        } else if (filter === 'completed') {
            tasks = tasks.filter(task => task.completed);
        }
    }
    
    // Clear container
    tasksContainer.innerHTML = '';
    
    // Check if there are no tasks
    if (tasks.length === 0) {
        emptyState.classList.add('show');
        tasksContainer.style.display = 'none';
    } else {
        emptyState.classList.remove('show');
        tasksContainer.style.display = 'grid';
        
        // Sort tasks: incomplete first, then by deadline
        tasks.sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            
            // Sort by deadline (earliest first)
            return new Date(a.deadline) - new Date(b.deadline);
        });
        
        // Render each task
        tasks.forEach(task => {
            const taskCard = createTaskCard(task);
            tasksContainer.appendChild(taskCard);
        });
    }
}

function createTaskCard(task) {
    const card = document.createElement('div');
    card.className = `task-card${task.completed ? ' completed' : ''}`;
    card.setAttribute('data-task-id', task.id);
    
    // Format deadline
    const deadlineDate = new Date(task.deadline);
    const formattedDeadline = deadlineDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Check if deadline is approaching or overdue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysUntilDeadline = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
    
    let deadlineClass = '';
    let deadlineWarning = '';
    
    if (!task.completed) {
        if (daysUntilDeadline < 0) {
            deadlineWarning = ' ⚠️ Overdue';
        } else if (daysUntilDeadline <= 3) {
            deadlineWarning = ' ⚠️ Due soon';
        }
    }
    
    // Format date
    const taskDate = new Date(task.date);
    const formattedDate = taskDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    // Get user role for conditional rendering
    const userRole = getUserRole();
    const isAdmin = userRole === 'admin';
    
    // Build task card HTML based on role
    let taskHTML = `
        <div class="task-header">
            <div class="task-employee">👤 ${escapeHtml(task.name)}</div>`;
    
    // Show assigned to for admin
    if (isAdmin) {
        taskHTML += `
            <span class="task-assigned-badge">Assigned to: ${escapeHtml(task.assignTo)}</span>`;
    }
    
    taskHTML += `
        </div>
        <h3 class="task-title">${escapeHtml(task.taskTitle)}</h3>
        <p class="task-description">${escapeHtml(task.taskDescription)}</p>
        <div class="task-details">
            <div class="task-detail-item"><strong>🔧 Instrument:</strong> ${escapeHtml(task.instrument)}</div>
            <div class="task-detail-item"><strong>📅 Date:</strong> ${formattedDate}</div>
            <div class="task-detail-item"><strong>⏰ Deadline:</strong> ${formattedDeadline}${deadlineWarning}</div>
            <div class="task-detail-item"><strong>📍 Location:</strong> ${escapeHtml(task.areaLocation)}</div>
        </div>
        <div class="task-client-section">
            <h4>Client Details</h4>
            <div class="task-client-grid">
                <div class="task-detail-item"><strong>👥 Name:</strong> ${escapeHtml(task.clientName)}</div>
                <div class="task-detail-item"><strong>📞 Mobile:</strong> ${escapeHtml(task.clientContact)}</div>`;
    
    // Show price only to admin
    if (isAdmin) {
        taskHTML += `
                <div class="task-detail-item"><strong>💰 Price:</strong> $${parseFloat(task.price).toFixed(2)}</div>`;
    }
    
    taskHTML += `
            </div>
        </div>`;
    
    // Only show task-actions div if user is admin
    if (isAdmin) {
        taskHTML += `
        <div class="task-actions">
            <button class="task-btn complete-btn" onclick="toggleTaskCompletion('${task.id}')" ${task.completed ? 'disabled' : ''}>
                ${task.completed ? '✓ Completed' : 'Mark Complete'}
            </button>
            <button class="task-btn delete-btn" onclick="confirmDeleteTask('${task.id}')">
                Delete
            </button>
        </div>`;
    } else {
        // Show status indicator for employees
        taskHTML += `
        <div class="task-status-info">
            <span class="status-badge pending">📋 Pending Task</span>
        </div>`;
    }
    
    taskHTML += `
    `;
    
    card.innerHTML = taskHTML;
    
    return card;
}

// ===================================
// Task Actions
// ===================================
function toggleTaskCompletion(taskId) {
    const task = getTasks().find(t => t.id === taskId);
    
    if (task && !task.completed) {
        updateTask(taskId, { completed: true, completedAt: new Date().toISOString() });
        showAlert('Task marked as completed!', 'success');
        
        // For admin, get current filter; for employees, just reload
        const userRole = getUserRole();
        if (userRole === 'admin') {
            const activeFilter = document.querySelector('.filter-btn.active').getAttribute('data-filter');
            loadTasks(activeFilter);
        } else {
            loadTasks(); // Employee view - completed task will disappear
        }
    }
}

function confirmDeleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        deleteTask(taskId);
        showAlert('Task deleted successfully!', 'success');
        
        // Get current filter
        const activeFilter = document.querySelector('.filter-btn.active').getAttribute('data-filter');
        loadTasks(activeFilter);
    }
}

// ===================================
// Filter System
// ===================================
function setupFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all filter buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Get filter value and load tasks
            const filter = this.getAttribute('data-filter');
            loadTasks(filter);
        });
    });
}

// ===================================
// Statistics Update
// ===================================
function updateStats() {
    let tasks = getTasks();
    
    // Filter by user role - employees only see their tasks in stats
    const userRole = getUserRole();
    const currentUser = getCurrentUserDisplayName();
    
    if (userRole === 'employee') {
        // Employees only see their assigned incomplete tasks
        const allEmployeeTasks = tasks.filter(task => task.assignTo === currentUser);
        const incompleteTasks = allEmployeeTasks.filter(task => !task.completed);
        
        document.getElementById('totalTasks').textContent = incompleteTasks.length;
        document.getElementById('pendingTasks').textContent = incompleteTasks.length;
        document.getElementById('completedTasks').textContent = allEmployeeTasks.filter(task => task.completed).length;
    } else {
        // Admin sees all task statistics
        const totalTasks = tasks.length;
        const pendingTasks = tasks.filter(task => !task.completed).length;
        const completedTasks = tasks.filter(task => task.completed).length;
        
        document.getElementById('totalTasks').textContent = totalTasks;
        document.getElementById('pendingTasks').textContent = pendingTasks;
        document.getElementById('completedTasks').textContent = completedTasks;
    }
}

// ===================================
// Alert/Notification System
// ===================================
function showAlert(message, type = 'info') {
    // Remove existing alerts
    const existingAlert = document.querySelector('.custom-alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `custom-alert alert-${type}`;
    alert.textContent = message;
    
    // Style the alert
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        font-weight: 600;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        max-width: 400px;
    `;
    
    // Set color based on type
    if (type === 'success') {
        alert.style.background = '#10b981';
        alert.style.color = 'white';
    } else if (type === 'error') {
        alert.style.background = '#ef4444';
        alert.style.color = 'white';
    } else {
        alert.style.background = '#3b82f6';
        alert.style.color = 'white';
    }
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    
    if (!document.querySelector('style[data-alert-style]')) {
        style.setAttribute('data-alert-style', 'true');
        document.head.appendChild(style);
    }
    
    document.body.appendChild(alert);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        alert.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => alert.remove(), 300);
    }, 3000);
}

// ===================================
// Utility Functions
// ===================================
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// ===================================
// Export functions for global access
// ===================================
window.navigateToSection = navigateToSection;
window.toggleTaskCompletion = toggleTaskCompletion;
window.confirmDeleteTask = confirmDeleteTask;
window.logout = logout;
