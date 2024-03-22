const fs = require('fs');
const path = require('path');

// Assuming manifests are stored in a directory named 'manifests' at the root of your project
const manifestsDir = path.join(__dirname, '..', 'manifests');

// Helper function to validate email format
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Helper function to validate URL format
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
};

describe('Manifest Files Validation', () => {
  const manifestFiles = fs.readdirSync(manifestsDir).filter(file => file.endsWith('.json'));

  manifestFiles.forEach(file => {
    describe(`${file}`, () => {
      let manifest;

      beforeAll(() => {
        const filePath = path.join(manifestsDir, file);
        manifest = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      });

      test('should have required fields', () => {
        expect(manifest).toHaveProperty('schema_version');
        expect(manifest).toHaveProperty('name_for_model');
        expect(manifest).toHaveProperty('description_for_model');
        expect(manifest).toHaveProperty('description_for_human');
        expect(manifest).toHaveProperty('auth');
        expect(manifest).toHaveProperty('api');
        expect(manifest).toHaveProperty('logo_url');
        expect(manifest).toHaveProperty('contact_email');
        expect(manifest).toHaveProperty('legal_info_url');
      });

      test('auth object should have expected structure', () => {
        expect(manifest.auth).toHaveProperty('type');
        
        // Check for properties only if auth type is not 'none'
        if (manifest.auth.type !== 'none') {
          // Assuming these properties should be present for non-'none' auth types
          expect(manifest.auth).toHaveProperty('client_url');
          expect(manifest.auth).toHaveProperty('scope');
          expect(manifest.auth).toHaveProperty('authorization_url');
          // Add additional checks as necessary for your project
        }
      });

      test('api object should have expected structure', () => {
        expect(manifest.api).toHaveProperty('type');
        expect(manifest.api).toHaveProperty('url');
      });

      test('should have valid URLs', () => {
        expect(isValidUrl(manifest.logo_url)).toBeTruthy();
        expect(isValidUrl(manifest.legal_info_url)).toBeTruthy();
        // Optionally check other URLs if applicable
      });

      test('should have a valid contact email', () => {
        expect(isValidEmail(manifest.contact_email)).toBeTruthy();
      });

      // Add more tests as needed to validate other fields and structures
    });
  });
});
