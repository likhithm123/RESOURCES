# Git and GitHub - Concepts, Commands and Scenario-Based Q&A
Every engineer uses Git daily. This notebook explains how Git stores data, every everyday command with diagrams, branching strategies, merge vs rebase, undoing mistakes, GitHub pull requests and Actions, and 30+ real scenario questions with exact commands.
## What is Version Control
- **Version control** records every change to files so you can see history, go back, and work in parallel with others.
- **Git** (Linus Torvalds, 2005) is **distributed**: every developer has the full history locally. Commits, branches, diffs are fast and work offline.
- **GitHub / GitLab / Bitbucket** host Git repositories online and add pull requests, code review, issues, CI/CD (Actions), security scanning.
## How Git Stores Data
- Git stores **snapshots**, not differences. Each commit points to a **tree** (directory) of **blobs** (file contents), plus parent commit(s), author, message.
- Every object is named by its **SHA-1/SHA-256 hash** of content - identical content is stored once and any change gives a new id (integrity).
- A **branch** is just a movable pointer (a 41-byte file) to a commit. **HEAD** points to the branch you are on.
@chain C1 <- C2 <- C3 <- C4 (main, HEAD) :: Commits point to their parents; main points to C4
### The three areas
@chain Working directory -> git add -> Staging area (index) -> git commit -> Local repository -> git push -> Remote (GitHub) :: Where your changes live
| Area | What it is |
|---|---|
| working directory | the files you edit |
| staging area (index) | snapshot of what goes into the next commit |
| local repo (.git) | all commits and history |
| remote | shared copy on GitHub (origin) |
## Setup and First Repository
```sh
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
git config --global init.defaultBranch main
git init my-project && cd my-project            # new repo
git clone https://github.com/user/repo.git      # copy an existing repo
ssh-keygen -t ed25519 -C "you@example.com"      # SSH key; add the .pub key to GitHub settings
```
## Everyday Commands
```sh
git status                         # what changed?
git add file.py                    # stage one file
git add .                          # stage everything
git add -p                         # stage chunks interactively (review what you commit)
git commit -m "Add login API"      # snapshot staged changes
git commit --amend                 # fix the last commit message/content (before pushing)
git log --oneline --graph --all    # visual history
git diff                           # unstaged changes
git diff --staged                  # staged changes
git show <commit>                  # one commit in detail
git rm old.txt; git mv a.py b.py   # remove / rename tracked files
git restore file.py                # discard working changes
git restore --staged file.py       # unstage
```
- `.gitignore` lists files Git should not track: `node_modules/`, `.env`, `__pycache__/`, `*.log`, build output. Never commit secrets - rotate them if you do.
### Good commit messages
- Imperative, short subject (50 chars): "Fix null check in payment service". Body explains **why**. Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.
## Branching
- A branch lets you develop a feature in isolation. Creating one is instant (a new pointer).
@chain main: C1 <- C2 <- C3 -> feature: C4 <- C5 :: feature branched off C3
```sh
git branch                          # list
git switch -c feature/login         # create + switch (older: git checkout -b)
git switch main
git branch -d feature/login         # delete merged branch (-D to force)
git push -u origin feature/login    # publish and track
git branch -vv                      # tracking info
```
## Merging
### Fast-forward merge
- If main has no new commits since you branched, Git just moves the pointer forward - no merge commit.
### Three-way merge
- If both branches have new commits, Git combines them using the common ancestor and creates a **merge commit** with two parents.
@chain C3 (common ancestor) -> C4 (main) + C5 (feature) -> M (merge commit, 2 parents) :: Three-way merge
```sh
git switch main
git merge feature/login            # merge commit if needed
git merge --no-ff feature/login    # always create a merge commit (keeps feature history grouped)
git merge --squash feature/login   # one combined change, then commit
```
### Merge conflicts
- Happen when both sides changed the same lines. Git marks the file:
```txt
<<<<<<< HEAD
price = 100
=======
price = 120
>>>>>>> feature/pricing
```
```sh
# edit the file to the correct final content, remove the markers, then:
git add pricing.py
git commit                          # (or git rebase --continue during a rebase)
git merge --abort                   # give up and return to before the merge
```
## Rebase
- `git rebase main` replays your branch's commits **on top of** the latest main, producing a linear history (new commit ids).
@chain Before: main C1-C2-C3, feature C1-C4-C5 -> After rebase: C1-C2-C3-C4'-C5' :: Rebase rewrites feature commits
```sh
git switch feature/login
git fetch origin
git rebase origin/main               # resolve conflicts, then: git add . && git rebase --continue
git rebase -i HEAD~4                 # interactive: squash, reword, drop, reorder commits
git push --force-with-lease          # needed after rewriting a pushed branch (safer than --force)
```
| Merge | Rebase |
|---|---|
| keeps true history, adds merge commits | linear, clean history |
| non-destructive | rewrites commit ids |
| safe on shared branches | never rebase a branch others are using |
> Golden rule: do not rebase commits that are already shared on a public branch (main/develop).
## Remotes: fetch, pull, push
```sh
git remote -v
git remote add origin git@github.com:user/repo.git
git fetch origin                    # download new commits, do not touch your files
git pull                            # fetch + merge
git pull --rebase                   # fetch + rebase (cleaner)
git push origin main
git push origin --delete old-branch
git remote add upstream https://github.com/original/repo.git   # forks: keep in sync
git fetch upstream && git rebase upstream/main
```
## Undoing Things
| Command | Effect | Safe on pushed commits? |
|---|---|---|
| git restore file | discard uncommitted edits in file | yes |
| git reset --soft HEAD~1 | undo last commit, keep changes staged | no (rewrites) |
| git reset --mixed HEAD~1 (default) | undo commit, keep changes unstaged | no |
| git reset --hard HEAD~1 | undo commit and delete the changes | no, destructive |
| git revert <sha> | new commit that inverses <sha> | yes - use on shared branches |
| git commit --amend | replace the last commit | no |
| git reflog | list where HEAD has been (recover lost commits) | - |
@chain HEAD~2 <- HEAD~1 <- HEAD (bad) :: reset moves the branch pointer back; revert adds a new commit undoing HEAD
```sh
git reflog                            # find the lost commit sha
git reset --hard abc1234              # go back to it (or: git branch rescue abc1234)
```
## Stash, Cherry-pick, Tags, Bisect, Blame
```sh
git stash push -m "wip navbar"        # shelve uncommitted work
git stash list; git stash pop          # restore (apply + drop)
git cherry-pick 9f3e2a1               # copy one commit onto the current branch (hotfix to release)
git tag -a v1.2.0 -m "Release 1.2.0"; git push origin v1.2.0      # releases (semantic versioning MAJOR.MINOR.PATCH)
git bisect start; git bisect bad; git bisect good v1.1.0          # binary search for the commit that broke things
git blame app.py                      # who changed each line and when
git log -S "calculateTax" --oneline   # commits that added/removed a string
git clean -fdn                        # preview deleting untracked files (-f to really delete)
git worktree add ../hotfix main       # second working folder for another branch
git submodule add <url> libs/x        # repo inside a repo
```
## Branching Strategies
| Strategy | How | Good for |
|---|---|---|
| GitHub Flow | main always deployable; short feature branches + PR | web apps, continuous deployment |
| Git Flow | main, develop, feature/*, release/*, hotfix/* | versioned releases (mobile, desktop) |
| Trunk-based | everyone commits small changes to main daily, feature flags | high-velocity teams, CI/CD |
| Release branches | cut release/x.y from main, cherry-pick fixes | long-supported versions |
@chain feature/x -> Pull request + review + CI -> main -> deploy :: GitHub Flow
## GitHub Collaboration
### Pull requests (PRs)
- Push a branch, open a PR, describe the change, link the issue (`Closes #12`), request reviewers. CI runs tests automatically. Reviewers comment; you push fixes; then **merge** (merge commit, squash and merge, or rebase and merge).
- **Branch protection**: require PR reviews, passing status checks, signed commits, no force pushes on main. **CODEOWNERS** file auto-assigns reviewers.
### Forks and open source
@chain upstream repo -> fork (your copy) -> clone -> branch + commits -> push to fork -> PR to upstream :: Open-source contribution flow
### GitHub Actions (CI/CD)
```yaml
# .github/workflows/ci.yml
name: CI
on:
  push: { branches: [main] }
  pull_request:
jobs:
  test:
    runs-on: ubuntu-latest
    strategy: { matrix: { python: ["3.11", "3.12"] } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "${{ matrix.python }}" }
      - run: pip install -r requirements.txt
      - run: pytest -q
```
- Other GitHub features: Issues and Projects (kanban), Releases, Packages, Pages (static hosting), Dependabot (dependency updates), secret scanning, code scanning (CodeQL), Codespaces, Copilot.
## Git Internals (for deeper interviews)
```sh
git cat-file -p HEAD              # shows tree, parent, author of the commit
git cat-file -p HEAD^{tree}       # lists blobs and sub-trees
ls .git                           # HEAD, config, objects/, refs/heads/, refs/tags/, index
```
- Objects: blob (content), tree (folder), commit (snapshot + metadata), tag. Packfiles compress objects with deltas. `git gc` cleans up.
- Hooks (`.git/hooks/pre-commit`, `commit-msg`, `pre-push`) run scripts locally - e.g. linting via the pre-commit framework or Husky.
## Scenario-Based Questions and Answers
Q: You committed to main but meant to commit to a new branch (not pushed yet).
A: `git branch feature/x` (keeps the commit there), `git reset --hard HEAD~1` (move main back), `git switch feature/x`.
Q: You pushed a commit with a bug to main that others already pulled.
A: Do not rewrite history; run `git revert <sha>` and push - it adds a commit that undoes the change.
Q: You accidentally committed a password/API key and pushed it.
A: Rotate/revoke the secret immediately (assume it is leaked), remove it from history with `git filter-repo` or BFG, force-push, ask collaborators to re-clone, add the file to .gitignore and use environment variables/secret managers.
Q: Your last commit message has a typo and is not pushed.
A: `git commit --amend -m "correct message"`.
Q: You need to combine your last 5 messy commits into one before opening a PR.
A: `git rebase -i HEAD~5`, mark the last four as `squash` (or `fixup`), save, edit the message, then `git push --force-with-lease`.
Q: You ran `git reset --hard` and lost work you had committed.
A: `git reflog` shows the previous HEAD positions; `git reset --hard <sha>` or `git branch recover <sha>` brings it back. Uncommitted changes cannot be recovered this way.
Q: You are in the middle of a feature and an urgent production bug arrives.
A: `git stash` (or commit WIP), `git switch main && git pull`, `git switch -c hotfix/bug`, fix, PR and merge, then return and `git stash pop`. Alternatively use `git worktree`.
Q: A fix is merged into main and must also go into release/2.3.
A: `git switch release/2.3 && git cherry-pick <fix-sha>`, resolve conflicts if any, push and open a PR.
Q: Two developers edited the same function and a merge conflict appears.
A: Open the conflicted file, understand both changes, write the combined correct code, remove markers, run tests, `git add` and continue the merge/rebase; talk to the other developer if intent is unclear.
Q: Your feature branch is 50 commits behind main.
A: `git fetch origin` then `git rebase origin/main` (private branch) or `git merge origin/main` (shared branch), resolve conflicts, run tests, push.
Q: Which commit introduced a performance regression between v1.4 and v1.5?
A: `git bisect start`, `git bisect bad v1.5`, `git bisect good v1.4`, test each checkout and mark good/bad (or `git bisect run ./perf_test.sh`) until Git names the first bad commit.
Q: You want to undo changes to one file only, going back to the version in main.
A: `git restore --source=main -- path/to/file`.
Q: You added a large file (500 MB) by mistake and push is rejected.
A: Remove it from the commit (`git rm --cached big.zip`, amend or rebase it out), add it to .gitignore; for genuine large assets use Git LFS.
Q: Difference between `git fetch` and `git pull`?
A: fetch downloads remote commits into remote-tracking branches without changing your work; pull = fetch + merge (or rebase) into your current branch.
Q: How do you keep your fork updated with the original repository?
A: `git remote add upstream <url>`, `git fetch upstream`, `git rebase upstream/main` (or merge), `git push origin main`.
Q: `git push` is rejected with "non-fast-forward".
A: The remote has commits you do not have. `git pull --rebase`, resolve conflicts, then push. Do not use --force on shared branches.
Q: You want to see what changed between two releases.
A: `git log v1.4..v1.5 --oneline` and `git diff v1.4 v1.5 --stat`.
Q: A file is in .gitignore but is still tracked.
A: It was committed before being ignored: `git rm --cached file` then commit.
Q: How do you delete a branch locally and remotely?
A: `git branch -d name` and `git push origin --delete name`.
Q: How do you enforce that main always passes tests?
A: Branch protection with required status checks (CI on every PR), required reviews, and disallow direct pushes.
Q: Merge commit vs squash merge vs rebase merge on GitHub?
A: Merge commit keeps all commits plus a merge node; squash creates one commit per PR (clean main, loses granular history); rebase-merge replays commits linearly without a merge commit.
Q: What is a detached HEAD?
A: HEAD points directly to a commit instead of a branch (after checking out a tag/sha). New commits there are not on any branch - create one with `git switch -c name` to keep them.
Q: How do you find who wrote a specific line and why?
A: `git blame -L 40,60 file.py`, then `git show <sha>` to read the commit message and linked PR.
Q: You want to temporarily try someone's PR locally.
A: `git fetch origin pull/123/head:pr-123 && git switch pr-123` (or `gh pr checkout 123`).
Q: How do you sign commits?
A: Configure a GPG or SSH signing key (`git config commit.gpgsign true`, `user.signingkey`) so GitHub shows Verified.
## Quick Reference
| Task | Command |
|---|---|
| start | git init / git clone url |
| save | git add . ; git commit -m "msg" |
| branch | git switch -c name |
| update | git pull --rebase |
| share | git push -u origin name |
| combine | git merge / git rebase |
| undo safely | git revert sha |
| undo locally | git reset --soft HEAD~1 |
| shelve | git stash / git stash pop |
| find bug | git bisect |
| history | git log --oneline --graph --all |
| recover | git reflog |
