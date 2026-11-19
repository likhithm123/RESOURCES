# REST APIs, HTTP and FastAPI - Complete Guide
Every app you use talks to a server through APIs. This notebook explains, in simple words, what an API is, how HTTP works (methods, status codes, headers, cookies, HTTPS, versions), how to design clean REST APIs, authentication, security, versioning, pagination, errors, documentation, testing, and then FastAPI from zero to production with a full project. Also GraphQL, gRPC, WebSockets and webhooks.
## What is an API
- **API** = Application Programming Interface: a set of rules that lets one program ask another program for data or to do something.
- Restaurant analogy: you (the **client**) do not walk into the kitchen (the **server / database**). You give your order to the **waiter (the API)**, who takes it to the kitchen and brings back the food (the **response**). The menu = the **API documentation**.
@chain Mobile app (client) -> request: GET /menu -> API server -> database -> response: JSON menu -> app shows it :: Client - API - server
- Types: **web APIs** (over HTTP: REST, GraphQL, gRPC, SOAP), **library APIs** (functions of a library), **OS APIs** (system calls).
- Web APIs return data, usually **JSON**: `{"id": 7, "name": "Asha", "skills": ["python", "sql"]}`.
## HTTP - The Language of the Web
### Request and response
- **HTTP** (HyperText Transfer Protocol) is a request-response protocol: the client sends a **request**, the server sends back a **response**. It runs over TCP (HTTP/1.1, HTTP/2) or QUIC/UDP (HTTP/3).
```txt
POST /api/v1/users HTTP/1.1                 <- method, path, version
Host: api.example.com                       <- headers
Content-Type: application/json
Authorization: Bearer eyJhbGciOi...
Accept: application/json

{"name": "Asha", "email": "asha@x.com"}     <- body

HTTP/1.1 201 Created                        <- version, status code, reason
Content-Type: application/json
Location: /api/v1/users/42
Cache-Control: no-store

{"id": 42, "name": "Asha", "email": "asha@x.com"}
```
| Part | Meaning |
|---|---|
| URL | https://api.example.com:443/api/v1/users?role=admin&page=2#top = scheme, host, port, path, query string, fragment |
| Method | what to do (GET, POST, PUT, PATCH, DELETE...) |
| Headers | metadata: content type, auth, caching, cookies |
| Body | the data (JSON, form, file) - not used with GET |
| Status code | result of the request (200, 404...) |
### HTTP methods
| Method | Meaning | Body | Safe (no change) | Idempotent (same result if repeated) |
|---|---|---|---|---|
| GET | read a resource | no | yes | yes |
| POST | create / trigger an action | yes | no | no (two POSTs = two orders) |
| PUT | replace a resource completely | yes | no | yes |
| PATCH | update some fields | yes | no | not guaranteed |
| DELETE | remove a resource | usually no | no | yes |
| HEAD | like GET but headers only | no | yes | yes |
| OPTIONS | which methods are allowed (CORS preflight) | no | yes | yes |
- **Idempotent** = doing it once or ten times leaves the same state. Important for **retries**: a network timeout on PUT can be retried safely; POST needs an **Idempotency-Key** to be safe.
### Status codes
| Range | Meaning | Common codes |
|---|---|---|
| 1xx | informational | 101 Switching Protocols (WebSocket upgrade) |
| 2xx | success | 200 OK, 201 Created, 202 Accepted (processing later), 204 No Content |
| 3xx | redirection | 301 Moved Permanently, 302 Found, 304 Not Modified (use cache), 307 / 308 redirect keeping the method |
| 4xx | client error (your request is wrong) | 400 Bad Request, 401 Unauthorized (not logged in), 403 Forbidden (logged in but not allowed), 404 Not Found, 405 Method Not Allowed, 409 Conflict, 410 Gone, 415 Unsupported Media Type, 422 Unprocessable (validation failed), 429 Too Many Requests |
| 5xx | server error (the server failed) | 500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout |
> 401 means "who are you?" (missing or invalid login). 403 means "I know who you are, but you are not allowed".
### Important headers
| Header | Purpose |
|---|---|
| Content-Type / Accept | format of the body sent / wanted (application/json, multipart/form-data) |
| Authorization | credentials: Bearer token, Basic, API key schemes |
| Cookie / Set-Cookie | browser cookies (session ids) |
| Cache-Control, ETag, Last-Modified, If-None-Match | caching and conditional requests |
| Location | URL of a newly created resource or redirect target |
| User-Agent | which client is calling |
| Origin, Access-Control-Allow-Origin | CORS (cross-origin rules) |
| X-Request-ID / traceparent | trace one request across services |
| Retry-After | when to retry after 429 / 503 |
| Idempotency-Key | make POST safe to retry |
| Content-Encoding | gzip / br compression |
| Strict-Transport-Security, Content-Security-Policy, X-Frame-Options | security headers |
### HTTP versions and HTTPS
| Version | Key idea |
|---|---|
| HTTP/1.1 | text protocol, keep-alive connections, one request at a time per connection (head-of-line blocking) |
| HTTP/2 | binary, many requests multiplexed on one connection, header compression |
| HTTP/3 | runs on QUIC over UDP, faster connection setup, no TCP head-of-line blocking, better on mobile |
- **HTTPS** = HTTP over **TLS**: encrypts traffic (nobody on the Wi-Fi can read it), proves the server's identity (certificate from a trusted authority) and prevents tampering.
@flow (Client hello: supported ciphers) | Server hello + certificate (proves the domain) | Key exchange (ECDHE) -> both sides compute the same secret key | (Encrypted HTTP requests and responses) :: TLS handshake in short
- HTTP is **stateless**: each request carries everything needed (token / cookie). Cookies, sessions and JWT are explained in notebook 12 (Cookies vs Sessions vs Tokens).
### What happens when you type a URL (classic interview question)
@flow (Type https://example.com) | DNS lookup -> IP address | TCP handshake (SYN, SYN-ACK, ACK) | TLS handshake | HTTP GET request | Load balancer -> web server -> app -> database | Response HTML | (Browser parses HTML, loads CSS / JS / images, renders the page) :: From URL to page
## REST - Representational State Transfer
- **REST** is a style (not a protocol) for designing web APIs around **resources** (nouns like users, orders) that are manipulated with standard HTTP methods.
| REST constraint | Meaning |
|---|---|
| Client-server | UI and data storage are separated |
| Stateless | every request contains all needed info; no client session stored on the server between requests (tokens) |
| Cacheable | responses say whether they can be cached |
| Uniform interface | resources identified by URLs, standard methods, representations (JSON), self-descriptive messages, HATEOAS (links to next actions) |
| Layered system | proxies, gateways, load balancers can sit in between |
| Code on demand (optional) | server can send code (JavaScript) |
### Designing good REST endpoints
| Action | Endpoint |
|---|---|
| list users | GET /api/v1/users |
| create a user | POST /api/v1/users |
| get one user | GET /api/v1/users/42 |
| replace a user | PUT /api/v1/users/42 |
| update some fields | PATCH /api/v1/users/42 |
| delete a user | DELETE /api/v1/users/42 |
| orders of a user (sub-resource) | GET /api/v1/users/42/orders |
| filter, sort, paginate | GET /api/v1/orders?status=paid&sort=-created_at&limit=20&cursor=abc |
| an action that is not CRUD | POST /api/v1/orders/42/cancel |
- Rules: **nouns not verbs** (`/users`, not `/getUsers`), **plural** collection names, lowercase with hyphens (`/order-items`), nesting at most 2 levels, consistent JSON field style (snake_case or camelCase - pick one), return the created resource with **201 + Location**, never return passwords or internal fields.
### Pagination, filtering and sorting
| Style | How | Pros / cons |
|---|---|---|
| Offset | ?limit=20&offset=40 | simple, jump to page N; slow and inconsistent on large / changing tables |
| Page | ?page=3&size=20 | same as offset |
| Cursor / keyset | ?limit=20&cursor=<last id or timestamp> | fast and stable for feeds and infinite scroll; no page jumping |
```json
{ "data": [ {"id": 101}, {"id": 102} ], "next_cursor": "eyJpZCI6MTAyfQ", "has_more": true }
```
### Errors - a consistent format
```json
{
  "error": { "code": "VALIDATION_FAILED", "message": "email is not valid",
             "details": [ { "field": "email", "issue": "must contain @" } ], "request_id": "req_8f2a" }
}
```
- Standard option: RFC 9457 "Problem Details" (`type`, `title`, `status`, `detail`, `instance`). Never send stack traces to clients.
### Versioning
| Method | Example |
|---|---|
| URL path (most common) | /api/v1/users, /api/v2/users |
| Header | Accept: application/vnd.example.v2+json |
| Query | /users?version=2 |
- Add fields freely (backward compatible); create a new version only for **breaking** changes (removing / renaming fields, changing meaning). Announce deprecation with dates.
### Caching and conditional requests
- `Cache-Control: public, max-age=300` lets browsers / CDNs reuse a response for 5 minutes. `no-store` for private data.
- **ETag**: the server sends a fingerprint of the response; the client sends `If-None-Match: <etag>` next time; if unchanged the server replies **304 Not Modified** with no body (saves bandwidth). `If-Match` on PUT prevents overwriting someone else's change (optimistic locking -> 412 Precondition Failed).
### Rate limiting
- Protect the API: e.g. 100 requests per minute per user. Reply **429** with `Retry-After`, and headers like `X-RateLimit-Limit`, `X-RateLimit-Remaining`. Algorithms (token bucket etc.) are in notebook 12.
## Authentication and Authorization for APIs
- **Authentication** = who are you? **Authorization** = what are you allowed to do?
| Method | How | Use |
|---|---|---|
| API key | secret key in a header (X-API-Key) | server-to-server, simple public APIs |
| Basic auth | base64(username:password) in Authorization header, only over HTTPS | internal tools, old systems |
| Session cookie | login creates a server session, id in an HttpOnly cookie | classic web apps |
| JWT bearer token | signed token in Authorization: Bearer ... | SPAs, mobile, microservices |
| OAuth 2.0 | delegated access: "Log in with Google", apps acting on your behalf with scoped tokens | third-party access |
| OpenID Connect (OIDC) | identity layer on OAuth 2.0 (ID token tells who the user is) | single sign-on |
| mTLS | both client and server present certificates | service-to-service in zero-trust networks |
@flow (User clicks "Sign in with Google") | App redirects to Google with client_id, scopes, redirect_uri, PKCE challenge | User logs in at Google and approves | Google redirects back with a short-lived authorization code | App's server exchanges code (+ PKCE verifier) for access + ID tokens | (App knows the user and can call APIs with the access token) :: OAuth 2.0 Authorization Code flow with PKCE
- **JWT** structure: `header.payload.signature`. Payload holds claims (`sub` user id, `exp` expiry, `role`). Verify the signature and `exp` on every request; keep access tokens short-lived (5-15 min) with refresh tokens.
- **Authorization models**: RBAC (role-based: admin, editor, viewer), ABAC (attribute-based: department, time, ownership), and always check **object-level** access ("is this order yours?").
## API Security Checklist (OWASP API Top 10 in practice)
| Risk | Example | Defence |
|---|---|---|
| Broken object-level authorization (BOLA / IDOR) | GET /orders/1002 shows someone else's order | check ownership of every object on every request |
| Broken authentication | weak tokens, no expiry, credential stuffing | strong hashing (bcrypt / argon2), MFA, short tokens, lockouts, rate limits |
| Excessive data exposure | API returns the whole user row incl. password hash | response schemas with only needed fields |
| Mass assignment | client sends {"role": "admin"} and it is saved | accept only allowed fields (Pydantic models) |
| Lack of rate limiting | brute force, scraping, high bills | per-user / IP limits, quotas |
| Injection | SQL / NoSQL / command injection | parameterised queries, validation |
| SSRF | API fetches a URL given by the user -> internal network | allow-list destinations, block internal IPs |
| Security misconfiguration | debug mode, open CORS (*) with credentials, verbose errors | hardened config, strict CORS, generic errors |
| Improper inventory | forgotten old /v1 endpoints | API gateway inventory, retire old versions |
- Always: HTTPS, validate input, sanitize output, secrets in environment variables / secret managers, audit logs, security headers, dependency scanning.
## API Documentation and Testing
- **OpenAPI** (formerly Swagger): a YAML / JSON description of every endpoint, parameter and schema. Tools generate interactive docs (Swagger UI, Redoc), client SDKs and tests from it. FastAPI generates it automatically.
| Tool | Use |
|---|---|
| Postman / Insomnia / Bruno | send requests by hand, collections, environments |
| curl / HTTPie | command-line requests |
| pytest + httpx / requests | automated API tests in Python |
| REST Assured | API tests in Java |
| Newman | run Postman collections in CI |
| k6 / JMeter / Locust | load testing |
| Pact | contract testing between services |
```sh
curl -i https://api.example.com/api/v1/users/42 -H "Authorization: Bearer $TOKEN"
curl -X POST https://api.example.com/api/v1/users -H "Content-Type: application/json" -d '{"name":"Asha","email":"asha@x.com"}'
curl -X PATCH .../users/42 -d '{"name":"Asha M"}' -H "Content-Type: application/json"
curl -X DELETE .../users/42 -w "%{http_code}\n"
```
## FastAPI from Zero to Production
### Why FastAPI
- Python web framework built on **Starlette** (web) + **Pydantic** (validation). Very fast (async), automatic validation and error messages, automatic **OpenAPI docs** at `/docs`, type hints everywhere, great for AI / ML back ends.
```sh
python -m venv .venv && source .venv/bin/activate
pip install "fastapi[standard]" sqlalchemy "psycopg[binary]" "passlib[bcrypt]" "pyjwt" pytest httpx
fastapi dev app/main.py        # auto-reload dev server -> http://127.0.0.1:8000/docs
```
### Project structure
```txt
app/
  main.py            # create the FastAPI app, include routers, middleware
  config.py          # settings from environment variables (pydantic-settings)
  db.py              # database engine and session dependency
  models.py          # SQLAlchemy tables
  schemas.py         # Pydantic request / response models
  security.py        # password hashing, JWT
  routers/
    auth.py          # /auth/register, /auth/login
    notes.py         # /notes CRUD
tests/
  test_notes.py
Dockerfile
.env.example
```
### Settings, database and models
```py
# app/config.py
from pydantic_settings import BaseSettings
class Settings(BaseSettings):
    database_url: str = "sqlite:///./app.db"
    jwt_secret: str                         # required: read from the environment / .env
    jwt_minutes: int = 30
    class Config: env_file = ".env"
settings = Settings()

# app/db.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False)
class Base(DeclarativeBase): pass
def get_db():                               # dependency: one session per request, always closed
    db = SessionLocal()
    try: yield db
    finally: db.close()

# app/models.py
from sqlalchemy import String, ForeignKey, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(200))
class Note(Base):
    __tablename__ = "notes"
    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(120))
    body: Mapped[str] = mapped_column(Text, default="")
    created_at = mapped_column(DateTime(timezone=True), server_default=func.now())
```
### Schemas (Pydantic) - input and output shapes
```py
# app/schemas.py
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
class UserOut(BaseModel):                     # never includes the password hash
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: EmailStr
class NoteIn(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    body: str = ""
class NotePatch(BaseModel):
    title: str | None = Field(default=None, max_length=120)
    body: str | None = None
class NoteOut(NoteIn):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
```
### Security: hashing and JWT
```py
# app/security.py
from datetime import datetime, timedelta, timezone
import jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2 = OAuth2PasswordBearer(tokenUrl="/auth/login")
def hash_password(p: str) -> str: return pwd.hash(p)
def verify_password(p: str, h: str) -> bool: return pwd.verify(p, h)
def create_token(user_id: int) -> str:
    exp = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_minutes)
    return jwt.encode({"sub": str(user_id), "exp": exp}, settings.jwt_secret, algorithm="HS256")
def current_user(token: str = Depends(oauth2), db=Depends(get_db)) -> User:
    try: user_id = int(jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])["sub"])
    except jwt.PyJWTError: raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token", headers={"WWW-Authenticate": "Bearer"})
    user = db.get(User, user_id)
    if not user: raise HTTPException(401, "User not found")
    return user
```
### Routers - the endpoints
```py
# app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
router = APIRouter(prefix="/auth", tags=["auth"])
@router.post("/register", response_model=UserOut, status_code=201)
def register(body: UserCreate, db=Depends(get_db)):
    if db.query(User).filter_by(email=body.email).first(): raise HTTPException(409, "Email already registered")
    user = User(email=body.email, password_hash=hash_password(body.password))
    db.add(user); db.commit(); db.refresh(user)
    return user
@router.post("/login", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db=Depends(get_db)):
    user = db.query(User).filter_by(email=form.username).first()
    if not user or not verify_password(form.password, user.password_hash): raise HTTPException(401, "Wrong email or password")
    return Token(access_token=create_token(user.id))

# app/routers/notes.py
from fastapi import APIRouter, Depends, HTTPException, Query, Response
router = APIRouter(prefix="/notes", tags=["notes"])
def own_note(note_id: int, user=Depends(current_user), db=Depends(get_db)) -> Note:
    note = db.get(Note, note_id)
    if not note or note.owner_id != user.id: raise HTTPException(404, "Note not found")   # object-level authorization (no IDOR)
    return note
@router.get("", response_model=list[NoteOut])
def list_notes(q: str | None = None, limit: int = Query(20, ge=1, le=100), cursor: int | None = None,
               user=Depends(current_user), db=Depends(get_db)):
    query = db.query(Note).filter(Note.owner_id == user.id)
    if q: query = query.filter(Note.title.ilike(f"%{q}%"))
    if cursor: query = query.filter(Note.id < cursor)                         # cursor pagination
    return query.order_by(Note.id.desc()).limit(limit).all()
@router.post("", response_model=NoteOut, status_code=201)
def create_note(body: NoteIn, response: Response, user=Depends(current_user), db=Depends(get_db)):
    note = Note(owner_id=user.id, **body.model_dump()); db.add(note); db.commit(); db.refresh(note)
    response.headers["Location"] = f"/notes/{note.id}"
    return note
@router.get("/{note_id}", response_model=NoteOut)
def get_note(note: Note = Depends(own_note)): return note
@router.patch("/{note_id}", response_model=NoteOut)
def update_note(body: NotePatch, note: Note = Depends(own_note), db=Depends(get_db)):
    for k, v in body.model_dump(exclude_unset=True).items(): setattr(note, k, v)   # only fields that were sent
    db.commit(); db.refresh(note); return note
@router.delete("/{note_id}", status_code=204)
def delete_note(note: Note = Depends(own_note), db=Depends(get_db)): db.delete(note); db.commit()
```
### The app: middleware, errors, CORS, health
```py
# app/main.py
import time, uuid, logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
app = FastAPI(title="Notes API", version="1.0.0")
Base.metadata.create_all(engine)                       # use Alembic migrations in real projects
app.add_middleware(CORSMiddleware, allow_origins=["https://notes.example.com"], allow_credentials=True,
                   allow_methods=["GET", "POST", "PATCH", "DELETE"], allow_headers=["Authorization", "Content-Type"])
@app.middleware("http")
async def log_requests(request: Request, call_next):   # runs for every request
    rid = request.headers.get("X-Request-ID", uuid.uuid4().hex[:12]); start = time.perf_counter()
    response = await call_next(request)
    response.headers["X-Request-ID"] = rid
    logging.info("%s %s %s %.1fms", rid, request.method, request.url.path, (time.perf_counter() - start) * 1000)
    return response
@app.exception_handler(Exception)
async def unhandled(request: Request, exc: Exception):
    logging.exception("unhandled error")
    return JSONResponse(status_code=500, content={"error": {"code": "INTERNAL", "message": "Something went wrong"}})
@app.get("/health")
def health(): return {"status": "ok"}
app.include_router(auth.router); app.include_router(notes.router)
```
### Async, background tasks, file uploads, WebSockets
```py
import httpx, asyncio
from fastapi import BackgroundTasks, UploadFile, File, WebSocket
@app.get("/weather/{city}")
async def weather(city: str):                          # async: thousands of waiting requests on one worker
    async with httpx.AsyncClient(timeout=5) as client:
        r = await client.get("https://api.open-meteo.com/v1/forecast", params={"latitude": 18.5, "longitude": 73.8, "current": "temperature_2m"})
    return r.json()
def send_welcome_email(email: str): ...                # slow work
@app.post("/signup")
def signup(email: str, tasks: BackgroundTasks):
    tasks.add_task(send_welcome_email, email)          # runs after the response is sent
    return {"ok": True}
@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    if file.content_type not in {"image/png", "image/jpeg", "application/pdf"}: raise HTTPException(415, "Unsupported file type")
    data = await file.read(10 * 1024 * 1024 + 1)
    if len(data) > 10 * 1024 * 1024: raise HTTPException(413, "File too large")
    return {"name": file.filename, "size": len(data)}
@app.websocket("/ws/chat")
async def chat(ws: WebSocket):
    await ws.accept()
    while True:
        msg = await ws.receive_text()
        await ws.send_text(f"echo: {msg}")
```
- `def` endpoints run in a thread pool (fine for blocking DB drivers); `async def` endpoints must not call blocking code (use async drivers or `await asyncio.to_thread(...)`).
- Long jobs (video processing, ML training) go to a **queue** (Celery / RQ / Arq with Redis) and the API returns **202 Accepted** with a job id to poll.
### Testing FastAPI
```py
# tests/test_notes.py
from fastapi.testclient import TestClient
from app.main import app
client = TestClient(app)
def auth_header():
    client.post("/auth/register", json={"email": "t@example.com", "password": "passw0rd!"})
    token = client.post("/auth/login", data={"username": "t@example.com", "password": "passw0rd!"}).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
def test_create_and_read_note():
    h = auth_header()
    r = client.post("/notes", json={"title": "DSA", "body": "graphs"}, headers=h)
    assert r.status_code == 201 and r.headers["Location"].startswith("/notes/")
    assert client.get(f"/notes/{r.json()['id']}", headers=h).json()["title"] == "DSA"
def test_requires_login():
    assert client.get("/notes").status_code == 401
def test_validation():
    assert client.post("/notes", json={"title": ""}, headers=auth_header()).status_code == 422
```
### Deploying FastAPI
```txt
# Dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
RUN useradd -m appuser
USER appuser
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4", "--proxy-headers"]
```
- Run behind Nginx or a cloud load balancer (HTTPS), set secrets as environment variables, use Alembic for migrations, PostgreSQL in production, health checks on `/health`, structured logs, CI tests (notebook 25).
| FastAPI vs Flask vs Django REST Framework vs Spring Boot vs Express | |
|---|---|
| FastAPI | async, type hints, auto docs, best for APIs and AI back ends |
| Flask | minimal, flexible, synchronous by default |
| Django + DRF | batteries included (ORM, admin, auth), big apps |
| Spring Boot (Java) | enterprise standard (notebook 03) |
| Express / NestJS (Node) | JavaScript back ends (notebook 28) |
## Beyond REST
| Style | How | Best for |
|---|---|---|
| GraphQL | one endpoint; the client writes a query asking exactly the fields it needs | many screens needing different data, mobile apps, avoiding over / under-fetching |
| gRPC | HTTP/2 + Protocol Buffers (binary), generated clients, streaming | fast internal microservice calls |
| WebSockets | one long-lived two-way connection | chat, live games, collaborative editing |
| Server-Sent Events | server pushes a stream over HTTP | notifications, live scores, LLM token streaming |
| Webhooks | the server calls YOUR URL when something happens | payments (Razorpay / Stripe), GitHub events |
| SOAP | XML messages with strict contracts | older enterprise / banking systems |
```txt
# GraphQL query: the client chooses the fields
query {
  user(id: 42) { name  orders(last: 3) { id total status } }
}
```
```txt
// gRPC service definition (Protocol Buffers)
syntax = "proto3";
service Users { rpc GetUser (GetUserRequest) returns (User); }
message GetUserRequest { int64 id = 1; }
message User { int64 id = 1; string name = 2; string email = 3; }
```
- **Webhook security**: verify the HMAC signature header with your shared secret, check the timestamp (replay protection), make the handler idempotent, reply 2xx fast and process in the background.
## REST API Interview Questions
Q: What is REST?
A: An architectural style where resources are identified by URLs and manipulated with standard HTTP methods using stateless requests and representations like JSON, with cacheable responses and a uniform interface.
Q: PUT vs PATCH vs POST?
A: POST creates or triggers actions (not idempotent); PUT replaces the whole resource (idempotent); PATCH updates only given fields.
Q: What does idempotent mean and why does it matter?
A: Repeating the request leaves the same final state; it makes retries after timeouts safe. GET, PUT and DELETE are idempotent; POST needs an idempotency key.
Q: 401 vs 403?
A: 401: not authenticated (missing or invalid credentials). 403: authenticated but not permitted.
Q: How do you version an API?
A: Usually in the URL (/v1), creating a new version only for breaking changes, keeping additive changes backward compatible and deprecating old versions with notice.
Q: How do you secure a REST API?
A: HTTPS, strong authentication (OAuth2 / JWT / sessions), object-level authorization checks, input validation, rate limiting, least-privilege data exposure, secure headers and CORS, logging and monitoring.
Q: Offset vs cursor pagination?
A: Offset is simple but slow on large tables and shifts when data changes; cursor (keyset) pagination uses the last seen key, is fast and stable, ideal for feeds.
Q: What is CORS?
A: A browser rule that blocks a web page from calling a different origin unless the server allows it with Access-Control-Allow-* headers; preflight OPTIONS requests check permission first.
Q: REST vs GraphQL vs gRPC?
A: REST is simple, cacheable and resource-based; GraphQL lets clients pick fields from one endpoint; gRPC is a fast binary RPC for internal services with streaming.
Q: How would you design an API for long-running work?
A: Accept the request with 202 and a job id, process in a background queue, let the client poll GET /jobs/{id} or receive a webhook / SSE when done.
Q: Why FastAPI?
A: Automatic validation and documentation from type hints, high performance with async, dependency injection, and easy integration with Python AI / ML code.
Q: What is dependency injection in FastAPI?
A: Declaring needed resources (DB session, current user, settings) with Depends; FastAPI creates and passes them per request, making code reusable and testable.
