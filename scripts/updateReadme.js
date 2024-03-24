const fs = require('fs');
const path = require('path');

const testResultsPath = path.join(__dirname, '..', 'test-results.json');
let data;

try {
    data = JSON.parse(fs.readFileSync(testResultsPath, 'utf8'));
} catch (error) {
    console.error(`Error reading test results from ${testResultsPath}:`, error);
    process.exit(1);
}

const readmePath = path.join(__dirname, '..', 'README.md');
let readmeContents;

try {
    readmeContents = fs.readFileSync(readmePath, 'utf8');
} catch (error) {
    console.error(`Error reading README.md from ${readmePath}:`, error);
    process.exit(1);
}

let lines = readmeContents.split('\n');

const ensureColumnsExist = () => {
    const headerIndex = lines.findIndex(line => line.includes('|') && line.toLowerCase().includes('name'));
    if (headerIndex !== -1 && headerIndex + 1 < lines.length) {
        const separatorLine = lines[headerIndex + 1];
        if (!lines[headerIndex].includes('Passed Unit Tests?')) {
            lines[headerIndex] = lines[headerIndex].replace(/\|$/, '|Passed Unit Tests?|');
            lines[headerIndex + 1] = separatorLine.replace(/\|$/, '|:---:|');
        }
        if (!lines[headerIndex].includes('API Active?')) {
            lines[headerIndex] = lines[headerIndex].replace(/\|$/, '|API Active?|');
            lines[headerIndex + 1] = separatorLine.replace(/\|$/, '|:---:|');
        }
    }
};

const updateReadme = () => {
    let manifestResults = {};

    data.testResults.forEach(testSuite => {
        testSuite.assertionResults.forEach(result => {
            const manifestFilename = result.ancestorTitles[1];
            if (!manifestResults[manifestFilename]) {
                manifestResults[manifestFilename] = { passed: true, failedTests: [], apiActive: true };
            }
            if (result.status !== "passed") {
                manifestResults[manifestFilename].passed = false;
                manifestResults[manifestFilename].failedTests.push(result.fullName);
            }
            // Specifically check for the API active test
            if (result.title === "API URL should be active" && result.status !== "passed") {
                manifestResults[manifestFilename].apiActive = false;
            }
        });
    });

    Object.keys(manifestResults).forEach(manifestFilename => {
        const statusIcon = manifestResults[manifestFilename].passed ? '&check;' : '&cross;';
        const apiStatusIcon = manifestResults[manifestFilename].apiActive ? '🟢' : '🔴';
        const rowToUpdateIndex = lines.findIndex(line => line.includes(manifestFilename));

        if (rowToUpdateIndex !== -1) {
            let parts = lines[rowToUpdateIndex].split('|');
            // Adjust the index for the last two columns as needed
            parts[parts.length - 3] = ` ${statusIcon} `;
            parts[parts.length - 2] = ` ${apiStatusIcon} `;
            lines[rowToUpdateIndex] = parts.join('|');
        } else {
            console.log(`Could not find row for ${manifestFilename} in README.md.`);
        }
    });

    try {
        fs.writeFileSync(readmePath, lines.join('\n'));
        console.log('README.md has been successfully updated.');
    } catch (error) {
        console.error('Error writing updates to README.md:', error);
    }
};

// Ensure the necessary columns exist before updating
ensureColumnsExist();
updateReadme();