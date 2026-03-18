# Technical Overview
## Sceneside Financial System Infrastructure & Security

---

## 1. System Architecture

### Database Provider: Supabase
**Supabase** is a PostgreSQL-based Backend-as-a-Service (BaaS) platform that powers the Sceneside Financial System's data management layer. It provides enterprise-grade database infrastructure with built-in security, scalability, and reliability.

### Web Hosting: Vercel
**Vercel** hosts the Sceneside Financial System web application, providing global CDN distribution, serverless backend functions, and automatic deployment from source control. This ensures fast, reliable access to the financial dashboard across all geographies.

### System Provider: Blue Ox
**Blue Ox** designed, developed, and actively maintains the Sceneside Financial System. Blue Ox manages all updates, feature enhancements, bug fixes, and ensures the system operates optimally for Sceneside L.L.C.

---

## 2. Data Protection & Security

### Encryption at Rest and in Transit
- **Data at Rest**: All financial data stored in Supabase PostgreSQL is encrypted using industry-standard encryption algorithms. Database files are protected at the storage layer.
- **Data in Transit**: All communication between the web application, Supabase, and client browsers uses **HTTPS/TLS 1.3 encryption**. This ensures that sensitive financial information (invoices, payments, account details) cannot be intercepted during transmission.
- **API Security**: All API requests are authenticated and validated before processing.

### Row-Level Security (RLS) Policies
The system implements **PostgreSQL Row-Level Security (RLS)** at the database level for granular access control:
- **User-Based Access**: Each authenticated user can only access data belonging to their organization (Sceneside L.L.C).
- **Role-Based Permissions**: Database policies enforce role-based access control (Admin, Accountant, Manager, Sales, Auditor).
- **Record Isolation**: Financial records (invoices, bills, journal entries, etc.) are isolated at the database layer, preventing unauthorized access even if someone gains database credentials.
- **Automatic Enforcement**: RLS policies are evaluated on every database query, ensuring no sensitive data can be accessed outside authorized boundaries.

### Authentication & Login Security
- **Supabase Auth**: User authentication is handled by Supabase Auth, which uses JWT (JSON Web Token) based authentication.
- **Password Security**: Passwords are hashed using bcrypt with salt, never stored in plain text.
- **Session Management**: Secure cookies store authentication tokens with HTTP-only flags to prevent XSS attacks.
- **Multi-User Protection**: Each user has isolated sessions. Logging out immediately invalidates all tokens.
- **Middleware Protection**: All sensitive routes (dashboard, reports, settings) are protected by authentication middleware that runs before page render.

### Backup & Disaster Recovery
- **Automatic Daily Backups**: Supabase automatically backs up all financial data **every single day**. These backups are stored in geographically distributed secure locations.
- **Point-in-Time Recovery**: In the event of accidental data deletion or corruption, your data can be recovered to any point within the backup retention window (typically 30 days).
- **Redundant Storage**: Backups are replicated across multiple availability zones to ensure data is never lost due to hardware failure.
- **Zero Data Loss Guarantee**: The system architecture ensures no financial records are ever lost between backup cycles.

---

## 3. Reliability & Uptime

### Service Level Agreement (SLA)
- **99.99% Uptime Guarantee**: Supabase maintains a 99.99% uptime SLA, translating to less than 52 minutes of downtime per year.
- **Vercel Global Infrastructure**: Vercel's CDN ensures the web application is available globally with automatic failover.
- **Automated Health Monitoring**: Both Supabase and Vercel continuously monitor system health and automatically recover from failures.

---

## 4. Monthly & Annual Costs

### Infrastructure Investment Breakdown

| Service | Cost | Frequency | Purpose |
|---------|------|-----------|---------|
| **Domain Name** (sceneside.com) | $12.00 | Annually | Website and email domain registration |
| **Supabase Storage & Backup** | $10.00 | Monthly | Database hosting, storage, daily backups, 99.99% uptime |
| **Company Email** | $10.00 | Annually | Professional email accounts (@sceneside.com) |

### Total Annual Cost
- **Monthly**: $10.00 (Supabase)
- **Annual**: (12 × $10) + $12.00 (domain) + $10.00 (email) = **$142.00 per year**

This represents an enterprise-grade financial management system at a fraction of traditional ERP software costs.

---

## 5. Summary

Sceneside Financial System leverages **Supabase** for secure, reliable database infrastructure and **Vercel** for global web hosting, delivering:

✅ **Military-grade encryption** for all financial data  
✅ **Role-based access control** with database-level enforcement  
✅ **99.99% uptime** for continuous availability  
✅ **Automatic daily backups** with disaster recovery capability  
✅ **Secure authentication** with JWT tokens and session management  
✅ **Affordable hosting** at only $142/year infrastructure cost  

Blue Ox maintains this system to the highest standards, ensuring Sceneside L.L.C's financial data is always secure, available, and protected.

---

*Document Version: 1.0*  
*Last Updated: February 28, 2026*  
*Maintained by: Blue Ox*
