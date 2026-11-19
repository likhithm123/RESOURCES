# Computer Networks - Every Topic Explained with Examples
This notebook explains how computers talk to each other, from cables to web browsers, in simple words: network types and devices, the OSI and TCP/IP models layer by layer, IP addressing and subnetting (with solved problems), routing, ARP, DHCP, DNS, TCP and UDP in depth, HTTP / HTTPS / TLS, email, sockets, proxies, load balancers, cookies and sessions, network security and the most asked interview questions.
## What is a Computer Network
- A **network** is two or more devices connected so they can share data and resources (internet, files, printers). Every message is broken into small pieces (**packets**) that travel separately and are put back together at the destination.
- Analogy: the postal system. A letter (data) goes in an envelope with addresses (headers), is sorted at post offices (routers) and delivered to the right house (computer) and the right person in it (application / port).
| Term | Meaning |
|---|---|
| Node / host | any device on the network (laptop, phone, server) |
| Link | the connection (cable, Wi-Fi, fibre) |
| Protocol | agreed rules for communication (HTTP, TCP, IP) |
| Bandwidth | maximum data per second the link can carry (Mbps / Gbps) |
| Throughput | actual data per second achieved |
| Latency | time for data to travel from source to destination (ms) |
| Round Trip Time (RTT) | time to go and come back |
| Jitter | variation in latency (bad for calls / games) |
| Packet loss | packets that never arrive |
### Types of networks
| Type | Range | Example |
|---|---|---|
| PAN (Personal) | a few metres | Bluetooth earphones |
| LAN (Local) | a building / campus | college lab, home Wi-Fi |
| MAN (Metropolitan) | a city | city cable network |
| WAN (Wide) | countries / world | the internet, company networks across cities |
| WLAN | wireless LAN | Wi-Fi |
| VPN | private network over the internet | work-from-home access |
| SAN | storage network | data-centre disks |
### Network topologies
| Topology | Shape | Pros | Cons |
|---|---|---|---|
| Bus | all devices on one cable | cheap | one break stops all, collisions |
| Star | all devices to a central switch | easy to manage, one cable failing affects one device | the central device is a single point of failure |
| Ring | each device to two neighbours in a loop | orderly | one break can stop the ring |
| Mesh | every device to many / all others | very reliable | expensive cabling |
| Tree | hierarchy of stars | scalable | depends on the root |
| Hybrid | mix | flexible | complex |
@graph Switch-PC1 Switch-PC2 Switch-PC3 Switch-PC4 Switch-Printer :: Star topology (most LANs today)
### Transmission modes and switching
- **Simplex** (one way: TV broadcast), **half duplex** (both ways, one at a time: walkie-talkie), **full duplex** (both ways together: phone call).
- **Circuit switching**: a dedicated path for the whole call (old telephone network). **Packet switching**: data split into packets that share links and may take different routes (the internet) - efficient, but packets can be delayed, reordered or lost.
### Network devices
| Device | Layer | What it does |
|---|---|---|
| Hub | 1 (physical) | repeats every signal to all ports (dumb, collisions) |
| Repeater | 1 | boosts a weak signal |
| Bridge | 2 (data link) | joins two LAN segments, filters by MAC |
| Switch | 2 | sends frames only to the port of the destination MAC (MAC address table) |
| Router | 3 (network) | forwards packets between different networks using IP addresses |
| Layer 3 switch | 2-3 | switch with routing |
| Gateway | up to 7 | connects networks with different protocols |
| Modem | 1 | converts digital data to signals for the line (DSL, cable, fibre ONT) |
| Access point | 2 | connects Wi-Fi devices to the wired LAN |
| Firewall | 3-7 | allows / blocks traffic by rules |
| Load balancer / proxy | 4-7 | distributes or forwards requests (see below) |
| NIC | 1-2 | network interface card in each device (has the MAC address) |
## The OSI Model (7 layers)
- The **OSI model** splits networking into 7 layers so each layer has one job and can change without affecting the others. Remember top to bottom: "**A**ll **P**eople **S**eem **T**o **N**eed **D**ata **P**rocessing".
@layers 7 Application: HTTP, DNS, SMTP, FTP | 6 Presentation: encryption (TLS), compression, encoding (JSON, JPEG) | 5 Session: open / manage / close sessions | 4 Transport: TCP / UDP, ports, reliability - segments | 3 Network: IP addressing and routing - packets | 2 Data link: MAC addresses, frames, switches, error detection | 1 Physical: bits as signals on cables / radio :: The OSI model
| Layer | Data unit | Job | Examples | Devices |
|---|---|---|---|---|
| 7 Application | data / message | services for apps | HTTP, HTTPS, DNS, SMTP, FTP, SSH | - |
| 6 Presentation | data | format, encrypt, compress | TLS, JPEG, ASCII, UTF-8 | - |
| 5 Session | data | dialogue control, sessions | RPC, NetBIOS, session restore | - |
| 4 Transport | segment (TCP) / datagram (UDP) | process-to-process delivery, ports, reliability, flow control | TCP, UDP, QUIC | firewall, L4 load balancer |
| 3 Network | packet | logical addressing, routing | IPv4, IPv6, ICMP, OSPF, BGP | router |
| 2 Data link | frame | node-to-node delivery on one link, MAC, error detection | Ethernet, Wi-Fi (802.11), ARP, VLAN | switch, bridge |
| 1 Physical | bits | signals on the medium | cables, fibre, radio, RJ45 | hub, repeater, modem |
### Encapsulation
- Going **down** the layers, each layer adds its own header (and the data link layer adds a trailer). Going **up** at the receiver, each layer removes its header. This is like putting a letter in an envelope, the envelope in a courier bag, the bag in a truck.
@chain Data -> [TCP header + data] = segment -> [IP header + segment] = packet -> [Ethernet header + packet + CRC trailer] = frame -> bits on the wire :: Encapsulation at the sender
## The TCP/IP Model (what the internet really uses)
| TCP/IP layer | OSI layers | Protocols |
|---|---|---|
| Application | 7, 6, 5 | HTTP, DNS, SMTP, SSH, TLS |
| Transport | 4 | TCP, UDP |
| Internet | 3 | IP, ICMP, ARP (between 2 and 3) |
| Network access (link) | 2, 1 | Ethernet, Wi-Fi |
- OSI is a teaching / reference model; TCP/IP is the practical model the internet is built on.
## Physical and Data Link Layer Essentials
- Media: twisted pair copper (Cat5e / Cat6, up to 10 Gbps short range), coaxial, **optical fibre** (light, very fast, long distance, no interference), wireless (radio: Wi-Fi, 4G / 5G, Bluetooth).
- **MAC address**: 48-bit hardware address of a network card, written like `3C:22:FB:9A:10:7E`. The first 24 bits identify the manufacturer. Used **within one local network**.
- **Ethernet frame**: destination MAC, source MAC, type, payload (46-1500 bytes = **MTU**), CRC checksum.
- **Error detection**: parity bits, checksums, **CRC** (cyclic redundancy check - used by Ethernet). **Error correction**: Hamming code (can fix single-bit errors).
- **Media access control**: when many devices share a medium. **CSMA/CD** (classic wired Ethernet: listen before sending, detect collisions, back off randomly) and **CSMA/CA** (Wi-Fi: avoid collisions with random waits and acknowledgements, because wireless cannot detect collisions while sending).
- **Flow control at link level**: stop-and-wait, **sliding window** (Go-Back-N, Selective Repeat) - the same ideas TCP uses.
- **Switch learning**: a switch records which MAC address was seen on which port (MAC table) and forwards frames only there; unknown destinations are flooded.
- **VLAN**: splits one physical switch into separate logical networks (e.g. students vs staff) for security and less broadcast traffic.
## IP Addressing (IPv4)
### Structure
- An **IPv4 address** is 32 bits, written as 4 decimal numbers 0-255 (dotted decimal): `192.168.1.10` = `11000000.10101000.00000001.00001010`.
- It has a **network part** (which network) and a **host part** (which device). The **subnet mask** says where the split is: `255.255.255.0` = `/24` means the first 24 bits are the network.
| Address | Meaning |
|---|---|
| Network address | host bits all 0: 192.168.1.0/24 |
| Broadcast address | host bits all 1: 192.168.1.255 |
| Usable hosts | between them: 192.168.1.1 - 192.168.1.254 (2^8 - 2 = 254) |
| Default gateway | the router's address on this network (often .1) |
| Loopback | 127.0.0.1 (this machine itself, "localhost") |
| Private ranges (not routed on the internet) | 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16 |
| APIPA | 169.254.x.x (no DHCP server found) |
| 0.0.0.0 | "any address" / default route |
### Classful addressing (old, still asked in exams)
| Class | First bits | First octet | Default mask | Networks / hosts |
|---|---|---|---|---|
| A | 0 | 1-126 | /8 (255.0.0.0) | 126 networks, 16.7 million hosts each |
| B | 10 | 128-191 | /16 (255.255.0.0) | 16,384 networks, 65,534 hosts each |
| C | 110 | 192-223 | /24 (255.255.255.0) | 2 million networks, 254 hosts each |
| D | 1110 | 224-239 | - | multicast |
| E | 1111 | 240-255 | - | reserved / experimental |
- Classful addressing wasted addresses, so today we use **CIDR** (Classless Inter-Domain Routing): any prefix length, written `/n`.
### Subnetting step by step
- **Subnetting** splits one network into smaller networks (borrowing host bits). Why: organise departments, reduce broadcast traffic, improve security, use addresses efficiently.
- Formulas: hosts per subnet = 2^(host bits) - 2. Number of subnets = 2^(borrowed bits). Block size (increment) = 256 - mask value in the interesting octet.
| CIDR | Mask | Hosts | Block size |
|---|---|---|---|
| /24 | 255.255.255.0 | 254 | 256 |
| /25 | 255.255.255.128 | 126 | 128 |
| /26 | 255.255.255.192 | 62 | 64 |
| /27 | 255.255.255.224 | 30 | 32 |
| /28 | 255.255.255.240 | 14 | 16 |
| /29 | 255.255.255.248 | 6 | 8 |
| /30 | 255.255.255.252 | 2 | 4 (point-to-point links) |
| /31 | 255.255.255.254 | 2 (special, point-to-point) | 2 |
| /32 | 255.255.255.255 | 1 host | 1 |
### Solved problem 1: find the network, broadcast and host range of 192.168.10.77/27
1. /27 -> mask 255.255.255.224 -> block size in the 4th octet = 256 - 224 = **32**.
2. Subnets start at 0, 32, 64, 96, ... 77 falls in the block starting at **64**.
3. Network = **192.168.10.64**, broadcast = 64 + 32 - 1 = **192.168.10.95**, hosts **.65 - .94** (30 hosts).
### Solved problem 2: split 192.168.1.0/24 into 4 equal subnets
- 4 subnets need 2 borrowed bits (2^2 = 4) -> /26, block 64.
| Subnet | Network | Host range | Broadcast |
|---|---|---|---|
| 1 | 192.168.1.0/26 | .1 - .62 | .63 |
| 2 | 192.168.1.64/26 | .65 - .126 | .127 |
| 3 | 192.168.1.128/26 | .129 - .190 | .191 |
| 4 | 192.168.1.192/26 | .193 - .254 | .255 |
### Solved problem 3: VLSM (Variable Length Subnet Mask)
- Network 10.0.0.0/24 must give: Sales 100 hosts, IT 50 hosts, HR 20 hosts, 2 router links of 2 hosts. Allocate the **biggest first**.
| Need | Hosts needed | Prefix (hosts) | Subnet |
|---|---|---|---|
| Sales | 100 | /25 (126) | 10.0.0.0 - 10.0.0.127 |
| IT | 50 | /26 (62) | 10.0.0.128 - 10.0.0.191 |
| HR | 20 | /27 (30) | 10.0.0.192 - 10.0.0.223 |
| Link 1 | 2 | /30 (2) | 10.0.0.224 - 10.0.0.227 |
| Link 2 | 2 | /30 (2) | 10.0.0.228 - 10.0.0.231 |
### Supernetting / route summarisation
- Combine contiguous networks into one bigger prefix to shrink routing tables: 192.168.0.0/24 + 192.168.1.0/24 + 192.168.2.0/24 + 192.168.3.0/24 = **192.168.0.0/22**.
```py
import ipaddress
net = ipaddress.ip_network("192.168.10.77/27", strict=False)
print(net.network_address, net.broadcast_address, net.num_addresses - 2, list(net.hosts())[0], list(net.hosts())[-1])
# 192.168.10.64 192.168.10.95 30 192.168.10.65 192.168.10.94
for sub in ipaddress.ip_network("192.168.1.0/24").subnets(new_prefix=26): print(sub)
print(ipaddress.ip_address("10.4.5.6") in ipaddress.ip_network("10.0.0.0/8"), ipaddress.ip_address("172.20.1.1").is_private)
print(list(ipaddress.collapse_addresses([ipaddress.ip_network(f"192.168.{i}.0/24") for i in range(4)])))   # [192.168.0.0/22]
```
### NAT (Network Address Translation)
- Your home has one public IP but many devices with private IPs (192.168.x.x). The router **rewrites** the source IP and port of outgoing packets to its public IP and a unique port, and remembers the mapping to send replies back. **PAT** (port address translation / NAT overload) is the common form.
@chain Laptop 192.168.1.5:51000 -> Router NAT: rewrite to 49.36.10.2:62001 (remember mapping) -> Server -> reply to 49.36.10.2:62001 -> Router maps back -> Laptop :: How NAT works
- NAT saves IPv4 addresses and hides inside devices, but breaks direct incoming connections (needs port forwarding, STUN / TURN for video calls).
### IPv6
- 128-bit addresses written in hexadecimal groups: `2001:0db8:0000:0000:0000:ff00:0042:8329` -> shortened `2001:db8::ff00:42:8329` (drop leading zeros, replace one run of zero groups with ::).
- 2^128 addresses (enough for every device forever), no NAT needed, simpler fixed header, built-in autoconfiguration (SLAAC), IPsec support, no broadcast (multicast instead). Loopback `::1`, link-local `fe80::/10`.
- Transition: **dual stack** (both IPv4 and IPv6), tunnelling (6to4), translation (NAT64).
| IPv4 | IPv6 |
|---|---|
| 32 bits, about 4.3 billion addresses | 128 bits, 3.4 x 10^38 addresses |
| dotted decimal | hexadecimal with colons |
| needs NAT | end-to-end addressing |
| DHCP or manual | SLAAC or DHCPv6 |
| header with checksum, options | simpler fixed 40-byte header, no checksum |
| broadcast exists | no broadcast |
