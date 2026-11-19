# Cyber Security Engineer: Network Defense, Cryptography & AppSec
A comprehensive cybersecurity notebook covering the CIA Triad, cryptographic algorithms (AES, RSA, ECC), PKI & TLS handshakes, OWASP Top 10 vulnerabilities, and Zero Trust network defense.

## The Foundations: CIA Triad & Threat Modeling
- **Confidentiality:** Ensuring only authorized parties can read sensitive data (encryption, access controls).
- **Integrity:** Ensuring data cannot be modified or tampered with unnoticed (cryptographic hashing, digital signatures, MACs).
- **Availability:** Ensuring critical systems remain operational for legitimate users under attack (DDoS protection, redundant failover, rate limiting).
- **Non-Technical Real-Life Analogy (The Bank Safety Deposit Box):**
  - **Confidentiality:** The private key in your pocket ensures only you and the bank officer can open the safe box.
  - **Integrity:** The wax seal stamped across the envelope seam ensures that if anyone peeled it open in transit, the broken wax immediately exposes the tampering.
  - **Availability:** The bank branch remaining open with bulletproof doors and emergency backup generators even during a regional power blackout.

@tree [CIA Security Triad] -> [Confidentiality (AES-256, RBAC), Integrity (SHA-256, HMAC, Signatures), Availability (Cloudflare WAF, Anycast DNS)] :: Core Cyber Security Triad

## Cryptography: Symmetric vs Asymmetric vs Hashing
| Primitive | Key Requirement | Performance | Common Algorithms | Ideal Use Case |
|---|---|---|---|---|
| **Symmetric Encryption** | Single shared secret key | Extremely fast (hardware-accelerated AES-NI) | AES-256-GCM, ChaCha20-Poly1305 | Encrypting databases, disk storage, TLS session traffic |
| **Asymmetric Encryption** | Public key (encrypt) + Private key (decrypt) | Slow (~1,000x slower than symmetric) | RSA-4096, ECC (X25519, Ed25519) | Initial TLS key exchange, SSH authentication, digital signatures |
| **Cryptographic Hashing** | One-way mathematical function (no key) | Deterministic & irreversible | SHA-256, SHA-3 | File integrity verification, Git commit hashes, blockchain blocks |
| **Password Hashing** | Salted + Computationally expensive (work factor) | Intentionally slow with memory hardness | Argon2id, bcrypt, PBKDF2 | User password storage in database |

### AES-256-GCM in Python
```python
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

# 256-bit symmetric key (32 bytes)
key = AESGCM.generate_key(bit_length=256)
aesgcm = AESGCM(key)

# 96-bit unique nonce per encryption (12 bytes) - NEVER REUSE A NONCE WITH THE SAME KEY!
nonce = os.urandom(12)
plaintext = b"Confidential customer credit card number: 4111-2222-3333-4444"
aad = b"user-account-id-987"  # Additional authenticated data (authenticated but not encrypted)

# Encrypt: produces ciphertext + 128-bit authentication tag appended
ciphertext = aesgcm.encrypt(nonce, plaintext, aad)

# Decrypt: verifies tag first; throws InvalidTag exception if a single bit was tampered with!
decrypted_data = aesgcm.decrypt(nonce, ciphertext, aad)
print("Decrypted:", decrypted_data.decode())
```

## OWASP Top 10 Web Application Vulnerabilities
1. **Broken Access Control (BOLA / IDOR):**
   - *Vulnerability:* Attendant visits `GET /api/invoices/1042` without backend verifying that invoice 1042 belongs to the calling user.
   - *Remediation:* Always enforce `WHERE id = ? AND tenant_id = ?`.
2. **Cryptographic Failures:** Storing passwords with plaintext or MD5/SHA1; transmitting unencrypted HTTP.
3. **Injection (SQLi & Command Injection):**
   - *Vulnerability:* `SELECT * FROM users WHERE email = '` + email + `'`
   - *Remediation:* Always use parameterized prepared statements.
4. **Server-Side Request Forgery (SSRF):**
   - *Vulnerability:* Attacker feeds `http://169.254.169.254/latest/meta-data/` to a webhook image thumbnail generator to steal cloud IAM credentials.
   - *Remediation:* Restrict outgoing HTTP clients to public IPs only and block loopback/metadata addresses (`127.0.0.1`, `169.254.169.254`, `10.0.0.0/8`).

@flow [User Browser HTTPS Request] | [Cloudflare WAF / DDoS Mitigation] | [TLS 1.3 Termination & Reverse Proxy] | [API Gateway Rate Limiter & JWT Verifier] | [VPC Private Subnet Microservice] | (Protected Postgres Database) :: Defense-in-Depth Web Application Security Architecture
