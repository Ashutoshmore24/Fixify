## Software Requirements Specification

## for

## FIXIFY: IT Asset & Maintenance

## Management System,

Version 1.0 approved

## Aniket Ashokrao Gawande Atharv Sampat Shinde Ashutosh Sanjay More Prepared by

## Organisation

## Pimpri Chinchwad College of Engineering

July 23, 2026


- 1. Introduction

- 1.1 Purpose

This Software Requirements Specification (SRS) defines the functional and non-functional requirements for the development of Fixify: IT Asset & Maintenance Management System, Version 1.0. The purpose of this document is to establish a comprehensive and unambiguous specification for the proposed software system, ensuring a common understanding among stakeholders including developers, faculty members, laboratory staff, project evaluators, testers, and future maintainers. This document serves as the primary reference for the analysis, design, implementation, testing, and maintenance of the system throughout the Software Development Life Cycle (SDLC). Fixify is a centralized, web-based platform designed to digitalize and streamline the complete maintenance lifecycle of computer laboratories within educational institutions. The system enables students and faculty members to report hardware or software issues through an official laboratory QR code, automatically routes maintenance requests to the responsible laboratory assistant, supports hierarchical ticket escalation to higher departmental authorities whenever required, maintains detailed IT asset records, manages spare-part inventory, and provides analytical dashboards for monitoring laboratory performance and maintenance activities. The system aims to replace manual complaint registration methods with a secure, transparent, and data- driven maintenance management solution that improves operational efficiency, minimizes hardware downtime, and enhances accountability throughout the maintenance process.

## 1.2 Document Conventions

This Software Requirements Specification follows the recommendations of IEEE 29148-2018 for Software Requirements Specifications and adopts a structured hierarchical organization to improve readability, traceability, and maintainability.

The following conventions are used throughout this document:

- Hierarchical Numbering: Requirements are organized using hierarchical numbering (for example, 3.2.1, REQ-3.2.1). Each functional requirement is uniquely identifiable to facilitate requirement traceability throughout the software development lifecycle.

- Requirement Statements: Mandatory system requirements are expressed using the keyword "shall", while optional or future enhancements are expressed using "should" or "may".

- User Interface Elements: User interface components such as buttons, menus, navigation links, dashboards, and dialog boxes are represented using bold formatting (for example, Submit Complaint, Dashboard, Generate QR Code).

- Terminology: Technical terms such as Asset, Maintenance Ticket, Lab Assistant, Department Authority, Administrator, Escalation, and Inventory are defined in the Glossary section.

- Requirement Priority: Functional requirements are categorized according to implementation priority (High, Medium, Low) wherever applicable to assist project planning and incremental development.

- Requirement Status: Items marked as TBD (To Be Determined) indicate requirements awaiting institutional approval or infrastructure-related decisions.

- Abbreviations: Standard software engineering abbreviations such as SRS, RBAC, SLA, API, JWT, and OAuth are used consistently throughout the document.

## 1.3 Intended Audience and Reading Suggestions

This SRS is intended for multiple stakeholders involved in the development, deployment, operation, and

evaluation of the Fixify platform. Software Developers and System Architects Developers should use this document to understand the functional requirements, system behavior, database entities, interface specifications, and architectural constraints before implementation.

## Recommended Reading Order:

- Introduction

- Overall Description

- External Interface Requirements

- System Features

- Non-functional Requirements


## Faculty Evaluators and Project Supervisors

Faculty members should review the project scope, business objectives, software engineering practices, and requirement completeness to evaluate the feasibility and quality of the proposed system.

## Recommended Reading Order:

- Introduction

- Overall Description

- System Features

- Analysis Models

## Laboratory Assistants

Laboratory Assistants should review the sections describing ticket management, maintenance workflows, dashboard functionality, and escalation procedures.

## Recommended Reading Order:

- User Classes

- User Interfaces

- Ticket Management Features

## Department Authorities and Heads of Department (HODs)

Department authorities should focus on the administrative workflow, escalation hierarchy, maintenance monitoring, IT asset management, and analytical dashboards provided by the system.

## Recommended Reading Order:

- Product Functions

- User Classes

- Analytics Dashboard

- Business Rules

## Students and Faculty Members

Students and faculty members should understand how to report laboratory issues, monitor complaint status, and receive maintenance updates using the platform.

## Recommended Reading Order:

- Product Scope

- User Interfaces

- Complaint Registration Feature

## Test Engineers

Test engineers should use this document to prepare system verification, validation activities, and acceptance test cases based on the functional and non-functional requirements.

## Future Maintenance Teams

Future developers and institutional IT teams should refer to this document during system enhancement, migration, and maintenance activities.

## 1.4 Product Scope

Fixify is a centralized IT Asset and Maintenance Management System developed specifically for educational institutions to modernize the management of computer laboratories and their associated hardware assets. Many educational institutions still rely on verbal communication, handwritten registers, or informal messaging applications to report and resolve computer-related issues. These approaches often result in delayed maintenance, poor communication between stakeholders, lack of accountability, duplicate complaints, missing maintenance history, and inefficient utilization of technical staff.

Fixify addresses these challenges by providing a secure, web-based maintenance platform that integrates complaint management, IT asset tracking, technician assignment, inventory management, maintenance history, and departmental analytics into a single centralized system.


Instead of attaching QR codes to every individual computer, the proposed solution utilizes an official laboratory QR code. After scanning the QR code, users select the affected computer from the laboratory inventory, describe the issue, and submit the maintenance request. The system automatically routes the complaint to the assigned laboratory assistant responsible for that laboratory. If the assigned laboratory assistant cannot resolve the issue due to technical complexity or hardware replacement requirements, the complaint is escalated to the designated departmental authority, who investigates the issue, approves component replacement when necessary, and ensures successful resolution before the maintenance ticket is closed. In addition to complaint management, Fixify maintains complete records of institutional IT assets, including laboratory details, computer configurations, maintenance history, spare-part inventory, technician assignments, and system performance metrics.

The primary objectives of Fixify are:

- 1. Digitize and standardize laboratory maintenance workflows.

- 2. Reduce hardware downtime and improve laboratory availability.

- 3. Ensure secure Role-Based Access Control (RBAC) using institutional authentication.

- 4. Automate complaint routing and hierarchical escalation.

- 5. Maintain complete lifecycle records for every IT asset.

- 6. Manage spare-part inventory and replacement history.

- 7. Improve accountability through activity logs and maintenance history.

- 8. Provide analytical dashboards for laboratory assistants, department authorities, administrators, and Heads of Department.

- 9. Support data-driven decision making for future infrastructure planning and preventive maintenance.

- 10. Build a scalable platform that can be extended across multiple departments and campuses.

## 1.5 References

The following standards, documents, and reference materials were used during the preparation of this

Software Requirements Specification:

- 1. IEEE Std 29148-2018 – Systems and Software Engineering — Life Cycle Processes — Requirements Engineering.

- 2. Karl E. Wiegers, Software Requirements Specification Template, Version 1.0 (1999).

- 3. IEEE SRS Notes used for understanding SRS structure, requirement characteristics, and specification principles.

- 4. Flipkart Online Shopping Software Requirements Specification, referenced for requirement organization, document formatting, and feature specification style.

- 5. Pimpri Chinchwad College of Engineering (PCCoE) laboratory maintenance workflow and departmental operating procedures (primary domain reference).

- 6. Internal Fixify Vision Document, UI Wireframes, UML Models, Database Design Documents, and Project Planning Documents.


- 2. Overall Description

## 2.1 Product Perspective

Fixify is a standalone, web-based IT Asset & Maintenance Management System developed specifically for educational institutions to manage the complete lifecycle of laboratory hardware assets and maintenance operations. The system replaces the existing manual maintenance process, which primarily depends on verbal communication, handwritten registers, or informal messaging between students, faculty members, laboratory assistants, and departmental authorities. The platform serves as a centralized maintenance management solution that integrates complaint registration, IT asset management, technician assignment, hierarchical ticket escalation, spare-part inventory tracking, maintenance history, and administrative analytics into a single application. Unlike conventional complaint management systems, Fixify follows the actual maintenance workflow adopted by educational institutions. Users report issues by scanning an official laboratory QR code placed inside the laboratory. After scanning, they select the affected computer from the available laboratory inventory, choose the issue category, and submit the maintenance request. The system automatically assigns the complaint to the laboratory assistant responsible for that laboratory. If the issue cannot be resolved by the assigned laboratory assistant due to technical complexity or hardware replacement requirements, the complaint is escalated to the designated departmental authority for further investigation and resolution. Throughout this process, the system maintains a complete maintenance history and provides real-time status tracking for all stakeholders. The system consists of the following major components:

- QR-based Complaint Registration Module

- IT Asset Management Module

- Maintenance Ticket Management Module

- Technician Assignment Module

- Hierarchical Escalation Module

- Spare Parts Inventory Module

- Dashboard & Analytics Module

- User Authentication & Role-Based Access Control Module

- Notification Module

- Audit Log & Maintenance History Module

The proposed system is designed to be scalable and can be extended to multiple departments, campuses, or institutional environments without significant architectural changes.

## 2.2 Product Functions

Fixify provides an integrated set of functionalities to simplify laboratory maintenance and IT asset management.

The major functions of the system include:

## Complaint Registration

- Scan the official laboratory QR code.

- Automatically identify the laboratory.

- Display the list of registered computers in that laboratory.

- Allow users to select the affected computer.

- Submit complaints with issue category, description, and optional image attachment.

## IT Asset Management

- Maintain complete records of laboratory computers.

- Store hardware specifications and asset information.

- Track installation dates, warranty details, and current asset status.

- Maintain complete maintenance history for every computer.

## Maintenance Ticket Management

- Automatically generate unique maintenance tickets.


- Assign tickets to the responsible laboratory assistant.

- Track ticket status throughout its lifecycle.

- Prevent duplicate complaints for the same computer.

## Technician Management

- Allow laboratory assistants to securely log in using institutional credentials.

- Display only tickets assigned to their laboratories.

- Update maintenance status.

- Record repair actions and technical observations.

## Hierarchical Escalation

- Escalate unresolved complaints to the Department Authority.

- Track escalation history.

- Allow higher authorities to assign technicians or approve component replacement.

- Monitor pending escalated issues.

## Spare Parts & Inventory Management

- Maintain available hardware components.

- Record component replacement history.

- Track inventory availability.

- Notify administrators when inventory becomes insufficient.

## Analytics & Reporting

- Laboratory-wise maintenance reports.

- Technician performance reports.

- Frequently failing computers.

- Frequently reported issue categories.

- Average resolution time.

- Monthly maintenance statistics.

- Asset health monitoring.

## Notification System

- Notify laboratory assistants about newly assigned tickets.

- Notify students when ticket status changes.

- Notify authorities when complaints are escalated.

- Send maintenance completion notifications.

## User & Access Management

- Authenticate users using institutional login.

- Enforce Role-Based Access Control (RBAC).

- Manage user accounts and permissions.

- Restrict unauthorized access.

## 2.3 User Classes and Characteristics

The system supports multiple user categories, each having different responsibilities and access privileges.

## 1. Students / Faculty Members (End Users)

These users are the primary reporters of laboratory issues.

## Characteristics

- Minimal technical knowledge required.

- Access through institutional login.

- Mobile-first interaction.

- High-frequency users.

## Responsibilities

- Scan laboratory QR code.


- Select affected computer.

- Register complaints.

- Upload supporting images (optional).

- Track complaint status.

- View complaint history.

## 2. Laboratory Assistants

Laboratory assistants are responsible for first-level maintenance activities.

## Characteristics

- Moderate technical expertise.

- Assigned to one or more laboratories.

- Daily operational users.

## Responsibilities

- View assigned complaints.

- Accept maintenance requests.

- Update ticket status.

- Record repair notes.

- Resolve software and hardware issues.

- Escalate unresolved complaints.

## 3. Department Authority / Lab In-charge

This role manages second-level maintenance activities.

## Characteristics

- Senior technical authority.

- Moderate system usage.

- Responsible for escalated issues.

## Responsibilities

- Review escalated complaints.

- Investigate unresolved issues.

- Approve hardware replacement.

- Assign maintenance responsibilities.

- Monitor pending escalations.

- Close escalated tickets.

## 4. Head of Department (HOD)

HOD users focus primarily on monitoring laboratory performance.

## Characteristics

- Low-frequency users.

- High administrative privileges.

- Decision makers.

## Responsibilities

- View analytics dashboards.

- Monitor maintenance performance.

- Review technician efficiency.

- Monitor laboratory health.

- View escalation statistics.

## 5. System Administrator

Administrators manage the overall system configuration.

## Characteristics

- Highest privilege level.

- Technical expertise.

- Responsible for system administration.

## Responsibilities


- Manage users.

- Manage laboratories.

- Register computers.

- Generate laboratory QR codes.

- Configure technician assignments.

- Manage inventory.

- Backup system data.

- Configure system settings.

## 2.4 Operating Environment

Fixify is a cloud-based web application designed to operate on modern computing devices connected to the institutional network or the Internet.

## Client Environment

- Google Chrome

- Microsoft Edge

- Mozilla Firefox

- Safari

## Supported Devices

- Android smartphones

- iOS smartphones

- Desktop computers

- Laptop computers

- Tablets

## Server Environment

- Node.js Runtime Environment

- Express.js Application Server

- RESTful API Services

## Database Environment

- MongoDB Database

- Mongoose ODM

## Authentication Environment

- Firebase Authentication (Email/Password & Google Sign-In)

- Institutional Email Verification & Domain Restriction

## Network Requirements

- Internet Connectivity

- Campus Wi-Fi

- HTTPS Communication

- WebSocket support for real-time updates

## 2.5 Design and Implementation Constraints

The following constraints shall be considered during system development and deployment.

## Institutional Authentication

Only authenticated users possessing valid institutional email accounts shall be permitted to access the system.

## Official Laboratory QR Codes

Due to institutional restrictions, QR codes shall be placed at the laboratory level rather than on individual computers. Users shall select the appropriate computer after scanning the laboratory QR code.

## Web-Based Platform


The application shall operate as a responsive web application without requiring native Android or iOS applications.

## Mobile-First Design

The complaint registration interface shall be optimized for smartphone devices because most complaints originate through QR code scanning.

## Internet Dependency

The application requires active Internet or campus network connectivity. Offline operation is outside the current project scope.

## Institutional Policies

The software shall comply with institutional policies regarding user authentication, laboratory access, and data privacy.

## Scalability

The system architecture shall support future deployment across multiple laboratories, departments, and campuses.

## 2.6 User Documentation

The following documentation shall be provided with the software.

## Student User Guide

- Register complaint

- Scan laboratory QR

- Track complaint status

## Laboratory Assistant Manual

- Login

- Manage tickets

- Update maintenance status

- Escalate issues

## Department Authority Guide

- Review escalations

- Approve hardware replacement

- Monitor maintenance

## Administrator Manual

- User management

- Asset registration

- QR code generation

- Inventory management

- System configuration

## Online Help

- Context-sensitive help

- FAQ section

- Error message explanations

- Troubleshooting guide

## 2.7 Assumptions and Dependencies

The successful operation of Fixify depends on the following assumptions.

## Assumptions

- Every laboratory has one official QR code.


- Every computer is registered in the system.

- Laboratory assistants are assigned to laboratories.

- Institutional email accounts are available for authentication.

- Internet connectivity is available inside laboratories.

- Users provide accurate complaint information.

## Dependencies

- Firebase Authentication (Web SDK & Firebase Admin SDK).

- Institutional email services.

- MongoDB Database.

- Campus network infrastructure.

- Cloud hosting platform.

- Notification service (Email).

- Institutional approval for laboratory deployment.

- Updated laboratory asset inventory maintained by administrators.

## 3. External Interface Requirements

## 3.1 User Interfaces

The Fixify system shall provide intuitive, responsive, and role-specific user interfaces that enable different categories of users to perform their respective tasks efficiently. The application shall maintain a consistent user experience across desktop and mobile devices while following modern web usability standards.

## Student / Faculty Interface (Mobile-First)

The complaint registration interface shall be optimized for smartphones, as users primarily access the system by scanning an official laboratory QR code.

The interface shall provide:

- Automatic identification of the laboratory after QR code scanning.

- List of registered computers available in the selected laboratory.

- Issue category selection.

- Complaint description textbox.

- Optional image upload for better fault identification.

- Complaint submission confirmation.

- Complaint history and current ticket status.

- Simple and responsive interface requiring minimal user interaction.

## Laboratory Assistant Dashboard

The laboratory assistant dashboard shall provide a dedicated workspace displaying only complaints assigned to laboratories under the assistant's responsibility.

The dashboard shall include:

- Dashboard summary (Pending, In Progress, Escalated, Resolved)

- Assigned complaint list

- Complaint details

- Computer asset information

- Maintenance history

- Status update interface

- Resolution notes

- Escalation option

- Search and filter facilities

## Department Authority Dashboard

The Department Authority interface shall provide tools for managing escalated maintenance requests.


## The dashboard shall include:

- Escalated ticket list

- Pending approvals

- Hardware replacement requests

- Technician assignment

- Maintenance progress monitoring

- Inventory requests

- Component approval workflow

- Escalation history

## Head of Department (HOD) Dashboard

The HOD dashboard shall provide analytical and monitoring capabilities without allowing direct modification of maintenance records.

The dashboard shall display:

- Laboratory health summary

- Monthly maintenance reports

- Technician performance

- Asset utilization

- Frequently failing computers

- Average repair time

- Escalation statistics

- Department-wide maintenance analytics

## System Administrator Dashboard

The administrator interface shall provide complete system administration capabilities.

The administrator shall be able to:

- Manage users

- Register laboratories

- Register computers

- Generate laboratory QR codes

- Assign laboratory assistants

- Manage spare-part inventory

- Configure system settings

- View complete audit logs

- Generate system reports

## Common User Interface Requirements

The system shall provide:

- Responsive web design.

- Consistent navigation across all modules.

- Uniform typography, icons, and color schemes.

- Real-time form validation.

- Standardized error messages.

- Toast notifications for successful operations.

- Confirmation dialogs before critical operations.

- Search, sorting, and filtering capabilities.

- Accessibility support compatible with modern web browsers.

## 3.2 Hardware Interfaces

Fixify interfaces with institutional hardware assets to support maintenance management and complaint registration.

The hardware interfaces include:

## QR Code Interface

The system shall interact with official laboratory QR codes installed within each laboratory.


After scanning the QR code using a mobile device camera, the system shall automatically identify the

laboratory and redirect the user to the complaint registration interface. Unlike traditional systems, individual computers are not required to have dedicated QR codes. Instead, users shall select the affected computer from the laboratory inventory displayed by the application.

## Client Devices

The software shall support the following client devices:

- Android smartphones

- iPhones

- Desktop computers

- Laptop computers

- Tablets

These devices shall provide:

- Internet connectivity

- Web browser support

- Camera access for QR scanning (mobile devices)

## Server Hardware

The application shall operate on cloud-hosted or institutional servers capable of supporting:

- Web application hosting

- REST API services

- Database services

- Notification services

- Real-time communication services

## Network Hardware

The system depends upon institutional networking infrastructure including:

- Campus Wi-Fi

- Internet routers

- Network switches

- Broadband connectivity

## 3.3 Software Interfaces

Fixify shall communicate with various internal and external software components required for authentication, database management, notifications, and application services.

## Authentication Service

The system shall integrate with Firebase Authentication (supporting Email/Password and Google Sign-In) using institutional email accounts for secure user authentication. The backend shall verify Firebase ID tokens using the Firebase Admin SDK (`verifyIdToken` with `checkRevoked: true`).

Only authorized institutional users with verified email addresses shall be allowed to access protected system resources.

## Database Management System

The system shall communicate with MongoDB for storing and retrieving:

- User information

- Laboratory records

- Computer assets

- Maintenance tickets

- Inventory data

- Activity logs

- Analytics information

## Email Notification Service

The system shall communicate with an email service provider to send:

- Complaint confirmation

- Ticket assignment notifications


- Escalation notifications

- Resolution confirmations

- Administrative alerts

## QR Code Service

The system shall support QR code generation and decoding for official laboratory identification. Each QR code shall uniquely identify a laboratory within the institution.

## Frontend–Backend Interface

The frontend application shall communicate with backend services through RESTful APIs for:

- Authentication

- Complaint management

- Asset management

- Ticket updates

- Inventory management

- Dashboard data

- Report generation

## Analytics Module

The system shall exchange data with the reporting module to generate:

- Laboratory reports

- Technician performance reports

- Asset utilization reports

- Maintenance statistics

## 3.4 Communications Interfaces

The system shall support secure and reliable communication between clients, servers, and external services.

## Network Communication

The application shall communicate using:

- HTTP for development environments.

- HTTPS for production deployments.

All sensitive communications shall occur over encrypted HTTPS connections.

## Data Exchange Format

The system shall exchange information using the JSON (JavaScript Object Notation) format.

All API requests and responses shall follow standardized JSON structures.

## Real-Time Communication

The application shall support real-time communication to provide immediate updates regarding:

- New complaint registration

- Ticket assignment

- Status changes

- Escalation events

- Complaint resolution

Real-time notifications shall be delivered to authorized users without requiring manual page refresh.

## Email Communication

The system shall send automated email notifications for:

- Complaint submission

- Ticket assignment

- Ticket escalation

- Maintenance completion

- Administrative announcements


## Communication Security

The communication interface shall ensure:

- Secure HTTPS/TLS encryption.

- Authenticated API requests.

- Role-based access validation.

- Protection against unauthorized access.

- Secure session management.

## 4. System Features

The Fixify system provides multiple integrated features that collectively support IT asset management, maintenance operations, complaint tracking, inventory management, and administrative monitoring within educational institutions.

## 4.1 Laboratory QR-Based Complaint Registration

## 4.1.1 Description and Priority

This feature provides the primary entry point for users to report laboratory computer issues. Users scan the official laboratory QR code, select the affected computer, describe the issue, and submit a maintenance request.

Priority: High (Core System Feature)

## 4.1.2 Stimulus / Response Sequences

## Stimulus

User scans laboratory QR code.

↓

## Response

System identifies laboratory.

↓

Displays registered computers.

↓

User selects PC.

↓

Selects issue category.

↓

Writes description.

↓

Submits complaint.

↓

System validates information.

↓

Creates maintenance ticket.

↓

Assigns unique Ticket ID.

↓

Routes complaint to assigned Laboratory Assistant.

↓

Displays confirmation.

## 4.1.3 Functional Requirements

REQ-1.1 The system shall identify the laboratory from the scanned QR code.

REQ-1.2 The system shall display all registered computers belonging to that laboratory.

REQ-1.3 The system shall allow users to select the affected computer.

REQ-1.4 The system shall allow users to select predefined issue categories.


REQ-1.5 The system shall allow users to enter additional complaint descriptions.

REQ-1.6 The system shall allow optional image uploads.

REQ-1.7 The system shall prevent duplicate active complaints for the same computer.

REQ-1.8 The system shall generate a unique Ticket ID.

REQ-1.9 The system shall assign complaint priority.

REQ-1.10 The system shall automatically forward the complaint to the assigned laboratory assistant.

## 4.2 Maintenance Ticket Management

## Description

Manages the complete maintenance lifecycle from complaint creation until closure.

Priority: High

## Functional Requirements

- Ticket Assignment

- Ticket Status Update

- Ticket History

- Resolution Notes

- Time Tracking

- Maintenance Timeline

- Duplicate Detection

## 4.3 Laboratory Assistant Dashboard

## Description

Provides maintenance staff with tools to manage assigned complaints.

Priority: High

## Functional Requirements

- View Assigned Tickets

- Accept Ticket

- Start Repair

- Update Status

- Add Repair Notes

- Request Spare Parts

- Escalate Ticket

- Close Ticket

## 4.4 Hierarchical Escalation Management


## Functional Requirements

REQ-4.1 Automatically escalate unresolved complaints.

REQ-4.2 Maintain escalation history.

REQ-4.3 Allow Department Authority to assign technicians.

REQ-4.4 Approve replacement components.

REQ-4.5 Close escalated tickets.

## 4.5 IT Asset Management

This feature is completely missing from your old SRS.

Priority: High

The system shall maintain:

- Laboratory Details

- Computer Details

- Processor

- RAM

- Storage

- Purchase Date

- Warranty

- Vendor


- Current Status

- Maintenance History

- Installed Components

Page 19

Functional Requirements include registering, updating, searching, and viewing asset histories.

## 4.6 Spare Parts & Inventory Management

Another enterprise feature.

Priority: Medium

## Maintain inventory for:

- RAM

- SSD

- Keyboard

- Mouse

- Monitor

- Power Supply

- Motherboard

- LAN Cable

## The system shall:

- Add inventory

- Remove inventory

- Track stock

- Record replacement history

- Alert low stock

## 4.7 User Authentication & Role-Based Access Control

Priority: High

## Supported Roles:

- Student

- Faculty

- Laboratory Assistant

- Department Authority

- HOD

- Administrator

## Functional Requirements:

- Firebase Authentication: Support both Email + Password and Google Sign-In via Firebase Web SDK on the client and Firebase Admin SDK on the server.

- Password Security: Passwords are encrypted, hashed, and stored exclusively by Firebase Authentication. Institutional application servers shall never handle, store, or log plaintext or hashed passwords.

- Institutional Email Verification: The system shall enforce mandatory email verification (`email_verified: true`) prior to unlocking application functionality.

- Institutional Domain Restriction (BR-10): The server shall validate the user's verified email domain against the institutional whitelist (`ALLOWED_EMAIL_DOMAINS`, exact match after '@'). Public email domains are rejected in production.

- Profile Completion: New users (via Email/Password signup or Google Sign-In) must complete their academic profile (First Name, Last Name, Course, Year, Division, and unique PRN for Students; Department and Employee ID for Faculty) via `POST /api/v1/auth/register-profile` before accessing application features.

- Role Assignment & Governance: Public self-registration only permits creation of STUDENT or FACULTY accounts. Client attempts to escalate to other roles are strictly rejected. FACULTY accounts matching the institutional faculty email pattern are auto-approved; otherwise, they enter `PENDING_APPROVAL` status awaiting administrator approval. Elevated roles (`LAB_ASSISTANT`, `DEPT_AUTHORITY`, `HOD`, `ADMIN`) are assigned exclusively by an Administrator.

- Session Cookie Management: Upon successful Firebase ID token verification (`verifyIdToken` with `checkRevoked: true`), the server issues a secure, httpOnly JWT session cookie with a 15-minute sliding inactivity expiration and an 8-hour absolute maximum lifetime.

- Activity Logging & Audit Trail: All successful logins, registration completions, and authentication rejections shall be recorded in the system audit log.

## 4.8 Analytics & Reporting Dashboard

Priority: Medium

## Reports include:

- Complaint Statistics

- Most Faulty Computer

- Most Faulty Laboratory

- Technician Performance

- Resolution Time

- Monthly Reports

- Inventory Usage

- Asset Health

- SLA Reports

The system shall allow filtering by:


- Date

- Laboratory

- Department

- Status

- Technician

## 4.9 Notification Management

Priority: Medium

## Notify users when:

- Complaint Submitted

- Ticket Assigned

- Ticket Accepted

- Escalated

- Component Approved

- Ticket Resolved

- Ticket Closed

## Support:

- Email

- In-App Notifications

## 4.10 System Administration

Priority: High

Administrator shall manage:

- Users

- Laboratories

- Computers

- QR Codes

- Inventory

- Departments

- Technician Assignment

- Backup

- Audit Logs

- Reports


## 5. Other Non-Functional Requirements

## 5.1 Performance Requirements

The Fixify system shall provide efficient and reliable performance to support maintenance operations across multiple laboratories while ensuring a responsive user experience.

## System Capacity

- The system shall support a minimum of 500 registered users.

- The system shall support at least 50 concurrent users during peak academic hours.

- The system shall support management of 2,000 or more IT assets without performance degradation.

- The system shall support storage of 100,000 maintenance records.

## Response Time

- The system shall display the complaint registration page within 2 seconds after scanning the laboratory QR code.

- User authentication shall complete within 3 seconds.

- Complaint submission shall complete within 2 seconds under normal network conditions.

- Dashboard pages shall load within 3 seconds.

- Search operations shall return results within 2 seconds.

## Database Performance

- Asset search operations shall complete within 2 seconds.

- Complaint history retrieval shall complete within 3 seconds.

- Analytics reports shall be generated within 5 seconds.

## Availability

- The application shall provide a minimum availability of 99% during institutional working hours.

- Automatic database backup shall be performed at least once every 24 hours.

## Scalability

The system shall support future expansion to:

- Multiple departments

- Multiple buildings

- Multiple campuses

- Additional asset categories

without requiring major architectural modifications.

## 5.2 Safety Requirements

Although Fixify does not directly control hardware devices, it shall support safe maintenance practices by providing appropriate warnings and procedures.

## Electrical Safety

If a user reports issues such as:

- Electrical short circuit

- Burning smell

- Smoke

- Exposed wiring

- Electric shock

the system shall immediately display a warning instructing users to stop using the equipment and report the issue immediately.

## Data Protection

The system shall prevent accidental deletion of:

- Maintenance history

- Asset information


- User accounts

- Inventory records

Deleted records shall either be recoverable or require administrator confirmation before permanent removal.

## Backup and Recovery

- Daily database backups shall be maintained.

- The system shall support restoration of maintenance records in case of system failure.

- Audit logs shall remain available after system recovery.

## Equipment Protection

The system shall maintain maintenance history for every asset to reduce repeated hardware failures and encourage preventive maintenance.

## 5.3 Security Requirements

Security is critical because the system manages institutional users, IT assets, and maintenance records.

## User Authentication

- Only users with valid institutional email accounts shall access the system.

- Authentication shall be performed using Firebase Authentication (supporting Email + Password and Google Sign-In).

- The backend application server shall verify Firebase ID tokens using `firebase-admin` (`verifyIdToken` with `checkRevoked: true`).

- Firebase Authentication stores all credentials; passwords shall never be stored, logged, or processed by institutional application servers.

- Mandatory email verification (`email_verified: true`) is enforced before granting access to protected application resources.

- Unauthorized email domains shall be denied access (HTTP 403 Forbidden with institutional guidance message).

- Role escalation prevention: Public registration payloads attempting to claim privileged roles (`LAB_ASSISTANT`, `DEPT_AUTHORITY`, `HOD`, `ADMIN`) are strictly rejected.

## Role-Based Access Control (RBAC)

The system shall restrict access according to user roles.

Students shall not:

- Modify maintenance records

- Access administrative dashboards

- View inventory details

Laboratory Assistants shall only access laboratories assigned to them.

Department Authorities shall only access escalated complaints.

Administrators shall have complete system privileges.

## Session Management

- User sessions shall automatically expire after 15 minutes of inactivity.

- Users shall be required to authenticate again after session expiration.

## Data Security

- All communication shall occur using HTTPS.

- Sensitive information shall be encrypted during transmission.

- Passwords shall never be stored because authentication uses institutional OAuth.

- System audit logs shall record important user activities.

## Audit Logging

The system shall record:

- Login activities

- Complaint creation

- Status updates

- Escalations

- Component replacements

- Administrative changes

## Data Privacy

Personal information shall only be accessible to authorized users and shall be used solely for maintenance management purposes.

## 5.4 Software Quality Attributes


The Fixify system shall satisfy the following software quality attributes.

## Usability

- The complaint registration process shall require no more than four user actions after scanning the QR code.

- Users shall be able to submit complaints without prior training.

- Interfaces shall remain consistent throughout the application.

## Reliability

- The system shall maintain data consistency during unexpected failures.

- Maintenance records shall not be lost during normal operation.

## Maintainability

- The software shall follow a modular architecture.

- Individual modules shall be independently maintainable.

- Source code shall be maintained using GitHub.

## Availability

The application shall remain operational during institutional working hours except during scheduled maintenance.

## Scalability

The architecture shall support future integration of:

- IoT-based monitoring

- Barcode support

- Mobile applications

- AI-based predictive maintenance

- Multi-campus deployment

## Portability

The system shall operate on:

- Windows

- Linux

- Android

- iOS

through modern web browsers without requiring platform-specific installation.

## Interoperability

The system shall integrate with:

- Google OAuth

- Institutional Email Services

- QR Code Services

- MongoDB

- Notification Services

## Recoverability

The application shall support restoration of data after hardware failures, software failures, or accidental deletion.

## 5.5 Business Rules

The following business rules govern the operation of the Fixify system.

## BR-1 Laboratory QR Codes

Each laboratory shall contain one officially generated QR code.

Scanning the QR code shall identify the laboratory, after which users shall select the affected computer from the registered asset list.


## BR-2 Complaint Ownership

Each complaint shall be associated with exactly one registered IT asset.

## BR-3 Duplicate Complaints

The system shall not allow multiple active complaints for the same computer.

If an active maintenance ticket already exists, users shall be informed and shown the current ticket status.

## BR-4 Technician Assignment

Each laboratory shall have one or more assigned laboratory assistants.

New complaints shall automatically be assigned to the responsible laboratory assistant.

## BR-5 Escalation Policy

If the laboratory assistant cannot resolve a complaint, the system shall allow escalation to the Department Authority.

## BR-6 Component Replacement

Hardware replacement shall only be approved by authorized Department Authorities or System Administrators.

## BR-7 Inventory Management

Whenever a hardware component is replaced, the inventory quantity shall be updated automatically.

## BR-8 Ticket Closure

A maintenance ticket shall only be closed after:

- Repair is completed.

- Testing is successful.

- Resolution notes are recorded.

## BR-9 Audit Trail

Every maintenance activity shall be recorded with:

- User

- Date

- Time

- Action performed

The audit trail shall not be editable by ordinary users.

## BR-10 Institutional Access

Only users authenticated through valid institutional credentials verified via Firebase Authentication shall be permitted to access the system. The server enforces strict domain whitelist checking on the verified email address against `ALLOWED_EMAIL_DOMAINS` (exact match on domain portion after '@'). Unverified emails (`email_verified: false`) are denied access with HTTP 403. Public email domains (such as gmail.com, yahoo.com) are strictly prohibited in production environments and permitted only in development mode.


- 6. Other Requirements

6.1 Database Requirements The Fixify platform requires a robust NoSQL database environment (specifically MongoDB) to handle the dynamic, document-based schemas associated with varying hardware issues and user roles. The database must support rapid read/write operations to ensure that concurrent ticket submissions during peak laboratory hours do not result in data locking or loss. Furthermore, the database must maintain relational integrity between User, Laboratory, Computer, and Ticket collections.

6.2 Legal and Compliance Requirements As a system deployed within an educational institution, Fixify must strictly adhere to institutional data privacy policies. Student and faculty email addresses, identifying information, and platform usage data extracted via the Firebase Authentication integration must remain localized to the college's secure environment. Passwords are encrypted and managed externally by Firebase Authentication; institutional servers never store, log, or process user passwords. The platform shall display appropriate disclaimers and privacy notices on the login and signup screens, confirming that usage data is collected solely for hardware maintenance purposes, defect attribution, and laboratory security.

6.3 Reuse Objectives To maximize the software engineering value of this project, specific backend modules shall be developed as independent, decoupled microservices. The QR Code URL Generation Module and the Firebase Authentication Session Middleware should be engineered so they can be easily reused by other college departments for future campus-wide applications (e.g., library management or cafeteria ordering).

## Appendix A: Glossary

- API (Application Programming Interface): A set of rules and protocols allowing the frontend application to communicate with the backend server.

- Fixify: The official project name for the centralized PCs' fixing platform.

- HOD (Head of Department): The administrative leader of a specific engineering branch, possessing elevated privileges to view lab health analytics.

- JWT (JSON Web Token): A secure method for transmitting authenticated user identity information between the client and server after session creation.

- MERN Stack: The foundational technology architecture used for this project, comprising MongoDB, Express.js, React, and Node.js.

- RBAC (Role-Based Access Control): The security mechanism that restricts system access and interface views based on the user's defined role (Student, Assistant, HOD, Admin).

- SLA (Service Level Agreement): The expected standard of service, measured in this system by the average time taken for a Lab Assistant to resolve a pending ticket.

- SRS (Software Requirements Specification): A document that completely describes what the software will do and how it will be expected to perform.

- Firebase Auth / SSO: An authentication architecture allowing users to access the platform using institutional Email/Password credentials or institutional Google identity, verified via Firebase.

## Appendix B: Analysis Models

To fully illustrate the system architecture and behavioral flows of the Fixify platform, the following UML 2.0 analysis models are included in this project documentation:

- 1. Use Case Diagram: Identifying the interactions between the primary actors (Student, Lab Assistant, System Admin) and the system's core functions (Report Issue, Update Ticket, View Analytics).

- 2. Sequence Diagrams: Detailing the chronological flow of messages between the User, React Frontend, Node.js API, and MongoDB database during the "Scan QR & Report Issue" scenario.

- 3. Design Class Model: Showcasing the structural entities (User, Ticket, Laboratory) and their relationships, incorporating Object Constraint Language (OCL) expressions to define class invariants (e.g., ensuring ticket resolution dates cannot precede creation dates).

- 4. Activity Diagram: Depicting the action flow and responsibilities across swimlanes for the student reporting the issue, the system routing it, and the assistant resolving it.

## Appendix C: To Be Determined List

The following elements remain to be finalized pending further institutional input and infrastructure analysis:


- TBD-1: The final, approved list of acceptable institutional email domains for the Single Sign-On (SSO) domain restriction constraint.

- TBD-2: The physical dimensions, material durability requirements, and specific adhesive types required for printing and placing the physical QR codes on laboratory assets.

- TBD-3: The exact cloud hosting environment and budgetary constraints for deploying the production build (e.g., AWS EC2, Render, or on-premise institutional servers).

- TBD-4: The specific escalation timeframe rules approved by the administration (e.g., whether unacknowledged tickets escalate to the HOD after 24 hours or 48 hours).
