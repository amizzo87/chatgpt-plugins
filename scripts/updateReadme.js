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

const updateReadme = () => {
    let manifestResults = {};

    // Aggregate test results by manifest file
    data.testResults.forEach(testSuite => {
        testSuite.assertionResults.forEach(result => {
            const manifestFilename = result.ancestorTitles[1]; // Assuming the manifest filename is always the second value
            if (!manifestResults[manifestFilename]) {
                manifestResults[manifestFilename] = { passed: true, failedTests: [] };
            }
            if (result.status !== "passed") {
                manifestResults[manifestFilename].passed = false;
                manifestResults[manifestFilename].failedTests.push(result.fullName);
            }
        });
    });

    // Update README.md based on aggregated results
    Object.keys(manifestResults).forEach(manifestFilename => {
        const statusIcon = manifestResults[manifestFilename].passed ? '&check;' : '&cross;';
        const rowToUpdateIndex = lines.findIndex(line => line.includes(manifestFilename));

        if (rowToUpdateIndex !== -1) {
            let parts = lines[rowToUpdateIndex].split('|');
            parts[parts.length - 2] = ` ${statusIcon} `;
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

updateReadme();
