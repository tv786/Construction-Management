// Local storage management for offline functionality
export class StorageManager {
    constructor() {
        this.keys = {
            vendors: 'ruh_al_bina_vendors',
            transactions: 'ruh_al_bina_transactions',
            projects: 'ruh_al_bina_projects',
            technicians: 'ruh_al_bina_technicians',
            settings: 'ruh_al_bina_settings'
        };
        this.initializeData();
    }

    initializeData() {
        // Initialize with empty arrays if no data exists
        if (!localStorage.getItem(this.keys.vendors)) {
            this.saveVendors([]);
        }
        if (!localStorage.getItem(this.keys.transactions)) {
            this.saveTransactions([]);
        }
        if (!localStorage.getItem(this.keys.projects)) {
            this.saveProjects([]);
        }
        if (!localStorage.getItem(this.keys.technicians)) {
            this.saveTechnicians([]);
        }
        if (!localStorage.getItem(this.keys.settings)) {
            this.saveSettings({
                currency: 'USD',
                dateFormat: 'YYYY-MM-DD',
                theme: 'light'
            });
        }
    }

    // Vendor operations
    getVendors() {
        try {
            return JSON.parse(localStorage.getItem(this.keys.vendors)) || [];
        } catch (error) {
            console.error('Error loading vendors:', error);
            return [];
        }
    }

    saveVendors(vendors) {
        try {
            localStorage.setItem(this.keys.vendors, JSON.stringify(vendors));
            return true;
        } catch (error) {
            console.error('Error saving vendors:', error);
            return false;
        }
    }

    addVendor(vendor) {
        const vendors = this.getVendors();
        vendor.id = this.generateId();
        vendor.createdAt = new Date().toISOString();
        vendor.updatedAt = new Date().toISOString();
        vendor.totalSpent = 0;
        vendor.status = vendor.status || 'active';
        
        vendors.push(vendor);
        return this.saveVendors(vendors) ? vendor : null;
    }

    updateVendor(id, updatedVendor) {
        const vendors = this.getVendors();
        const index = vendors.findIndex(v => v.id === id);
        
        if (index !== -1) {
            vendors[index] = { ...vendors[index], ...updatedVendor, updatedAt: new Date().toISOString() };
            return this.saveVendors(vendors) ? vendors[index] : null;
        }
        return null;
    }

    deleteVendor(id) {
        const vendors = this.getVendors();
        const filteredVendors = vendors.filter(v => v.id !== id);
        return this.saveVendors(filteredVendors);
    }

    getVendorById(id) {
        const vendors = this.getVendors();
        return vendors.find(v => v.id === id) || null;
    }

    // Transaction operations
    getTransactions() {
        try {
            return JSON.parse(localStorage.getItem(this.keys.transactions)) || [];
        } catch (error) {
            console.error('Error loading transactions:', error);
            return [];
        }
    }

    saveTransactions(transactions) {
        try {
            localStorage.setItem(this.keys.transactions, JSON.stringify(transactions));
            this.updateVendorTotals();
            return true;
        } catch (error) {
            console.error('Error saving transactions:', error);
            return false;
        }
    }

    addTransaction(transaction) {
        const transactions = this.getTransactions();
        transaction.id = this.generateId();
        transaction.createdAt = new Date().toISOString();
        transaction.updatedAt = new Date().toISOString();
        
        transactions.push(transaction);
        return this.saveTransactions(transactions) ? transaction : null;
    }

    updateTransaction(id, updatedTransaction) {
        const transactions = this.getTransactions();
        const index = transactions.findIndex(t => t.id === id);
        
        if (index !== -1) {
            transactions[index] = { ...transactions[index], ...updatedTransaction, updatedAt: new Date().toISOString() };
            return this.saveTransactions(transactions) ? transactions[index] : null;
        }
        return null;
    }

    deleteTransaction(id) {
        const transactions = this.getTransactions();
        const filteredTransactions = transactions.filter(t => t.id !== id);
        return this.saveTransactions(filteredTransactions);
    }

    getTransactionById(id) {
        const transactions = this.getTransactions();
        return transactions.find(t => t.id === id) || null;
    }

    // Project operations
    getProjects() {
        try {
            return JSON.parse(localStorage.getItem(this.keys.projects)) || [];
        } catch (error) {
            console.error('Error loading projects:', error);
            return [];
        }
    }

    saveProjects(projects) {
        try {
            localStorage.setItem(this.keys.projects, JSON.stringify(projects));
            return true;
        } catch (error) {
            console.error('Error saving projects:', error);
            return false;
        }
    }

    addProject(project) {
        const projects = this.getProjects();
        project.id = this.generateId();
        project.createdAt = new Date().toISOString();
        project.updatedAt = new Date().toISOString();
        project.progress = project.progress || 0;
        project.status = project.status || 'planning';
        
        projects.push(project);
        return this.saveProjects(projects) ? project : null;
    }

    updateProject(id, updatedProject) {
        const projects = this.getProjects();
        const index = projects.findIndex(p => p.id === id);
        
        if (index !== -1) {
            projects[index] = { ...projects[index], ...updatedProject, updatedAt: new Date().toISOString() };
            return this.saveProjects(projects) ? projects[index] : null;
        }
        return null;
    }

    deleteProject(id) {
        const projects = this.getProjects();
        const filteredProjects = projects.filter(p => p.id !== id);
        return this.saveProjects(filteredProjects);
    }

    getProjectById(id) {
        const projects = this.getProjects();
        return projects.find(p => p.id === id) || null;
    }

    // Technician operations
    getTechnicians() {
        try {
            return JSON.parse(localStorage.getItem(this.keys.technicians)) || [];
        } catch (error) {
            console.error('Error loading technicians:', error);
            return [];
        }
    }

    saveTechnicians(technicians) {
        try {
            localStorage.setItem(this.keys.technicians, JSON.stringify(technicians));
            return true;
        } catch (error) {
            console.error('Error saving technicians:', error);
            return false;
        }
    }

    addTechnician(technician) {
        const technicians = this.getTechnicians();
        technician.id = this.generateId();
        technician.createdAt = new Date().toISOString();
        technician.updatedAt = new Date().toISOString();
        technician.status = technician.status || 'available';
        
        technicians.push(technician);
        return this.saveTechnicians(technicians) ? technician : null;
    }

    updateTechnician(id, updatedTechnician) {
        const technicians = this.getTechnicians();
        const index = technicians.findIndex(t => t.id === id);
        
        if (index !== -1) {
            technicians[index] = { ...technicians[index], ...updatedTechnician, updatedAt: new Date().toISOString() };
            return this.saveTechnicians(technicians) ? technicians[index] : null;
        }
        return null;
    }

    deleteTechnician(id) {
        const technicians = this.getTechnicians();
        const filteredTechnicians = technicians.filter(t => t.id !== id);
        return this.saveTechnicians(filteredTechnicians);
    }

    getTechnicianById(id) {
        const technicians = this.getTechnicians();
        return technicians.find(t => t.id === id) || null;
    }

    // Settings operations
    getSettings() {
        try {
            return JSON.parse(localStorage.getItem(this.keys.settings)) || {};
        } catch (error) {
            console.error('Error loading settings:', error);
            return {};
        }
    }

    saveSettings(settings) {
        try {
            localStorage.setItem(this.keys.settings, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    }

    // Utility methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    updateVendorTotals() {
        const vendors = this.getVendors();
        const transactions = this.getTransactions();
        
        vendors.forEach(vendor => {
            const vendorTransactions = transactions.filter(t => t.vendorId === vendor.id && t.type === 'expense');
            vendor.totalSpent = vendorTransactions.reduce((total, t) => total + (t.amount || 0), 0);
        });
        
        this.saveVendors(vendors);
    }

    // Data import/export
    exportData() {
        return {
            vendors: this.getVendors(),
            transactions: this.getTransactions(),
            projects: this.getProjects(),
            technicians: this.getTechnicians(),
            settings: this.getSettings(),
            exportDate: new Date().toISOString()
        };
    }

    importData(data) {
        try {
            if (data.vendors) this.saveVendors(data.vendors);
            if (data.transactions) this.saveTransactions(data.transactions);
            if (data.projects) this.saveProjects(data.projects);
            if (data.technicians) this.saveTechnicians(data.technicians);
            if (data.settings) this.saveSettings(data.settings);
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    // Search and filter methods
    searchVendors(query) {
        const vendors = this.getVendors();
        const lowerQuery = query.toLowerCase();
        
        return vendors.filter(vendor =>
            vendor.name.toLowerCase().includes(lowerQuery) ||
            vendor.category.toLowerCase().includes(lowerQuery) ||
            vendor.contact.toLowerCase().includes(lowerQuery) ||
            vendor.email.toLowerCase().includes(lowerQuery)
        );
    }

    searchTransactions(query) {
        const transactions = this.getTransactions();
        const lowerQuery = query.toLowerCase();
        
        return transactions.filter(transaction =>
            transaction.description.toLowerCase().includes(lowerQuery) ||
            transaction.vendorName.toLowerCase().includes(lowerQuery) ||
            transaction.projectName.toLowerCase().includes(lowerQuery)
        );
    }

    searchProjects(query) {
        const projects = this.getProjects();
        const lowerQuery = query.toLowerCase();
        
        return projects.filter(project =>
            project.name.toLowerCase().includes(lowerQuery) ||
            project.description.toLowerCase().includes(lowerQuery) ||
            project.location.toLowerCase().includes(lowerQuery)
        );
    }

    searchTechnicians(query) {
        const technicians = this.getTechnicians();
        const lowerQuery = query.toLowerCase();
        
        return technicians.filter(technician =>
            technician.name.toLowerCase().includes(lowerQuery) ||
            technician.type.toLowerCase().includes(lowerQuery) ||
            technician.phone.toLowerCase().includes(lowerQuery) ||
            technician.email.toLowerCase().includes(lowerQuery)
        );
    }

    // Analytics helpers
    getTransactionsByDateRange(startDate, endDate) {
        const transactions = this.getTransactions();
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        return transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            return transactionDate >= start && transactionDate <= end;
        });
    }

    getTransactionsByVendor(vendorId) {
        const transactions = this.getTransactions();
        return transactions.filter(transaction => transaction.vendorId === vendorId);
    }

    getTransactionsByProject(projectId) {
        const transactions = this.getTransactions();
        return transactions.filter(transaction => transaction.projectId === projectId);
    }

    getProjectsByStatus(status) {
        const projects = this.getProjects();
        return projects.filter(project => project.status === status);
    }

    getTechniciansByType(type) {
        const technicians = this.getTechnicians();
        return technicians.filter(technician => technician.type === type);
    }
}
