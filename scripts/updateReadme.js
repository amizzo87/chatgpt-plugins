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

// Normalize file name for comparison
const normalizeFileName = (fileName) => {
    return fileName.toLowerCase().replace(/_/g, '-').replace('.json', '');
};

// Initialize counters
let updatedRowsCount = 0;
let passedCount = 0;
let failedCount = 0;

const updateReadme = () => {
    console.log(`Processing ${data.numTotalTestSuites} test suites with ${data.numTotalTests} total tests.`);

    data.testResults.forEach(testSuite => {
        // Extract and normalize the manifest file name from the ancestorTitles
        if (testSuite.assertionResults.length > 0) {
            const manifestFileName = normalizeFileName(testSuite.assertionResults[0].ancestorTitles[1]);
            const allPassed = testSuite.assertionResults.every(result => result.status === "passed");
            const statusIcon = allPassed ? '&check;' : '&cross;';

            const rowToUpdateIndex = lines.findIndex(line => line.toLowerCase().includes(manifestFileName));
            if (rowToUpdateIndex !== -1) {
                let parts = lines[rowToUpdateIndex].split('|');
                parts[parts.length - 2] = ` ${statusIcon} `;
                lines[rowToUpdateIndex] = parts.join('|');
                updatedRowsCount++;
                allPassed ? passedCount++ : failedCount++;
            } else {
                console.log(`Could not find row for ${manifestFileName} in README.md.`);
            }
        }
    });

    try {
        fs.writeFileSync(readmePath, lines.join('\n'));
        console.log(`README.md has been successfully updated. Rows updated: ${updatedRowsCount} (Passed: ${passedCount}, Failed: ${failedCount})`);
    } catch (error) {
        console.error('Error writing updates to README.md:', error);
    }
};

updateReadme();
