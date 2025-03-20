let chart = null;
let functionCount = 1;

// DOM Elements
const functionsList = document.getElementById('functionsList');
const addFunctionButton = document.getElementById('addFunction');
const xMinInput = document.getElementById('xMin');
const xMaxInput = document.getElementById('xMax');
const yMinInput = document.getElementById('yMin');
const yMaxInput = document.getElementById('yMax');
const plotButton = document.getElementById('plotButton');
const helpButton = document.getElementById('showHelp');
const helpContent = document.getElementById('helpContent');
const coordinatesDisplay = document.getElementById('coordinates');
const functionInfoDisplay = document.getElementById('function-info');
const errorMessage = document.getElementById('error-message');
const gridLinesCheckbox = document.getElementById('gridLines');
const axisLinesCheckbox = document.getElementById('axisLines');
const smoothLineCheckbox = document.getElementById('smoothLine');
const presetButtons = document.querySelectorAll('.preset-btn');

// Default colors for functions
const defaultColors = [
    '#3498db', '#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6',
    '#1abc9c', '#e67e22', '#34495e', '#16a085', '#c0392b'
];

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 3000);
}

function generatePoints(func, xMin, xMax) {
    const points = [];
    const steps = 1000;
    const stepSize = (xMax - xMin) / steps;

    for (let i = 0; i <= steps; i++) {
        const x = xMin + (i * stepSize);
        try {
            const scope = { x: x };
            const y = math.evaluate(func, scope);
            if (!isNaN(y) && isFinite(y)) {
                points.push({ x: x, y: y });
            }
        } catch (error) {
            console.error('Error evaluating function:', error);
            showError(`Error evaluating function: ${func}`);
            return [];
        }
    }

    return points;
}

function createFunctionInput(id, initialFunction = '') {
    const functionGroup = document.createElement('div');
    functionGroup.className = 'function-input-group';
    functionGroup.dataset.functionId = id;

    functionGroup.innerHTML = `
        <div class="function-header">
            <h3>Function ${id}</h3>
            <button class="remove-function" title="Remove function">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="function-input">
            <label for="function-${id}">f${id}(x) = </label>
            <input type="text" id="function-${id}" class="function-input-field" 
                value="${initialFunction}"
                placeholder="Enter function (e.g., x^2, sin(x), 2*x+1)">
            <div class="function-color">
                <input type="color" id="color-${id}" value="${defaultColors[(id - 1) % defaultColors.length]}">
            </div>
        </div>
    `;

    const removeButton = functionGroup.querySelector('.remove-function');
    removeButton.addEventListener('click', () => {
        if (document.querySelectorAll('.function-input-group').length > 1) {
            functionGroup.remove();
            plotFunction();
        } else {
            showError('Cannot remove the last function input.');
        }
    });

    const functionInput = functionGroup.querySelector('.function-input-field');
    functionInput.addEventListener('input', debounce(plotFunction, 500));

    return functionGroup;
}

function addFunctionInput(initialFunction = '') {
    functionCount++;
    const newFunction = createFunctionInput(functionCount, initialFunction);
    functionsList.appendChild(newFunction);
    plotFunction();
}

function getAllFunctions() {
    const functions = [];
    document.querySelectorAll('.function-input-group').forEach(group => {
        const id = group.dataset.functionId;
        const func = document.getElementById(`function-${id}`).value.trim();
        const color = document.getElementById(`color-${id}`).value;
        if (func) {
            functions.push({ func, color });
        }
    });
    return functions;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function plotFunction() {
    const xMin = parseFloat(xMinInput.value);
    const xMax = parseFloat(xMaxInput.value);
    const yMin = parseFloat(yMinInput.value);
    const yMax = parseFloat(yMaxInput.value);

    if (xMin >= xMax || yMin >= yMax) {
        showError('Invalid range values. Min must be less than Max.');
        return;
    }

    const functions = getAllFunctions();
    if (functions.length === 0) {
        showError('Please enter at least one function.');
        return;
    }

    if (chart) {
        chart.destroy();
    }

    const datasets = functions.map(({ func, color }) => {
        const points = generatePoints(func, xMin, xMax);
        return {
            label: `f(x) = ${func}`,
            data: points,
            borderColor: color,
            backgroundColor: color + '20',
            borderWidth: 2,
            fill: false,
            pointRadius: 0,
            tension: smoothLineCheckbox.checked ? 0.4 : 0
        };
    });

    const ctx = document.getElementById('functionGraph').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: { datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    position: 'center',
                    min: xMin,
                    max: xMax,
                    grid: {
                        display: gridLinesCheckbox.checked,
                        color: '#e0e0e0'
                    },
                    ticks: {
                        display: axisLinesCheckbox.checked
                    }
                },
                y: {
                    type: 'linear',
                    position: 'center',
                    min: yMin,
                    max: yMax,
                    grid: {
                        display: gridLinesCheckbox.checked,
                        color: '#e0e0e0'
                    },
                    ticks: {
                        display: axisLinesCheckbox.checked
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label.split('=')[0]}= ${context.parsed.y.toFixed(2)}`;
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });

    const functionsList = functions.map(f => f.func).join(', ');
    functionInfoDisplay.textContent = `Functions: ${functionsList}`;
}

// Event Listeners
addFunctionButton.addEventListener('click', () => addFunctionInput());

// Add click handlers for preset function buttons
presetButtons.forEach(button => {
    button.addEventListener('click', () => {
        const functionText = button.dataset.function;
        addFunctionInput(functionText);
    });
});

plotButton.addEventListener('click', plotFunction);

helpButton.addEventListener('click', () => {
    helpContent.style.display = helpContent.style.display === 'none' ? 'block' : 'none';
});

document.addEventListener('click', (e) => {
    if (!helpButton.contains(e.target) && !helpContent.contains(e.target)) {
        helpContent.style.display = 'none';
    }
});

// Settings change handlers
gridLinesCheckbox.addEventListener('change', plotFunction);
axisLinesCheckbox.addEventListener('change', plotFunction);
smoothLineCheckbox.addEventListener('change', plotFunction);

// Input validation
[xMinInput, xMaxInput, yMinInput, yMaxInput].forEach(input => {
    input.addEventListener('change', () => {
        const min = parseFloat(input.id.includes('Min') ? input.value : 
            document.getElementById(input.id.replace('Max', 'Min')).value);
        const max = parseFloat(input.id.includes('Max') ? input.value : 
            document.getElementById(input.id.replace('Min', 'Max')).value);
        
        if (min >= max) {
            showError('Invalid range values. Min must be less than Max.');
            input.value = input.id.includes('Min') ? min - 1 : max + 1;
        }
    });
});

// Initial plot
plotFunction(); 