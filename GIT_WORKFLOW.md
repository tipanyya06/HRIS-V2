# Git Workflow

## Branch Strategy

```
main          → Production only, CI/CD deployments
develop       → Integration branch, all features merge here
feature/*     → Feature branches (feature/ats-pipeline)
fix/*         → Bug fixes (fix/jwt-expiry)
```

---

## Setup

```bash
# Initial setup
git clone https://github.com/tipanyya06/HRIS-V2.git
cd HRIS-V2
git checkout develop

# Create a feature branch
git checkout -b feature/your-feature-name
```

---

## Commit Messages

Follow **Conventional Commits**:

```
feat: add interview scheduling API
fix: resolve JWT token expiry issue
docs: update database schema
test: add unit tests for applicant model
chore: upgrade dependencies
```

Examples:
```bash
git commit -m "feat: implement job board endpoints"
git commit -m "fix: encrypt phone field in applicant model"
git commit -m "test: add tests for auth middleware"
```

---

## Pull Request Workflow

1. **Push to your feature branch**
   ```bash
   git push origin feature/your-feature
   ```

2. **Create PR on GitHub**
   - Title: `feat: short description`
   - Description: List changes, reference issues
   - Target: `develop` branch (NOT `main`)

3. **Code Review**
   - Address feedback
   - Push updates (new commits added to PR automatically)

4. **Merge**
   - Squash and merge (one clean commit per feature)
   - Delete branch after merge

5. **Deploy to dev environment**
   - Automatic deploy on `develop` push (if CI/CD configured)

---

## Release to Production

When ready for production (end of sprint):

```bash
# Merge develop into main
git checkout main
git pull origin main
git merge develop
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin main
git push origin v1.0.0
```

CI/CD automatically deploys from `main` tag.

---

## Common Issues

### Branch Protection Error
```
Error: Protected branch requires PR review
```
→ Requires at least 1 approval before merging

### Merge Conflict
```bash
git pull origin develop
# Fix conflicts in editor
git add .
git commit -m "resolve merge conflict"
git push origin feature/your-feature
```

### Undo Last Commit
```bash
git reset --soft HEAD~1
# Makes last commit into unstaged changes
```

---

## Best Practices

✅ Commit frequently with meaningful messages  
✅ Keep branches short-lived (< 1 week)  
✅ Always pull before pushing  
✅ Never force push to shared branches  
✅ Write tests for new features  
✅ Link commits to GitHub issues: `git commit -m "fix: issue #42"`

---

*Madison 88 Git Workflow Guide*
