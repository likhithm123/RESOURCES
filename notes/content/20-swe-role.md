# Software Engineer (SWE) Role Guide & Engineering Excellence
A comprehensive operational handbook for Software Engineers detailing the modern software development life cycle (SDLC), code review standards, production debugging, metrics (SLAs/SLOs), and engineering culture.

## The Reality of the Software Engineer Role
- **Beyond Writing Code:** Writing code accounts for approximately 25-30% of a real SWE's working week. The remaining 70% comprises architectural design docs (RFCs), code reviews, cross-functional alignment with Product/Design, telemetry monitoring, on-call incident response, and writing automated tests.
- **Non-Technical Real-Life Analogy (Architect vs Builder vs Building Inspector):**
  - A novice assumes a software engineer is just a bricklayer slapping bricks together as fast as possible.
  - A real SWE is simultaneously the **Architect** (drafting earthquake-proof blueprints so the building doesn't collapse under 100,000 visitors), the **Lead Builder** (laying precise, clean brickwork that future builders can expand), and the **Building Inspector** (thoroughly reviewing every teammate's structural integrity before letting residents move in).

@layers Product Requirement Document (PRD) & Design RFC | Implementation & Modular Code | Automated CI/CD Testing (Unit, Integration, E2E) | Production Telemetry (SLOs, SLIs, Alerts) | Post-Mortem & Blameless RCA :: The Full-Stack SWE Engineering Loop

## Code Quality & The Clean Architecture Tenets
1. **SOLID Principles:**
   - **Single Responsibility:** A class or module should have one, and only one, reason to change.
   - **Open/Closed:** Software entities should be open for extension, but closed for modification.
   - **Liskov Substitution:** Subtypes must be substitutable for their base types without altering correctness.
   - **Interface Segregation:** Clients should not be forced to depend on interfaces they do not use.
   - **Dependency Inversion:** Depend upon abstractions, not concretions.
2. **The Boy Scout Rule:** Always leave the codebase cleaner than you found it. If you touch a file to add a feature, refactor one confusing variable name or eliminate one unused import.

## The Testing Pyramid
```
      /\
     /  \       E2E Tests (10%) - Slow, flaky, tests full browser flow (Playwright/Cypress)
    /----\
   /      \     Integration Tests (20%) - Tests service boundaries & database queries (Testcontainers)
  /--------\
 /          \   Unit Tests (70%) - Fast, isolated in-memory tests of pure business logic (Jest/Pytest)
/------------\
```

### Writing Maintainable Unit Tests (Arrange-Act-Assert)
```python
# Production payment fee calculator test
import pytest

def calculate_processing_fee(amount_cents: int, is_premium_tier: bool) -> int:
    """Calculates fee: 2.9% + 30 cents, or 1.5% + 15 cents for premium."""
    if amount_cents <= 0:
        raise ValueError("Transaction amount must be positive.")
    if is_premium_tier:
        return int(round(amount_cents * 0.015)) + 15
    return int(round(amount_cents * 0.029)) + 30

def test_standard_tier_fee_calculation():
    # Arrange
    amount = 10000  # $100.00
    is_premium = False
    
    # Act
    fee = calculate_processing_fee(amount, is_premium)
    
    # Assert
    assert fee == 320  # $2.90 + $0.30 = $3.20

def test_negative_amount_raises_value_error():
    with pytest.raises(ValueError, match="must be positive"):
        calculate_processing_fee(-500, False)
```
- **Time Complexity:** $O(1)$ constant time execution.
- **Space Complexity:** $O(1)$ minimal stack memory.

## Production Observability: SLAs, SLOs & SLIs
- **SLI (Service Level Indicator):** The actual metric measured in production (e.g., *“99.2% of GET /orders requests returned HTTP 200 within 250ms over the past 30 days”*).
- **SLO (Service Level Objective):** The internal engineering target (e.g., *“Our API must achieve 99.9% availability each month”*).
- **SLA (Service Level Agreement):** The contractual commitment to external paying customers with financial penalties if breached (e.g., *“If availability falls below 99.5%, we credit 15% of the monthly bill back to the enterprise customer”*).
- **Blameless Post-Mortems:** When an outage occurs, never blame an engineer. Focus on systemic safeguards: *Why was it possible for a single typo to drop production tables? Where was the automated migration dry-run?*
