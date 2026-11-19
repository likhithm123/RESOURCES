# Microsoft Azure: Cloud Architecture, Compute & Security
A comprehensive engineering notebook on Microsoft Azure cloud infrastructure, resource hierarchy, compute services, Virtual Networks, Entra ID (Azure AD), storage tiers, and DevOps pipelines.

## Azure Resource Hierarchy & Management
- Azure organizes cloud assets in a rigid 4-tier management tree to ensure centralized governance, access control (RBAC), and billing visibility.
- **Non-Technical Real-Life Analogy (International Hotel Chain):**
  - **Management Groups (Corporate HQ):** Sets corporate policy across all hotel branches (e.g., "All hotels must have fire sprinklers" = "All databases must enforce encryption-at-rest").
  - **Subscriptions (Individual Hotel Building):** Each building receives its own electricity bill and operational license.
  - **Resource Groups (Hotel Floors):** Floor 3 is the Kitchen; Floor 4 is Guest Suites. All appliances on Floor 3 share a common lifecycle (if you renovate the kitchen, you can clear the entire floor together).
  - **Resources (Appliances / Rooms):** The refrigerator, stove, and dishwasher (VMs, SQL Databases, Storage Accounts).

@tree [Root Management Group] -> [Production Management Group, Staging Management Group] ; [Production Management Group] -> [Core Billing Subscription] ; [Core Billing Subscription] -> [Networking-RG, Compute-RG, Database-RG] ; [Compute-RG] -> [Azure App Service, AKS Cluster, Azure Key Vault] :: Azure Resource Management Hierarchy

## Core Compute Services: When to Use What
| Azure Service | Type | Cold Start / Scaling | Ideal Use Case | Real-Life Analogy |
|---|---|---|---|---|
| **Azure Virtual Machines** | IaaS | Minutes | Legacy Windows/.NET apps, custom kernel modules | Renting an unfurnished house where you paint walls and fix plumbing |
| **Azure App Service** | PaaS | Seconds | Web apps, REST APIs (Node, Python, Java, .NET) | Living in a fully serviced hotel suite with daily housekeeping |
| **Azure Functions** | FaaS / Serverless | 0 - 2 sec (Consumption tier) | Event-driven micro-tasks, webhook handlers, IoT pipelines | Calling an Uber on-demand: arrives when needed, pay only while moving |
| **Azure Kubernetes Service (AKS)** | CaaS | Seconds | Distributed microservices, high-density container orchestration | Running an international cargo shipping container terminal |

## Azure Virtual Network (VNet) & Zero-Trust Security
- **VNet Architecture:** Isolated private network per region, subdivided into CIDR subnets (e.g., `10.0.1.0/24` for Web, `10.0.2.0/24` for Database).
- **Network Security Groups (NSGs):** Stateful packet filter firewalls applied to subnets or network interfaces (NICs).
- **Private Endpoints & Azure Private Link:** Routes traffic from your VNet directly to Azure PaaS services (Blob Storage, Azure SQL) over private Microsoft backbone fiber, completely bypassing the public internet!

```json
// Sample NSG Rule: Allow Inbound HTTPS Only from Azure Application Gateway
{
  "name": "Allow-AppGateway-Inbound",
  "properties": {
    "protocol": "Tcp",
    "sourcePortRange": "*",
    "destinationPortRange": "443",
    "sourceAddressPrefix": "10.0.0.0/24",
    "destinationAddressPrefix": "10.0.1.0/24",
    "access": "Allow",
    "priority": 100,
    "direction": "Inbound"
  }
}
```

## Microsoft Entra ID (formerly Azure Active Directory)
- Cloud-native identity and access management provider.
- **Service Principals vs Managed Identities:**
  - **Service Principal:** A bot account with credentials (client secret or certificate) stored in app code. Vulnerable to credential leakage.
  - **System-Assigned Managed Identity:** Azure automatically creates and rotates credentials in the background. The VM or App Service requests tokens directly from `http://169.254.169.254/metadata/identity/oauth2/token`. Zero passwords in configuration files!

@flow [App Service with Managed Identity] | [Requests Azure Resource Token via internal IMDS 169.254.169.254] | [Entra ID validates identity without secret password] | [App Service accesses Azure Key Vault] | (Decrypted Secret retrieved with zero secret in code) :: Passwordless Architecture with Azure Managed Identity
