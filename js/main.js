// Main application entry point
import { StorageManager } from './storage.js';
import { VendorManager } from './vendors.js';
import { TransactionManager } from './transactions.js';
import { ProjectManager } from './projects.js';

import { AnalyticsManager } from './analytics.js';
import { CalculatorManager } from './calculators.js';
import { showToast, showLoading, hideLoading } from './utils.js';

class App {
    constructor() {
        this.storage = new StorageManager();
        this.vendors = new VendorManager(this.storage);
        this.transactions = new TransactionManager(this.storage);
        this.projects = new ProjectManager(this.storage);

        this.analytics = new AnalyticsManager(this.storage);
        this.calculators = new CalculatorManager();
        
        this.currentSection = 'dashboard';
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupServiceWorker();
        this.setupOfflineDetection();
        this.setupDataManagement();
        this.loadSection('dashboard');
        
        // Show welcome message
        setTimeout(() => {
            showToast('Welcome to Ruh Al-Bina Construction Management System', 'success');
        }, 1000);
    }

    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.loadSection(section);
            });
        });
    }

    loadSection(sectionName) {
        showLoading();
        
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
        
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show selected section
        document.getElementById(`${sectionName}-section`).classList.add('active');
        
        // Load section data
        setTimeout(() => {
            this.loadSectionData(sectionName);
            hideLoading();
        }, 100);
        
        this.currentSection = sectionName;
    }

    loadSectionData(sectionName) {
        switch (sectionName) {
            case 'dashboard':
                this.analytics.loadDashboard();
                break;
            case 'vendors':
                this.vendors.loadVendors();
                break;
            case 'transactions':
                this.transactions.loadTransactions();
                break;
            case 'projects':
                this.projects.loadProjects();
                break;

            case 'calculators':
                this.calculators.init();
                break;
        }
    }

    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                    console.log('Service Worker registered successfully:', registration);
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        }
    }

    setupOfflineDetection() {
        const offlineIndicator = document.getElementById('offline-indicator');
        
        const updateOnlineStatus = () => {
            if (navigator.onLine) {
                offlineIndicator.innerHTML = '<i class="fas fa-wifi"></i><span>Online</span>';
                offlineIndicator.classList.remove('offline');
            } else {
                offlineIndicator.innerHTML = '<i class="fas fa-wifi-slash"></i><span>Offline</span>';
                offlineIndicator.classList.add('offline');
            }
        };

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        updateOnlineStatus();
    }

    setupDataManagement() {
        // Export data
        document.getElementById('export-data').addEventListener('click', () => {
            this.exportData();
        });
    }

    exportData() {
        try {
            // Export data as CSV format
            const vendors = this.storage.getVendors();
            const transactions = this.storage.getTransactions();
            const projects = this.storage.getProjects();

            // Create vendor CSV
            let vendorCSV = 'Name,Category,Contact,Phone,Email,Address,Total Spent,Status\n';
            vendors.forEach(vendor => {
                vendorCSV += `"${vendor.name}","${vendor.category}","${vendor.contact || ''}","${vendor.phone || ''}","${vendor.email || ''}","${vendor.address || ''}","${vendor.totalSpent || 0}","${vendor.status}"\n`;
            });

            // Create transaction CSV
            let transactionCSV = 'Date,Type,Category,Vendor,Project,Amount,Payment Method,Description\n';
            transactions.forEach(transaction => {
                const vendorName = vendors.find(v => v.id === transaction.vendorId)?.name || '';
                const projectName = projects.find(p => p.id === transaction.projectId)?.name || '';
                transactionCSV += `"${transaction.date}","${transaction.type}","${transaction.category || ''}","${vendorName}","${projectName}","${transaction.amount}","${transaction.paymentMethod || ''}","${transaction.description || ''}"\n`;
            });

            // Create project CSV
            let projectCSV = 'Name,Client,Status,Start Date,End Date,Budget,Progress,Description\n';
            projects.forEach(project => {
                projectCSV += `"${project.name}","${project.client || ''}","${project.status}","${project.startDate || ''}","${project.endDate || ''}","${project.budget || 0}","${project.progress || 0}","${project.description || ''}"\n`;
            });

            // Create zip-like export with multiple CSV files
            const date = new Date().toISOString().split('T')[0];
            
            // Download vendors CSV
            this.downloadCSV(vendorCSV, `vendors-${date}.csv`);
            setTimeout(() => {
                // Download transactions CSV
                this.downloadCSV(transactionCSV, `transactions-${date}.csv`);
                setTimeout(() => {
                    // Download projects CSV
                    this.downloadCSV(projectCSV, `projects-${date}.csv`);
                }, 500);
            }, 500);

            showToast('Data exported successfully as CSV files', 'success');
        } catch (error) {
            console.error('Export error:', error);
            showToast('Failed to export data', 'error');
        }
    }

    downloadCSV(csvContent, filename) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }


}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

// Make calculators globally available
window.calculateMaterial = () => window.app.calculators.calculateMaterial();
window.calculateCost = () => window.app.calculators.calculateCost();
window.calculateLabor = () => window.app.calculators.calculateLabor();
window.calculateProfit = () => window.app.calculators.calculateProfit();

// Global modal functions
window.closeModal = () => {
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.remove('show');
    setTimeout(() => {
        overlay.style.display = 'none';
    }, 200);
};

window.showModal = (modalId) => {
    const overlay = document.getElementById('modal-overlay');
    const modals = overlay.querySelectorAll('.modal');
    
    // Hide all modals
    modals.forEach(modal => modal.style.display = 'none');
    
    // Show target modal
    document.getElementById(modalId).style.display = 'block';
    overlay.style.display = 'flex';
    
    setTimeout(() => {
        overlay.classList.add('show');
    }, 10);
};
