# DevOps: Docker, Kubernetes, Terraform
This notebook provides a complete visual and conceptual guide to modern cloud-native DevOps: containerization with Docker, orchestration and internal architecture with Kubernetes, and declarative Infrastructure as Code (IaC) with Terraform.
## Docker and Containerization Fundamentals
- **The Problem:** "It works on my machine" happens because production has a different OS version, missing libraries, or different runtime versions.
- **The Solution:** A **container** packages application code, runtime, system tools, and libraries together into an isolated, reproducible, lightweight unit.

### Virtual Machines vs Containers
- A **Virtual Machine (VM)** virtualizes physical hardware via a Hypervisor. Each VM runs a full guest operating system (several GBs, minutes to boot).
- A **Container** virtualizes the OS kernel. All containers share the host Linux kernel, isolating user space via two native Linux kernel features:
  - **Namespaces:** Provide isolation (PID = processes, NET = networking/ports, MNT = filesystem mounts, IPC = inter-process comms, UTS = hostname).
  - **cgroups (Control Groups):** Enforce resource constraints (max CPU, memory limit, disk I/O, network bandwidth).
@layers Hypervisor (Type 1 or 2) | Guest OS A (GBs) + App A | Guest OS B (GBs) + App B :: Virtual Machines: Heavy, separate OS per VM
@layers Host Linux Kernel (Namespaces + cgroups) | Container A (MBs, App + Libs) | Container B (MBs, App + Libs) :: Containers: Light, shared kernel, instant boot

### Docker Engine Architecture
- Docker is composed of three decoupled layers:
  1. **Docker CLI:** The client user interface (`docker build`, `docker run`). Talks via REST API / Unix socket to the daemon.
  2. **dockerd (Docker Daemon):** Manages images, containers, networks, and storage volumes.
  3. **containerd & runc:** Industry-standard OCI (Open Container Initiative) runtime that actually communicates with the Linux kernel to instantiate containers.
@flow /docker run -d -p 80:80 nginx/ | [Docker Client (CLI)] | [Docker Daemon (dockerd)] | [containerd] | [runc creates namespaces + cgroups] | (Container Running) :: Docker Runtime Execution Path

### Dockerfile and Layer Caching
- Each instruction in a `Dockerfile` (`FROM`, `COPY`, `RUN`) creates an **immutable read-only layer**.
- When rebuilding, Docker reuses unchanged layers from cache. Put frequently changed files (`COPY . .`) at the bottom, and rarely changed dependencies (`npm install`, `pip install`) at the top.
@layers Base Image (e.g. alpine:3.19 - 5MB) | System Dependencies (libpq, curl - 15MB) | Package Dependencies (node_modules - 80MB) | Application Source Code (src/ - 2MB) | Container Read-Write Layer (Logs, Temp files) :: Docker Image Stacking: Read-only cached layers + thin writable top layer

### Multi-Stage Builds
- Compilers, SDKs, and build tools (e.g. Go compiler, Maven, npm devDependencies) are needed to compile code, but bloated and insecure in production.
- **Multi-stage builds** use temporary build stages and copy only the final compiled artifact into a minimal production base image (like Alpine or Distroless).
```dockerfile
# Stage 1: Build & Compile
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server .

# Stage 2: Minimal Production Image (under 15MB!)
FROM gcr.io/distroless/static-debian12:nonroot
WORKDIR /
COPY --from=builder /app/server /server
EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["/server"]
```

## Kubernetes Architecture & Cluster Internals
- Kubernetes (K8s) is a production-grade container orchestration system. It automates container deployment, scaling, failover, service discovery, and rolling upgrades across a cluster of machines.
- A cluster consists of two distinct roles: **Control Plane (Master)** and **Worker Nodes**.

@layers [API Server (REST Gatekeeper)] | [etcd (Distributed State Store)] , [Scheduler (Node Placement)] , [Controller Manager (State Reconciler)] :: Kubernetes Control Plane: Desired State Management
@layers [kubelet (Node Agent)] , [kube-proxy (iptables / IPVS router)] , [Container Runtime (containerd)] | Pod 1 (App Container) | Pod 2 (App + Sidecar) :: Kubernetes Worker Node: Workload Execution

### Control Plane Components
| Component | Role and Functionality |
|---|---|
| **kube-apiserver** | The central nervous system and entry point. Exposes the Kubernetes REST API. Authenticates, authorizes, and validates all requests; only component that writes directly to etcd. |
| **etcd** | Highly available, consistent distributed key-value store (using Raft consensus). Holds the entire cluster state, specifications, secrets, and configurations. |
| **kube-scheduler** | Watches for unassigned pods and selects the optimal worker node based on resource requirements (CPU/RAM), affinity rules, taints/tolerations, and node health. |
| **kube-controller-manager** | Continuously runs reconciliation loops comparing **Current State** with **Desired State** (DeploymentController, NodeController, JobController, EndpointSliceController). |
| **cloud-controller-manager** | Integrates cluster with cloud provider APIs to manage cloud load balancers, volumes, and node IP addresses. |

### Worker Node Components
| Component | Role and Functionality |
|---|---|
| **kubelet** | The primary agent on every worker node. Receives `PodSpec` objects from the API Server and ensures described containers are created, healthy, and running via the CRI. |
| **kube-proxy** | Manages network rules on each node (via Linux `iptables` or `IPVS`). Directs traffic destined for a Service IP (ClusterIP) to the correct backend Pod IP. |
| **Container Runtime** | The CRI-compliant software (`containerd`, `CRI-O`) that downloads images, creates namespaces, mounts volumes, and starts/stops containers. |

## Pods and the Pod Lifecycle
- A **Pod** is the smallest deployable computing unit in Kubernetes.
- A Pod encapsulates one or more closely coupled containers that share:
  1. The same **Network Namespace:** They share an IP address and can talk to each other over `localhost:PORT`.
  2. The same **Storage Volumes:** Can share filesystems and temporary disks.
- **Sidecar Pattern:** A helper container running alongside the main application container (e.g. Envoy proxy for service mesh, FluentBit for log shipping, or Vault agent for secret rotation).

### End-to-End Pod Creation Flow
@flow /User runs kubectl apply -f pod.yaml/ | [API Server validates YAML & writes to etcd] | [Scheduler notices unscheduled pod & selects Node 2] | [API Server updates etcd with node assignment] | [Kubelet on Node 2 watches API Server & detects assignment] | [Kubelet calls containerd (CRI) to pull image & start pod] | [Kubelet reports Pod Running status to API Server] | (Pod Running & Healthy) :: Complete Lifecycle: From kubectl apply to Running Pod

### Pod Lifecycle Phases & Health Probes
@chain Pending (Scheduled / Pulling image) -> ContainerCreating -> Running -> Succeeded (Jobs) or Failed (CrashLoopBackOff) :: Pod Lifecycle Phases
- Kubernetes monitors container health using three types of **probes**:
  - **startupProbe:** Disables liveness and readiness checks until app completes initial startup (essential for slow legacy apps).
  - **readinessProbe:** Checks if app is ready to receive network traffic. If failing, Kubernetes removes the pod from Service endpoints so users never hit an unready pod.
  - **livenessProbe:** Checks if app is still alive. If failing, kubelet kills the container and restarts it according to the `restartPolicy`.

```yaml
# Pod with health probes and resource limits
apiVersion: v1
kind: Pod
metadata:
  name: web-api
  labels: { app: web-api }
spec:
  containers:
  - name: api
    image: myrepo/web-api:v1.2
    resources:
      requests: { cpu: "100m", memory: "128Mi" } # Guaranteed minimum
      limits: { cpu: "500m", memory: "512Mi" }   # Cap (Throttled on CPU, OOMKilled on RAM)
    readinessProbe:
      httpGet: { path: /healthz, port: 8080 }
      initialDelaySeconds: 5
      periodSeconds: 10
    livenessProbe:
      httpGet: { path: /live, port: 8080 }
      periodSeconds: 15
```

## Workload Controllers: Deployments, ReplicaSets, StatefulSets
- Raw Pods are mortal: if a node crashes, a raw Pod is lost forever. Workload controllers provide self-healing, declarative scaling, and zero-downtime updates.

### Controller Hierarchy
@layers Deployment: Declarative updates & rollbacks | ReplicaSet: Guarantees exact number of identical pod replicas | Pod 1 , Pod 2 , Pod 3 :: Kubernetes Workload Hierarchy

### Zero-Downtime Rolling Update Strategy
- When updating an image from `v1` to `v2`, a Deployment creates a new ReplicaSet and gradually replaces pods without dropping traffic:
  - `maxSurge` (e.g. 25%): Max pods allowed above desired replica count during rollout.
  - `maxUnavailable` (e.g. 0%): Max pods that can be offline during rollout (0 = 100% availability).
@flow [3 Pods Running v1 (100% capacity)] | [Create new v2 Pod (Surge to 4 pods)] | <v2 Pod passes readiness probe? ~ Wait> | [Terminate one v1 Pod (Back to 3 pods)] | [Repeat until all replicas run v2] | (Rollout Complete: 3 Pods running v2) :: Zero-Downtime Rolling Update Flow

### Other Workload Types
- **StatefulSet:** For stateful workloads (Kafka, PostgreSQL, Cassandra, Elasticsearch). Provides:
  - Stable, unique network identity (`web-0`, `web-1`, `web-2` via Headless Service).
  - Dedicated PersistentVolumeClaim per replica that persists across pod restarts and rescheduling.
  - Ordered, graceful deployment and termination (starts `0 -> 1 -> 2`, terminates `2 -> 1 -> 0`).
- **DaemonSet:** Runs exactly one copy of a Pod on every node in the cluster (or nodes matching nodeSelectors). Ideal for cluster infrastructure:
  - Log collectors: Fluentd, FluentBit.
  - Node monitoring agents: Prometheus `node-exporter`, Datadog agent.
  - Networking plugins: Calico, Cilium, kube-proxy.
- **Job & CronJob:** Run batch workloads to completion (data migrations, nightly backup scripts).

## Kubernetes Networking: Services and Ingress
- **Pod Networking Rule:** In Kubernetes, every Pod gets its own unique IP address across the entire cluster. Pods can communicate with any other Pod without NAT (using CNI plugins like Calico, Cilium, AWS VPC CNI).
- **The Problem:** Pod IPs are ephemeral (change whenever a pod dies or scales).
- **The Solution:** A **Service** provides a stable virtual IP (ClusterIP) and DNS name (`my-service.namespace.svc.cluster.local`) that load balances traffic across healthy backend pods matching its `selector` labels.

### Service Types
| Type | Scope | How It Works |
|---|---|---|
| **ClusterIP** | Internal only (Default) | Allocates a virtual cluster-internal IP accessible only within the cluster. |
| **NodePort** | External access | Exposes the Service on a static high port (`30000-32767`) on every worker node's physical IP. |
| **LoadBalancer** | External access | Provisions a cloud provider external load balancer (AWS NLB/ALB, GCP LB) that routes to NodePorts. |
| **ExternalName** | Outbound | Maps a K8s service to an external DNS CNAME (e.g. external RDS database). |

### Traffic Flow: External Client to Ingress to Pods
- **Ingress Controller:** A production reverse proxy (e.g. Nginx Ingress, Traefik, AWS ALB Controller) that routes external HTTP/HTTPS traffic based on Host headers and URL paths, terminating TLS at the edge.
@layers Internet User (https://api.myapp.com/users) | Ingress Controller (L7 Routing & TLS Termination) | Service: user-svc (ClusterIP 10.96.0.45) | Pod A (10.244.1.12) , Pod B (10.244.2.8) :: Complete Networking Path: External Internet -> Ingress -> ClusterIP Service -> Pod Endpoints

```yaml
# Ingress routing rules
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  tls:
  - hosts: [api.myapp.com]
    secretName: api-tls-cert
  rules:
  - host: api.myapp.com
    http:
      paths:
      - path: /users
        pathType: Prefix
        backend:
          service:
            name: user-service
            port: { number: 8080 }
```

## Kubernetes Storage: Volumes, PV, PVC, and StorageClass
- Container filesystems are ephemeral: when a container restarts, modifications are wiped.
- Kubernetes abstracts storage through a decoupled three-tier model:
  1. **StorageClass (SC):** Defines the storage provider and provisioner (e.g. AWS EBS gp3, GCP Persistent Disk, NFS) and volume parameters.
  2. **PersistentVolume (PV):** An actual storage disk in the cluster provisioned by an administrator or dynamically created by the StorageClass.
  3. **PersistentVolumeClaim (PVC):** A developer's request for storage (e.g. "I need 50Gi ReadWriteOnce storage").
@chain Pod references PVC -> PVC matches & binds to PV -> StorageClass dynamically creates cloud EBS disk :: Dynamic Volume Provisioning Flow

| Access Mode | Meaning |
|---|---|
| `ReadWriteOnce` (RWO) | Can be mounted as read-write by a single node (standard block storage like AWS EBS). |
| `ReadOnlyMany` (ROX) | Can be mounted read-only by many nodes simultaneously. |
| `ReadWriteMany` (RWX) | Can be mounted as read-write by many nodes at once (file storage like NFS, AWS EFS). |

## Security, Configuration, and Cluster Governance
### ConfigMaps and Secrets
- Decouple configuration artifacts from container image binaries:
  - **ConfigMap:** Plaintext configuration files, JSON configs, environment variables (`kubectl create configmap`).
  - **Secret:** Encrypted or base64-encoded confidential credentials, tokens, TLS certificates, and database passwords.
  - Can be injected as environment variables or mounted as read-only files inside pods.

### Role-Based Access Control (RBAC)
- Controls who can perform what actions on which resources:
  - **Role / ClusterRole:** Defines rules (e.g. `verbs: ["get", "list", "watch"]` on `resources: ["pods", "deployments"]`).
  - **RoleBinding / ClusterRoleBinding:** Attaches a Role to a User, Group, or ServiceAccount.
  - *ClusterRole* applies across the whole cluster; *Role* is scoped to a single namespace.

### NetworkPolicies (Zero Trust Pod Networking)
- By default, Kubernetes pods accept traffic from any source. A **NetworkPolicy** acts as an internal firewall (enforced by CNI):
```yaml
# Only allow frontend pods to reach backend on port 5432
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-db
  namespace: prod
spec:
  podSelector: { matchLabels: { role: database } }
  policyTypes: [Ingress]
  ingress:
  - from:
    - podSelector: { matchLabels: { role: frontend } }
    ports:
    - protocol: TCP
      port: 5432
```

## Infrastructure as Code (IaC) with Terraform
- **What is IaC?** Managing and provisioning infrastructure (VPCs, subnets, Kubernetes clusters, databases) through machine-readable definition files rather than manual web console clicks.
- **Why Terraform?** Multi-cloud declarative configuration (HCL - HashiCorp Configuration Language), cloud agnostic, state-driven, and idempotent.

### The Terraform Core Workflow
@flow /Write declarative infrastructure (.tf files)/ | [terraform init (Download cloud provider plugins)] | [terraform plan (Dry run: calculate diff against state)] | <Review plan: accurate? ~ Modify code> | [terraform apply (Execute cloud API calls)] | (State updated in terraform.tfstate) :: The Terraform Core Lifecycle

### Terraform State Management
- `terraform.tfstate` tracks real-world resource IDs and metadata mapped to your code.
- **Remote State with Locking:** In enterprise teams, never commit state to Git. Store state remotely in **AWS S3** with **DynamoDB state locking** to prevent race conditions (two engineers applying simultaneously).
```hcl
# backend.tf - Remote state with DynamoDB state locking
terraform {
  required_version = ">= 1.7.0"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.40" }
  }
  backend "s3" {
    bucket         = "mycompany-terraform-state-prod"
    key            = "k8s-cluster/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-lock-table"
    encrypt        = true
  }
}
```

### Essential Terraform Commands
| Command | Action and Purpose |
|---|---|
| `terraform init` | Initializes working directory, downloads required provider plugins and child modules. |
| `terraform fmt -check` | Scans and enforces standard formatting across all `.tf` files. |
| `terraform validate` | Verifies syntax and internal consistency of configurations without calling cloud APIs. |
| `terraform plan -out=tfplan` | Creates an execution plan; compares current state with real-world infrastructure and outlines additions (+), modifications (~), and destructions (-). |
| `terraform apply tfplan` | Applies the exact planned changes against cloud infrastructure. |
| `terraform destroy` | Tears down all managed infrastructure defined in the workspace. |
