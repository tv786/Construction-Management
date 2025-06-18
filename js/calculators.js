// Construction calculators functionality
export class CalculatorManager {
    constructor() {
        this.init();
    }

    init() {
        // Calculator functions are called from global scope via HTML onclick
        // No additional initialization needed
    }

    calculateMaterial() {
        const type = document.getElementById('material-type').value;
        const length = parseFloat(document.getElementById('material-length').value) || 0;
        const width = parseFloat(document.getElementById('material-width').value) || 0;
        const height = parseFloat(document.getElementById('material-height').value) || 0;

        if (length <= 0 || width <= 0) {
            this.showResult('material-result', 'Please enter valid dimensions', 'error');
            return;
        }

        let results = {};
        const area = length * width;
        const volume = length * width * height;

        switch (type) {
            case 'concrete':
                results = this.calculateConcrete(volume, area);
                break;
            case 'brick':
                results = this.calculateBricks(area, height || 0.1);
                break;
            case 'tiles':
                results = this.calculateTiles(area);
                break;
            case 'paint':
                results = this.calculatePaint(area);
                break;
            default:
                this.showResult('material-result', 'Please select a material type', 'error');
                return;
        }

        this.showMaterialResult(results, type);
    }

    calculateConcrete(volume, area) {
        // Standard concrete calculations
        const concreteBags = Math.ceil(volume * 13.33); // 50kg bags per cubic meter
        const cement = Math.ceil(volume * 7); // 50kg cement bags
        const sand = volume * 0.5; // cubic meters
        const aggregate = volume * 0.75; // cubic meters
        const water = volume * 200; // liters

        return {
            volume: volume.toFixed(2),
            area: area.toFixed(2),
            concreteBags,
            cement,
            sand: sand.toFixed(2),
            aggregate: aggregate.toFixed(2),
            water: water.toFixed(0),
            estimatedCost: concreteBags * 8 + cement * 6 + sand * 30 + aggregate * 25
        };
    }

    calculateBricks(area, height) {
        // Standard brick calculations (assuming 230x110x75mm bricks)
        const bricksPerSqM = 50; // approximately 50 bricks per square meter
        const totalBricks = Math.ceil(area * bricksPerSqM);
        const mortar = area * 0.03; // cubic meters of mortar
        const cement = Math.ceil(mortar * 6); // 50kg bags
        const sand = mortar * 4; // cubic meters

        return {
            area: area.toFixed(2),
            totalBricks,
            mortar: mortar.toFixed(2),
            cement,
            sand: sand.toFixed(2),
            estimatedCost: totalBricks * 0.5 + cement * 6 + sand * 30
        };
    }

    calculateTiles(area) {
        // Standard tile calculations
        const tilesPerSqM = 11.1; // for 300x300mm tiles
        const totalTiles = Math.ceil(area * tilesPerSqM * 1.1); // 10% wastage
        const adhesive = Math.ceil(area * 1.5); // kg
        const grout = Math.ceil(area * 0.5); // kg

        return {
            area: area.toFixed(2),
            totalTiles,
            adhesive,
            grout,
            wastage: '10%',
            estimatedCost: totalTiles * 2.5 + adhesive * 3 + grout * 4
        };
    }

    calculatePaint(area) {
        // Paint calculations
        const coverage = 10; // square meters per liter
        const coats = 2;
        const totalPaint = Math.ceil((area * coats) / coverage);
        const primer = Math.ceil(area / coverage);

        return {
            area: area.toFixed(2),
            totalPaint,
            primer,
            coats,
            coverage: coverage + ' sqm/L',
            estimatedCost: totalPaint * 25 + primer * 20
        };
    }

    showMaterialResult(results, type) {
        let content = `<h4>${type.toUpperCase()} Requirements</h4>`;
        
        Object.entries(results).forEach(([key, value]) => {
            const label = this.formatLabel(key);
            const formattedValue = key === 'estimatedCost' ? `₹${value.toFixed(2)}` : value;
            
            content += `
                <div class="result-item">
                    <span>${label}:</span>
                    <span>${formattedValue}</span>
                </div>
            `;
        });

        this.showResult('material-result', content);
    }

    calculateCost() {
        const projectType = document.getElementById('project-type').value;
        const area = parseFloat(document.getElementById('project-area').value) || 0;
        const quality = document.getElementById('quality-level').value;

        if (area <= 0) {
            this.showResult('cost-result', 'Please enter a valid area', 'error');
            return;
        }

        const baseCosts = {
            residential: { basic: 60000, standard: 90000, premium: 135000 },
            commercial: { basic: 75000, standard: 112500, premium: 165000 },
            renovation: { basic: 45000, standard: 67500, premium: 105000 }
        };

        const costPerSqM = baseCosts[projectType][quality];
        const materialsCost = area * costPerSqM * 0.6;
        const laborCost = area * costPerSqM * 0.3;
        const overheadCost = area * costPerSqM * 0.1;
        const totalCost = materialsCost + laborCost + overheadCost;
        const contingency = totalCost * 0.1;
        const finalCost = totalCost + contingency;

        const results = {
            area: area.toFixed(1) + ' sqm',
            costPerSqM: `₹${costPerSqM}`,
            materialsCost: materialsCost.toFixed(2),
            laborCost: laborCost.toFixed(2),
            overheadCost: overheadCost.toFixed(2),
            subtotal: totalCost.toFixed(2),
            contingency: contingency.toFixed(2),
            totalCost: finalCost.toFixed(2)
        };

        let content = '<h4>Cost Estimation</h4>';
        Object.entries(results).forEach(([key, value]) => {
            const label = this.formatLabel(key);
            const formattedValue = key.includes('Cost') || key === 'subtotal' || key === 'contingency' || key === 'totalCost' ? 
                `₹${value}` : value;
            
            content += `
                <div class="result-item">
                    <span>${label}:</span>
                    <span>${formattedValue}</span>
                </div>
            `;
        });

        this.showResult('cost-result', content);
    }

    calculateLabor() {
        const workType = document.getElementById('work-type').value;
        const workUnits = parseFloat(document.getElementById('work-units').value) || 0;
        const workerCount = parseInt(document.getElementById('worker-count').value) || 1;
        const hourlyRate = parseFloat(document.getElementById('hourly-rate').value) || 0;

        if (workUnits <= 0 || workerCount <= 0 || hourlyRate <= 0) {
            this.showResult('labor-result', 'Please enter valid values', 'error');
            return;
        }

        // Labor productivity rates (hours per unit)
        const productivityRates = {
            masonry: 1.5, // hours per sqm
            carpentry: 2.0, // hours per sqm
            plumbing: 0.5, // hours per fixture/meter
            electrical: 0.8, // hours per point/meter
            painting: 0.4 // hours per sqm
        };

        const hoursPerUnit = productivityRates[workType] || 1;
        const totalHours = workUnits * hoursPerUnit;
        const hoursPerWorker = totalHours / workerCount;
        const daysRequired = Math.ceil(hoursPerWorker / 8); // 8 hours per day
        const totalCost = totalHours * hourlyRate;

        const results = {
            workType: workType.charAt(0).toUpperCase() + workType.slice(1),
            workUnits: workUnits.toFixed(1),
            totalHours: totalHours.toFixed(1),
            hoursPerWorker: hoursPerWorker.toFixed(1),
            daysRequired: daysRequired,
            workerCount: workerCount,
            hourlyRate: hourlyRate.toFixed(2),
            totalCost: totalCost.toFixed(2)
        };

        let content = '<h4>Labor Calculation</h4>';
        Object.entries(results).forEach(([key, value]) => {
            const label = this.formatLabel(key);
            const formattedValue = key === 'hourlyRate' || key === 'totalCost' ? 
                `₹${value}` : value;
            
            content += `
                <div class="result-item">
                    <span>${label}:</span>
                    <span>${formattedValue}</span>
                </div>
            `;
        });

        this.showResult('labor-result', content);
    }

    calculateProfit() {
        const totalCost = parseFloat(document.getElementById('total-cost').value) || 0;
        const profitMargin = parseFloat(document.getElementById('profit-margin').value) || 0;
        const additionalExpenses = parseFloat(document.getElementById('additional-expenses').value) || 0;

        if (totalCost <= 0 || profitMargin <= 0) {
            this.showResult('profit-result', 'Please enter valid values', 'error');
            return;
        }

        const adjustedCost = totalCost + additionalExpenses;
        const profitAmount = adjustedCost * (profitMargin / 100);
        const sellingPrice = adjustedCost + profitAmount;
        const markup = (profitAmount / adjustedCost) * 100;

        const results = {
            totalCost: totalCost.toFixed(2),
            additionalExpenses: additionalExpenses.toFixed(2),
            adjustedCost: adjustedCost.toFixed(2),
            profitMargin: profitMargin.toFixed(1) + '%',
            profitAmount: profitAmount.toFixed(2),
            sellingPrice: sellingPrice.toFixed(2),
            markup: markup.toFixed(1) + '%'
        };

        let content = '<h4>Profit Calculation</h4>';
        Object.entries(results).forEach(([key, value]) => {
            const label = this.formatLabel(key);
            const formattedValue = key.includes('Cost') || key.includes('Amount') || key.includes('Price') ? 
                `₹${value}` : value;
            
            content += `
                <div class="result-item">
                    <span>${label}:</span>
                    <span>${formattedValue}</span>
                </div>
            `;
        });

        this.showResult('profit-result', content);
    }

    formatLabel(key) {
        return key.replace(/([A-Z])/g, ' $1')
                 .replace(/^./, str => str.toUpperCase())
                 .replace('Sq M', 'per sqm')
                 .replace('Cost', 'Cost')
                 .replace('Per', 'per');
    }

    showResult(elementId, content, type = 'success') {
        const resultElement = document.getElementById(elementId);
        resultElement.innerHTML = content;
        resultElement.className = `calc-result show ${type}`;
    }

    // Additional construction calculators

    calculateCementSand() {
        // Cement to sand ratio calculator
        const ratio = '1:3'; // cement:sand
        const area = 100; // example area
        // Implementation for cement-sand calculator
    }

    calculateSteel() {
        // Steel reinforcement calculator
        const concreteVolume = 10; // cubic meters
        const steelPercentage = 1.5; // percentage of concrete volume
        const steelWeight = concreteVolume * 1000 * (steelPercentage / 100) * 7.85; // kg
        // Implementation for steel calculator
    }

    calculateRoofing() {
        // Roofing material calculator
        const roofArea = 150; // square meters
        const pitch = 30; // degrees
        const adjustedArea = roofArea / Math.cos(pitch * Math.PI / 180);
        // Implementation for roofing calculator
    }

    calculatePlumbing() {
        // Plumbing fixtures and pipe calculator
        const fixtures = 8; // number of fixtures
        const pipeLength = fixtures * 10; // meters of pipe
        const fittings = fixtures * 5; // number of fittings
        // Implementation for plumbing calculator
    }

    calculateElectrical() {
        // Electrical points and wiring calculator
        const points = 20; // number of electrical points
        const wireLength = points * 15; // meters of wire
        const conduitLength = wireLength * 1.2; // meters of conduit
        // Implementation for electrical calculator
    }
}
