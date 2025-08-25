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

## API Request Examples

### Authentication Examples

#### 1. User Registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mishary@gmail.com",
    "password": "1234"
  }'
```

**Request Body:**
```json
{
  "email": "mishary@gmail.com",
  "password": "1234"
}
```

**Response:**
```json
{
    "message": "Registration successful",
    "userId": "54b21eec-ef6d-4fc3-bd88-df3ef6120609"
}
```

#### 2. User Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mishary@gmail.com",
    "password": "1234"
  }'
```

**Request Body:**
```json
{
  "email": "mishary@gmail.com",
  "password": "1234"
}
```

**Response:**
```json
{
    "message": "Login successful",
    "token": "example"
}
```

### Asset Management Examples

#### 3. Get User Assets (Requires JWT)
```bash
curl -X GET http://localhost:3000/api/assets \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
{
    "assets": [
        {
            "symbol": "BTC",
            "balance": "0.20"
        }
    ],
    "message": "Assets fetched successfully"
}
```

#### 4. Deposit Asset (Requires JWT)
```bash
curl -X POST http://localhost:3000/api/assets/deposit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "symbol": "BTC",
    "amount": 0.1
  }'
```

**Request Body:**
```json
{
  "symbol": "BTC",
  "amount": 0.1
}
```

**Response:**
```json
{
    "message": "Deposit process initiated.",
    "workflowId": "transaction-66b83ab9-ff5b-4283-9704-a775abb696ff"
}
```

#### 5. Withdraw Asset (Requires JWT)
```bash
curl -X POST http://localhost:3000/api/assets/withdraw \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "symbol": "ETH",
    "amount": 0.5
  }'
```

**Request Body:**
```json
{
  "symbol": "ETH",
  "amount": 0.5
}
```

**Response:**
```json
{
    "message": "Withdrawal process initiated.",
    "workflowId": "transaction-66b83ab9-ff5b-4283-9704-a775abb696ff"
}
```

### Transaction Status Examples

#### 6. Get Transaction Status (Requires JWT)
```bash
curl -X GET http://localhost:3000/api/transactions/workflowId:deposit_workflow_abc123 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
{
    "status": "completed",
    "message": "withdraw Succeeded"
}
```

---

## Assumptions

- Temporal Server and Redis are running and accessible
- Authentication header must be included in all the request to assets or transsactions
- Asset symbols and balance both are String type to ensure consistanty
- Transaction workflows are long-running and may take several seconds (30sec)
- Redis is used for both data storage and event publishing 

---

## Important Notes

### Docker Limitations

**The Docker files in this project (`Dockerfile.express` and `Dockerfile.worker`) are provided for reference but will NOT work properly when running the containers.** Here's why:

1. **Temporal Server Dependency**: The Express API and Temporal Worker containers require a running Temporal Server to function properly. The Docker setup does not include the Temporal Server.

2. **Redis Connection Issues**: Both containers need to connect to Redis, but the Docker configuration doesn't establish proper networking between containers.

3. **Complex Networking Issues**: Even when using a proper `docker-compose.yml` with Temporal Server image, there are persistent networking issues between the Express API, Temporal Worker, and Temporal Server containers that make the setup unreliable.

4. **Port Conflicts**: The containers may have port conflicts with your local development environment.

### If You Want to Use Docker

To make Docker work, you would need to:

1. **Add Temporal Server** to your Docker setup
2. **Add Redis** container with proper networking
3. **Create a proper `docker-compose.yml`** file
4. **Configure environment variables** for inter-service communication
5. **Set up proper networking** between containers

**Recommendation**: For ease of use and reliability, stick with the local development setup using `npm run start:dev` and `npm run worker:dev`.

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


