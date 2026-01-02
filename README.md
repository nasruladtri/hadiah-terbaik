# KUA-Dukcapil Integration System

A full-stack web application integrating KUA (Office of Religious Affairs) and Dukcapil (Population and Civil Registration) workflows for post-marriage data processing.

**🌐 Live Demo:** [https://ht.nasruladitri.space/](https://ht.nasruladitri.space/)


## 🚀 Features

- **Role-Based Access Control (RBAC)**: Secure access for 5 distinct roles (KUA, Operator, Verifier, Kemenag, Admin)
- **Submission Workflow**: Complete workflow from draft creation to final approval
- **Verification Dashboard**: Separate queues for operators and verifiers
- **Secure Document Handling**: Role-restricted access to uploaded documents
- **FSM Status Tracking**: State machine-validated status transitions
- **Monitoring & Reporting**: Statistics and performance reports for Kemenag
- **Audit Trail**: Complete logging of all status changes and actions

## 🛠 Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express.js + Prisma ORM
- **Database**: PostgreSQL 15
- **Containerization**: Docker + Docker Compose

## 📦 Prerequisites

- Docker Desktop (latest version)
- Git (for cloning)

## 🏃‍♂️ Quick Start

### 1. Clone & Start

```bash
# Clone repository
git clone <repository-url>
cd hadiah-terbaik

# Start all services
docker-compose up -d --build
```

### 2. Access the Application

- **Frontend**: http://localhost:2200
- **Backend API**: http://localhost:3100
- **API Docs**: http://localhost:3100/api-docs

### 3. Initialize Database

```bash
# Run migrations
cd backend
npx prisma migrate deploy

# Seed database (create default users)
npx prisma db seed
```

### 4. Default Credentials

| Role | Username | Password |
|------|----------|----------|
| KUA Officer | `kua_officer` | `password123` |
| Dukcapil Operator | `dukcapil_operator` | `password123` |
| Dukcapil Verifier | `dukcapil_verifier` | `password123` |
| Kemenag  | `kemenag_user` | `password123` |
| Admin | `admin` | `password123` |

## 📂 Project Structure

```
hadiah-terbaik/
├── backend/
│   ├── src/
│   │   ├── controllers/      # 6 controllers (kua, operator, verifier, etc.)
│   │   ├── services/         # Business logic layer
│   │   ├── routes/           # Role-based routes
│   │   ├── middlewares/      # Auth, validation, error handling
│   │   └── utils/            # FSM, logger, helpers
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema (5 roles, 7 statuses)
│   │   └── seed.js
│   └── scripts/
│       ├── migration_role.js    # Interactive role migration
│       └── migration_status.js  # Status migration
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       └── services/
├── docs/
│   ├── UPDATE.MD                  # API specification
│   ├── API_MIGRATION_GUIDE.md     # Frontend migration guide
│   └── PORTAINER_DEPLOYMENT.md
└── docker-compose.yml
```

## 🔐 Roles & Permissions

### KUA
- Create and submit marriage applications
- Upload required documents
- Revise returned applications
- View submission history

### Operator Dukcapil
- View submission queue
- Assign submissions to self
- Process documents
- Return to KUA for revision
- Send to verifier for approval

### Verifikator Dukcapil
- View verification queue
- Review processed submissions
- Approve or reject with mandatory reason
- Generate verification reports

### Kemenag
- View statistics per KUA
- View statistics per kecamatan
- Generate performance reports
- Monitor all submissions (read-only)

### Admin
- Manage users (create, update, delete)
- Reset user passwords
- Update user roles
- View system health
- Access audit logs

## 📡 API Structure

### Role-Based Routing

```
/api/v1/auth/*                      # Authentication (all roles)
/api/v1/kua/*                       # KUA endpoints
/api/v1/dukcapil/operator/*         # Operator endpoints
/api/v1/dukcapil/verifier/*         # Verifier endpoints
/api/v1/kemenag/*                   # Kemenag monitoring
/api/v1/admin/*                     # Admin management
```

### Total Endpoints: **34**

- Authentication: 4 endpoints
- KUA: 8 endpoints
- Operator: 7 endpoints
- Verifier: 5 endpoints
- Kemenag: 4 endpoints
- Admin: 7 endpoints

For detailed endpoint documentation, visit `/api-docs` or see [`API_MIGRATION_GUIDE.md`](docs/API_MIGRATION_GUIDE.md).

## 🔄 Status Workflow

The system implements a Finite State Machine (FSM) for status transitions:

```
DRAFT → SUBMITTED → PROCESSING → PENDING_VERIFICATION → APPROVED
                  ↓                                   ↓
            NEEDS_REVISION                        REJECTED
                  ↑_________________________________|
```

- **DRAFT**: Created by KUA, can be edited
- **SUBMITTED**: Submitted by KUA, ready for operator
- **PROCESSING**: Being processed by operator
- **NEEDS_REVISION**: Returned to KUA for corrections
- **PENDING_VERIFICATION**: Awaiting verifier approval
- **APPROVED**: Final approval by verifier
- **REJECTED**: Rejected by verifier

## 🧪 Testing

### API Testing with curl

```bash
# Login
curl -X POST http://localhost:3100/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"kua_officer","password":"password123"}'

# System health
curl -X GET http://localhost:3100/api/v1/admin/system/health \
  -H "Authorization: Bearer YOUR_TOKEN"
```



## 📚 Documentation


- **[Deployment Guide](docs/DEPLOYMENT.md)**: Production deployment instructions
- **[API Specification](docs/API_SPECIFICATION.md)**: Role-based API mapping and specification
- **[Docker Cheatsheet](docs/DOCKER_CHEATSHEET.md)**: Useful commands for development

## 🔐 Security Features

- **JWT Authentication**: Token-based auth for all protected routes
- **Role-Based Authorization**: Middleware enforces role permissions
- **FSM Validation**: State machine prevents invalid status transitions
- **Audit Logging**: All mutations logged with actor, timestamp, notes
- **Input Validation**: Zod schemas for request validation
- **Secure File Handling**: Authorized document access only

## 🚢 Deployment

### Development

```bash
docker-compose up -d --build
```

### Production (Portainer)

See [`docs/PORTAINER_DEPLOYMENT.md`](docs/PORTAINER_DEPLOYMENT.md) for detailed instructions.

**Key steps:**
1. Backup database
2. Run Prisma migrations
3. Run role & status migration scripts
4. Deploy via Portainer stack
5. Verify system health

## 🔧 Environment Variables

### Backend (.env)

```env
DATABASE_URL="postgresql://user:pass@db:5432/kua_dukcapil"
JWT_SECRET="your-secret-key-here"
PORT=3100
NODE_ENV=production
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3100/api/v1
```

## 📊 Monitoring

Access system health:

```bash
GET /api/v1/admin/system/health
```

Response includes:
- Database connection status
- Response times
- Memory usage
- Record counts
- Uptime

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs backend
docker-compose logs db
```

### Migration Errors

```bash
# Reset database (development only!)
cd backend
npx prisma migrate reset

# Re-run migrations
npx prisma migrate deploy
node scripts/migration_role.js
node scripts/migration_status.js
```

## 📝 Contributing

1. Follow existing code structure
2. Use FSM for status transitions
3. Add audit logs for mutations
4. Update Swagger documentation
5. Run linting before commit

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
Copyright (c) 2026 Nasrul Aditri Rahmandika

---

**Version**: 2.0.0 (Role-Based API)  
**Last Updated**: 2025-12-30  
**Contact**: [@nasruladitri](https://github.com/nasruladitri)
