# Solivage Travels Agent Guidelines

This file provides instructions for AI agents working on the Solivage Travels codebase.

## 1. Development Commands

### Server Operations
- Start production server: `npm start`
- Start development server (with auto-reload): `npm run dev`
- View server logs: `tail -f server.log`

### Testing
- Run all tests: `npm test`
- Run tests in watch mode: `npm run test:watch`
- Run a single test by name: `npm test -- -t "test name"`
- Run tests matching a pattern: `npm test -- -k "pattern"`
- Run tests with verbose output: `npm test -- --verbose`

### Linting & Formatting
- (To be implemented) Run ESLint: `npm run lint`
- (To be implemented) Fix auto-fixable issues: `npm run lint -- --fix`

### Database
- Initialize/reset database: `node migrations/init-db.js`
- View current database: `cat database.json`

## 2. Code Style Guidelines

### JavaScript/Node.js Standards
- Use ES6+ syntax (const/let, arrow functions, destructuring, template literals)
- Prefer `const` for variables that won't be reassigned, `let` for those that will
- Use template literals for string concatenation
- Use arrow functions for callbacks and short functions
- Use explicit returns in arrow functions when multiline
- Avoid `var` entirely

### File Organization
- Route handlers in `server.js` (for now, as it's a small app)
- Business logic in separate modules (`payment.js`, `utils/logger.js`)
- Test files in `/tests` directory, matching the file they test
- Configuration in `.env` (never committed) and `.env.example`
- Database migrations in `/migrations` directory
- Frontend assets: HTML, CSS, JS in root (as it's a simple static site)

### Import/Require Guidelines
- Group imports: built-in modules first, then third-party, then local
- Alphabetize within each group when possible
- Use destructuring for imports when using multiple exports from a module
- Local imports use relative paths with `./` prefix
- Example:
  ```javascript
  const express = require('express');
  const bcrypt = require('bcryptjs');
  const jwt = require('jsonwebtoken');
  
  const path = require('path');
  const fs = require('fs');
  
  const logger = require('./utils/logger');
  const payment = require('./payment');
  ```

### Formatting
- Use 2-space indentation (no tabs)
- Maximum line length: 100 characters
- Use semicolons to terminate statements
- Add a single newline at end of file
- Use spaces around operators and after commas
- Opening braces on same line as statement
- Empty lines to separate logical sections

### Naming Conventions
- Files and directories: kebab-case (e.g., `payment.js`, `utils/logger.js`)
- Variables and functions: camelCase (e.g., `isValidEmail`, `sendBookingConfirmationEmail`)
- Classes: PascalCase (none currently in codebase)
- Constants: UPPER_SNAKE_CASE (e.g., `PORT`, `JWT_SECRET`)
- Private properties/functions: prefix with `_` (when applicable)
- Boolean variables: prefix with `is`, `has`, `can`, `should` (e.g., `isValidEmail`)
- Functions: use verb-noun pattern (e.g., `createPaymentIntent`, `validateForm`)

### Error Handling
- Use try/catch for asynchronous operations
- In Express route handlers, catch errors and pass to `next(err)` or handle explicitly
- Log errors using the logger utility (`logger.error()`)
- Return appropriate HTTP status codes:
  - 200: Success
  - 201: Created
  - 400: Bad Request (client error)
  - 401: Unauthorized
  - 403: Forbidden
  - 404: Not Found
  - 429: Too Many Requests (rate limiting)
  - 500: Internal Server Error
  - 503: Service Unavailable
- Never expose internal error details to clients in production
- Validate all inputs (query params, body, params) before processing
- Use centralized error handling middleware when expanding the app

### Security Practices
- Always validate and sanitize user inputs
- Use environment variables for secrets (never hardcode)
- Hash passwords with bcrypt (work factor 10+)
- Use HTTPS in production (implemented via reverse proxy)
- Implement rate limiting on API endpoints
- Use helmet.js for security headers
- Validate JWT tokens on protected routes
- Use secure, HTTP-only cookies for any cookies implemented
- Sanitize data before outputting to prevent XSS (though we're primarily JSON API)

### Comments and Documentation
- Use JSDoc for public functions and complex logic
- Comment why, not what (unless the what is non-obvious)
- Keep comments up-to-date when code changes
- Remove commented-out code (use version control instead)
- For complex logic, add explanatory comments

### Database (JSON file) Guidelines
- Treat `database.json` as a transient datastore for simplicity
- All writes must go through `saveDb()` function
- All reads should use the in-memory `db` object after `loadDb()`
- Initialize default data via migrations/init-db.js
- Never store sensitive data (like passwords) in plain text
- Use ISO 8601 format for dates (new Date().toISOString())
- Assign unique IDs using `Date.now()` (acceptable for low-volume app)

### Frontend Specific
- HTML: Use semantic elements where possible
- CSS: Use BEM-like naming for classes (block__element--modifier)
- Keep CSS in `styles.css` (no preprocessors for simplicity)
- JavaScript: Use vanilla JS with ES6 modules (when split)
- Accessibility: Ensure sufficient color contrast, alt text for images
- Responsive design: Mobile-first approach using media queries
- Performance: Optimize images, minify CSS/JS in production

### Testing Practices
- Write unit tests for pure functions (validation, helpers)
- Test both positive and negative cases
- Mock external dependencies (email, payment gateways)
- Test API endpoints with supertest
- Aim for 80%+ coverage on critical paths
- Keep tests readable and maintainable
- Use descriptive test names that explain the scenario
- Group related tests with `describe` blocks
- Use `beforeEach`, `afterEach` for setup/teardown when needed

### Git Workflow
- Commit often with descriptive messages
- Use present tense in commit messages ("Add feature" not "Added feature")
- Reference issues in commit messages when applicable
- Keep feature branches short-lived
- Rebase to keep history clean when appropriate
- Never force push to main/master branches

### Debugging
- Use logger utility for debug/info/warn/error levels
- In development, use console.log for quick debugging (remove before commit)
- Use Chrome DevTools for frontend debugging
- Use Node.js inspector for backend debugging (`node inspect server.js`)
- Check logs in `server.log` and `logs/` directory

## 3. Project Structure Explanation

```
/ (root)
├── index.html              # Main homepage
├── admin.html              # Admin panel interface
├── styles.css              # Shared stylesheet
├── solivage.js             # Frontend JavaScript
├── server.js               # Main Express server
├── package.json            # Dependencies and scripts
├── .env                    # Environment variables (gitignored)
├── .env.example            # Example environment variables
├── database.json           # JSON-based data store
├── server.log              # Runtime logs
├── AGENTS.md               # This file
├── API_DOCUMENTATION.md    # API reference documentation
├── migrations/             # Database initialization scripts
│   ├── init-db.js          # Database initialization logic
│   └── init.sql            # SQL version (for reference)
├── tests/                  # Test files
│   ├── validation.test.js  # Validation function tests
│   └── server.test.js      # Basic server route tests
├── utils/                  # Utility modules
│   └── logger.js           # Winston logger configuration
├── payment.js              # Payment integration placeholder
├── back3.jpg               # Background image
├── back3-optimized.webp    # Optimized background
├── mercedes V-class.jpeg   # Vehicle images
├── E-class.jpeg
├── S-class.jpeg
├── service-worker.js       # PWA service worker
└── manifest.json           # PWA manifest
```

## 4. When in Doubt
- Refer to existing code in the repository for patterns
- Prioritize readability and maintainability
- When adding features, consider extensibility
- Security first: always assume inputs are malicious
- Performance: optimize for typical use cases, not edge cases
- User experience: make interfaces intuitive and accessible