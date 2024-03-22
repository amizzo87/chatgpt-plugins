const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Path to the directory containing manifest files, relative to this test file
const manifestsDir = path.join(__dirname, '..', 'manifests');

// Dynamically read all manifest files
const manifestFiles = fs.readdirSync(manifestsDir).filter(file => file.endsWith('.json'));

describe('Manifest Files Validation', () => {
  manifestFiles.forEach(file => {
    describe(`Validating ${file}`, () => {
      let manifest;

      beforeAll(() => {
        // Load the manifest file
        const filePath = path.join(manifestsDir, file);
        const fileContents = fs.readFileSync(filePath, 'utf8');
        manifest = JSON.parse(fileContents);
      });

      test('should have a name, version, and description', () => {
        expect(manifest).toHaveProperty('name');
        expect(typeof manifest.name).toBe('string');
        expect(manifest.name.length).toBeGreaterThan(0);

        expect(manifest).toHaveProperty('version');
        // Simple regex for semantic versioning
        expect(manifest.version).toMatch(/^\d+\.\d+\.\d+$/);

        expect(manifest).toHaveProperty('description');
        expect(typeof manifest.description).toBe('string');
        expect(manifest.description.length).toBeGreaterThan(0);
      });

      test('should have a valid "api" field if present', async () => {
        if (manifest.api) {
          expect(Array.isArray(manifest.api)).toBeTruthy();
          manifest.api.forEach(endpoint => {
            expect(endpoint).toHaveProperty('url');
            // Perform a basic format check on the URL
            expect(endpoint.url).toMatch(/^https?:\/\/[^\s$.?#].[^\s]*$/);
          });

          // Testing each API endpoint for reachability
          for (const endpoint of manifest.api) {
            await expect(axios.get(endpoint.url)).resolves.toHaveProperty('status', 200);
          }
        }
      }, 30000); // Extended timeout for async operations if testing API endpoints
    });
  });
});
