# Contributing to Trust Center

Thank you for your interest in contributing to Trust Center! We welcome contributions from the community through pull requests.

## 📋 Before You Start

1. **Check existing issues** — See if your idea/bug is already being discussed
2. **Open an issue first** — For significant changes, discuss your approach before coding
3. **Read the docs** — Familiarize yourself with the project structure and code style

## 🚀 Getting Started

### 1. Fork & Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/trust-center.git
cd trust-center
```

### 2. Set Up Development Environment

```bash
cp .env.example .env
docker-compose up
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Supabase Studio: http://localhost:54323
- Mailpit (emails): http://localhost:8025

### 3. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-description
```

**Branch naming conventions:**
- `feature/` — New features
- `fix/` — Bug fixes
- `docs/` — Documentation changes
- `refactor/` — Code refactoring
- `test/` — Test additions

## 💻 Development Guidelines

### Code Style

- **TypeScript** — All new code must be in TypeScript
- **Formatting** — Follow existing code patterns
- **Naming** — Use clear, descriptive names
- **Comments** — Add comments for complex logic
- **No console.log** — Remove debug statements before committing

### Project Structure

```
trust-center/
├── frontend/          # Next.js 15 application
│   ├── src/app/       # App router pages
│   ├── src/components/# React components
│   └── src/lib/       # Utilities
├── backend/           # Express API
│   ├── src/routes/    # API endpoints
│   └── src/middleware/# Auth & error handling
└── supabase/          # Database migrations
```

### Database Changes

- Add new migrations in `supabase/migrations/`
- Use sequential numbering: `024_your_feature.sql`
- Test migrations locally before submitting

## ✅ Testing Your Changes

Before submitting a PR:

1. **Run backend tests:**
   ```bash
   cd backend && npm test
   ```

2. **Rebuild containers** if you changed dependencies:
   ```bash
   docker-compose down
   docker-compose up --build
   ```

3. **Test the flows:**
   - [ ] Public pages load correctly
   - [ ] Admin login works
   - [ ] Your feature works as expected
   - [ ] No console errors in browser

4. **Check for TypeScript errors:**
   ```bash
   cd frontend && npm run build
   cd ../backend && npm run build
   ```

5. **Write tests** for new middleware, utilities, or route handlers in `__tests__/` directories.

## 📝 Submitting a Pull Request

### 1. Commit Your Changes

```bash
git add .
git commit -m "feat: add new feature description"
```

**Commit message format:**
- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation
- `refactor:` — Code refactoring
- `test:` — Tests
- `chore:` — Maintenance

### 2. Push & Create PR

```bash
git push origin feature/your-feature-name
```

Then open a Pull Request on GitHub. Fill out the PR template completely.

### 3. PR Requirements

- [ ] Descriptive title and description
- [ ] Link to related issue (if applicable)
- [ ] All checklist items completed
- [ ] Screenshots for UI changes
- [ ] No merge conflicts

### 4. Review Process

1. Maintainers will review your PR
2. Address any requested changes
3. Once approved, your PR will be merged

## 🐛 Reporting Issues

Use our issue templates:
- **Bug Report** — For bugs and errors
- **Feature Request** — For new ideas

Include as much detail as possible!

## 💡 Good First Issues

Look for issues labeled `good first issue` — these are great for newcomers!

## 🔒 Security Issues

**Do NOT open public issues for security vulnerabilities.**

See [SECURITY.md](SECURITY.md) for responsible disclosure guidelines.

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Thank You!

Every contribution helps make Trust Center better. We appreciate your time and effort!
