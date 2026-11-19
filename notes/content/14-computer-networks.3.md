## HTTP in Practice - Real Examples
### A complete HTTP conversation (what curl -v shows)
```txt
$ curl -v https://api.example.com/v1/users/42
*   Trying 93.184.215.14:443...                       <- DNS gave this IP; TCP handshake starts
* Connected to api.example.com port 443
* TLS 1.3 handshake, server certificate: CN=api.example.com, issuer: Let's Encrypt R11
* ALPN: server accepted h2                             <- HTTP/2 negotiated inside TLS
> GET /v1/users/42 HTTP/2                              <- request line
> Host: api.example.com
> User-Agent: curl/8.7.1
> Accept: */*
> Authorization: Bearer eyJhbGciOi...
>
< HTTP/2 200                                           <- status
< content-type: application/json; charset=utf-8
< cache-control: private, max-age=60
< etag: "a1b2c3"
< x-request-id: 7f3e9c
<
{"id":42,"name":"Asha","city":"Pune"}                   <- body
```
### HTTP methods in action
| Example request | What happens | Typical response |
|---|---|---|
| GET /products?category=books&page=2 | read a list, filtered and paged | 200 + JSON list |
| GET /products/17 | read one item | 200, or 404 if missing |
| POST /orders with a JSON body | create an order | 201 Created + Location: /orders/981 |
| PUT /users/42 with the full user | replace the whole user | 200 or 204 |
| PATCH /users/42 {"city": "Delhi"} | change one field | 200 with the updated user |
| DELETE /cart/items/5 | remove an item | 204 No Content |
| HEAD /files/report.pdf | headers only (size, type) | 200 with Content-Length, no body |
| OPTIONS /api/orders | which methods / CORS allowed | 204 with Allow and Access-Control-* headers |
### Status codes in real situations
| Situation | Code |
|---|---|
| page or API call worked | 200 OK |
| sign-up created a new account | 201 Created |
| file uploaded, processing later (video encoding) | 202 Accepted |
| deleted successfully, nothing to return | 204 No Content |
| http://site.com -> https://site.com forever | 301 Moved Permanently / 308 |
| after login, go to the dashboard | 302 Found / 303 See Other |
| browser's cached copy is still fresh | 304 Not Modified |
| form missing a required field / invalid JSON | 400 Bad Request |
| no login token / expired token | 401 Unauthorized |
| student trying an admin-only page | 403 Forbidden |
| wrong URL / product removed | 404 Not Found |
| seat already booked by someone else | 409 Conflict |
| email is not valid (validation) | 422 Unprocessable Content |
| too many OTP requests in a minute | 429 Too Many Requests |
| bug in server code | 500 Internal Server Error |
| load balancer cannot reach a healthy app server | 502 Bad Gateway |
| server overloaded / maintenance | 503 Service Unavailable |
| app server took too long to answer the proxy | 504 Gateway Timeout |
### Caching example (why the second visit is faster)
@flow (First visit: GET /logo.png) | Server: 200 + Cache-Control: max-age=86400 + ETag: "v7" | Browser stores it | (Next day, the cache expired): GET /logo.png + If-None-Match: "v7" | <Changed on server? ~ Server: 304 Not Modified (no body, use your copy)> | (Server: 200 with the new image and a new ETag) :: Caching and revalidation
| Header | Example | Meaning |
|---|---|---|
| Cache-Control | public, max-age=31536000, immutable | cache for a year (versioned files like app.3f9a.js) |
| Cache-Control | no-cache | store it but always revalidate first |
| Cache-Control | no-store | never store (bank pages, private data) |
| ETag / If-None-Match | "v7" | fingerprint for revalidation |
| Last-Modified / If-Modified-Since | date | date-based revalidation |
| Vary | Accept-Encoding | cache separate copies per header value |
### Redirect example
```txt
GET http://example.com/old-page HTTP/1.1
HTTP/1.1 301 Moved Permanently
Location: https://example.com/new-page
-> the browser automatically requests https://example.com/new-page and remembers the 301 (search engines move the ranking too)
```
### CORS example (browser security rule)
- A page on `https://app.myclg.com` calls an API on `https://api.myclg.com` (different origin). Before a non-simple request the browser sends a **preflight**:
```txt
OPTIONS /v1/marks HTTP/1.1
Origin: https://app.myclg.com
Access-Control-Request-Method: POST
Access-Control-Request-Headers: content-type, authorization

HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://app.myclg.com
Access-Control-Allow-Methods: GET, POST
Access-Control-Allow-Headers: content-type, authorization
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 600
```
- If these headers are missing, the browser blocks the response and the console shows "blocked by CORS policy". CORS is enforced **by browsers only**: Postman and curl ignore it, which is why "it works in Postman but not in the browser".
### HTTP/1.1 vs HTTP/2 vs HTTP/3 with an example
- A page needs 1 HTML + 30 images + 5 JS files.
| Version | What happens |
|---|---|
| HTTP/1.0 | a new TCP connection for every file - very slow |
| HTTP/1.1 | keep-alive reuses connections, but one request at a time per connection; browsers open ~6 connections per site; a slow file blocks the ones behind it (head-of-line blocking) |
| HTTP/2 | all 36 files over ONE connection at the same time (multiplexed streams), compressed headers (HPACK); but one lost TCP packet stalls every stream |
| HTTP/3 | same multiplexing over QUIC (UDP): a lost packet only delays its own stream; faster setup (1-RTT, 0-RTT on repeat visits); survives Wi-Fi -> mobile switch |
### Keep-alive, connection reuse and latency
- Every new HTTPS connection costs DNS + TCP (1 RTT) + TLS (1 RTT). With 100 ms RTT that is ~200-300 ms before the first byte. Reusing connections (keep-alive, HTTP/2), CDNs (shorter RTT), TLS session resumption and HTTP/3 remove most of this.
## DNS in Practice - Examples
### Setting up DNS for a new website (resourcescse.example)
| Record | Name | Value | Why |
|---|---|---|---|
| A | @ (root) | 76.76.21.21 | the site's IP (e.g. Vercel / your server) |
| CNAME | www | cname.vercel-dns.com | www points to the hosting provider |
| MX | @ | 1 smtp.google.com | email for the domain goes to Gmail / Workspace |
| TXT | @ | v=spf1 include:_spf.google.com ~all | only Google may send mail as this domain |
| TXT | google._domainkey | v=DKIM1; k=rsa; p=MIIB... | DKIM key to sign outgoing mail |
| TXT | _dmarc | v=DMARC1; p=quarantine; rua=mailto:dmarc@... | what to do with mail failing SPF / DKIM |
| TXT | @ | google-site-verification=abc123 | prove ownership to Google Search Console |
| CAA | @ | 0 issue "letsencrypt.org" | only this CA may issue certificates |
### dig output explained
```txt
$ dig www.github.com
;; QUESTION SECTION:
;www.github.com.            IN  A
;; ANSWER SECTION:
www.github.com.     3600    IN  CNAME  github.com.        <- www is an alias, cached for 3600 s
github.com.           60    IN  A      20.207.73.82       <- the real IP, cached for 60 s
;; Query time: 12 msec
;; SERVER: 192.168.1.1#53                                  <- your router forwarded the query
```
### DNS TTL and propagation
- You change the A record from the old server to a new server, but some users still reach the old one for hours. Reason: resolvers around the world **cached** the old answer for its **TTL**. "Propagation" is really caches expiring.
- Best practice before a migration: lower the TTL to 60-300 seconds a day earlier, switch, confirm, then raise the TTL again.
### DNS-based load balancing and failover
- **Round-robin DNS**: several A records; clients spread across them (no health awareness).
- **GeoDNS / latency routing**: users in India get the Mumbai IP, users in the US get the Virginia IP (Route 53, Cloudflare).
- **Failover routing**: health checks; if the primary region fails, DNS answers with the backup IP (time to switch is limited by the TTL).
- **Anycast**: the same IP announced from many locations (Cloudflare 1.1.1.1, Google 8.8.8.8); BGP routes each user to the nearest one.
## Case Studies and Troubleshooting Scenarios
### Scenario 1: "The website is not opening" - a systematic approach
@flow (User: site not loading) | Is it only you? Check from phone data / downdetector | DNS: nslookup site.com - does it return an IP? | Reachability: ping / traceroute to the IP | Port open? curl -v https://site.com or nc -zv site.com 443 | TLS: any certificate error in curl -v? | HTTP: which status code? (4xx = request problem, 5xx = server problem) | (Server side: logs, load balancer health checks, recent deploys) :: Troubleshooting by layer (bottom-up)
| Symptom | Likely cause | Check / fix |
|---|---|---|
| "DNS_PROBE_FINISHED_NXDOMAIN" | domain does not resolve (typo, expired domain, missing record) | dig site.com; fix records / renew domain |
| "This site can't be reached / timed out" | firewall, server down, wrong IP, security group blocks 443 | ping, nc -zv, cloud firewall rules |
| "Connection refused" | nothing listening on that port | ss -tulpn on the server, start the service |
| "Your connection is not private" | expired / wrong-domain / self-signed certificate | renew cert (certbot), include www in the cert |
| 502 Bad Gateway | proxy cannot talk to the app (app crashed, wrong upstream port) | app logs, systemctl status, Nginx upstream |
| 504 Gateway Timeout | app too slow (slow DB query, external API) | slow-query log, add timeouts, caching |
| 503 | overloaded or maintenance | autoscaling, rate limits |
| works on Wi-Fi, not on mobile data | IPv6 / DNS / MTU issue on one network | test with dig AAAA, change DNS |
### Scenario 2: the website is slow - where does the time go?
```sh
curl -o /dev/null -s -w "dns=%{time_namelookup} tcp=%{time_connect} tls=%{time_appconnect} first_byte=%{time_starttransfer} total=%{time_total}\n" https://example.com
# dns=0.012 tcp=0.045 tls=0.110 first_byte=1.900 total=2.050
```
- Here DNS, TCP and TLS are fast; **time to first byte is 1.9 s** -> the server / database is slow, not the network. Fix: profile the API, add indexes, cache results (Redis), use a CDN for static files.
- If **TCP** were slow -> far away server (use a CDN / closer region). If **TLS** were slow -> enable session resumption / HTTP/3. If the **download** were slow -> compress (gzip / brotli), smaller images (WebP), fewer requests.
### Scenario 3: users log in but are logged out on the next page
- Cause: the session cookie is not sent back. Typical reasons: `Secure` cookie on an http:// site; `SameSite=Strict` while coming from another site; cookie `Domain` set to `app.site.com` but the API is on `api.site.com`; sessions stored in memory on server A while the load balancer sends the next request to server B.
- Fix: correct cookie attributes, shared session store (Redis) or sticky sessions, same-site deployment or `credentials: "include"` + proper CORS.
### Scenario 4: e-commerce flash sale - network and HTTP design
- Problem: 500,000 users open the sale page at 12:00.
- Solution: static pages and images on a **CDN**; DNS with low TTL and multiple regions; **load balancers** with autoscaling app servers; **HTTP caching** headers for product data (short max-age); **rate limiting** (429) per user and IP; a **queue / waiting room** before checkout; **keep-alive + HTTP/2** to cut connection overhead; DDoS protection at the edge (Cloudflare / AWS Shield).
- Seat / stock correctness under concurrency is in notebook 12 (Concurrency Scenarios).
### Scenario 5: email from the website goes to spam
- Causes: no SPF / DKIM / DMARC records, sending from a free Gmail address with a different domain in "From", new domain with no reputation, spammy content.
- Fix: publish SPF, DKIM, DMARC TXT records; send from your own domain via a proper provider; consistent "From"; a plain-text version; ask users to mark "Not spam" (which is why this portal tells students to check spam).
### Scenario 6: a video call is choppy but browsing is fine
- Real-time media uses **UDP** (RTP / WebRTC): it hates **jitter** and **packet loss** but needs little bandwidth. Browsing (TCP) just retransmits and feels fine.
- Check: `ping -c 100` for loss and jitter; move closer to the router or use 5 GHz / Ethernet; stop big downloads (bufferbloat); enable QoS on the router.
### Scenario 7: you cannot reach a server in a private subnet on AWS
- Path: your laptop -> internet -> the instance has no public IP (private subnet) -> unreachable by design.
- Options: bastion host (SSH jump), AWS Systems Manager Session Manager, VPN / Direct Connect. For the server to download updates: a **NAT gateway** in a public subnet and a route 0.0.0.0/0 -> NAT (notebook 09).
### Scenario 8: designing a college campus network
@layers Internet (two ISPs for redundancy) | Edge router + firewall (NAT, VPN for staff) | Core switches (layer 3, redundant) | Distribution switches per building | Access switches + Wi-Fi access points | VLANs: students, staff, labs, servers, CCTV, guests :: Campus network design
- Addressing: 10.0.0.0/8 split with VLSM per VLAN (e.g. students 10.10.0.0/16, staff 10.20.0.0/22, servers 10.30.0.0/24); DHCP per VLAN with relays; internal DNS; firewall rules between VLANs (students cannot reach the exam server); captive portal for guests; WPA3-Enterprise (802.1X) with student login; content filtering; monitoring with SNMP / NetFlow.
## Last-Minute Networking Formulas and Facts
| Item | Value / formula |
|---|---|
| Hosts in a subnet | 2^(32 - prefix) - 2 |
| Block size | 256 - last non-255 mask octet |
| Transmission delay | packet size / bandwidth |
| Propagation delay | distance / signal speed (about 2 x 10^8 m/s in fibre) |
| Throughput upper bound for TCP | window size / RTT |
| Bandwidth-delay product | bandwidth x RTT (bytes "in flight" to fill the pipe) |
| Ethernet MTU | 1500 bytes |
| IPv4 header | 20-60 bytes; TCP header 20-60; UDP header 8 |
| TCP handshake | 1 RTT; TLS 1.3 adds 1 RTT; QUIC combines both in 1 RTT |
- Example: 1 Gbps link, 1500-byte packet: transmission delay = 12,000 bits / 10^9 = 12 microseconds. 2,000 km of fibre: propagation = 2 x 10^6 / 2 x 10^8 = 10 ms. A 64 KB window with 100 ms RTT limits TCP to 64 KB / 0.1 s = 640 KB/s no matter how fast the link is (hence window scaling).
