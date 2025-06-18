// Analytics and dashboard functionality
import { formatCurrency, formatDate } from './utils.js';

export class AnalyticsManager {
    constructor(storage) {
        this.storage = storage;
        this.charts = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Dashboard period filter
        document.getElementById('dashboard-period').addEventListener('change', () => {
            this.loadDashboard();
        });
    }

    loadDashboard() {
        this.updateStatCards();
        this.renderCharts();
        this.renderRecentActivities();
    }

    updateStatCards() {
        const vendors = this.storage.getVendors();
        const projects = this.storage.getProjects();
        const transactions = this.getTransactionsForPeriod();
        
        // Total vendors
        document.getElementById('total-vendors').textContent = vendors.length;
        
        // Active projects
        const activeProjects = projects.filter(p => p.status === 'active').length;
        document.getElementById('active-projects').textContent = activeProjects;
        
        // Total income and expenses
        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        const expenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
            
        document.getElementById('total-income').textContent = formatCurrency(income);
        document.getElementById('total-expenses').textContent = formatCurrency(expenses);
    }

    getTransactionsForPeriod() {
        const period = document.getElementById('dashboard-period').value;
        const now = new Date();
        let startDate;

        switch (period) {
            case 'week':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'quarter':
                const quarterStart = Math.floor(now.getMonth() / 3) * 3;
                startDate = new Date(now.getFullYear(), quarterStart, 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        const transactions = this.storage.getTransactions();
        return transactions.filter(t => new Date(t.date) >= startDate);
    }

    renderCharts() {
        this.renderRevenueChart();
        this.renderProjectStatusChart();
        this.renderVendorSpendingChart();
        this.renderMonthlyTransactionsChart();
    }

    renderRevenueChart() {
        const ctx = document.getElementById('revenue-chart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.charts.revenue) {
            this.charts.revenue.destroy();
        }

        const transactions = this.getTransactionsForPeriod();
        const chartData = this.getRevenueChartData(transactions);

        this.charts.revenue = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [
                    {
                        label: 'Income',
                        data: chartData.income,
                        borderColor: '#10B981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Expenses',
                        data: chartData.expenses,
                        borderColor: '#EF4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                            }
                        }
                    }
                }
            }
        });
    }

    renderProjectStatusChart() {
        const ctx = document.getElementById('project-status-chart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.charts.projectStatus) {
            this.charts.projectStatus.destroy();
        }

        const projects = this.storage.getProjects();
        const statusCounts = {
            planning: 0,
            active: 0,
            completed: 0,
            'on-hold': 0
        };

        projects.forEach(project => {
            statusCounts[project.status] = (statusCounts[project.status] || 0) + 1;
        });

        this.charts.projectStatus = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Planning', 'Active', 'Completed', 'On Hold'],
                datasets: [{
                    data: [
                        statusCounts.planning,
                        statusCounts.active,
                        statusCounts.completed,
                        statusCounts['on-hold']
                    ],
                    backgroundColor: [
                        '#3B82F6',
                        '#10B981',
                        '#6B7280',
                        '#F59E0B'
                    ],
                    borderWidth: 2,
                    borderColor: '#FFFFFF'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    renderVendorSpendingChart() {
        const ctx = document.getElementById('vendor-spending-chart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.charts.vendorSpending) {
            this.charts.vendorSpending.destroy();
        }

        const vendors = this.storage.getVendors();
        const transactions = this.getTransactionsForPeriod();
        
        // Calculate spending per vendor
        const vendorSpending = {};
        transactions
            .filter(t => t.type === 'expense' && t.vendorId)
            .forEach(transaction => {
                const vendor = vendors.find(v => v.id === transaction.vendorId);
                if (vendor) {
                    vendorSpending[vendor.name] = (vendorSpending[vendor.name] || 0) + transaction.amount;
                }
            });

        // Get top 5 vendors by spending
        const sortedVendors = Object.entries(vendorSpending)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);

        this.charts.vendorSpending = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sortedVendors.map(([name]) => name),
                datasets: [{
                    label: 'Spending',
                    data: sortedVendors.map(([, amount]) => amount),
                    backgroundColor: '#F59E0B',
                    borderColor: '#D97706',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'Spending: ' + formatCurrency(context.parsed.y);
                            }
                        }
                    },
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    renderMonthlyTransactionsChart() {
        const ctx = document.getElementById('monthly-transactions-chart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.charts.monthlyTransactions) {
            this.charts.monthlyTransactions.destroy();
        }

        const transactions = this.storage.getTransactions();
        const monthlyData = this.getMonthlyTransactionData(transactions);

        this.charts.monthlyTransactions = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: monthlyData.labels,
                datasets: [
                    {
                        label: 'Income',
                        data: monthlyData.income,
                        backgroundColor: '#10B981',
                        borderColor: '#059669',
                        borderWidth: 1
                    },
                    {
                        label: 'Expenses',
                        data: monthlyData.expenses,
                        backgroundColor: '#EF4444',
                        borderColor: '#DC2626',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                            }
                        }
                    }
                }
            }
        });
    }

    getRevenueChartData(transactions) {
        const period = document.getElementById('dashboard-period').value;
        const data = { labels: [], income: [], expenses: [] };
        
        if (period === 'week') {
            // Last 7 days
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                
                data.labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
                
                const dayTransactions = transactions.filter(t => t.date === dateStr);
                const income = dayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
                const expenses = dayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
                
                data.income.push(income);
                data.expenses.push(expenses);
            }
        } else if (period === 'month') {
            // Last 30 days grouped by week
            const now = new Date();
            for (let i = 3; i >= 0; i--) {
                const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (i * 7) - 6);
                const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (i * 7));
                
                data.labels.push(`Week ${4 - i}`);
                
                const weekTransactions = transactions.filter(t => {
                    const transactionDate = new Date(t.date);
                    return transactionDate >= weekStart && transactionDate <= weekEnd;
                });
                
                const income = weekTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
                const expenses = weekTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
                
                data.income.push(income);
                data.expenses.push(expenses);
            }
        } else {
            // Monthly data for quarter/year
            const months = period === 'quarter' ? 3 : 12;
            const now = new Date();
            
            for (let i = months - 1; i >= 0; i--) {
                const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
                data.labels.push(month.toLocaleDateString('en-US', { month: 'short' }));
                
                const monthTransactions = transactions.filter(t => {
                    const transactionDate = new Date(t.date);
                    return transactionDate.getMonth() === month.getMonth() && 
                           transactionDate.getFullYear() === month.getFullYear();
                });
                
                const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
                const expenses = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
                
                data.income.push(income);
                data.expenses.push(expenses);
            }
        }
        
        return data;
    }

    getMonthlyTransactionData(transactions) {
        const data = { labels: [], income: [], expenses: [] };
        const now = new Date();
        
        // Last 6 months
        for (let i = 5; i >= 0; i--) {
            const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
            data.labels.push(month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
            
            const monthTransactions = transactions.filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate.getMonth() === month.getMonth() && 
                       transactionDate.getFullYear() === month.getFullYear();
            });
            
            const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            const expenses = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
            
            data.income.push(income);
            data.expenses.push(expenses);
        }
        
        return data;
    }

    renderRecentActivities() {
        const activities = this.getRecentActivities();
        const container = document.getElementById('recent-activities-list');
        
        if (activities.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No recent activities</p>
                </div>
            `;
            return;
        }

        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas ${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <p>${activity.description}</p>
                    <div class="activity-time">${this.getTimeAgo(activity.timestamp)}</div>
                </div>
            </div>
        `).join('');
    }

    getRecentActivities() {
        const activities = [];
        
        // Get recent transactions
        const transactions = this.storage.getTransactions()
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);
            
        transactions.forEach(transaction => {
            const vendor = this.storage.getVendorById(transaction.vendorId);
            const project = this.storage.getProjectById(transaction.projectId);
            
            activities.push({
                icon: transaction.type === 'income' ? 'fa-arrow-up' : 'fa-arrow-down',
                description: `${transaction.type === 'income' ? 'Received' : 'Paid'} ${formatCurrency(transaction.amount)} ${vendor ? `to ${vendor.name}` : ''} ${project ? `for ${project.name}` : ''}`,
                timestamp: transaction.createdAt
            });
        });

        // Get recent projects
        const projects = this.storage.getProjects()
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 3);
            
        projects.forEach(project => {
            activities.push({
                icon: 'fa-hammer',
                description: `New project "${project.name}" created`,
                timestamp: project.createdAt
            });
        });

        // Get recent vendors
        const vendors = this.storage.getVendors()
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 2);
            
        vendors.forEach(vendor => {
            activities.push({
                icon: 'fa-building',
                description: `New vendor "${vendor.name}" added`,
                timestamp: vendor.createdAt
            });
        });

        // Sort all activities by timestamp and limit to 10
        return activities
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10);
    }

    getTimeAgo(timestamp) {
        const now = new Date();
        const past = new Date(timestamp);
        const diffInSeconds = Math.floor((now - past) / 1000);
        
        if (diffInSeconds < 60) {
            return 'Just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else {
            const days = Math.floor(diffInSeconds / 86400);
            if (days < 7) {
                return `${days} day${days > 1 ? 's' : ''} ago`;
            } else {
                return formatDate(timestamp);
            }
        }
    }

    // Generate reports
    generateProfitLossReport() {
        const transactions = this.getTransactionsForPeriod();
        const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const profit = income - expenses;
        
        return {
            income,
            expenses,
            profit,
            profitMargin: income > 0 ? (profit / income) * 100 : 0,
            transactions: transactions.length
        };
    }

    generateProjectReport() {
        const projects = this.storage.getProjects();
        const transactions = this.storage.getTransactions();
        
        return projects.map(project => {
            const projectTransactions = transactions.filter(t => t.projectId === project.id);
            const income = projectTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            const expenses = projectTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
            
            return {
                ...project,
                totalIncome: income,
                totalExpenses: expenses,
                profit: income - expenses,
                transactionCount: projectTransactions.length,
                profitMargin: income > 0 ? ((income - expenses) / income) * 100 : 0
            };
        });
    }

    generateVendorReport() {
        const vendors = this.storage.getVendors();
        const transactions = this.storage.getTransactions();
        
        return vendors.map(vendor => {
            const vendorTransactions = transactions.filter(t => t.vendorId === vendor.id);
            const totalSpent = vendorTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
            
            return {
                ...vendor,
                totalSpent,
                transactionCount: vendorTransactions.length,
                lastTransaction: vendorTransactions.length > 0 ? 
                    Math.max(...vendorTransactions.map(t => new Date(t.date).getTime())) : null
            };
        });
    }
}
