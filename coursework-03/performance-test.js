const runButton = document.querySelector("#run-performance-test");
const clearButton = document.querySelector("#clear-performance-test");
const statusText = document.querySelector("#experiment-status");
const resultsArea = document.querySelector("#performance-results");
const testContainer = document.querySelector("#performance-container");

const trialCount = 5;
const itemCount = 1000;

function nextFrame() {
    return new Promise((resolve) => {
        requestAnimationFrame(() => {
            requestAnimationFrame(resolve);
        });
    });
}

function median(values) {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
}

async function measureLayout(layoutName) {
    testContainer.className = `perf-container perf-${layoutName}`;
    testContainer.replaceChildren();

    await nextFrame();

    const fragment = document.createDocumentFragment();
    const startTime = performance.now();

    for (let index = 0; index < itemCount; index += 1) {
        const item = document.createElement("span");
        item.className = "perf-item";
        item.textContent = index + 1;
        fragment.appendChild(item);
    }

    testContainer.appendChild(fragment);

    // Force the browser to calculate layout.
    const measuredHeight = testContainer.offsetHeight;
    const endTime = performance.now();

    if (measuredHeight === 0) {
        throw new Error("The test container did not render.");
    }

    return endTime - startTime;
}

async function warmUp() {
    await measureLayout("flex");
    await measureLayout("grid");
    testContainer.replaceChildren();
}

function createResultsTable(flexTrials, gridTrials) {
    const flexMedian = median(flexTrials);
    const gridMedian = median(gridTrials);
    const claimSupported = gridMedian < flexMedian;

    const rows = flexTrials.map((flexValue, index) => {
        return `
            <tr>
                <th scope="row">${index + 1}</th>
                <td>${flexValue.toFixed(3)} ms</td>
                <td>${gridTrials[index].toFixed(3)} ms</td>
            </tr>
        `;
    }).join("");

    resultsArea.innerHTML = `
        <table class="results-table">
            <thead>
                <tr>
                    <th scope="col">Trial</th>
                    <th scope="col">Flexbox</th>
                    <th scope="col">Grid</th>
                </tr>
            </thead>

            <tbody>
                ${rows}

                <tr>
                    <th scope="row">Median</th>
                    <td><strong>${flexMedian.toFixed(3)} ms</strong></td>
                    <td><strong>${gridMedian.toFixed(3)} ms</strong></td>
                </tr>
            </tbody>
        </table>

        <p>
            <strong>Claim supported:</strong>
            ${claimSupported ? "Yes" : "No"}
        </p>

        <p>
            The result applies only to this browser, computer, viewport,
            item count, and implementation.
        </p>
    `;
}

async function runExperiment() {
    runButton.disabled = true;
    clearButton.disabled = true;
    resultsArea.replaceChildren();
    statusText.textContent = "Warming up the browser...";

    const flexTrials = [];
    const gridTrials = [];

    try {
        await warmUp();

        for (let trial = 0; trial < trialCount; trial += 1) {
            statusText.textContent = `Running trial ${trial + 1} of ${trialCount}...`;

            if (trial % 2 === 0) {
                flexTrials.push(await measureLayout("flex"));
                gridTrials.push(await measureLayout("grid"));
            } else {
                gridTrials.push(await measureLayout("grid"));
                flexTrials.push(await measureLayout("flex"));
            }
        }

        createResultsTable(flexTrials, gridTrials);
        statusText.textContent = "Five trials completed for both implementations.";
    } catch (error) {
        statusText.textContent = `The experiment stopped: ${error.message}`;
    } finally {
        testContainer.replaceChildren();
        runButton.disabled = false;
        clearButton.disabled = false;
    }
}

function clearExperiment() {
    resultsArea.replaceChildren();
    testContainer.replaceChildren();
    statusText.textContent = "Select Run Five Trials to begin.";
}

runButton.addEventListener("click", runExperiment);
clearButton.addEventListener("click", clearExperiment);