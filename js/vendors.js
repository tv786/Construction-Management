// Vendor management functionality
import { showToast, formatCurrency, formatDate } from './utils.js';

export class VendorManager {
    constructor(storage) {
        this.storage = storage;
        this.currentVendor = null;
        this.sortColumn = 'name';
        this.sortDirection = 'asc';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupModal();
    }

    setupEventListeners() {
        // Add vendor button
        document.getElementById('add-vendor-btn').addEventListener('click', () => {
            this.showVendorModal();
        });

        // Search functionality
        document.getElementById('vendor-search').addEventListener('input', (e) => {
            this.filterVendors();
        });

        // Filter functionality
        document.getElementById('vendor-category-filter').addEventListener('change', () => {
            this.filterVendors();
        });

        document.getElementById('vendor-status-filter').addEventListener('change', () => {
            this.filterVendors();
        });

        // Table sorting
        document.querySelectorAll('#vendors-table th[data-sort]').forEach(th => {
            th.addEventListener('click', (e) => {
                const column = e.currentTarget.dataset.sort;
                this.sortVendors(column);
            });
        });
    }

    setupModal() {
        // Vendor form submission
        document.getElementById('vendor-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveVendor();
        });
    }

    loadVendors() {
        this.renderVendorsTable();
    }

    renderVendorsTable() {
        const vendors = this.getFilteredVendors();
        const tbody = document.getElementById('vendors-table-body');
        
        if (vendors.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <div class="empty-state">
                            <i class="fas fa-building"></i>
                            <h3>No Vendors Found</h3>
                            <p>Add your first vendor to get started</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = vendors.map(vendor => `
            <tr data-vendor-id="${vendor.id}">
                <td>
                    <div class="vendor-info">
                        <strong>${vendor.name}</strong>
                        ${vendor.contact ? `<br><small class="text-muted">${vendor.contact}</small>` : ''}
                    </div>
                </td>
                <td><span class="badge badge-category">${this.getCategoryLabel(vendor.category)}</span></td>
                <td>
                    ${vendor.phone ? `<i class="fas fa-phone"></i> ${vendor.phone}<br>` : ''}
                    ${vendor.email ? `<i class="fas fa-envelope"></i> ${vendor.email}` : ''}
                </td>
                <td><strong>${formatCurrency(vendor.totalSpent || 0)}</strong></td>
                <td><span class="status-badge ${vendor.status}">${vendor.status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view" onclick="vendorManager.viewVendor('${vendor.id}')" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit" onclick="vendorManager.editVendor('${vendor.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="vendorManager.deleteVendor('${vendor.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Make vendorManager globally available for onclick handlers
        window.vendorManager = this;
    }

    getFilteredVendors() {
        let vendors = this.storage.getVendors();
        
        // Apply search filter
        const searchTerm = document.getElementById('vendor-search').value.toLowerCase();
        if (searchTerm) {
            vendors = vendors.filter(vendor =>
                vendor.name.toLowerCase().includes(searchTerm) ||
                vendor.category.toLowerCase().includes(searchTerm) ||
                vendor.contact.toLowerCase().includes(searchTerm) ||
                vendor.email.toLowerCase().includes(searchTerm)
            );
        }

        // Apply category filter
        const categoryFilter = document.getElementById('vendor-category-filter').value;
        if (categoryFilter) {
            vendors = vendors.filter(vendor => vendor.category === categoryFilter);
        }

        // Apply status filter
        const statusFilter = document.getElementById('vendor-status-filter').value;
        if (statusFilter) {
            vendors = vendors.filter(vendor => vendor.status === statusFilter);
        }

        // Apply sorting
        vendors.sort((a, b) => {
            let aValue = a[this.sortColumn];
            let bValue = b[this.sortColumn];
            
            // Handle different data types
            if (this.sortColumn === 'totalSpent') {
                aValue = parseFloat(aValue) || 0;
                bValue = parseFloat(bValue) || 0;
            } else {
                aValue = String(aValue).toLowerCase();
                bValue = String(bValue).toLowerCase();
            }
            
            if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return vendors;
    }

    sortVendors(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }

        // Update sort indicators
        document.querySelectorAll('#vendors-table th[data-sort] i').forEach(icon => {
            icon.className = 'fas fa-sort';
        });

        const currentTh = document.querySelector(`#vendors-table th[data-sort="${column}"] i`);
        currentTh.className = `fas fa-sort-${this.sortDirection === 'asc' ? 'up' : 'down'}`;

        this.renderVendorsTable();
    }

    filterVendors() {
        this.renderVendorsTable();
    }

    showVendorModal(vendor = null) {
        this.currentVendor = vendor;
        const title = vendor ? 'Edit Vendor' : 'Add Vendor';
        
        document.getElementById('vendor-modal-title').textContent = title;
        
        // Reset form
        document.getElementById('vendor-form').reset();
        
        // Populate form if editing
        if (vendor) {
            document.getElementById('vendor-name').value = vendor.name || '';
            document.getElementById('vendor-category').value = vendor.category || '';
            document.getElementById('vendor-contact').value = vendor.contact || '';
            document.getElementById('vendor-phone').value = vendor.phone || '';
            document.getElementById('vendor-email').value = vendor.email || '';
            document.getElementById('vendor-address').value = vendor.address || '';
            document.getElementById('vendor-notes').value = vendor.notes || '';
        }
        
        window.showModal('vendor-modal');
    }

    saveVendor() {
        const formData = new FormData(document.getElementById('vendor-form'));
        const vendorData = {
            name: document.getElementById('vendor-name').value.trim(),
            category: document.getElementById('vendor-category').value,
            contact: document.getElementById('vendor-contact').value.trim(),
            phone: document.getElementById('vendor-phone').value.trim(),
            email: document.getElementById('vendor-email').value.trim(),
            address: document.getElementById('vendor-address').value.trim(),
            notes: document.getElementById('vendor-notes').value.trim(),
            status: 'active'
        };

        // Validate required fields
        if (!vendorData.name || !vendorData.category) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        // Validate email format if provided
        if (vendorData.email && !this.isValidEmail(vendorData.email)) {
            showToast('Please enter a valid email address', 'error');
            return;
        }

        try {
            let result;
            if (this.currentVendor) {
                result = this.storage.updateVendor(this.currentVendor.id, vendorData);
                showToast('Vendor updated successfully', 'success');
            } else {
                result = this.storage.addVendor(vendorData);
                showToast('Vendor added successfully', 'success');
            }

            if (result) {
                window.closeModal();
                this.renderVendorsTable();
            } else {
                showToast('Failed to save vendor', 'error');
            }
        } catch (error) {
            console.error('Error saving vendor:', error);
            showToast('Failed to save vendor', 'error');
        }
    }

    viewVendor(vendorId) {
        const vendor = this.storage.getVendorById(vendorId);
        if (!vendor) {
            showToast('Vendor not found', 'error');
            return;
        }

        // Get vendor transactions
        const transactions = this.storage.getTransactionsByVendor(vendorId);
        
        // Create view modal content
        const modalContent = `
            <div class="vendor-details">
                <div class="vendor-header">
                    <h3>${vendor.name}</h3>
                    <span class="status-badge ${vendor.status}">${vendor.status}</span>
                </div>
                
                <div class="vendor-info-grid">
                    <div class="info-item">
                        <label>Category:</label>
                        <span>${this.getCategoryLabel(vendor.category)}</span>
                    </div>
                    
                    <div class="info-item">
                        <label>Contact Person:</label>
                        <span>${vendor.contact || 'N/A'}</span>
                    </div>
                    
                    <div class="info-item">
                        <label>Phone:</label>
                        <span>${vendor.phone || 'N/A'}</span>
                    </div>
                    
                    <div class="info-item">
                        <label>Email:</label>
                        <span>${vendor.email || 'N/A'}</span>
                    </div>
                    
                    <div class="info-item">
                        <label>Total Spent:</label>
                        <span><strong>${formatCurrency(vendor.totalSpent || 0)}</strong></span>
                    </div>
                    
                    <div class="info-item">
                        <label>Transactions:</label>
                        <span>${transactions.length} transactions</span>
                    </div>
                </div>
                
                ${vendor.address ? `
                    <div class="info-item">
                        <label>Address:</label>
                        <p>${vendor.address}</p>
                    </div>
                ` : ''}
                
                ${vendor.notes ? `
                    <div class="info-item">
                        <label>Notes:</label>
                        <p>${vendor.notes}</p>
                    </div>
                ` : ''}
                
                <div class="vendor-actions">
                    <button class="btn btn-primary" onclick="vendorManager.editVendor('${vendor.id}')">
                        <i class="fas fa-edit"></i> Edit Vendor
                    </button>
                    <button class="btn btn-secondary" onclick="closeModal()">Close</button>
                </div>
            </div>
        `;

        // Show in a generic modal or create a custom one
        this.showInfoModal('Vendor Details', modalContent);
    }

    editVendor(vendorId) {
        const vendor = this.storage.getVendorById(vendorId);
        if (!vendor) {
            showToast('Vendor not found', 'error');
            return;
        }
        
        this.showVendorModal(vendor);
    }

    deleteVendor(vendorId) {
        const vendor = this.storage.getVendorById(vendorId);
        if (!vendor) {
            showToast('Vendor not found', 'error');
            return;
        }

        // Check if vendor has transactions
        const transactions = this.storage.getTransactionsByVendor(vendorId);
        
        let confirmMessage = `Are you sure you want to delete "${vendor.name}"?`;
        if (transactions.length > 0) {
            confirmMessage += `\n\nThis vendor has ${transactions.length} transaction(s). Deleting the vendor will not affect existing transactions.`;
        }

        if (confirm(confirmMessage)) {
            try {
                this.storage.deleteVendor(vendorId);
                showToast('Vendor deleted successfully', 'success');
                this.renderVendorsTable();
            } catch (error) {
                console.error('Error deleting vendor:', error);
                showToast('Failed to delete vendor', 'error');
            }
        }
    }

    getCategoryLabel(category) {
        const categories = {
            'materials': 'Materials Supplier',
            'equipment': 'Equipment Rental',
            'services': 'Services',
            'subcontractor': 'Subcontractor'
        };
        return categories[category] || category;
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

    // Export vendors to CSV
    exportVendorsToCSV() {
        const vendors = this.storage.getVendors();
        const headers = ['Name', 'Category', 'Contact', 'Phone', 'Email', 'Address', 'Status', 'Total Spent', 'Created Date'];
        
        const csvContent = [
            headers.join(','),
            ...vendors.map(vendor => [
                `"${vendor.name}"`,
                `"${vendor.category}"`,
                `"${vendor.contact || ''}"`,
                `"${vendor.phone || ''}"`,
                `"${vendor.email || ''}"`,
                `"${vendor.address || ''}"`,
                `"${vendor.status}"`,
                vendor.totalSpent || 0,
                `"${formatDate(vendor.createdAt)}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vendors-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('Vendors exported to CSV', 'success');
    }
}
