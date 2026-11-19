# Network Engineering: Protocols, Routing, Switching, and Security
This notebook explains network engineering from first principles using intuitive real-life analogies, visual handwritten-style diagrams, and enterprise topologies: the OSI model, IP subnetting, switching and VLANs, dynamic routing (OSPF, BGP), TCP/UDP mechanics, DNS, DHCP, NAT, firewalls, and packet analysis.
## The Mental Model: How Data Travels
- Computer networking is fundamentally a **global postal delivery system**.
- If Alice wants to send a letter from an office in Tokyo to Bob in an office in New York:
  - Alice writes the message (**Application Layer**).
  - Puts it in an envelope addressed to Bob's department (**Transport Layer / Port Number**).
  - Puts that envelope into a shipping box addressed to Bob's building street address (**Network Layer / IP Address**).
  - Hands the box to the local mail carrier who verifies room badges (**Data Link Layer / MAC Address**).
  - The box travels over roads, airplanes, and undersea fiber cables (**Physical Layer / Bits on Wires**).

### The OSI 7-Layer Model vs TCP/IP Stack
| Layer | OSI Name | Real-Life Analogy | Protocols & Data Unit | Hardware |
|---|---|---|---|---|
| **7** | Application | The letter text itself | HTTP, HTTPS, DNS, SSH, SMTP | Endpoints |
| **6** | Presentation | Language translation & encryption (English to French, TLS) | SSL/TLS, JSON, JPEG | Endpoints |
| **5** | Session | Keeping the phone call alive between two people | RPC, NetBIOS, gRPC | Endpoints |
| **4** | Transport | Delivery guarantee: Certified mail (TCP) vs Postcard (UDP) | TCP, UDP (Segment) | Gateways, L4 Load Balancer |
| **3** | Network | Postal street address (Zip code + building number) | IP, ICMP, IPsec (Packet) | Routers, L3 Switches |
| **2** | Data Link | Employee badge ID inside the same room | Ethernet, ARP, VLANs (Frame) | Network Switches, Bridges |
| **1** | Physical | Copper wire, radio waves, flashing laser pulses | 1000BASE-T, Wi-Fi 6, 5G (Bits) | Cables, Hubs, Transceivers |

@layers Layer 7: Application (HTTP, DNS, SSH) | Layer 4: Transport (TCP reliable stream / UDP datagram) | Layer 3: Network (IP routing across the globe) | Layer 2: Data Link (Ethernet frames & MAC addresses on local wire) | Layer 1: Physical (Electrical voltages & light pulses) :: Encapsulation: Each layer wraps the upper layer with headers

## Layer 2: Switching, MAC Addresses, and VLANs
- **MAC Address (Media Access Control):** A permanent physical hardware address burnt into every network card (e.g. `00:1A:2B:3C:4D:5E`).
- **Network Switch:** Connects devices on the same local network (LAN).
  - A switch builds a **MAC Address Table** by inspecting the source MAC of every incoming frame. It forwards packets only to the exact port where the destination device is plugged in (unlike an ancient hub which blindly broadcasted to everyone).

### Virtual LANs (VLANs) & 802.1Q
- **The Problem:** In a hospital or bank, guests on public Wi-Fi should never physically sniff or communicate with internal patient records or payment terminals.
- **VLANs:** Split one physical switch into multiple isolated logical switches.
  - Devices on VLAN 10 (Finance) cannot talk to VLAN 20 (Guest Wi-Fi) without passing through a router or firewall.
  - **Trunk Ports (802.1Q):** Carry traffic for multiple VLANs between switches by inserting a 4-byte "VLAN Tag" into the Ethernet frame header.

### Spanning Tree Protocol (STP)
- If you connect switches in a physical loop for redundancy, broadcast packets loop infinitely, creating a **broadcast storm** that crashes the entire network in seconds.
- **STP (IEEE 802.1D / RSTP 802.1w):** Automatically detects loops and places redundant backup links into a "blocking" state. If an active link is cut, STP unblocks the backup link within sub-seconds.

## Layer 3: IP Addressing, Subnetting, and CIDR
- An **IP Address (IPv4)** is a 32-bit number written as four decimal octets: `192.168.1.50`.
- An IP address consists of two parts:
  1. **Network ID:** Identifies the street/neighborhood.
  2. **Host ID:** Identifies the specific house/apartment on that street.
- The **Subnet Mask** tells computers where the Network ID ends and the Host ID begins:
  - `/24` = `255.255.255.0` (First 24 bits are Network, last 8 bits are Host $\rightarrow 2^8 - 2 = 254$ usable host IPs).
  - *Note:* We subtract 2 because the very first IP is the **Network Address** and the last IP is the **Broadcast Address**.

### Subnetting Cheat Sheet
| CIDR | Subnet Mask | Total IPs | Usable Hosts | Typical Use Case |
|---|---|---|---|---|
| `/30` | `255.255.255.252` | 4 | 2 | Point-to-point router links |
| `/28` | `255.255.255.240` | 16 | 14 | Small database cluster |
| `/24` | `255.255.255.0` | 256 | 254 | Standard office or Kubernetes node subnet |
| `/16` | `255.255.0.0` | 65,536 | 65,534 | Cloud VPC (AWS / GCP Virtual Private Cloud) |

### Private vs Public IP Addresses (RFC 1918)
- The internet ran out of IPv4 addresses. Private IP ranges cannot be routed on the public internet:
  - `10.0.0.0 - 10.255.255.255` (Class A - Enterprise networks)
  - `172.16.0.0 - 172.31.255.255` (Class B - Medium networks, Docker containers)
  - `192.168.0.0 - 192.168.255.255` (Class C - Home Wi-Fi routers)

### Network Address Translation (NAT & PAT)
- **Analogy:** A company with 500 employees has only 1 main telephone number. When employee Bob (desk 402) dials out, the receptionist routes the call using extension numbers.
- **Port Address Translation (PAT / NAT Overload):** Your home or office router takes hundreds of private devices (`192.168.1.X`) and translates them to **one single public IP**, keeping track of connections via unique random source port numbers.
@flow [Laptop: 192.168.1.10:54321] | [NAT Router: Replaces with Public 203.0.113.5:10001] | [Internet: Destination 142.250.190.46:443 (Google)] | [Google responds to 203.0.113.5:10001] | [NAT Router forwards back to 192.168.1.10:54321] :: Port Address Translation (PAT) Flow

## Routing Protocols: Connecting the Global Internet
- A **Router** inspects destination IP addresses and determines the best hop path across multiple networks.

### Static vs Dynamic Routing
- **Static Routing:** Administrator manually types paths (`ip route 10.0.0.0 255.0.0.0 192.168.1.1`). Fragile; fails if a cable is cut.
- **Dynamic Routing:** Routers continuously communicate and automatically reroute traffic around failures.

### Interior vs Exterior Routing Protocols
- **OSPF (Open Shortest Path First):**
  - **Type:** Interior Gateway Protocol (IGP) used *inside* a corporate enterprise or data center.
  - **Algorithm:** Link-State using Dijkstra's Shortest Path First (SPF) algorithm. Every router maintains a complete topological map of the entire network.
- **BGP (Border Gateway Protocol):**
  - **Type:** Exterior Gateway Protocol (EGP). **The protocol that connects the entire global Internet.**
  - **Algorithm:** Path-Vector protocol running over TCP port 179. Connects independent **Autonomous Systems (AS)** (e.g. Google AS15169, AWS AS16509, Comcast AS7922).
  - Routes traffic based on business policy, AS path length, and latency.

@layers Autonomous System 1: Google (AS15169 running internal OSPF) | BGP Peering over Internet Exchange (TCP 179) | Autonomous System 2: Internet Service Provider (ISP running internal IS-IS) | BGP Peering | Autonomous System 3: Enterprise Cloud VPC (AWS AS16509) :: BGP glues distinct Autonomous Systems into the global Internet

## Layer 4: TCP vs UDP Deep Dive
### TCP: Reliable, Connection-Oriented Stream
- **Analogy:** A certified registered phone call. Both parties confirm they hear each other before speaking; if a word is muffled, the speaker repeats it.
- **The TCP 3-Way Handshake:**
@flow /Client sends SYN (seq = 100)/ | [Server receives & responds SYN-ACK (seq = 300, ack = 101)] | [Client sends ACK (seq = 101, ack = 301)] | (TCP Connection Established: Reliable Bidirectional Data Stream) :: TCP 3-Way Handshake

- **Flow Control & Congestion Control:**
  - **Sliding Window:** Receiver tells sender how many bytes of buffer space it has left (`Window Size`). Sender never overwhelms receiver.
  - **AIMD (Additive Increase, Multiplicative Decrease):** Gradually increases speed; cuts throughput in half the instant a packet is dropped.

### UDP: Low-Latency Connectionless Datagrams
- **Analogy:** A television live broadcast. The station sends video signals continuously; if your screen glitches for a split second, you do not pause the live match to re-request the missed frame.
- Zero handshake overhead, no sequence numbers, no retransmission.
- **When to use UDP:** Real-time gaming, VoIP calls, live video streaming, DNS queries, and modern **HTTP/3 (QUIC)**.

## Core Network Services: DNS and DHCP
### DNS: The Phonebook of the Internet
- Converts human-readable names (`api.github.com`) into IP addresses (`140.82.121.4`).
- **Recursive DNS Resolution Flow:**
@flow /User types example.com/ | [Local Stub Resolver checks OS cache] | [Recursive DNS Server (e.g. 8.8.8.8)] | [Root Nameserver (.) replies with .com TLD server] | [.com TLD Nameserver replies with example.com Authoritative server] | [Authoritative Nameserver returns IP: 93.184.216.34] | (Browser opens TLS connection to IP) :: Recursive DNS Resolution Process

### DHCP: Dynamic Host Configuration Protocol
- Automatically assigns IP addresses, subnet masks, default gateways, and DNS servers to new devices connecting to a network.
- **The DORA Process:**
  1. **Discover:** Client broadcasts "Is there a DHCP server out there?" (`0.0.0.0:68` $\rightarrow$ `255.255.255.255:67`).
  2. **Offer:** DHCP server reserves an IP and offers it to the client.
  3. **Request:** Client formally requests the offered IP.
  4. **Acknowledge:** DHCP server confirms lease time and configuration.

## Network Security: Firewalls and Packet Analysis
### Firewall Types
- **Packet-Filtering (Stateless):** Inspects only source/dest IP and port numbers. Dumb and fast; cannot detect connection state.
- **Stateful Inspection:** Tracks connection state (NEW, ESTABLISHED, RELATED). Automatically permits return packets for outbound requests.
- **Next-Gen Application Firewall (WAF / NGFW):** Deep Packet Inspection (DPI) at Layer 7. Can inspect HTTP payloads, block SQL injections, identify malware, and decrypt TLS.

### The Network Engineer's Diagnostic Toolkit
| Command | What it Does Under the Hood | When to Use |
|---|---|---|
| `ping <ip>` | Sends ICMP Echo Request; waits for Echo Reply. Measures round-trip latency. | First check: Is the host reachable? |
| `traceroute <ip>` | Sends packets with incrementing TTL (Time to Live = 1, 2, 3...). Each hop router drops the packet and replies with ICMP Time Exceeded. | Pinpointing exactly which router or ISP link is failing or dropping packets. |
| `dig <domain> +trace` | Traces DNS resolution from root nameservers down to authoritative records. | Debugging DNS propagation and record issues. |
| `ss -tulpn` / `netstat` | Displays listening TCP/UDP sockets and process IDs on the local OS. | Checking if your backend application is actually bound to port 8080. |
| `tcpdump -i eth0 -nn -s0 -w capture.pcap` | Dumps raw network packets passing through a physical or virtual interface into a PCAP file. | Deep low-level network and TLS handshake analysis in Wireshark. |
