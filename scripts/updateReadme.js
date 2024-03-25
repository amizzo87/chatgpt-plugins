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
        let headers = lines[headerIndex].split('|').map(h => h.trim());
        let separators = lines[headerIndex + 1].split('|').map(s => s.trim());
        
        if (!headers.includes('Passed Unit Tests?')) {
            headers.splice(headers.length - 1, 0, 'Passed Unit Tests?');
            separators.splice(separators.length - 1, 0, ':---:');
        }
        
        if (!headers.includes('API Active?')) {
            headers.splice(headers.length - 1, 0, 'API Active?');
            separators.splice(separators.length - 1, 0, ':---:');
        }
        
        lines[headerIndex] = headers.join(' | ');
        lines[headerIndex + 1] = separators.join(' | ');
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
            }
            if (result.title === "API URL should be active" && result.status !== "passed") {
                manifestResults[manifestFilename].apiActive = false;
            }
        });
    });

    const headerIndex = lines.findIndex(line => line.includes('|') && line.toLowerCase().includes('name'));
    const headers = lines[headerIndex].split('|').map(h => h.trim());
    const passedTestsIndex = headers.indexOf('Passed Unit Tests?');
    const apiActiveIndex = headers.indexOf('API Active?');

    Object.keys(manifestResults).forEach(manifestFilename => {
        const statusIcon = manifestResults[manifestFilename].passed ? '✅' : '❌';
        const apiStatusIcon = manifestResults[manifestFilename].apiActive ? '✅' : '❌';
        const rowToUpdateIndex = lines.findIndex(line => line.includes(manifestFilename));

        if (rowToUpdateIndex !== -1) {
            let parts = lines[rowToUpdateIndex].split('|');
            parts[passedTestsIndex] = ` ${statusIcon} `;
            parts[apiActiveIndex] = ` ${apiStatusIcon} `;
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
