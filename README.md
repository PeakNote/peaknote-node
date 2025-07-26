# PeakNote Backend

PeakNote backend service for Teams meeting transcript processing and analysis using Microsoft Graph API integration.

## Overview

PeakNote is a NestJS-based backend service that processes Microsoft Teams meeting transcripts, provides AI-powered meeting summaries, and manages meeting-related data through Microsoft Graph API integration. The service handles webhook events, transcript synchronization, and user subscription management.

## Features

- **Microsoft Teams Integration**: Seamless integration with Microsoft Graph API for Teams data
- **Meeting Transcript Processing**: Automated transcript retrieval and processing
- **AI-Powered Summaries**: OpenAI integration for intelligent meeting summaries
- **Webhook Management**: Real-time event processing from Microsoft Graph
- **User Subscription Management**: Automated subscription renewal and management
- **Database Management**: TypeORM with MySQL for data persistence
- **Message Queue**: RabbitMQ integration for asynchronous processing
- **Caching**: Redis-based caching for improved performance

## Tech Stack

- **Framework**: NestJS
- **Database**: MySQL with TypeORM
- **Cache**: Redis
- **Message Queue**: RabbitMQ
- **AI**: OpenAI API
- **Authentication**: Azure MSAL
- **API Integration**: Microsoft Graph API
- **Language**: TypeScript

## Installation

### Prerequisites

- Node.js (v18 or higher)
- MySQL database
- Redis server
- RabbitMQ server
- Microsoft Azure AD application with Graph API permissions

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd peaknote-node
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
DB_DATABASE=peaknote

# Azure Configuration
AZURE_CLIENT_ID=your_azure_client_id
AZURE_CLIENT_SECRET=your_azure_client_secret
AZURE_TENANT_ID=your_azure_tenant_id

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# RabbitMQ Configuration
RABBITMQ_URL=amqp://localhost:5672

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Webhook Configuration
WEBHOOK_BASE_URL=your_webhook_base_url
```

4. Run database migrations:
```bash
npm run migration:run
```

## Development

### Running the Application

Start the development server:
```bash
npm run start:dev
```

The application will be available at `http://localhost:3000`

### Available Scripts

- `npm run build` - Build the application
- `npm run start` - Start the production server
- `npm run start:dev` - Start development server with hot reload
- `npm run start:debug` - Start with debugging enabled
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage
- `npm run test:e2e` - Run end-to-end tests

### Database Operations

- `npm run migration:generate` - Generate new migration
- `npm run migration:run` - Run pending migrations
- `npm run migration:revert` - Revert last migration

## API Endpoints

### Webhook Endpoints

- `POST /webhook/graph` - Microsoft Graph webhook endpoint for event notifications
- `GET /webhook/validate` - Webhook validation endpoint

### Transcript Endpoints

- `GET /transcripts/:meetingId` - Get meeting transcript
- `POST /transcripts/process` - Process transcript for summary generation

## Architecture

### Core Services

- **GraphService**: Microsoft Graph API client and operations
- **TranscriptService**: Meeting transcript processing and management
- **SubscriptionService**: Microsoft Graph subscription management
- **MessageProducerService**: RabbitMQ message publishing
- **MessageConsumerService**: RabbitMQ message consumption
- **MeetingSummaryService**: AI-powered meeting summary generation

### Scheduled Tasks

- **CallRecordSyncScheduler**: Synchronizes call records from Microsoft Graph
- **MeetingEventScheduler**: Processes scheduled meeting events
- **SubscriptionRenewalScheduler**: Manages subscription renewals

### Database Entities

- **TeamsUser**: Teams user information
- **MeetingInstance**: Meeting instance data
- **MeetingTranscript**: Meeting transcript content
- **MeetingEvent**: Meeting events and notifications
- **GraphUserSubscription**: Microsoft Graph subscriptions

## Deployment

### Production Build

```bash
npm run build
npm run start:prod
```

### Environment Configuration

Ensure all environment variables are properly configured for your production environment, including:

- Database connection settings
- Azure AD application credentials
- OpenAI API key
- RabbitMQ and Redis connection details
- Webhook URLs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is proprietary software. All rights reserved.