## Network Layer: Routing and Supporting Protocols
### How a router decides
- A router reads the destination IP of each packet, looks in its **routing table**, picks the entry with the **longest matching prefix**, and sends the packet out of that interface to the next hop. If nothing matches, it uses the **default route** (0.0.0.0/0).
| Destination | Next hop | Interface |
|---|---|---|
| 10.1.0.0/16 | direct | eth0 |
| 10.1.5.0/24 | 10.1.0.2 | eth0 |
| 0.0.0.0/0 (default) | 49.36.10.1 (ISP) | eth1 |
- A packet for 10.1.5.9 matches both /16 and /24 -> the **/24 wins** (longest prefix match).
- **TTL** (time to live) in each IP packet decreases at every router; at 0 the packet is dropped (stops infinite loops). `traceroute` uses this to list each hop.
- **Fragmentation**: if a packet is bigger than the next link's MTU, IPv4 can split it (or drop it and signal "fragmentation needed" for path MTU discovery).
### Routing types and algorithms
| Type | Idea | Example |
|---|---|---|
| Static routing | admin writes routes by hand | small networks, default routes |
| Dynamic routing | routers exchange information and update automatically | most networks |
| Distance vector | each router tells neighbours its distance to every network (Bellman-Ford); "routing by rumour" | RIP (max 15 hops) |
| Link state | each router learns the full map and runs Dijkstra's shortest path | OSPF, IS-IS |
| Path vector | routes carry the full list of autonomous systems; policy based | BGP (the routing protocol of the internet between ISPs) |
- **Interior** gateway protocols (inside one organisation): RIP, OSPF, EIGRP. **Exterior**: **BGP** between autonomous systems (ISPs, big companies).
- Distance vector problem: **count to infinity** (slow convergence after a failure), fixed by split horizon, route poisoning, hold-down timers.
- Dijkstra and Bellman-Ford are exactly the shortest-path algorithms in notebook 11 (Graphs).
@graph R1-R2:4 R1-R3:1 R3-R2:2 R2-R4:5 R3-R4:8 :: OSPF: each router runs Dijkstra on link costs. R1 to R4 = R1-R3-R2-R4, cost 8
### ICMP
- **ICMP** carries error and diagnostic messages for IP: echo request / reply (**ping**), destination unreachable, time exceeded (used by **traceroute**), fragmentation needed.
```sh
ping -c 4 8.8.8.8            # is the host reachable and how long does it take?
traceroute google.com        # list each router hop (tracert on Windows)
```
### ARP (Address Resolution Protocol)
- IP gets a packet to the right network; inside the LAN the switch needs the **MAC address**. ARP finds the MAC for an IP: the host **broadcasts** "Who has 192.168.1.1? Tell 192.168.1.5", the owner **replies** with its MAC, and the answer is cached (ARP table, `arp -a`).
@flow (Laptop wants to send to 192.168.1.1) | <MAC in ARP cache? ~ Broadcast ARP request: who has 192.168.1.1?> | (Send the frame to that MAC) :: ARP lookup (the router replies with its MAC, laptop caches it)
- If the destination is on **another** network, the host ARPs for the **default gateway's** MAC, not the final server's.
- **ARP spoofing**: an attacker replies with their own MAC to intercept traffic (man-in-the-middle). Defences: dynamic ARP inspection, static entries for gateways, encryption (HTTPS).
### DHCP (Dynamic Host Configuration Protocol)
- Gives a device its IP address, subnet mask, default gateway and DNS servers automatically when it joins the network. Uses UDP ports 67 (server) and 68 (client). The steps spell **DORA**:
@chain Discover (client broadcasts: any DHCP server?) -> Offer (server offers 192.168.1.23) -> Request (client: I want 192.168.1.23) -> Acknowledge (server confirms, lease for 24 h) :: DHCP DORA
- Leases expire and are renewed. **DHCP relay** forwards requests across routers. A **rogue DHCP server** can hand out a malicious gateway (DHCP snooping on switches prevents it).
## Transport Layer: TCP and UDP
### Ports and sockets
- An IP address identifies a **computer**; a **port** (16-bit number, 0-65535) identifies an **application** on it. A **socket** = IP + port (+ protocol). A TCP connection is identified by the 4-tuple (source IP, source port, destination IP, destination port).
| Port | Service |
|---|---|
| 20 / 21 | FTP data / control |
| 22 | SSH (and SFTP) |
| 23 | Telnet (insecure) |
| 25 / 587 / 465 | SMTP (sending mail) |
| 53 | DNS (UDP and TCP) |
| 67 / 68 | DHCP |
| 80 | HTTP |
| 110 / 995 | POP3 / POP3S |
| 143 / 993 | IMAP / IMAPS |
| 123 | NTP (time) |
| 161 | SNMP |
| 443 | HTTPS (and HTTP/3 over UDP) |
| 3306 / 5432 / 27017 / 6379 | MySQL / PostgreSQL / MongoDB / Redis |
| 3389 | RDP |
- Ranges: 0-1023 well-known, 1024-49151 registered, 49152-65535 dynamic / ephemeral (temporary client ports).
### TCP vs UDP
| TCP | UDP |
|---|---|
| connection-oriented (handshake first) | connectionless (just send) |
| reliable: acknowledgements, retransmission | best effort: may lose, duplicate or reorder |
| ordered byte stream | independent datagrams |
| flow control and congestion control | none built in |
| 20-60 byte header | 8 byte header |
| slower start, more overhead | low latency |
| web (HTTP/1.1, HTTP/2), email, file transfer, SSH, databases | DNS, video calls, live streaming, online games, VoIP, DHCP, QUIC (HTTP/3) |
- Analogy: TCP is a phone call (connect first, both confirm everything heard). UDP is shouting announcements on a speaker (fast, no confirmation).
### TCP three-way handshake (connection setup)
@chain Client: SYN (seq = x) -> Server: SYN-ACK (seq = y, ack = x + 1) -> Client: ACK (ack = y + 1) -> connection ESTABLISHED :: TCP three-way handshake
- Why three steps: both sides must tell their starting sequence number and confirm they received the other's. Random initial sequence numbers make spoofing harder.
- **SYN flood attack**: send many SYNs without completing the handshake to fill the server's queue. Defence: SYN cookies, rate limiting, DDoS protection.
### TCP connection termination (four-way)
@chain Client: FIN -> Server: ACK -> Server: FIN -> Client: ACK -> client waits in TIME_WAIT (2 x MSL) then CLOSED :: TCP connection close
- TIME_WAIT makes sure the last ACK arrived and old delayed packets die before the same port pair is reused.
### TCP states (the important ones)
| State | Meaning |
|---|---|
| LISTEN | server waiting for connections |
| SYN_SENT / SYN_RECEIVED | handshake in progress |
| ESTABLISHED | data can flow |
| FIN_WAIT_1 / FIN_WAIT_2 | the side that closed first is waiting |
| CLOSE_WAIT | the other side closed; this app must call close() (many CLOSE_WAIT = app bug) |
| TIME_WAIT | waiting before final close |
| CLOSED | done |
### Reliability: sequence numbers, ACKs, retransmission
- Every byte has a **sequence number**. The receiver sends **cumulative ACKs** ("I have everything up to byte N"). If an ACK does not arrive before the **retransmission timeout (RTO)**, or 3 duplicate ACKs arrive (**fast retransmit**), the sender resends.
- Checksums detect corrupted segments; the receiver reorders out-of-order segments using sequence numbers.
### Flow control (do not overwhelm the receiver)
- The receiver advertises a **receive window** (how much free buffer it has). The sender never has more unacknowledged data than this window. **Sliding window**: as ACKs come back, the window slides forward.
@cells sent+acked sent+acked sent sent sent can-send can-send not-yet not-yet :: TCP sliding window: the window covers bytes sent but not acknowledged + bytes allowed to send
### Congestion control (do not overwhelm the network)
- The sender keeps a **congestion window (cwnd)**. Data in flight = min(cwnd, receive window).
| Phase | Rule |
|---|---|
| Slow start | start small (e.g. 10 segments) and **double** cwnd every RTT until the threshold (ssthresh) |
| Congestion avoidance | above ssthresh, grow cwnd by 1 segment per RTT (linear: additive increase) |
| On 3 duplicate ACKs | fast retransmit + fast recovery: halve cwnd (multiplicative decrease) |
| On timeout | ssthresh = cwnd / 2, cwnd back to 1, slow start again |
- This is **AIMD** (Additive Increase, Multiplicative Decrease): the sawtooth pattern of TCP throughput. Algorithms: Reno, NewReno, **CUBIC** (Linux default), **BBR** (Google: models bandwidth and RTT).
- Other TCP features: **Nagle's algorithm** (combine small writes; disable with TCP_NODELAY for low latency), delayed ACKs, **keep-alive**, window scaling, selective ACK (SACK).
### UDP and QUIC
- UDP header: source port, destination port, length, checksum. That is all - applications add their own reliability if needed.
- **QUIC** (used by HTTP/3): runs over UDP but adds reliability, encryption (TLS 1.3 built in), multiplexed streams without head-of-line blocking, and 0-1 RTT connection setup; connections survive switching from Wi-Fi to mobile data.
### Sockets programming
```py
# TCP echo server and client (Python)
import socket
def server():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:     # TCP
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        s.bind(("0.0.0.0", 9000)); s.listen()                        # LISTEN
        conn, addr = s.accept()                                       # handshake completes -> ESTABLISHED
        with conn:
            while data := conn.recv(1024): conn.sendall(b"echo: " + data)
def client():
    with socket.create_connection(("127.0.0.1", 9000)) as c:
        c.sendall(b"hello"); print(c.recv(1024))
# UDP: no connection, just send datagrams
u = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
u.sendto(b"ping", ("127.0.0.1", 9001))
```
```cpp
// TCP client in C/C++ (POSIX sockets)
#include <sys/socket.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <cstring>
#include <cstdio>
int main() {
    int fd = socket(AF_INET, SOCK_STREAM, 0);
    sockaddr_in addr{}; addr.sin_family = AF_INET; addr.sin_port = htons(9000);   // htons: host to network byte order
    inet_pton(AF_INET, "127.0.0.1", &addr.sin_addr);
    if (connect(fd, (sockaddr*)&addr, sizeof addr) < 0) { perror("connect"); return 1; }
    const char* msg = "hello"; send(fd, msg, strlen(msg), 0);
    char buf[1024]; int n = recv(fd, buf, sizeof buf - 1, 0); buf[n > 0 ? n : 0] = 0; printf("%s\n", buf);
    close(fd);
}
```
- Server calls: socket -> bind -> listen -> accept -> recv / send -> close. Client calls: socket -> connect -> send / recv -> close.
- Handling many clients: one thread per client (simple), thread pools, or **I/O multiplexing** (select / poll / **epoll**, kqueue) with an event loop (how Nginx, Redis and Node.js serve thousands of connections).
## Application Layer
### DNS (Domain Name System) in depth
- DNS is the internet's phone book: it turns names (`www.google.com`) into IP addresses. It is a **distributed, hierarchical** database.
@layers Root servers ( . ) | TLD servers ( .com, .in, .org ) | Authoritative servers for google.com | Answer: www.google.com = 142.250.193.36 :: DNS hierarchy
@flow (Browser needs www.example.com) | Check browser cache, OS cache, hosts file | Ask the recursive resolver (ISP / 8.8.8.8 / 1.1.1.1) | Resolver asks a root server -> "ask the .com servers" | Asks the .com TLD server -> "ask ns1.example.com" | Asks the authoritative server -> 93.184.215.14 | (Resolver caches it for the TTL and returns it to the browser) :: DNS resolution (the resolver does recursive work; root and TLD answer iteratively)
| Record | Meaning | Example |
|---|---|---|
| A | name -> IPv4 | example.com -> 93.184.215.14 |
| AAAA | name -> IPv6 | example.com -> 2606:2800::1 |
| CNAME | alias -> another name | www -> example.com |
| MX | mail server for the domain (with priority) | 10 mail.example.com |
| NS | name servers of the zone | ns1.example.com |
| TXT | free text: SPF, DKIM, domain verification | v=spf1 include:_spf.google.com ~all |
| SOA | start of authority: zone settings | serial, refresh |
| PTR | reverse lookup: IP -> name | 14.215.184.93.in-addr.arpa |
| SRV | service location (host + port) | _sip._tcp |
| CAA | which CAs may issue certificates | 0 issue "letsencrypt.org" |
- **TTL** controls caching time. DNS uses **UDP port 53** (TCP for large answers and zone transfers). Secure variants: **DNSSEC** (signed answers), **DoH / DoT** (DNS over HTTPS / TLS for privacy).
- Attacks: DNS spoofing / cache poisoning, DNS amplification DDoS, typosquatting.
```sh
dig example.com A +short
dig example.com MX
nslookup example.com
dig +trace www.example.com     # watch root -> TLD -> authoritative
```
### HTTP and HTTPS
- HTTP is the request-response protocol of the web (methods GET / POST / PUT / PATCH / DELETE, status codes, headers). All details, versions (HTTP/1.1, 2, 3), REST and status codes are in notebook 26.
- **HTTPS** = HTTP inside **TLS**. TLS provides **confidentiality** (encryption), **integrity** (no tampering) and **authentication** (the server proves its identity with a certificate signed by a trusted Certificate Authority).
@flow (Client Hello: TLS versions, cipher suites, random, key share) | Server Hello: chosen cipher, key share + certificate + signature | Client verifies the certificate chain up to a trusted root CA and the domain name | Both compute the same session key (ECDHE) | (Encrypted HTTP traffic using a fast symmetric cipher like AES-GCM) :: TLS 1.3 handshake (1 round trip)
- **Asymmetric** cryptography (public / private keys) is used only for the handshake (key exchange and signatures); the bulk data uses **symmetric** encryption because it is much faster.
- Certificates: issued by CAs (Let's Encrypt, DigiCert), valid for a domain and a period; the browser checks expiry, domain, chain and revocation. **HSTS** forces browsers to always use HTTPS.
### Email protocols
@chain Sender's mail app -> SMTP (587) -> sender's mail server -> SMTP (25) -> receiver's mail server (found via MX record) -> IMAP / POP3 -> receiver's mail app :: How an email travels
| Protocol | Use |
|---|---|
| SMTP | sending and relaying mail (port 587 with STARTTLS, 465 with TLS, 25 between servers) |
| POP3 | download mail to one device and usually delete it from the server |
| IMAP | keep mail on the server, sync folders across devices |
| SPF / DKIM / DMARC | DNS-based checks that the sender is allowed and the mail was not altered (fight spoofing and spam) |
- This portal's sign-up codes are sent with SMTP over TLS (Gmail, port 587) - which is why the instructions ask users to check their spam folder.
### Other application protocols
| Protocol | Use |
|---|---|
| FTP / SFTP / SCP | file transfer (SFTP and SCP run over SSH, encrypted) |
| SSH | secure remote shell and tunnels (port 22) |
| Telnet | remote shell without encryption (never on the internet) |
| NTP | time synchronisation (certificates and logs need correct time) |
| SNMP | monitoring network devices |
| LDAP | directory / login lookups |
| RTP / WebRTC | real-time audio / video |
| MQTT | lightweight publish-subscribe for IoT |
| WebSocket | full-duplex messaging over one TCP connection (chat, live updates) |
### What happens when you type a URL and press Enter (full answer)
1. **Parse** the URL; if it is not a URL, search instead. Check **HSTS** list (force HTTPS).
2. **DNS**: browser cache -> OS cache -> hosts file -> recursive resolver -> root -> TLD -> authoritative -> IP address.
3. **ARP** for the default gateway's MAC (if not cached); the packet leaves through the router and **NAT**.
4. **TCP three-way handshake** with the server (or QUIC over UDP for HTTP/3).
5. **TLS handshake**: certificate verified, session keys agreed.
6. Browser sends the **HTTP GET** request with headers and cookies.
7. On the server side: CDN / **load balancer** / **reverse proxy** -> web server -> application -> cache / database -> response.
8. Browser receives HTML, parses it into the **DOM**, downloads CSS / JS / images (more requests, often from a CDN, in parallel over HTTP/2), builds the CSSOM, runs JavaScript, lays out and **paints** the page.
9. Connections are kept alive for reuse; later visits use cached resources.
@chain URL typed -> DNS -> TCP -> TLS -> HTTP request -> server (LB, app, DB) -> HTTP response -> render page :: The whole journey in one line
## Proxies, Load Balancers, Cookies and Sessions
### Forward proxy vs reverse proxy
- **Forward proxy**: sits in front of **clients** and makes requests to the internet on their behalf (college / office proxy, content filtering, VPN-like privacy). The website sees the proxy's IP.
- **Reverse proxy**: sits in front of **servers** and receives requests from the internet on their behalf (Nginx, Cloudflare, AWS ALB). It provides TLS termination, caching, compression, security (hides server IPs, WAF), routing by path, and load balancing.
@chain Clients -> Forward proxy -> Internet -> Reverse proxy -> Server 1 / Server 2 :: Forward proxy protects clients; reverse proxy protects servers
### Load balancer
- Spreads incoming requests across many identical servers using an algorithm (round robin, weighted, least connections, IP hash, consistent hashing), removes unhealthy servers using **health checks**, and allows zero-downtime deploys.
- **Layer 4** load balancers route by IP and port (very fast); **Layer 7** load balancers read HTTP (route /api and /images differently, terminate TLS, sticky sessions by cookie).
### Cookies vs sessions
- HTTP is **stateless**. A **cookie** is a small piece of data the server stores in the browser (`Set-Cookie`), which the browser sends back automatically with every request (`Cookie` header). A **session** is data the **server** keeps about a logged-in user (in memory, Redis or a database), found using a random **session id** that travels in a cookie.
| Cookie | Session |
|---|---|
| stored in the browser | stored on the server |
| small (about 4 KB) | can be large |
| user can see / edit it | user only has a random id |
| sent with every request automatically | looked up on the server per request |
| attributes: HttpOnly, Secure, SameSite, Expires | ends on logout / timeout |
- Secure cookies: **HttpOnly** (JavaScript cannot read it -> XSS cannot steal it), **Secure** (HTTPS only), **SameSite=Lax/Strict** (blocks CSRF), short expiry.
> Full depth on reverse proxies, load balancers (Nginx config), cookies vs sessions vs JWT, and their attacks is in notebook 12 (System Design), sections "Proxy, Reverse Proxy and Load Balancer" and "Cookies vs Sessions vs Tokens".
## Network Security
| Topic | Explanation |
|---|---|
| Firewall | filters traffic by rules: packet filter (IP / port), stateful (tracks connections), application / next-gen firewall (inspects content), WAF (web attacks like SQL injection, XSS) |
| IDS / IPS | intrusion detection (alerts) / prevention (blocks) systems that watch traffic for attack patterns |
| VPN | encrypted tunnel over the internet: IPsec (site-to-site), SSL / WireGuard / OpenVPN (remote users) |
| DMZ | a separate zone for public servers between the internet and the internal network |
| Encryption | symmetric (AES: one shared key, fast), asymmetric (RSA / ECC: public + private key), hashing (SHA-256: one way), digital signatures, certificates / PKI |
| Wi-Fi security | WPA3 (best), WPA2-AES; never WEP / open networks for sensitive data |
| Zero trust | never trust by network location; verify every user and device on every request |
| Attack | How it works | Defence |
|---|---|---|
| Man-in-the-middle (MITM) | attacker secretly relays / alters traffic (fake Wi-Fi, ARP spoofing) | TLS everywhere, certificate checks, HSTS, VPN |
| DoS / DDoS | flood a server with traffic from one / many machines | rate limiting, CDNs, scrubbing services (Cloudflare, AWS Shield), autoscaling |
| SYN flood | half-open TCP connections exhaust the server | SYN cookies |
| IP / ARP / DNS spoofing | fake addresses or answers | ingress filtering, DAI, DNSSEC |
| Packet sniffing | reading unencrypted traffic | encryption |
| Port scanning | finding open services (nmap) | close unused ports, firewalls |
| Phishing | fake sites / mails steal credentials | user training, MFA, SPF / DKIM / DMARC |
| Session hijacking | stealing session cookies | HttpOnly + Secure cookies, HTTPS, short sessions |
Security in depth is covered in notebook 23 (Cyber Security).
## Useful Networking Commands
```sh
ip a / ifconfig / ipconfig            # your IP, MAC, interfaces
ping host                             # reachability and latency (ICMP)
traceroute host / tracert host        # path of routers
nslookup / dig name                   # DNS lookups
netstat -tulpn / ss -tulpn            # open ports and connections
arp -a                                # ARP cache
curl -v https://example.com           # see the TLS handshake and HTTP headers
nmap -sV 192.168.1.0/24               # scan your own network (only with permission)
tcpdump -i eth0 port 443              # capture packets; Wireshark for a GUI
```
## Computer Networks Interview Questions
Q: Explain the OSI model.
A: Seven layers - physical (bits), data link (frames, MAC), network (packets, IP, routing), transport (segments, TCP / UDP, ports), session, presentation (encoding, encryption) and application (HTTP, DNS) - each providing services to the layer above.
Q: TCP vs UDP?
A: TCP is connection-oriented and reliable with ordering, flow and congestion control; UDP is connectionless, fast and best-effort, used for DNS, streaming, gaming and QUIC.
Q: Explain the TCP three-way handshake.
A: The client sends SYN with its sequence number, the server replies SYN-ACK with its own sequence number and acknowledges the client's, and the client sends ACK; both sides now know each other's starting sequence numbers.
Q: What happens when you type a URL in the browser?
A: DNS resolution, TCP (or QUIC) connection, TLS handshake, HTTP request through load balancers / reverse proxies to the server, response, and the browser parses HTML, fetches resources and renders the page.
Q: How does DNS work?
A: The resolver checks caches, then asks a root server, the TLD server and the domain's authoritative server, caches the answer for its TTL and returns the IP.
Q: What is the difference between a switch and a router?
A: A switch connects devices within one network using MAC addresses (layer 2); a router connects different networks and forwards packets using IP addresses (layer 3).
Q: What is subnetting and why is it used?
A: Dividing a network into smaller networks by borrowing host bits, to organise addresses, reduce broadcast domains, improve security and use addresses efficiently.
Q: How many hosts does a /26 network have?
A: 2^(32-26) - 2 = 62 usable hosts.
Q: What is NAT?
A: Network Address Translation rewrites private source addresses / ports to a public address so many devices can share one public IP, keeping a table to map replies back.
Q: What is ARP?
A: A protocol that finds the MAC address for an IP on the local network by broadcasting a request and caching the reply.
Q: Explain DHCP.
A: It automatically assigns IP configuration using Discover, Offer, Request, Acknowledge (DORA) and leases.
Q: How does TCP handle congestion?
A: With a congestion window: slow start (exponential growth), congestion avoidance (linear growth), and multiplicative decrease on loss (AIMD), using algorithms like CUBIC or BBR.
Q: Flow control vs congestion control?
A: Flow control protects the receiver using its advertised window; congestion control protects the network using the sender's congestion window.
Q: How does HTTPS work?
A: TLS verifies the server's certificate, agrees on session keys with an asymmetric key exchange (ECDHE), then encrypts traffic with fast symmetric encryption, providing confidentiality, integrity and authentication.
Q: HTTP/1.1 vs HTTP/2 vs HTTP/3?
A: HTTP/2 multiplexes many requests over one TCP connection with header compression; HTTP/3 runs over QUIC (UDP), removing TCP head-of-line blocking and speeding up connection setup.
Q: What is a reverse proxy?
A: A server in front of back-end servers that receives client requests and forwards them, adding TLS termination, caching, compression, security and load balancing.
Q: Cookies vs sessions?
A: Cookies store small data in the browser and are sent automatically with requests; sessions store user state on the server, referenced by a session id usually kept in a secure cookie.
Q: What is the difference between IPv4 and IPv6?
A: IPv4 has 32-bit addresses and relies on NAT; IPv6 has 128-bit addresses, a simpler header, autoconfiguration and no broadcast.
Q: What is a VLAN?
A: A logical network created on switches so devices on the same physical switch can be separated into different broadcast domains.
Q: What is latency vs bandwidth?
A: Latency is how long one bit takes to arrive; bandwidth is how many bits per second the link can carry.
