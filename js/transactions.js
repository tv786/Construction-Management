// Transaction management functionality
import { showToast, formatCurrency, formatDate } from './utils.js';

export class TransactionManager {
    constructor(storage) {
        this.storage = storage;
        this.currentTransaction = null;
        this.sortColumn = 'date';
        this.sortDirection = 'desc';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupModal();
    }

    setupEventListeners() {
        // Add transaction button
        document.getElementById('add-transaction-btn').addEventListener('click', () => {
            this.showTransactionModal();
        });

        // Search functionality
        document.getElementById('transaction-search').addEventListener('input', () => {
            this.filterTransactions();
        });

        // Filter functionality
        document.getElementById('transaction-type-filter').addEventListener('change', () => {
            this.filterTransactions();
        });

        document.getElementById('transaction-vendor-filter').addEventListener('change', () => {
            this.filterTransactions();
        });

        document.getElementById('transaction-project-filter').addEventListener('change', () => {
            this.filterTransactions();
        });

        document.getElementById('transaction-date-from').addEventListener('change', () => {
            this.filterTransactions();
        });

        document.getElementById('transaction-date-to').addEventListener('change', () => {
            this.filterTransactions();
        });

        // New filter event listeners
        document.getElementById('transaction-category-filter').addEventListener('change', () => {
            this.filterTransactions();
        });

        document.getElementById('transaction-payment-filter').addEventListener('change', () => {
            this.filterTransactions();
        });

        // Table sorting
        document.querySelectorAll('#transactions-table th[data-sort]').forEach(th => {
            th.addEventListener('click', (e) => {
                const column = e.currentTarget.dataset.sort;
                this.sortTransactions(column);
            });
        });
    }

    setupModal() {
        // Create transaction modal if it doesn't exist
        this.createTransactionModal();
    }

    createTransactionModal() {
        const existingModal = document.getElementById('transaction-modal');
        if (existingModal) return;

        const modalHTML = `
            <div class="modal" id="transaction-modal">
                <div class="modal-header">
                    <h3 id="transaction-modal-title">Add Transaction</h3>
                    <button class="btn-close" onclick="closeModal()">&times;</button>
                </div>
                <form id="transaction-form" class="modal-body">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="transaction-type">Type *</label>
                            <select id="transaction-type" required>
                                <option value="">Select Type</option>
                                <option value="income">Income</option>
                                <option value="expense">Expense</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="transaction-date">Date *</label>
                            <input type="date" id="transaction-date" required>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="transaction-vendor">Vendor</label>
                            <select id="transaction-vendor">
                                <option value="">Select Vendor</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="transaction-project">Project</label>
                            <select id="transaction-project">
                                <option value="">Select Project</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="transaction-amount">Amount *</label>
                            <input type="number" id="transaction-amount" step="0.01" min="0" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="transaction-category">Category</label>
                            <select id="transaction-category">
                                <option value="">Select Category</option>
                                <option value="materials">Materials</option>
                                <option value="labor">Labor</option>
                                <option value="equipment">Equipment</option>
                                <option value="transport">Transport</option>
                                <option value="utilities">Utilities</option>
                                <option value="permits">Permits & Licenses</option>
                                <option value="consultation">Consultation</option>
                                <option value="rental">Rental</option>
                                <option value="maintenance">Maintenance</option>
                                <option value="payment">Client Payment</option>
                                <option value="advance">Advance Payment</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="transaction-payment-method">Payment Method</label>
                        <select id="transaction-payment-method">
                            <option value="">Select Payment Method</option>
                            <option value="cash">Cash</option>
                            <option value="check">Check</option>
                            <option value="upi">UPI</option>
                            <option value="bank-transfer">Bank Transfer</option>
                            <option value="card">Card</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="transaction-description">Description *</label>
                        <textarea id="transaction-description" rows="3" required></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="transaction-notes">Notes</label>
                        <textarea id="transaction-notes" rows="2"></textarea>
                    </div>
                    
                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save Transaction</button>
                    </div>
                </form>
            </div>
        `;

        document.getElementById('modal-overlay').insertAdjacentHTML('beforeend', modalHTML);

        // Setup form submission
        document.getElementById('transaction-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTransaction();
        });

        // Set default date to today
        document.getElementById('transaction-date').value = new Date().toISOString().split('T')[0];
    }

    loadTransactions() {
        this.populateFilterDropdowns();
        this.renderTransactionsTable();
    }

    populateFilterDropdowns() {
        // Populate vendor filter
        const vendors = this.storage.getVendors();
        const vendorFilter = document.getElementById('transaction-vendor-filter');
        const vendorSelect = document.getElementById('transaction-vendor');
        
        [vendorFilter, vendorSelect].forEach(select => {
            if (select) {
                const currentValue = select.value;
                select.innerHTML = select.id.includes('filter') ? 
                    '<option value="">All Vendors</option>' : 
                    '<option value="">Select Vendor</option>';
                
                vendors.forEach(vendor => {
                    select.innerHTML += `<option value="${vendor.id}">${vendor.name}</option>`;
                });
                
                select.value = currentValue;
            }
        });

        // Populate project filter
        const projects = this.storage.getProjects();
        const projectFilter = document.getElementById('transaction-project-filter');
        const projectSelect = document.getElementById('transaction-project');
        
        [projectFilter, projectSelect].forEach(select => {
            if (select) {
                const currentValue = select.value;
                select.innerHTML = select.id.includes('filter') ? 
                    '<option value="">All Projects</option>' : 
                    '<option value="">Select Project</option>';
                
                projects.forEach(project => {
                    select.innerHTML += `<option value="${project.id}">${project.name}</option>`;
                });
                
                select.value = currentValue;
            }
        });
    }

    renderTransactionsTable() {
        const transactions = this.getFilteredTransactions();
        const tbody = document.getElementById('transactions-table-body');
        
        if (transactions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="empty-state">
                        <div class="empty-state">
                            <i class="fas fa-receipt"></i>
                            <h3>No Transactions Found</h3>
                            <p>Add your first transaction to get started</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = transactions.map(transaction => {
            const vendor = this.storage.getVendorById(transaction.vendorId);
            const project = this.storage.getProjectById(transaction.projectId);
            
            return `
                <tr data-transaction-id="${transaction.id}">
                    <td>${formatDate(transaction.date)}</td>
                    <td><span class="status-badge ${transaction.type}">${transaction.type}</span></td>
                    <td><span class="category-badge">${transaction.category || 'N/A'}</span></td>
                    <td>${vendor ? vendor.name : 'N/A'}</td>
                    <td>${project ? project.name : 'N/A'}</td>
                    <td class="${transaction.type === 'income' ? 'text-success' : 'text-danger'}">
                        <strong>${formatCurrency(transaction.amount)}</strong>
                    </td>
                    <td><span class="payment-method">${transaction.paymentMethod || 'N/A'}</span></td>
                    <td>
                        <div class="transaction-desc">
                            ${transaction.description}
                        </div>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn view" onclick="transactionManager.viewTransaction('${transaction.id}')" title="View">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="action-btn edit" onclick="transactionManager.editTransaction('${transaction.id}')" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete" onclick="transactionManager.deleteTransaction('${transaction.id}')" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Update transaction summary
        this.updateTransactionSummary(transactions);

        // Make transactionManager globally available
        window.transactionManager = this;
    }

    getFilteredTransactions() {
        let transactions = this.storage.getTransactions();
        
        // Apply search filter
        const searchTerm = document.getElementById('transaction-search').value.toLowerCase();
        if (searchTerm) {
            transactions = transactions.filter(transaction => {
                const vendor = this.storage.getVendorById(transaction.vendorId);
                const project = this.storage.getProjectById(transaction.projectId);
                
                return transaction.description.toLowerCase().includes(searchTerm) ||
                       (vendor && vendor.name.toLowerCase().includes(searchTerm)) ||
                       (project && project.name.toLowerCase().includes(searchTerm)) ||
                       (transaction.category && transaction.category.toLowerCase().includes(searchTerm)) ||
                       (transaction.paymentMethod && transaction.paymentMethod.toLowerCase().includes(searchTerm));
            });
        }

        // Apply type filter
        const typeFilter = document.getElementById('transaction-type-filter').value;
        if (typeFilter) {
            transactions = transactions.filter(transaction => transaction.type === typeFilter);
        }

        // Apply vendor filter
        const vendorFilter = document.getElementById('transaction-vendor-filter').value;
        if (vendorFilter) {
            transactions = transactions.filter(transaction => transaction.vendorId === vendorFilter);
        }

        // Apply project filter
        const projectFilter = document.getElementById('transaction-project-filter').value;
        if (projectFilter) {
            transactions = transactions.filter(transaction => transaction.projectId === projectFilter);
        }

        // Apply date range filter
        const dateFrom = document.getElementById('transaction-date-from').value;
        const dateTo = document.getElementById('transaction-date-to').value;
        
        if (dateFrom) {
            transactions = transactions.filter(transaction => transaction.date >= dateFrom);
        }
        
        if (dateTo) {
            transactions = transactions.filter(transaction => transaction.date <= dateTo);
        }

        // Apply category filter
        const categoryFilter = document.getElementById('transaction-category-filter').value;
        if (categoryFilter) {
            transactions = transactions.filter(transaction => transaction.category === categoryFilter);
        }

        // Apply payment method filter
        const paymentFilter = document.getElementById('transaction-payment-filter').value;
        if (paymentFilter) {
            transactions = transactions.filter(transaction => transaction.paymentMethod === paymentFilter);
        }

        // Apply sorting
        transactions.sort((a, b) => {
            let aValue = a[this.sortColumn];
            let bValue = b[this.sortColumn];
            
            // Handle different data types
            if (this.sortColumn === 'amount') {
                aValue = parseFloat(aValue) || 0;
                bValue = parseFloat(bValue) || 0;
            } else if (this.sortColumn === 'date') {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            } else if (this.sortColumn === 'vendor') {
                const vendorA = this.storage.getVendorById(a.vendorId);
                const vendorB = this.storage.getVendorById(b.vendorId);
                aValue = vendorA ? vendorA.name.toLowerCase() : '';
                bValue = vendorB ? vendorB.name.toLowerCase() : '';
            } else if (this.sortColumn === 'project') {
                const projectA = this.storage.getProjectById(a.projectId);
                const projectB = this.storage.getProjectById(b.projectId);
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

        return transactions;
    }

    sortTransactions(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }

        // Update sort indicators
        document.querySelectorAll('#transactions-table th[data-sort] i').forEach(icon => {
            icon.className = 'fas fa-sort';
        });

        const currentTh = document.querySelector(`#transactions-table th[data-sort="${column}"] i`);
        currentTh.className = `fas fa-sort-${this.sortDirection === 'asc' ? 'up' : 'down'}`;

        this.renderTransactionsTable();
    }

    filterTransactions() {
        this.renderTransactionsTable();
    }

    updateTransactionSummary(filteredTransactions) {
        const allTransactions = this.storage.getTransactions();
        
        // Calculate totals for all transactions
        const totalIncome = allTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
        
        const totalExpense = allTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
        
        const netAmount = totalIncome - totalExpense;
        
        // Calculate filtered total
        const filteredTotal = filteredTransactions
            .reduce((sum, t) => {
                const amount = parseFloat(t.amount || 0);
                return t.type === 'income' ? sum + amount : sum - amount;
            }, 0);
        
        // Update summary display
        document.getElementById('total-income').textContent = formatCurrency(totalIncome);
        document.getElementById('total-expense').textContent = formatCurrency(totalExpense);
        document.getElementById('net-amount').textContent = formatCurrency(netAmount);
        document.getElementById('net-amount').className = `summary-value ${netAmount >= 0 ? 'income' : 'expense'}`;
        document.getElementById('filtered-total').textContent = formatCurrency(Math.abs(filteredTotal));
    }

    showTransactionModal(transaction = null) {
        this.currentTransaction = transaction;
        const title = transaction ? 'Edit Transaction' : 'Add Transaction';
        
        document.getElementById('transaction-modal-title').textContent = title;
        
        // Populate dropdowns
        this.populateFilterDropdowns();
        
        // Reset form
        document.getElementById('transaction-form').reset();
        
        // Set default date to today if adding new
        if (!transaction) {
            document.getElementById('transaction-date').value = new Date().toISOString().split('T')[0];
        }
        
        // Populate form if editing
        if (transaction) {
            document.getElementById('transaction-type').value = transaction.type || '';
            document.getElementById('transaction-date').value = transaction.date || '';
            document.getElementById('transaction-vendor').value = transaction.vendorId || '';
            document.getElementById('transaction-project').value = transaction.projectId || '';
            document.getElementById('transaction-amount').value = transaction.amount || '';
            document.getElementById('transaction-category').value = transaction.category || '';
            document.getElementById('transaction-payment-method').value = transaction.paymentMethod || '';
            document.getElementById('transaction-description').value = transaction.description || '';
            document.getElementById('transaction-notes').value = transaction.notes || '';
        }
        
        window.showModal('transaction-modal');
    }

    saveTransaction() {
        const transactionData = {
            type: document.getElementById('transaction-type').value,
            date: document.getElementById('transaction-date').value,
            vendorId: document.getElementById('transaction-vendor').value || null,
            projectId: document.getElementById('transaction-project').value || null,
            amount: parseFloat(document.getElementById('transaction-amount').value),
            category: document.getElementById('transaction-category').value,
            paymentMethod: document.getElementById('transaction-payment-method').value,
            description: document.getElementById('transaction-description').value.trim(),
            notes: document.getElementById('transaction-notes').value.trim()
        };

        // Validate required fields
        if (!transactionData.type || !transactionData.date || !transactionData.amount || !transactionData.description) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        // Validate amount
        if (transactionData.amount <= 0) {
            showToast('Amount must be greater than zero', 'error');
            return;
        }

        try {
            let result;
            if (this.currentTransaction) {
                result = this.storage.updateTransaction(this.currentTransaction.id, transactionData);
                showToast('Transaction updated successfully', 'success');
            } else {
                result = this.storage.addTransaction(transactionData);
                showToast('Transaction added successfully', 'success');
            }

            if (result) {
                window.closeModal();
                this.renderTransactionsTable();
                
                // Refresh analytics if on dashboard
                if (window.app && window.app.analytics) {
                    window.app.analytics.loadDashboard();
                }
            } else {
                showToast('Failed to save transaction', 'error');
            }
        } catch (error) {
            console.error('Error saving transaction:', error);
            showToast('Failed to save transaction', 'error');
        }
    }

    viewTransaction(transactionId) {
        const transaction = this.storage.getTransactionById(transactionId);
        if (!transaction) {
            showToast('Transaction not found', 'error');
            return;
        }

        const vendor = this.storage.getVendorById(transaction.vendorId);
        const project = this.storage.getProjectById(transaction.projectId);
        
        const modalContent = `
            <div class="transaction-details">
                <div class="transaction-header">
                    <h3>${transaction.description}</h3>
                    <span class="status-badge ${transaction.type}">${transaction.type}</span>
                </div>
                
                <div class="transaction-info-grid">
                    <div class="info-item">
                        <label>Amount:</label>
                        <span class="${transaction.type === 'income' ? 'text-success' : 'text-danger'}">
                            <strong>${formatCurrency(transaction.amount)}</strong>
                        </span>
                    </div>
                    
                    <div class="info-item">
                        <label>Date:</label>
                        <span>${formatDate(transaction.date)}</span>
                    </div>
                    
                    <div class="info-item">
                        <label>Category:</label>
                        <span>${transaction.category || 'N/A'}</span>
                    </div>
                    
                    <div class="info-item">
                        <label>Vendor:</label>
                        <span>${vendor ? vendor.name : 'N/A'}</span>
                    </div>
                    
                    <div class="info-item">
                        <label>Project:</label>
                        <span>${project ? project.name : 'N/A'}</span>
                    </div>
                    
                    <div class="info-item">
                        <label>Created:</label>
                        <span>${formatDate(transaction.createdAt)}</span>
                    </div>
                </div>
                
                ${transaction.notes ? `
                    <div class="info-item">
                        <label>Notes:</label>
                        <p>${transaction.notes}</p>
                    </div>
                ` : ''}
                
                <div class="transaction-actions">
                    <button class="btn btn-primary" onclick="transactionManager.editTransaction('${transaction.id}')">
                        <i class="fas fa-edit"></i> Edit Transaction
                    </button>
                    <button class="btn btn-secondary" onclick="closeModal()">Close</button>
                </div>
            </div>
        `;

        this.showInfoModal('Transaction Details', modalContent);
    }

    editTransaction(transactionId) {
        const transaction = this.storage.getTransactionById(transactionId);
        if (!transaction) {
            showToast('Transaction not found', 'error');
            return;
        }
        
        this.showTransactionModal(transaction);
    }

    deleteTransaction(transactionId) {
        const transaction = this.storage.getTransactionById(transactionId);
        if (!transaction) {
            showToast('Transaction not found', 'error');
            return;
        }

        const confirmMessage = `Are you sure you want to delete this ${transaction.type} transaction of ${formatCurrency(transaction.amount)}?`;

        if (confirm(confirmMessage)) {
            try {
                this.storage.deleteTransaction(transactionId);
                showToast('Transaction deleted successfully', 'success');
                this.renderTransactionsTable();
                
                // Refresh analytics if on dashboard
                if (window.app && window.app.analytics) {
                    window.app.analytics.loadDashboard();
                }
            } catch (error) {
                console.error('Error deleting transaction:', error);
                showToast('Failed to delete transaction', 'error');
            }
        }
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

    // Export transactions to CSV
    exportTransactionsToCSV() {
        const transactions = this.getFilteredTransactions();
        const headers = ['Date', 'Type', 'Vendor', 'Project', 'Amount', 'Category', 'Description', 'Notes'];
        
        const csvContent = [
            headers.join(','),
            ...transactions.map(transaction => {
                const vendor = this.storage.getVendorById(transaction.vendorId);
                const project = this.storage.getProjectById(transaction.projectId);
                
                return [
                    `"${transaction.date}"`,
                    `"${transaction.type}"`,
                    `"${vendor ? vendor.name : ''}"`,
                    `"${project ? project.name : ''}"`,
                    transaction.amount,
                    `"${transaction.category || ''}"`,
                    `"${transaction.description}"`,
                    `"${transaction.notes || ''}"`
                ].join(',');
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('Transactions exported to CSV', 'success');
    }
}
