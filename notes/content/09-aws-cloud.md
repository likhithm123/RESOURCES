# AWS Cloud - Core Services, Architecture and Hands-on
Amazon Web Services is the largest cloud platform. This notebook explains cloud basics, then every core service (IAM, EC2, S3, VPC, RDS, DynamoDB, Lambda, ECS/EKS, API Gateway, SQS/SNS, CloudWatch...), how they fit together in real architectures, cost, security, the Well-Architected Framework, CLI/Terraform examples and interview questions.
## Cloud Computing Basics
- **Cloud computing** = renting computing resources (servers, storage, databases, AI) over the internet, paying only for what you use, instead of buying and running your own data centre.
- Benefits: no upfront hardware cost, scale in minutes, global reach, managed services, high availability.
| Model | You manage | Provider manages | Examples |
|---|---|---|---|
| IaaS | OS, runtime, app, data | hardware, network, virtualisation | EC2, VPC, EBS |
| PaaS | app and data | everything below | Elastic Beanstalk, App Runner, RDS |
| SaaS | only usage | everything | Gmail, Salesforce |
| FaaS / serverless | function code | servers, scaling | Lambda |
- Deployment models: public cloud, private cloud, hybrid, multi-cloud.
- **Shared responsibility model**: AWS secures the cloud (data centres, hardware, hypervisor); you secure what is **in** the cloud (IAM, data, OS patches on EC2, security groups, encryption).
## AWS Global Infrastructure
- **Region**: a geographic area (ap-south-1 = Mumbai, us-east-1 = N. Virginia) with 3+ **Availability Zones** (AZs) = separate data centres with independent power and network, connected by low-latency links.
- **Edge locations**: 400+ points of presence for CloudFront CDN and Route 53.
- Choose a region by: latency to users, data residency laws, service availability, price.
@layers Region ap-south-1 | AZ a, AZ b, AZ c | Edge locations (CloudFront) :: Deploy across at least 2 AZs for high availability
## IAM - Identity and Access Management
- **Users** (people), **groups** (collections of users), **roles** (identities assumed by services or federated users - temporary credentials), **policies** (JSON permissions).
- Principle of **least privilege**: grant only what is needed. Enable **MFA**, never use the root account for daily work, never put access keys in code (use roles).
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:GetObject", "s3:PutObject"],
    "Resource": "arn:aws:s3:::my-app-uploads/*",
    "Condition": { "IpAddress": { "aws:SourceIp": "203.0.113.0/24" } }
  }]
}
```
- Evaluation: an explicit **Deny** always wins; otherwise access needs an explicit Allow. Policy types: identity-based, resource-based (bucket policy), permission boundaries, SCPs (AWS Organizations), session policies.
- **STS** issues temporary credentials (AssumeRole). **IAM Identity Center** (SSO) for workforce logins. **Cognito** for your app's end users.
## Compute
### EC2 (Elastic Compute Cloud)
- Virtual servers. Pick an **AMI** (OS image), **instance type** (family + size: t3.micro, m7i.large, c7g (Graviton ARM), r7 (memory), g5/p5 (GPU)), storage (EBS), network (VPC subnet, security group), key pair.
| Pricing | Use |
|---|---|
| On-Demand | pay per second, no commitment |
| Savings Plans / Reserved | 1-3 year commitment, up to ~72% off |
| Spot | spare capacity, up to 90% off, can be interrupted - batch, CI, ML training |
| Dedicated Hosts | licensing / compliance |
- **User data** script runs at first boot. **Instance metadata** (169.254.169.254, use IMDSv2) gives role credentials.
- **Auto Scaling Group** (ASG): keeps N healthy instances, scales on CPU/requests/schedule across AZs using a launch template.
- **Elastic Load Balancing**: ALB (HTTP/HTTPS layer 7, path/host routing), NLB (TCP/UDP layer 4, ultra-low latency, static IP), GWLB (appliances).
@layers Users | Route 53 (DNS) | Application Load Balancer | EC2 in AZ a, EC2 in AZ b (Auto Scaling Group) | RDS primary (AZ a), RDS standby (AZ b) :: Classic highly available web app
```sh
#!/bin/bash
# EC2 user data: install and start a web server
dnf install -y nginx
echo "<h1>Hello from $(hostname)</h1>" > /usr/share/nginx/html/index.html
systemctl enable --now nginx
```
### Lambda (serverless functions)
- Upload code; AWS runs it on events (API Gateway request, S3 upload, SQS message, schedule). Pay per request and per ms of compute. Scales automatically to thousands of parallel executions.
- Limits: 15 min max run time, up to 10 GB memory, /tmp up to 10 GB. **Cold start** = latency when a new execution environment starts (mitigate with provisioned concurrency, smaller packages, SnapStart for Java).
```py
import json, boto3
s3 = boto3.client("s3")
def handler(event, context):
    # triggered by an S3 upload: make a thumbnail record
    for rec in event["Records"]:
        bucket = rec["s3"]["bucket"]["name"]; key = rec["s3"]["object"]["key"]
        print(f"new file s3://{bucket}/{key}")
    return {"statusCode": 200, "body": json.dumps({"ok": True})}
```
### Containers: ECS, EKS, Fargate, ECR, App Runner
- **ECR**: private Docker image registry. **ECS**: AWS's container orchestrator (tasks and services). **EKS**: managed Kubernetes. **Fargate**: serverless compute for ECS/EKS - no EC2 to manage. **App Runner**: deploy a container/web app from source with auto scaling, simplest option.
- **Elastic Beanstalk**: PaaS that provisions EC2 + ALB + ASG for your code. **Lightsail**: simple VPS.
## Storage
### S3 (Simple Storage Service)
- Object storage: files (**objects**, up to 5 TB) in **buckets** with keys. 11 nines (99.999999999%) durability by storing copies across AZs. Strong read-after-write consistency.
| Storage class | Use |
|---|---|
| Standard | frequent access |
| Intelligent-Tiering | unknown patterns, auto moves |
| Standard-IA / One Zone-IA | infrequent access, cheaper storage, retrieval fee |
| Glacier Instant / Flexible / Deep Archive | archives: ms / minutes-hours / 12 hours |
- Features: versioning, lifecycle rules (move to Glacier after 90 days, delete after 1 year), replication (cross-region), encryption (SSE-S3, SSE-KMS), **Block Public Access**, bucket policies, **presigned URLs** (temporary upload/download links), static website hosting, event notifications, S3 Select, Object Lock (WORM).
```sh
aws s3 mb s3://my-app-uploads-2026
aws s3 cp report.pdf s3://my-app-uploads-2026/reports/
aws s3 sync ./site s3://my-site-bucket --delete
aws s3 presign s3://my-app-uploads-2026/reports/report.pdf --expires-in 600
```
```py
url = boto3.client("s3").generate_presigned_url("put_object", Params={"Bucket": "my-app-uploads-2026", "Key": "avatars/7.png"}, ExpiresIn=300)
# browser uploads directly to S3 with this URL - your server never handles the file bytes
```
### EBS, EFS, FSx, Storage Gateway
| Service | Type | Notes |
|---|---|---|
| EBS | block disk for one EC2 (one AZ) | gp3 (general), io2 (high IOPS), snapshots to S3 |
| Instance store | temporary local disk | lost on stop |
| EFS | shared NFS file system across AZs | many EC2/containers at once, auto grows |
| FSx | Windows File Server, Lustre (HPC/ML), NetApp ONTAP | specialised file systems |
| Storage Gateway / Snowball / DataSync | hybrid and bulk transfer | move on-prem data |
## Networking
### VPC (Virtual Private Cloud)
- Your private network in a region, with a CIDR block (e.g. 10.0.0.0/16 = 65,536 addresses). Split into **subnets** per AZ.
- **Public subnet**: route table sends 0.0.0.0/0 to an **Internet Gateway**. **Private subnet**: no direct internet; outbound via a **NAT Gateway** in a public subnet.
@layers Internet | Internet Gateway | Public subnet: ALB, NAT Gateway, bastion | Private subnet: app servers (EC2 / ECS) | Private DB subnet: RDS, ElastiCache :: Three-tier VPC across 2 AZs
| Security Group | Network ACL |
|---|---|
| instance/ENI level | subnet level |
| stateful (return traffic allowed automatically) | stateless (allow both directions) |
| allow rules only | allow and deny rules, ordered |
| e.g. DB SG allows 5432 only from App SG | e.g. block a bad IP range |
- Connectivity: **VPC peering** (two VPCs), **Transit Gateway** (hub for many VPCs + on-prem), **Site-to-Site VPN**, **Direct Connect** (dedicated fibre), **VPC endpoints / PrivateLink** (reach S3, DynamoDB or other services privately without the internet), **Flow Logs** (traffic logs).
### Route 53 and CloudFront
- **Route 53**: DNS + domain registration + health checks. Routing policies: simple, weighted (A/B, canary), latency-based, failover, geolocation, geoproximity, multivalue. Alias records to ALB/CloudFront/S3.
- **CloudFront**: CDN caching content at edge locations; HTTPS with ACM certificates; origins S3 (with Origin Access Control), ALB, any HTTP server; Lambda@Edge / CloudFront Functions for edge logic; **WAF** and **Shield** for protection.
- **Global Accelerator**: anycast static IPs routing over the AWS backbone.
## Databases
| Service | Type | Use |
|---|---|---|
| RDS | managed MySQL, PostgreSQL, MariaDB, Oracle, SQL Server | OLTP apps |
| Aurora | AWS-built MySQL/PostgreSQL compatible, 6 copies over 3 AZs, up to 15 replicas, Serverless v2 | high-performance relational |
| DynamoDB | key-value/document, serverless, ms latency | massive scale, sessions, carts (notebook 06) |
| ElastiCache / MemoryDB | Redis / Valkey / Memcached | caching, leaderboards |
| DocumentDB | MongoDB-compatible | documents |
| Neptune | graph | relationships, fraud |
| Keyspaces | Cassandra-compatible | wide-column |
| Timestream | time series | IoT metrics |
| Redshift | data warehouse (columnar, MPP) | analytics, BI |
| OpenSearch | search and log analytics | full-text, dashboards |
- **RDS Multi-AZ**: synchronous standby in another AZ, automatic failover (availability). **Read replicas**: asynchronous copies for scaling reads (can be cross-region). Automated backups + point-in-time recovery, snapshots, encryption with KMS, **RDS Proxy** for connection pooling (Lambda).
## Application Integration
| Service | Pattern | Example |
|---|---|---|
| SQS | queue (point-to-point), at-least-once; FIFO queues for order + exactly-once processing | order -> worker |
| SNS | pub/sub fan-out to many subscribers (SQS, Lambda, email, SMS) | "order placed" to email + inventory + analytics |
| EventBridge | event bus with rules, schedules, SaaS events | route events by content |
| Step Functions | workflow orchestration (state machine) | multi-step order saga with retries |
| Kinesis Data Streams / Firehose | real-time streaming / delivery to S3/Redshift | clickstream |
| MSK | managed Kafka | event streaming (notebook 12) |
| API Gateway | REST/HTTP/WebSocket APIs in front of Lambda or services; auth, throttling, keys | serverless API |
| AppSync | managed GraphQL | mobile apps |
@chain Order service -> SNS topic -> SQS email queue / SQS inventory queue / Lambda analytics :: Fan-out: one event, many independent consumers
- SQS concepts: visibility timeout (message hidden while a consumer works), dead-letter queue after N failed attempts, long polling, max message 256 KB (store big payloads in S3).
## Monitoring, Logging and Management
- **CloudWatch**: metrics (CPU, latency, custom metrics), logs (Logs Insights queries), alarms (-> SNS / Auto Scaling), dashboards, Synthetics, Container Insights.
- **CloudTrail**: who did what API call, when, from where - audit and security investigations.
- **AWS Config**: resource configuration history and compliance rules. **X-Ray**: distributed tracing. **Systems Manager**: Session Manager (shell without SSH/bastion), Parameter Store, patching, Run Command.
- **CloudFormation / CDK / Terraform**: infrastructure as code. **Trusted Advisor**, **Compute Optimizer**, **Cost Explorer**, **Budgets**.
## Security Services
| Service | Purpose |
|---|---|
| KMS | managed encryption keys (envelope encryption) |
| Secrets Manager | store and rotate DB passwords, API keys |
| ACM | free TLS certificates |
| WAF | block SQL injection, XSS, bad bots, rate limits |
| Shield | DDoS protection (Standard free, Advanced paid) |
| GuardDuty | threat detection from logs |
| Inspector | vulnerability scanning of EC2, containers, Lambda |
| Macie | find sensitive data (PII) in S3 |
| Security Hub | central security findings |
| Cognito | user sign-up/sign-in, OAuth/OIDC for apps |
## AI and Data Services on AWS
- **Amazon Bedrock**: API access to foundation models (Anthropic Claude, Llama, Mistral, Amazon Nova, Titan embeddings), Knowledge Bases (managed RAG), Agents, Guardrails.
- **SageMaker AI**: build, train, tune, deploy and monitor ML models (notebooks, training jobs, endpoints, pipelines, feature store).
- Ready-made AI: Rekognition (images), Textract (documents), Transcribe (speech-to-text), Polly (text-to-speech), Translate, Comprehend (NLP), Lex (chatbots), Personalize, Forecast, Kendra / Q Business.
- Data/analytics: **Glue** (ETL + data catalog), **Athena** (SQL on S3), **EMR** (Spark/Hadoop), **Lake Formation**, **QuickSight** (BI), Redshift, Kinesis, MSK.
@chain S3 data lake -> Glue crawler + catalog -> Athena SQL / Redshift -> QuickSight dashboard :: Serverless analytics pipeline
## Reference Architectures
### Serverless REST API
@chain Client -> CloudFront -> API Gateway -> Lambda -> DynamoDB :: Cognito for auth, CloudWatch for logs, S3 for files
### Containerised microservices
@layers Route 53 + CloudFront + WAF | ALB | ECS Fargate services: users, orders, payments | RDS Aurora, ElastiCache Redis, SQS + SNS, S3 :: Microservices on ECS
### Static website / SPA
- React build in S3 (private) + CloudFront (OAC) + ACM certificate + Route 53 alias. Backend via API Gateway + Lambda.
### Event-driven image processing
@chain User uploads via presigned URL -> S3 bucket -> S3 event -> Lambda resize -> S3 thumbnails + DynamoDB metadata :: Event-driven pipeline
### High availability and disaster recovery
| Strategy | RTO / RPO | Cost |
|---|---|---|
| Backup and restore | hours | lowest |
| Pilot light (core DB replicated) | tens of minutes | low |
| Warm standby (scaled-down copy running) | minutes | medium |
| Multi-site active-active | near zero | highest |
- **RTO** = how long recovery may take. **RPO** = how much data loss (time) is acceptable.
## Well-Architected Framework (6 pillars)
| Pillar | Key practices |
|---|---|
| Operational excellence | IaC, small reversible changes, runbooks, observability |
| Security | least privilege, encryption at rest and in transit, traceability, defence in depth |
| Reliability | multi-AZ, auto healing, backups, test recovery, handle quotas |
| Performance efficiency | right service and instance type, serverless, caching, go global |
| Cost optimisation | right-size, Savings Plans/Spot, auto scaling, delete idle resources, S3 lifecycle |
| Sustainability | efficient instances (Graviton), managed services, reduce waste |
## Hands-on: AWS CLI and Terraform
```sh
aws configure                                  # or SSO: aws configure sso
aws sts get-caller-identity                     # who am I
aws ec2 describe-instances --query "Reservations[].Instances[].{id:InstanceId,state:State.Name}" --output table
aws ec2 run-instances --image-id ami-xxxx --instance-type t3.micro --key-name mykey --security-group-ids sg-xxxx --subnet-id subnet-xxxx
aws logs tail /aws/lambda/my-fn --follow
aws lambda invoke --function-name my-fn --payload '{}' out.json
```
```txt
# main.tf - Terraform: S3 bucket + EC2 instance
provider "aws" { region = "ap-south-1" }
resource "aws_s3_bucket" "uploads" { bucket = "my-app-uploads-2026" }
resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  block_public_acls = true
  block_public_policy = true
  ignore_public_acls = true
  restrict_public_buckets = true
}
resource "aws_instance" "web" {
  ami           = "ami-0abcdef1234567890"
  instance_type = "t3.micro"
  tags          = { Name = "web-1" }
}
output "web_ip" { value = aws_instance.web.public_ip }
```
```sh
terraform init && terraform plan && terraform apply
```
## Cost Basics
- Main cost drivers: compute hours, data transfer **out** to the internet and cross-AZ, storage, NAT Gateway processing, idle resources.
- Free tier for learning; set an **AWS Budget** alert first; tag resources (team, env) for cost allocation; stop dev instances at night.
## Certifications Path
- Cloud Practitioner (foundation) -> Solutions Architect Associate (most valuable) -> Developer / SysOps Associate -> Solutions Architect Professional / DevOps Engineer Professional. Specialty: Security, Machine Learning, Data Engineer, AI Practitioner.
## AWS Interview Questions
Q: What is the difference between a region and an availability zone?
A: A region is a geographic area; AZs are isolated data centres within it. Deploy across multiple AZs for high availability and multiple regions for disaster recovery or latency.
Q: Security group vs NACL?
A: Security groups are stateful, instance-level, allow-only; NACLs are stateless, subnet-level, with ordered allow and deny rules.
Q: How do you make a private EC2 instance download updates?
A: Route its private subnet's 0.0.0.0/0 to a NAT Gateway in a public subnet (or use VPC endpoints for AWS services).
Q: How do you give an EC2 instance access to S3 securely?
A: Attach an IAM role (instance profile) with a least-privilege policy; the SDK picks up temporary credentials - never store access keys on the instance.
Q: S3 storage classes and lifecycle?
A: Standard, Intelligent-Tiering, IA, Glacier tiers; lifecycle rules transition objects to cheaper classes or expire them automatically.
Q: RDS Multi-AZ vs read replica?
A: Multi-AZ is a synchronous standby for automatic failover (availability); read replicas are asynchronous copies for read scaling.
Q: SQS vs SNS vs EventBridge vs Kinesis?
A: SQS queues work for one consumer group; SNS fans out push notifications; EventBridge routes events by rules across services/SaaS; Kinesis is an ordered, replayable stream for real-time analytics.
Q: When would you choose Lambda vs ECS/Fargate vs EC2?
A: Lambda for event-driven, spiky, short tasks; Fargate for long-running containers without managing servers; EC2 for full control, special hardware (GPU), or steady high utilisation where reserved pricing is cheapest.
Q: How do you secure secrets?
A: Secrets Manager or SSM Parameter Store (encrypted with KMS), fetched at runtime via IAM role; rotate regularly; never commit to Git.
Q: How would you design for 99.99% availability?
A: Multi-AZ everything (ALB, ASG, Aurora), health checks and auto healing, no single points of failure, backups and tested DR (possibly multi-region active-passive with Route 53 failover), and monitoring with alarms.
Q: How do you reduce an AWS bill?
A: Right-size instances, Savings Plans/Reserved for steady load, Spot for batch, auto scaling, shut down idle/dev resources, S3 lifecycle, reduce NAT and cross-AZ data transfer, use CloudFront, review Cost Explorer.
Q: What is the shared responsibility model?
A: AWS secures the infrastructure; customers secure their data, identities, configurations, network rules and guest OS.
Q: How does an ALB differ from an NLB?
A: ALB works at layer 7 with HTTP routing rules, WebSockets and WAF; NLB works at layer 4 with millions of requests/sec, static IPs and TLS passthrough.
Q: What is a presigned URL?
A: A time-limited URL signed with your credentials that lets a client upload or download one S3 object without AWS credentials.
