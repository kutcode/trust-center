# Code of Conduct

## Our Pledge

We as members, contributors, and maintainers of The Open GRC Trust Center pledge to make participation in our project and community a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

## Our Standards

### Expected Behavior

- **Be respectful and inclusive** — treat all community members with dignity
- **Give and accept constructive feedback** — focus on the code, not the person
- **Acknowledge mistakes gracefully** — we all make them
- **Prioritize what's best for the project and community**
- **Show empathy** toward other contributors

### Coding Standards

Contributors should follow these practices to maintain code quality and consistency:

#### General

- Write clean, readable, self-documenting code
- Follow existing patterns and conventions in the codebase
- Keep commits focused and atomic — one logical change per commit
- Write meaningful commit messages following [Conventional Commits](https://www.conventionalcommits.org/) (e.g., `feat:`, `fix:`, `docs:`, `refactor:`)

#### TypeScript / JavaScript

- Use TypeScript strict mode — avoid `any` types where possible
- Use `const` and `let` — never `var`
- Prefer functional components and hooks in React
- Use descriptive variable and function names
- Handle errors gracefully — don't swallow exceptions silently
- Add JSDoc comments for public functions and complex logic

#### Styling

- Follow existing TailwindCSS class conventions
- Use responsive design patterns (`sm:`, `md:`, `lg:` breakpoints)
- Ensure all UI changes are accessible (proper ARIA labels, keyboard navigation)

#### Security

- **Never** commit secrets, API keys, or credentials
- Validate and sanitize all user inputs
- Use parameterized queries — never concatenate SQL strings
- Follow the principle of least privilege for API endpoints
- Report security vulnerabilities privately (see [Security Reporting](#security-reporting))

#### Pull Requests

- Provide a clear description of what and why
- Reference related issues (e.g., `Closes #42`)
- Ensure `npm run build` passes before submitting
- Add tests for new features when applicable
- Keep PRs focused — avoid unrelated changes in the same PR

### Unacceptable Behavior

- Harassment, trolling, or personal attacks
- Publishing others' private information without consent
- Submitting malicious code or intentional security vulnerabilities
- Spam, off-topic promotional content, or bot activity
- Any conduct that would be considered inappropriate in a professional setting

## Scope

This Code of Conduct applies within all project spaces — including GitHub issues, pull requests, discussions, and any related communication channels.

## Enforcement

Project maintainers are responsible for clarifying standards of acceptable behavior and will take appropriate and fair corrective action in response to any behavior that violates this Code of Conduct.

Maintainers have the right to remove, edit, or reject comments, commits, code, issues, and other contributions that do not align with this Code of Conduct, and will communicate reasons for moderation decisions when appropriate.

## Security Reporting

If you discover a security vulnerability, **do not open a public issue**. Instead, please report it responsibly via GitHub's [private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability). We will respond within 48 hours and work with you to address the issue.

## Attribution

This Code of Conduct is adapted from the [Contributor Covenant](https://www.contributor-covenant.org/), version 2.1, with project-specific coding standards added for The Open GRC Trust Center.

---

**Thank you for helping make this project welcoming and professional for everyone.** 🤝
