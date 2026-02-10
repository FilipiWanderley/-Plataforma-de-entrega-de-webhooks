# Backend - Webhook Platform

## Requirements
- Java 17
- Maven 3.8+
- Docker (for Integration Tests)

## Quality Gates & Commands

This project uses strictly enforced code quality standards (Google Java Format, Checkstyle, PMD, SpotBugs).

### Formatting (Spotless)
To check if code is formatted correctly:
```bash
mvn spotless:check
```
To **fix** formatting automatically:
```bash
mvn spotless:apply
```

### Linting & Static Analysis
Run all quality checks (Checkstyle, PMD, SpotBugs) without running tests:
```bash
mvn verify -DskipTests
```

### Testing
Run unit and integration tests:
```bash
mvn test
```

### Full Verification (Build + Test + Quality)
```bash
mvn verify
```

## Architecture (Hexagonal)

This project strictly follows Hexagonal Architecture (Ports and Adapters). Violations are blocked by ArchUnit tests.

### Layers & Rules
1.  **Domain** (`com.webhook.platform.domain`)
    *   **Core business logic only.**
    *   MUST NOT depend on Spring, Web, Persistence, or Infrastructure.
    *   Dependencies allowed: Standard Java Libraries, `lombok`.

2.  **Application** (`com.webhook.platform.application`)
    *   **Orchestration layer** (Services, Commands, Use Cases).
    *   MUST depend ONLY on **Domain**.
    *   MUST define **Ports** (Interfaces) for external communication (Repositories, Clients).

3.  **Adapters** (`com.webhook.platform.adapters`)
    *   **In** (`.in`): Web Controllers, Listeners. Depend on `Application`.
    *   **Out** (`.out`): Implementations of Application Ports (Rest Clients, Persistence). Depend on `Application` and `Domain`.

4.  **Infrastructure** (`com.webhook.platform.infra`)
    *   **Configuration & Frameworks** (Spring Config, Security, Database setup).
    *   Wires everything together.

### Verification
Architecture rules are enforced by `ArchitectureTest.java`. Run:
```bash
mvn test -Dtest=ArchitectureTest
```

## CI/CD
The project uses GitHub Actions to enforce these rules on every Pull Request.
- **Spotless**: Fails if code is not formatted.
- **Checkstyle**: Fails on naming conventions, imports, etc.
- **SpotBugs/PMD**: Fails on bugs and code smells.
