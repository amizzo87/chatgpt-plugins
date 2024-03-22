const fs = require('fs');
const path = require('path');

const testResultsPath = path.join(__dirname, '..', 'test-results.json');
let testResults;

try {
    testResults = require(testResultsPath);
} catch (error) {
    console.error('Failed to load test results:', error);
    process.exit(1); // Exit if there's no test results
}

const updateReadmeForTestResults = (results) => {
    const readmePath = path.join(__dirname, '..', 'README.md');
    let readmeContents;

    try {
        readmeContents = fs.readFileSync(readmePath, 'utf8');
    } catch (error) {
        console.error('Failed to read README.md:', error);
        return;
    }

    let lines = readmeContents.split('\n');
    let updated = false;

    // Ensure the "Passed Unit Tests?" column exists
    const headerIndex = lines.findIndex(line => line.startsWith('|Logo|'));
    if (headerIndex !== -1 && !lines[headerIndex].includes('Passed Unit Tests?')) {
        lines[headerIndex] = lines[headerIndex].trim() + 'Passed Unit Tests?|';
        lines[headerIndex + 1] = lines[headerIndex + 1].trim() + ':---:|'; // Assuming the separator line follows the header
    }

    // Update each manifest entry with test results
    results.testResults.forEach(test => {
        const manifestName = path.basename(test.name, '.json');
        const passed = test.status === "passed";
        const statusIcon = passed ? '&check;' : '&cross;';

        const lineIndex = lines.findIndex(line => line.includes(manifestName));
        if (lineIndex !== -1) {
            updated = true;
            let parts = lines[lineIndex].split('|');
            if (parts.length - 1 < lines[headerIndex].split('|').length - 1) {
                // If the current line has fewer columns than the header, add an empty column for the status
                parts.splice(parts.length - 1, 0, ' ');
            }
            parts[parts.length - 2] = ` ${statusIcon} `; // Update or add the test result icon
            lines[lineIndex] = parts.join('|');
        }
    });

    if (updated) {
        try {
            fs.writeFileSync(readmePath, lines.join('\n'));
            console.log('README.md updated successfully.');
        } catch (error) {
            console.error('Failed to write README.md:', error);
        }
    } else {
        console.log('No updates made to README.md.');
    }
};

updateReadmeForTestResults(testResults);
