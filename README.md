#  Temporal Asset Vault

This project is a backend system that simulates a digital asset vault.  
It uses **Temporal** for orchestrating transaction workflows, **Redis** for data storage and messaging, and a **Node.js/Express** API built with TypeScript.

---

##  Prerequisites

Before you begin, ensure you have the following installed and running:

- **Node.js:** Version `v16.20.2` or higher is recommended.  
- **Temporal Server:** The workflow engine must be running.  
- **Redis:** The Redis database server must be running.  


---

##  Implementation Details

###  Express.js
- Provides a RESTful API for authentication, asset management, and transaction tracking.  
- Routes under `/api` expose endpoints for `auth`, `assets`, and `transactions`.  
- Controllers handle request validation, forward commands to Temporal Workflows, and return responses.

---

### TypeScript (Required)
- Enforced project-wide via `tsconfig.json`.  
- All APIs use **DTOs (Data Transfer Objects)** for input validation.  
- **Generics, types, and enums** ensure strong typing, e.g.:
  - `enum TransactionStatus { PENDING, SUCCESS, FAILED }`
  - `type AssetSymbol = "BTC" | "ETH" | "USD"`
  - Generics used for reusable service logic.

---

###  Redis
- **Storage**: Keeps balances keyed per user, e.g. `user:{id}:balance:BTC`.  
- **Events (Pub/Sub)**: Publishes transaction events into Redis channels:
  - `auth:login:success`
  - `deposit:success`, `deposit:failed`
  - `withdraw:success`, `withdraw:failed`  


---

###  Temporal SDK (TypeScript)
- Orchestrates **deterministic transaction workflows**.  
- Implements **`ProcessTransactionWorkflow`** with built-in retries and cancellation handling.  
- Activities:
  1. `validateInputActivity` → Ensures request body is valid.  
  2. `updateBalanceActivity` → Checks/updates balance in Redis.  
  3. `publishEventActivity` → Publishes success/failure events to Redis.  
- Supports simulated **latency** (`sleep(5000)`) for long-running operations.  
- Handles **workflow retries** on transient errors.  
- Supports **workflow cancellation** for aborted transactions.

---

### Testing (Jest)
- Unit tests for services, DTOs, and workflow activities.  
- API integration tests for `/auth`, `/assets`, `/transactions`.  
- Mock Redis and Temporal for isolated tests.

---

### ESLint + Prettier
- Enforces code style consistency and catches TypeScript errors early.  
- Configured for `airbnb-base` style with TypeScript support.

---

###  Audit Logs & Tracing
- Each API request and workflow execution produces structured logs.  
- Events include:
  - User logins
  - Transaction start/end
  - Workflow retries or failures  

---

###  Multi-User Support
- Authentication via **JWT tokens**.  
- User-specific balances in Redis (e.g., `user:123:balance:BTC`).  
- Prevents cross-user data leakage.
---


## Manual Local Setup

Make sure you have a local instance of the Temporal Server and Redis running.

Navigate to the project's root folder:
```bash
cd temporal-asset-vault
```

Install all required dependencies:
```bash
npm install
```

In one terminal window, start the API server:
```bash
npm run start:dev
```

Open a second terminal window and start the Temporal worker:
```bash
npm run worker:dev
```

---

## Project Structure

The project is organized with a clear separation of concerns to enhance maintainability and scalability.
```
temporal-asset-vault/
├── .gitignore
├── Dockerfile.express
├── Dockerfile.worker
├── jest.config.js
├── package-lock.json
├── package.json
├── tsconfig.json
├── node_modules/       # Managed by NPM
├── dist/               # Compiled TypeScript output
└── src/                # Application source code
    ├── __test__/       # Test files
    ├── db/             # Database connections (Redis)
    ├── dtos/           # Data Transfer Objects for validation
    ├── handlers/       # Request handlers and business logic
    ├── models/         # Data models and types
    ├── routes/         # Express route definitions
    └── temporal/       # Workflows, activities, and worker
    └── index.ts   
```

---

## API Endpoints

All API routes are prefixed with `/api`.

| Endpoint | Method | Description | Request Body |
|----------|--------|-------------|--------------|
| `/auth/register` | POST | Registers a new user | `{ "email": "string", "password": "string" }` |
| `/auth/login` | POST | Logs in a user, returns JWT | `{ "email": "string", "password": "string" }` |
| `/assets` | GET | Fetches all asset balances for the user | None (requires JWT) |
| `/assets/deposit` | POST | Starts a Temporal workflow to deposit asset | `{ "symbol": "string", "amount": number }` |
| `/assets/withdraw` | POST | Starts a Temporal workflow to withdraw asset | `{ "symbol": "string", "amount": number }` |
| `/transactions/:workflowId` | GET | Gets the current status of a transaction workflow | None (requires JWT) |

**Note:** All asset and transaction routes require a valid JWT Bearer token in the Authorization header.

---

## Assumptions

- Temporal Server and Redis are running and accessible
- JWT tokens are used for authentication
- Asset symbols are limited to common cryptocurrencies (BTC, ETH, USD)
- Transaction workflows are long-running and may take several seconds
- Redis is used for both data storage and event publishing
- The system is designed for demonstration/learning purposes

---

## Development

### Available Scripts

- `npm run start:dev` - Start the development server
- `npm run worker:dev` - Start the Temporal worker
- `npm run build` - Build the TypeScript project
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier


• Express API: http://localhost:3000
* Temporal Web UI: http://localhost:8088
* Redis: localhost:6379
* Temporal Server: localhost:7233


---

## Contributing

1. Ensure all tests pass
2. Follow the established code style (ESLint + Prettier)
3. Add tests for new functionality
4. Update documentation as needed


