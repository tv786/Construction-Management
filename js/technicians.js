// Technician management functionality
import { showToast, formatCurrency, formatDate } from './utils.js';

export class TechnicianManager {
    constructor(storage) {
        this.storage = storage;
        this.currentTechnician = null;
        this.sortColumn = 'name';
        this.sortDirection = 'asc';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupModal();
    }

    setupEventListeners() {
        // Add technician button
        document.getElementById('add-technician-btn').addEventListener('click', () => {
            this.showTechnicianModal();
        });

        // Search functionality
        document.getElementById('technician-search').addEventListener('input', () => {
            this.filterTechnicians();
        });

        // Filter functionality
        document.getElementById('technician-type-filter').addEventListener('change', () => {
            this.filterTechnicians();
        });

        document.getElementById('technician-status-filter').addEventListener('change', () => {
            this.filterTechnicians();
        });

        // Table sorting
        document.querySelectorAll('#technicians-table th[data-sort]').forEach(th => {
            th.addEventListener('click', (e) => {
                const column = e.currentTarget.dataset.sort;
                this.sortTechnicians(column);
            });
        });
    }

    setupModal() {
        this.createTechnicianModal();
    }

    createTechnicianModal() {
        const existingModal = document.getElementById('technician-modal');
        if (existingModal) return;

        const modalHTML = `
            <div class="modal" id="technician-modal">
                <div class="modal-header">
                    <h3 id="technician-modal-title">Add Technician</h3>
                    <button class="btn-close" onclick="closeModal()">&times;</button>
                </div>
                <form id="technician-form" class="modal-body">
                    <div class="form-group">
                        <label for="technician-name">Name *</label>
                        <input type="text" id="technician-name" required>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="technician-type">Type *</label>
                            <select id="technician-type" required>
                                <option value="">Select Type</option>
                                <option value="carpenter">Carpenter</option>
                                <option value="plumber">Plumber</option>
                                <option value="electrician">Electrician</option>
                                <option value="mason">Mason</option>
                                <option value="painter">Painter</option>
                                <option value="welder">Welder</option>
                                <option value="hvac">HVAC Technician</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="technician-status">Status</label>
                            <select id="technician-status">
                                <option value="available">Available</option>
                                <option value="busy">Busy</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="technician-phone">Phone</label>
                            <input type="tel" id="technician-phone">
                        </div>
                        
                        <div class="form-group">
                            <label for="technician-email">Email</label>
                            <input type="email" id="technician-email">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="technician-hourly-rate">Hourly Rate</label>
                            <input type="number" id="technician-hourly-rate" step="0.01" min="0">
                        </div>
                        
                        <div class="form-group">
                            <label for="technician-daily-rate">Daily Rate</label>
                            <input type="number" id="technician-daily-rate" step="0.01" min="0">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="technician-current-project">Current Project</label>
                        <select id="technician-current-project">
                            <option value="">Select Project</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="technician-specialties">Specialties</label>
                        <textarea id="technician-specialties" rows="2" placeholder="List specific skills or specialties"></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="technician-address">Address</label>
                        <textarea id="technician-address" rows="2"></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="technician-notes">Notes</label>
                        <textarea id="technician-notes" rows="2"></textarea>
                    </div>
                    
                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save Technician</button>
                    </div>
                </form>
            </div>
        `;

        document.getElementById('modal-overlay').insertAdjacentHTML('beforeend', modalHTML);

        // Setup form submission
        document.getElementById('technician-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTechnician();
        });
    }

    loadTechnicians() {
        this.populateProjectDropdown();
        this.renderTechniciansTable();
    }

    populateProjectDropdown() {
        const projects = this.storage.getProjects().filter(p => p.status === 'active' || p.status === 'planning');
        const projectSelect = document.getElementById('technician-current-project');
        
        if (projectSelect) {
            const currentValue = projectSelect.value;
            projectSelect.innerHTML = '<option value="">Select Project</option>';
            
            projects.forEach(project => {
                projectSelect.innerHTML += `<option value="${project.id}">${project.name}</option>`;
            });
            
            projectSelect.value = currentValue;
        }
    }

    renderTechniciansTable() {
        const technicians = this.getFilteredTechnicians();
        const tbody = document.getElementById('technicians-table-body');
        
        if (technicians.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <div class="empty-state">
                            <i class="fas fa-users"></i>
                            <h3>No Technicians Found</h3>
                            <p>Add your first technician to get started</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = technicians.map(technician => {
            const project = this.storage.getProjectById(technician.currentProject);
            
            return `
                <tr data-technician-id="${technician.id}">
                    <td>
                        <div class="technician-info">
                            <strong>${technician.name}</strong>
                            ${technician.specialties ? `<br><small class="text-muted">${technician.specialties}</small>` : ''}
                        </div>
                    </td>
                    <td><span class="badge badge-type">${this.getTypeLabel(technician.type)}</span></td>
                    <td>
                        ${technician.phone ? `<i class="fas fa-phone"></i> ${technician.phone}<br>` : ''}
                        ${technician.email ? `<i class="fas fa-envelope"></i> ${technician.email}` : ''}
                    </td>
                    <td>
                        ${technician.hourlyRate ? `<strong>${formatCurrency(technician.hourlyRate)}/hr</strong>` : ''}
                        ${technician.hourlyRate && technician.dailyRate ? '<br>' : ''}
                        ${technician.dailyRate ? `${formatCurrency(technician.dailyRate)}/day` : ''}
                    </td>
                    <td><span class="status-badge ${technician.status}">${technician.status}</span></td>
                    <td>${project ? project.name : 'N/A'}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn view" onclick="technicianManager.viewTechnician('${technician.id}')" title="View">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="action-btn edit" onclick="technicianManager.editTechnician('${technician.id}')" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete" onclick="technicianManager.deleteTechnician('${technician.id}')" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Make technicianManager globally available
        window.technicianManager = this;
    }

    getFilteredTechnicians() {
        let technicians = this.storage.getTechnicians();
        
        // Apply search filter
        const searchTerm = document.getElementById('technician-search').value.toLowerCase();
        if (searchTerm) {
            technicians = technicians.filter(technician =>
                technician.name.toLowerCase().includes(searchTerm) ||
                technician.type.toLowerCase().includes(searchTerm) ||
                technician.phone.toLowerCase().includes(searchTerm) ||
                technician.email.toLowerCase().includes(searchTerm) ||
                technician.specialties.toLowerCase().includes(searchTerm)
            );
        }

        // Apply type filter
        const typeFilter = document.getElementById('technician-type-filter').value;
        if (typeFilter) {
            technicians = technicians.filter(technician => technician.type === typeFilter);
        }

        // Apply status filter
        const statusFilter = document.getElementById('technician-status-filter').value;
        if (statusFilter) {
            technicians = technicians.filter(technician => technician.status === statusFilter);
        }

        // Apply sorting
        technicians.sort((a, b) => {
            let aValue = a[this.sortColumn];
            let bValue = b[this.sortColumn];
            
            // Handle different data types
            if (this.sortColumn === 'hourlyRate') {
                aValue = parseFloat(aValue) || 0;
                bValue = parseFloat(bValue) || 0;
            } else if (this.sortColumn === 'currentProject') {
                const projectA = this.storage.getProjectById(a.currentProject);
                const projectB = this.storage.getProjectById(b.currentProject);
                aValue = projectA ? projectA.name.toLowerCase() : '';
                bValue = projectB ? projectB.name.toLowerCase() : '';
            } else {
                aValue = String(aValue).toLowerCase();
                bValue = String(bValue).toLowerCase();
            }
            
            if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return technicians;
    }

    sortTechnicians(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }

        // Update sort indicators
        document.querySelectorAll('#technicians-table th[data-sort] i').forEach(icon => {
            icon.className = 'fas fa-sort';
        });

        const currentTh = document.querySelector(`#technicians-table th[data-sort="${column}"] i`);
        currentTh.className = `fas fa-sort-${this.sortDirection === 'asc' ? 'up' : 'down'}`;

        this.renderTechniciansTable();
    }

    filterTechnicians() {
        this.renderTechniciansTable();
    }

    showTechnicianModal(technician = null) {
        this.currentTechnician = technician;
        const title = technician ? 'Edit Technician' : 'Add Technician';
        
        document.getElementById('technician-modal-title').textContent = title;
        
        // Populate project dropdown
        this.populateProjectDropdown();
        
        // Reset form
        document.getElementById('technician-form').reset();
        
        // Populate form if editing
        if (technician) {
            document.getElementById('technician-name').value = technician.name || '';
            document.getElementById('technician-type').value = technician.type || '';
            document.getElementById('technician-status').value = technician.status || 'available';
            document.getElementById('technician-phone').value = technician.phone || '';
            document.getElementById('technician-email').value = technician.email || '';
            document.getElementById('technician-hourly-rate').value = technician.hourlyRate || '';
            document.getElementById('technician-daily-rate').value = technician.dailyRate || '';
            document.getElementById('technician-current-project').value = technician.currentProject || '';
            document.getElementById('technician-specialties').value = technician.specialties || '';
            document.getElementById('technician-address').value = technician.address || '';
            document.getElementById('technician-notes').value = technician.notes || '';
        }
        
        window.showModal('technician-modal');
    }

    saveTechnician() {
        const technicianData = {
            name: document.getElementById('technician-name').value.trim(),
            type: document.getElementById('technician-type').value,
            status: document.getElementById('technician-status').value,
            phone: document.getElementById('technician-phone').value.trim(),
            email: document.getElementById('technician-email').value.trim(),
            hourlyRate: parseFloat(document.getElementById('technician-hourly-rate').value) || null,
            dailyRate: parseFloat(document.getElementById('technician-daily-rate').value) || null,
            currentProject: document.getElementById('technician-current-project').value || null,
            specialties: document.getElementById('technician-specialties').value.trim(),
            address: document.getElementById('technician-address').value.trim(),
            notes: document.getElementById('technician-notes').value.trim()
        };

        // Validate required fields
        if (!technicianData.name || !technicianData.type) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        // Validate email format if provided
        if (technicianData.email && !this.isValidEmail(technicianData.email)) {
            showToast('Please enter a valid email address', 'error');
            return;
        }

        try {
            let result;
            if (this.currentTechnician) {
                result = this.storage.updateTechnician(this.currentTechnician.id, technicianData);
                showToast('Technician updated successfully', 'success');
            } else {
                result = this.storage.addTechnician(technicianData);
                showToast('Technician added successfully', 'success');
            }

            if (result) {
                window.closeModal();
                this.renderTechniciansTable();
            } else {
                showToast('Failed to save technician', 'error');
            }
        } catch (error) {
            console.error('Error saving technician:', error);
            showToast('Failed to save technician', 'error');
        }
    }

    viewTechnician(technicianId) {
        const technician = this.storage.getTechnicianById(technicianId);
        if (!technician) {
            showToast('Technician not found', 'error');
            return;
        }

        const project = this.storage.getProjectById(technician.currentProject);
        
        const modalContent = `
            <div class="technician-details">
                <div class="technician-header">
                    <h3>${technician.name}</h3>
                    <span class="status-badge ${technician.status}">${technician.status}</span>
                </div>
                
                <div class="technician-info-grid">
                    <div class="info-item">
                        <label>Type:</label>
                        <span>${this.getTypeLabel(technician.type)}</span>
                    </div>
                    
                    <div class="info-item">
                        <label>Phone:</label>
                        <span>${technician.phone || 'N/A'}</span>
                    </div>
                    
                    <div class="info-item">
                        <label>Email:</label>
                        <span>${technician.email || 'N/A'}</span>
                    </div>
                    
                    ${technician.hourlyRate ? `
                        <div class="info-item">
                            <label>Hourly Rate:</label>
                            <span><strong>${formatCurrency(technician.hourlyRate)}</strong></span>
                        </div>
                    ` : ''}
                    
                    ${technician.dailyRate ? `
                        <div class="info-item">
                            <label>Daily Rate:</label>
                            <span><strong>${formatCurrency(technician.dailyRate)}</strong></span>
                        </div>
                    ` : ''}
                    
                    <div class="info-item">
                        <label>Current Project:</label>
                        <span>${project ? project.name : 'N/A'}</span>
                    </div>
                    
                    <div class="info-item">
                        <label>Added:</label>
                        <span>${formatDate(technician.createdAt)}</span>
                    </div>
                </div>
                
                ${technician.specialties ? `
                    <div class="info-item">
                        <label>Specialties:</label>
                        <p>${technician.specialties}</p>
                    </div>
                ` : ''}
                
                ${technician.address ? `
                    <div class="info-item">
                        <label>Address:</label>
                        <p>${technician.address}</p>
                    </div>
                ` : ''}
                
                ${technician.notes ? `
                    <div class="info-item">
                        <label>Notes:</label>
                        <p>${technician.notes}</p>
                    </div>
                ` : ''}
                
                <div class="technician-actions">
                    <button class="btn btn-primary" onclick="technicianManager.editTechnician('${technician.id}')">
                        <i class="fas fa-edit"></i> Edit Technician
                    </button>
                    <button class="btn btn-secondary" onclick="closeModal()">Close</button>
                </div>
            </div>
        `;

        this.showInfoModal('Technician Details', modalContent);
    }

    editTechnician(technicianId) {
        const technician = this.storage.getTechnicianById(technicianId);
        if (!technician) {
            showToast('Technician not found', 'error');
            return;
        }
        
        this.showTechnicianModal(technician);
    }

    deleteTechnician(technicianId) {
        const technician = this.storage.getTechnicianById(technicianId);
        if (!technician) {
            showToast('Technician not found', 'error');
            return;
        }

        const confirmMessage = `Are you sure you want to delete "${technician.name}"?`;

        if (confirm(confirmMessage)) {
            try {
                this.storage.deleteTechnician(technicianId);
                showToast('Technician deleted successfully', 'success');
                this.renderTechniciansTable();
            } catch (error) {
                console.error('Error deleting technician:', error);
                showToast('Failed to delete technician', 'error');
            }
        }
    }

    getTypeLabel(type) {
        const types = {
            'carpenter': 'Carpenter',
            'plumber': 'Plumber',
            'electrician': 'Electrician',
            'mason': 'Mason',
            'painter': 'Painter',
            'welder': 'Welder',
            'hvac': 'HVAC Technician',
            'other': 'Other'
        };
        return types[type] || type;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showInfoModal(title, content) {
        // Create or update info modal
        let modal = document.getElementById('info-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'info-modal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-header">
                    <h3 id="info-modal-title"></h3>
                    <button class="btn-close" onclick="closeModal()">&times;</button>
                </div>
                <div class="modal-body" id="info-modal-body"></div>
            `;
            document.getElementById('modal-overlay').appendChild(modal);
        }

        document.getElementById('info-modal-title').textContent = title;
        document.getElementById('info-modal-body').innerHTML = content;
        
        window.showModal('info-modal');
    }

    // Assign technician to project
    assignToProject(technicianId, projectId) {
        const technician = this.storage.getTechnicianById(technicianId);
        if (!technician) {
            showToast('Technician not found', 'error');
            return;
        }

        try {
            this.storage.updateTechnician(technicianId, { 
                currentProject: projectId,
                status: projectId ? 'busy' : 'available'
            });
            this.renderTechniciansTable();
            showToast('Technician assignment updated', 'success');
        } catch (error) {
            console.error('Error assigning technician:', error);
            showToast('Failed to update assignment', 'error');
        }
    }
}
