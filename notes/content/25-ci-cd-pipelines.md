# CI/CD Pipelines and Deployment Strategies
This notebook explains, in simple words, how code travels from a developer's laptop to real users safely and automatically: Continuous Integration, Continuous Delivery and Deployment, pipeline stages, GitHub Actions / Jenkins / GitLab CI, artifacts and environments, and every deployment strategy (blue-green, canary, rolling, recreate, A/B, shadow, feature flags, dark launch) with diagrams, real examples, rollback plans and interview questions.
## Why CI/CD Exists
- Old way: developers worked for weeks, merged everything at once ("integration hell"), a person copied files to the server by hand on a Friday night, and something always broke.
- **CI/CD** makes this small, automatic and repeatable: every change is built and tested automatically, and releasing becomes a button (or no button at all).
- Analogy: a car factory assembly line. Every car (code change) passes the same stations - welding, painting, quality check - in the same order, and a faulty car is stopped at the station where the fault is found.
@chain Developer pushes code -> CI: build + test automatically -> Artifact (package / Docker image) -> CD: deploy to staging -> checks -> deploy to production -> monitor :: The CI/CD flow
| Term | Meaning in simple words |
|---|---|
| Continuous Integration (CI) | everyone merges small changes into the main branch often (daily); each merge is automatically built and tested |
| Continuous Delivery | every change that passes the pipeline is ready to release; a human clicks "deploy to production" |
| Continuous Deployment | every change that passes goes to production automatically, no human click |
| Pipeline | the ordered list of automatic steps (stages / jobs) |
| Artifact | the built output: a JAR, a wheel, a zip, a Docker image |
| Environment | a place where the app runs: dev, test / QA, staging, production |
| Release | making a version available to users |
| Rollback | going back to the previous working version |
@layers Continuous Integration: build, unit tests, lint, security scan | Continuous Delivery: + automatic deploy to staging, release to prod by approval | Continuous Deployment: + automatic deploy to prod :: Each level adds more automation
### Benefits (and the DORA metrics companies measure)
- Faster feedback (a broken test is found in minutes), fewer bugs reach users, small changes are easy to understand and roll back, no "deployment day" stress.
| DORA metric | What it measures | Elite teams |
|---|---|---|
| Deployment frequency | how often you deploy to production | many times a day |
| Lead time for changes | commit -> running in production | under a day |
| Change failure rate | % of deployments that cause a problem | 0-15% |
| Time to restore service (MTTR) | how fast you recover from a failure | under an hour |
## Stages of a Typical Pipeline
@flow (Push / pull request) | Checkout code + install dependencies (cached) | Lint + format check + type check | Unit tests + code coverage | Security scans: dependencies (SCA), code (SAST), secrets | Build artifact / Docker image, tag with version + commit id | Push image to registry | Deploy to staging | Integration, end-to-end, smoke and performance tests | <Approved / all checks green? ~ Stop, notify the team> | Deploy to production with a safe strategy | (Monitor metrics; roll back automatically if errors rise) :: A complete CI/CD pipeline
| Stage | Tools | Fails the pipeline when |
|---|---|---|
| Source | Git, GitHub / GitLab, branch protection | - |
| Build | Maven / Gradle, npm / pnpm, pip / uv, Docker, Bazel | it does not compile |
| Static checks | ESLint, Prettier, Ruff, Black, mypy, Checkstyle, SonarQube | style or type errors |
| Unit tests | JUnit, pytest, Jest / Vitest, GoogleTest | any test fails or coverage drops |
| Security | Dependabot / Snyk / Trivy (dependencies and images), CodeQL / Semgrep (code), gitleaks (secrets) | high-severity issue |
| Package | Docker build, artifact upload | - |
| Registry | Docker Hub, AWS ECR, GHCR, Artifactory, Nexus | - |
| Deploy | kubectl / Helm, Argo CD, Terraform, AWS CodeDeploy, Vercel / Netlify | deployment error |
| Post-deploy tests | Playwright / Cypress (end to end), Postman / Newman (API), k6 / JMeter (load), smoke tests | test fails |
| Monitor | Prometheus, Grafana, Datadog, CloudWatch, Sentry | alerts fire -> rollback |
### The testing pyramid
@layers End-to-end tests (few, slow, test the whole app like a user) | Integration tests (some: modules + database + APIs together) | Unit tests (many, fast, one function at a time) :: Write many unit tests, fewer integration tests, very few end-to-end tests
- **Shift left**: find problems as early as possible (in the developer's editor or the PR), because a bug found in production costs far more to fix.
## GitHub Actions in Depth
- Workflows are YAML files in `.github/workflows/`. A **workflow** has **triggers** (`on`), **jobs** (run in parallel unless `needs` says otherwise) and **steps** (shell commands or reusable **actions**). Jobs run on **runners** (GitHub-hosted or your own machines).
```yaml
# .github/workflows/ci-cd.yml - test, build a Docker image, deploy to staging, then production with approval
name: CI-CD
on:
  push: { branches: [main] }
  pull_request: { branches: [main] }
concurrency: { group: deploy-${{ github.ref }}, cancel-in-progress: true }   # only one run per branch at a time
permissions: { contents: read, packages: write, id-token: write }             # least privilege for the token
jobs:
  test:
    runs-on: ubuntu-latest
    strategy: { matrix: { python: ["3.11", "3.12"] } }                       # run on two versions in parallel
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "${{ matrix.python }}", cache: pip }
      - run: pip install -r requirements.txt -r requirements-dev.txt
      - run: ruff check . && mypy app
      - run: pytest --cov=app --cov-fail-under=80
  build:
    needs: test                                                               # runs only if all tests passed
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    outputs: { image: "${{ steps.meta.outputs.image }}" }
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with: { registry: ghcr.io, username: "${{ github.actor }}", password: "${{ secrets.GITHUB_TOKEN }}" }
      - id: meta
        run: echo "image=ghcr.io/${{ github.repository }}:${{ github.sha }}" >> "$GITHUB_OUTPUT"
      - run: docker build -t ${{ steps.meta.outputs.image }} . && docker push ${{ steps.meta.outputs.image }}
      - uses: aquasecurity/trivy-action@0.28.0                                # scan the image for vulnerabilities
        with: { image-ref: "${{ steps.meta.outputs.image }}", severity: "CRITICAL,HIGH", exit-code: "1" }
  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - run: ./scripts/deploy.sh staging ${{ needs.build.outputs.image }}
      - run: ./scripts/smoke-test.sh https://staging.example.com
  deploy-production:
    needs: [build, deploy-staging]
    runs-on: ubuntu-latest
    environment: { name: production, url: "https://example.com" }             # protection rule: needs a reviewer's approval
    steps:
      - run: ./scripts/deploy.sh production ${{ needs.build.outputs.image }} --strategy canary
```
| GitHub Actions feature | Use |
|---|---|
| on: push / pull_request / schedule / workflow_dispatch / release | triggers (workflow_dispatch = manual button) |
| needs | order jobs: build after test |
| matrix | the same job on many versions / OSes |
| cache / actions/cache | reuse downloaded dependencies -> faster runs |
| secrets / vars | encrypted values (API keys) / plain settings |
| environments | staging / production with required reviewers, wait timers, own secrets |
| OIDC (id-token: write) | log in to AWS / GCP / Azure without storing long-lived keys |
| artifacts (upload / download-artifact) | pass files between jobs, keep test reports |
| reusable workflows / composite actions | share pipelines across repositories |
| concurrency | stop two deploys running at the same time |
| self-hosted runners | your own machines (GPU, private network) |
## Other CI/CD Tools
| Tool | Notes |
|---|---|
| Jenkins | oldest and most flexible, self-hosted, Groovy Jenkinsfile, huge plugin library |
| GitLab CI/CD | built into GitLab, .gitlab-ci.yml, strong environments and registry |
| Azure DevOps Pipelines | Microsoft ecosystem, YAML pipelines |
| AWS CodePipeline + CodeBuild + CodeDeploy | native AWS, CodeDeploy does blue-green / canary on EC2, ECS, Lambda |
| CircleCI, Travis CI, Bitbucket Pipelines, TeamCity, Buildkite | hosted CI services |
| Argo CD, Flux | GitOps continuous delivery for Kubernetes |
| Argo Rollouts, Flagger, Spinnaker | progressive delivery (canary / blue-green with automatic analysis) |
| Vercel, Netlify, Render | push-to-deploy for web apps, preview URL for every pull request |
```txt
// Jenkinsfile (declarative pipeline)
pipeline {
  agent any
  environment { IMAGE = "registry.example.com/shop:${env.BUILD_NUMBER}" }
  stages {
    stage('Checkout') { steps { checkout scm } }
    stage('Test')     { steps { sh 'mvn -B test' } post { always { junit 'target/surefire-reports/*.xml' } } }
    stage('Build')    { steps { sh 'mvn -B package -DskipTests && docker build -t $IMAGE . && docker push $IMAGE' } }
    stage('Deploy to staging') { steps { sh "helm upgrade --install shop ./chart -n staging --set image=$IMAGE" } }
    stage('Approve')  { steps { input message: 'Deploy to production?' } }
    stage('Deploy to production') { steps { sh "helm upgrade --install shop ./chart -n prod --set image=$IMAGE" } }
  }
  post { failure { mail to: 'team@example.com', subject: "Build failed: ${env.JOB_NAME}", body: "${env.BUILD_URL}" } }
}
```
```yaml
# .gitlab-ci.yml
stages: [test, build, deploy]
test:   { stage: test,  image: python:3.12, script: [pip install -r requirements.txt, pytest] }
build:  { stage: build, image: docker:27, services: [docker:27-dind], script: [docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA ., docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA] }
deploy_prod: { stage: deploy, script: [./deploy.sh $CI_COMMIT_SHA], environment: production, when: manual, only: [main] }
```
## Environments, Artifacts and Versioning
@chain dev (each developer) -> test / QA (automatic tests) -> staging (copy of production) -> production (real users) :: Promotion through environments
- **Build once, deploy many**: build the image one time, give it an immutable tag (version + commit id), and promote **the same image** from staging to production. Never rebuild for production - you would deploy something you did not test.
- **Semantic versioning**: MAJOR.MINOR.PATCH (2.4.1). MAJOR = breaking change, MINOR = new feature, PATCH = bug fix.
- **Configuration per environment** comes from environment variables / config maps, and **secrets** from a secret manager (GitHub secrets, Vault, AWS Secrets Manager) - never from the code or the image (twelve-factor app).
- **Preview environments**: a temporary copy of the app for every pull request so reviewers can click through it.
- **Infrastructure as Code (IaC)**: servers, networks and databases are described in code (Terraform, CloudFormation, Pulumi) and created by the pipeline too.
- **Database migrations** run as a pipeline step and must be **backward compatible** (expand / contract): first add the new column, deploy code that writes both, later remove the old column. Otherwise a rollback breaks.
## Deployment Strategies (every type explained)
- A **deployment strategy** decides **how the new version replaces the old one** - all at once, gradually, side by side, or only for some users. The goal: zero downtime, low risk, fast rollback.
### 1. Recreate (big bang)
- Stop all old servers, then start the new version.
- Simple and cheap, but users see **downtime** in between, and rollback means another full redeploy.
- Use for: internal tools, dev environments, or when two versions cannot run together (some database changes).
@chain v1 v1 v1 running -> stop everything (DOWNTIME) -> v2 v2 v2 running :: Recreate deployment
### 2. Rolling update
- Replace servers **a few at a time**: take one v1 instance out of the load balancer, start v2 there, check its health, move to the next. This is the **default in Kubernetes**.
- No downtime, no extra servers needed. But for a while **both versions serve users**, so they must be compatible, and rollback is another rolling update (not instant).
- Settings: `maxSurge` (how many extra pods may be added) and `maxUnavailable` (how many may be down) during the update.
@grid v1 v1 v1 v1 / v2* v1 v1 v1 / v2* v2* v1 v1 / v2* v2* v2* v2* :: Rolling update: one instance at a time (top to bottom = time)
```yaml
# Kubernetes Deployment with a rolling update
apiVersion: apps/v1
kind: Deployment
metadata: { name: shop }
spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    rollingUpdate: { maxSurge: 1, maxUnavailable: 0 }     # add 1 new pod, never drop below 4 healthy
  selector: { matchLabels: { app: shop } }
  template:
    metadata: { labels: { app: shop } }
    spec:
      containers:
        - name: shop
          image: ghcr.io/acme/shop:2.4.1
          readinessProbe: { httpGet: { path: /health, port: 8000 }, periodSeconds: 5 }   # traffic only when ready
          livenessProbe:  { httpGet: { path: /health, port: 8000 }, periodSeconds: 10 }
```
```sh
kubectl set image deployment/shop shop=ghcr.io/acme/shop:2.4.2   # start the rolling update
kubectl rollout status deployment/shop                            # watch it
kubectl rollout undo deployment/shop                              # roll back to the previous version
```
### 3. Blue-green deployment
- Keep **two identical production environments**: **Blue** = the live version (v1), **Green** = the new version (v2). Deploy v2 to Green while Blue keeps serving everyone. Test Green privately. Then **switch the router / load balancer** so all traffic goes to Green in one step.
- Rollback = switch the router back to Blue: **instant**. Blue stays running for a while as the safety net, then becomes the next "green".
- Cost: twice the servers during the switch. Watch out for the **database**: both colours usually share it, so schema changes must work with both versions.
- Real example: a bank releases a new net-banking version at 2 AM: Green is fully tested with production data; the load balancer flips; if errors appear the team flips back within seconds.
@layers Users | Load balancer / DNS / router | BLUE: v1 (live, 100% traffic), GREEN: v2 (idle, being tested) | Shared database :: Blue-green before the switch
@layers Users | Load balancer / DNS / router | BLUE: v1 (idle, kept for rollback), GREEN: v2 (live, 100% traffic) | Shared database :: Blue-green after the switch - rollback = switch back
```yaml
# Blue-green on Kubernetes: two Deployments, one Service. Switching = changing the Service selector.
apiVersion: v1
kind: Service
metadata: { name: shop }
spec:
  selector: { app: shop, color: blue }        # change to "green" to switch all traffic at once
  ports: [{ port: 80, targetPort: 8000 }]
```
```sh
kubectl apply -f shop-green-deployment.yaml                                   # deploy v2 as color=green
kubectl rollout status deployment/shop-green && ./smoke-test.sh http://shop-green.internal
kubectl patch service shop -p '{"spec":{"selector":{"app":"shop","color":"green"}}}'   # the switch
kubectl patch service shop -p '{"spec":{"selector":{"app":"shop","color":"blue"}}}'    # instant rollback if needed
```
### 4. Canary deployment
- Named after the canary birds miners carried: if the bird got sick, the miners knew the air was bad before people were harmed.
- Send a **small share of real traffic** (1% -> 5% -> 25% -> 50% -> 100%) to the new version while watching error rate, latency and business metrics. If metrics stay healthy, increase; if not, send everyone back to the old version. Only a few users are ever affected by a bad release.
- Needs good monitoring and a router that can split traffic by percentage (service mesh like Istio, Argo Rollouts, ALB weighted target groups, Nginx, feature-flag systems).
- Real example: Netflix and Google release to a small slice of servers or users first, compare the canary's metrics with the old version automatically (**canary analysis**, e.g. Kayenta), and promote or abort.
@chain v2 gets 5% of traffic -> watch errors + latency for 10 min -> 25% -> 50% -> 100% (or roll back at any step) :: Canary rollout
@flow (Deploy v2 next to v1) | Route 5% of traffic to v2 | Compare v2 vs v1: error rate, p95 latency, CPU, orders per minute | <Healthy? ~ (Route 100% back to v1, alert the team)> | Increase to the next step (25%, 50%) | (100% on v2, remove v1) :: Automated canary analysis
```yaml
# Argo Rollouts: automatic canary with pauses
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata: { name: shop }
spec:
  replicas: 10
  strategy:
    canary:
      steps:
        - setWeight: 5
        - pause: { duration: 10m }
        - analysis: { templates: [{ templateName: error-rate-below-1-percent }] }   # Prometheus query decides
        - setWeight: 25
        - pause: { duration: 10m }
        - setWeight: 50
        - pause: { duration: 10m }
  selector: { matchLabels: { app: shop } }
  template: { metadata: { labels: { app: shop } }, spec: { containers: [{ name: shop, image: "ghcr.io/acme/shop:2.4.2" }] } }
```
### 5. A/B testing
- Two (or more) versions are shown to **different user groups on purpose** to learn **which one is better for the business** (more sign-ups, more purchases). It is an experiment, not just a safety technique.
- Users are split by rules (random 50/50, country, device, logged-in user id) and each user consistently sees the same version. Results are compared with statistics (see notebook 29).
- Example: Amazon shows a green "Buy now" button to group A and an orange one to group B for two weeks, then keeps the one with the higher conversion rate.
| Canary | A/B testing |
|---|---|
| goal: is the new version safe and stable? | goal: which version performs better for users / business? |
| measures technical health (errors, latency) | measures business metrics (clicks, conversion, revenue) |
| short: minutes to hours, then 100% | longer: days to weeks until statistically significant |
| split by % of traffic | split by user groups, consistent per user |
### 6. Shadow (mirrored / dark traffic) deployment
- The new version receives a **copy** of real production traffic, but its responses are **thrown away** - users only ever get the old version's answer. You compare results and performance safely.
- Great for: rewriting a service, new search ranking, a new ML model, load-testing with real traffic. Careful with side effects: the shadow must not charge cards or send emails twice (stub or disable writes).
@chain User request -> Router -> v1 (answers the user) + copy -> v2 shadow (answer discarded, logged for comparison) :: Shadow deployment
### 7. Feature flags (feature toggles) and dark launches
- The new code is deployed to production **switched off**, hidden behind an if-condition. Turning it on is a **configuration change**, not a deployment - instant, and instant to turn off (**kill switch**).
- This **separates deploy from release**: deploy anytime; release when the business is ready, to whom you choose (internal staff -> beta users -> 10% -> everyone).
- A **dark launch** runs the new feature's code in production without showing anything to users (for example, compute new recommendations in the background to test load).
- Tools: LaunchDarkly, Unleash, Flagsmith, GrowthBook, AWS AppConfig, Firebase Remote Config, or a simple table in your database.
- Remove old flags regularly - many forgotten flags become **technical debt**.
```py
# Simple percentage rollout feature flag
import hashlib
FLAGS = {"new_checkout": {"enabled": True, "percent": 10, "allow": {"qa@company.com"}}}
def is_on(flag: str, user_id: str) -> bool:
    f = FLAGS.get(flag)
    if not f or not f["enabled"]: return False
    if user_id in f["allow"]: return True
    bucket = int(hashlib.sha256(f"{flag}:{user_id}".encode()).hexdigest(), 16) % 100   # the same user always gets the same bucket
    return bucket < f["percent"]
if is_on("new_checkout", user.email): render_new_checkout()
else: render_old_checkout()
```
### 8. Ring / staged deployment
- Release in **rings** of growing size: Ring 0 = the team itself, Ring 1 = the whole company, Ring 2 = early adopters, Ring 3 = everyone. Microsoft uses this for Windows and Office updates.
### 9. Other variants worth knowing
| Strategy | Idea |
|---|---|
| Red-black | Netflix's name for blue-green on cloud server groups |
| Immutable / replace-instances | never patch running servers; launch fresh ones from a new image and delete the old ones (Auto Scaling groups, containers) |
| In-place | update the code on the existing servers (cheap, but harder to roll back) |
| Region-by-region | deploy to one region, wait, then the next (limits the blast radius) |
| Serverless traffic shifting | AWS Lambda aliases shift 10% then 100% to the new version (CodeDeploy Canary10Percent5Minutes / Linear10PercentEvery1Minute) |
| Rollforward (hotfix) | instead of rolling back, quickly ship a fix forward |
### Choosing a strategy
| Strategy | Downtime | Rollback speed | Extra cost | Risk to users | Best for |
|---|---|---|---|---|---|
| Recreate | yes | slow | none | all users at once | dev/test, non-critical apps |
| Rolling | no | medium | small | grows gradually | most stateless services (default) |
| Blue-green | no | instant | double servers | all at once, but instant switch back | critical apps needing instant rollback |
| Canary | no | fast | small | only the canary % | high-traffic services with good monitoring |
| A/B testing | no | fast | small | the test group | product experiments |
| Shadow | no | nothing to roll back | double compute | none | risky rewrites, ML models |
| Feature flags | no | instant (toggle) | flag system | the chosen users | releasing features gradually |
## Rollback, Safety and Zero-Downtime Checklist
- **Health checks** (readiness = ready for traffic, liveness = still alive) so traffic reaches only healthy instances.
- **Graceful shutdown**: on SIGTERM stop accepting new requests and finish the running ones (connection draining).
- **Backward-compatible database changes** (expand / contract) so old and new versions can run together and you can roll back.
- **Automatic rollback** when error-rate or latency alerts fire after a deploy; keep the previous artifact ready.
- **Deployment freeze windows** for peak days (big sale days, exam results).
- **Observability**: dashboards that show the version, so you can see "errors started with release 2.4.2".
- **Post-incident review** (blameless postmortem) and add a test so the same bug cannot return.
@flow (Deploy v2 with canary or blue-green) | Watch dashboards and alerts for 15-30 minutes | <Error rate or latency above threshold? ~ (Promote v2, keep v1 artifact for a while)> | Roll back: switch traffic to v1 / kubectl rollout undo / disable the flag | (Investigate, fix, add a test, redeploy) :: Release and rollback decision
## GitOps
- **Git is the single source of truth** for what runs in production. The desired state (Kubernetes YAML, Helm values with the image tag) lives in a Git repository; a controller (**Argo CD** or **Flux**) inside the cluster continuously compares the cluster with Git and fixes any difference.
- Deploy = merge a pull request that changes the image tag. Rollback = revert the commit. Every change is reviewed and audited.
@chain CI builds image 2.4.2 -> PR updates the tag in the config repo -> merge -> Argo CD notices -> syncs the cluster to 2.4.2 :: GitOps flow (pull-based deployment)
## CI/CD Security (DevSecOps)
| Risk | Protection |
|---|---|
| Secrets leaked in code or logs | secret scanning (gitleaks), masked secrets, OIDC short-lived cloud credentials instead of stored keys |
| Malicious or vulnerable dependency | lock files, Dependabot / Renovate, SCA scanners, pin GitHub Actions to a commit SHA |
| Tampered build | signed artifacts (Sigstore cosign), SBOM (software bill of materials), SLSA provenance |
| Over-powered pipeline token | least-privilege permissions, separate credentials per environment, protected branches and environments |
| Untrusted pull requests running with secrets | do not expose secrets to forked PR workflows |
| Insecure container images | minimal base images, Trivy / Grype scans, non-root user |
More on DevOps tools (Docker, Kubernetes, Terraform, monitoring) is in notebook 16 and on security in notebook 23.
## Interview Questions on CI/CD and Deployments
Q: What is the difference between continuous integration, continuous delivery and continuous deployment?
A: CI automatically builds and tests every merge to the main branch. Continuous delivery keeps every passing build ready to release with a manual production approval. Continuous deployment releases every passing change to production automatically.
Q: Explain blue-green deployment.
A: Two identical environments: blue serves users while the new version is deployed and tested on green; the router then switches all traffic to green. Rollback is switching back to blue, which is instant; the cost is running double infrastructure and keeping the database compatible with both versions.
Q: Explain canary deployment and how it differs from blue-green.
A: A canary sends a small, increasing percentage of real traffic to the new version while metrics are compared, so a bad release affects only a few users. Blue-green moves all traffic at once but can switch back instantly.
Q: Rolling update vs blue-green?
A: A rolling update replaces instances gradually with no extra environment, so both versions run together for a while and rollback is another rollout. Blue-green needs double capacity but gives an atomic switch and instant rollback.
Q: Canary vs A/B testing?
A: Canary checks technical safety (errors, latency) for a short period before going to 100%; A/B testing is a longer experiment comparing business metrics between user groups to choose the better version.
Q: What is a shadow deployment?
A: The new version receives a copy of live traffic but its responses are discarded, so you can compare behaviour and performance with zero user impact; side effects must be disabled.
Q: What are feature flags and why use them?
A: Runtime switches that turn code paths on or off without redeploying; they separate deployment from release, enable gradual rollouts and give an instant kill switch.
Q: How do you achieve zero-downtime deployments?
A: Multiple instances behind a load balancer, readiness and liveness probes, rolling / blue-green / canary strategies, graceful shutdown with connection draining, and backward-compatible database migrations.
Q: How do you handle database migrations in CI/CD?
A: Version-controlled migrations run by the pipeline using expand-and-contract: add new structures first, deploy code that works with both, migrate data, and remove old structures in a later release so rollback stays possible.
Q: Why "build once, deploy many"?
A: Promoting the exact same immutable artifact through environments guarantees that what reaches production is what was tested; rebuilding could pull different dependencies.
Q: How do you roll back a bad deployment?
A: Switch traffic back (blue-green), set the canary weight to 0, run kubectl rollout undo, disable the feature flag, or revert the GitOps commit - and automate it based on alerts.
Q: What is GitOps?
A: Managing deployments by storing the desired state in Git and letting a controller such as Argo CD or Flux continuously reconcile the cluster with it; deploys and rollbacks are pull requests and reverts.
Q: How do you keep secrets safe in a pipeline?
A: Store them in the CI secret store or a vault, prefer OIDC short-lived credentials, never print them, scope them per environment and require approvals for production.
Q: A deployment passed all tests but production errors spiked. What do you do?
A: Roll back first to restore service, communicate, then investigate with logs, metrics and traces; add the missing test or check to the pipeline and write a blameless postmortem.
