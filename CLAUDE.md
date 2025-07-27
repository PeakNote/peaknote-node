# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Running the Application
- `npm run start:dev` - Start development server with hot reload
- `npm run start:debug` - Start with debugging enabled
- `npm run start:prod` - Start production server
- `npm run build` - Build the application

### Testing
- `npm run test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage report
- `npm run test:e2e` - Run end-to-end tests
- `npm run test:debug` - Run tests with debugger

### Code Quality
- `npm run lint` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier

### Database Management
- `npm run migration:generate` - Generate new migration based on entity changes
- `npm run migration:run` - Run pending migrations
- `npm run migration:revert` - Revert last migration

### Infrastructure
- `docker-compose up -d` - Start MySQL, Redis, and RabbitMQ services
- `docker-compose down` - Stop infrastructure services

## Architecture Overview

### Core Application Structure
PeakNote is a NestJS-based backend service that processes Microsoft Teams meeting transcripts using Microsoft Graph API integration. The application follows a modular architecture with clear separation of concerns.

### Key Architectural Patterns
- **Event-Driven Architecture**: Uses webhooks from Microsoft Graph to trigger processing
- **Async Processing**: RabbitMQ for message queuing and background job processing
- **Caching Layer**: Redis/in-memory caching for performance optimization
- **Repository Pattern**: Custom repositories for data access abstraction
- **Scheduled Tasks**: Cron-based schedulers for periodic operations

### Database Strategy
The application uses a flexible database configuration:
- **Primary**: MySQL for production
- **Fallback**: SQLite in-memory for development when MySQL is unavailable
- **Auto-detection**: Attempts MySQL connection, falls back to SQLite automatically

### Key Service Categories

#### Core Integration Services
- **GraphService**: Microsoft Graph API client with credential management
- **SubscriptionService**: Manages Microsoft Graph webhook subscriptions
- **TeamsUserSyncService**: Synchronizes Teams users from Graph API

#### Processing Services
- **TranscriptService**: Handles meeting transcript retrieval and storage
- **MeetingSummaryService**: AI-powered meeting summary generation using OpenAI
- **GraphEventService**: Processes incoming webhook events from Microsoft Graph

#### Infrastructure Services
- **MessageProducer/MessageConsumer**: RabbitMQ message handling
- **PayloadParserService**: Webhook payload validation and parsing

#### Scheduled Operations
- **CallRecordSyncScheduler**: Syncs call records from Microsoft Graph
- **MeetingEventScheduler**: Processes scheduled meeting events
- **SubscriptionRenewalScheduler**: Manages subscription renewals

### Configuration Management
Configuration is handled through environment variables with the following structure:
- **Database**: DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE
- **Azure/Graph**: AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID
- **AI**: OPENAI_API_KEY
- **Infrastructure**: RABBITMQ_URL, REDIS_HOST, REDIS_PORT
- **Webhooks**: WEBHOOK_BASE_URL

### Entity Relationships
- **TeamsUser**: Base user entity from Microsoft Teams
- **MeetingInstance**: Meeting metadata and information
- **MeetingTranscript**: Transcript content and processing status
- **MeetingEvent**: Event notifications from Graph webhooks
- **GraphUserSubscription**: User-specific Graph API subscriptions
- **MeetingUrlAccess**: Meeting access control and permissions

### Development Considerations

#### Startup Sequence
The application performs initialization tasks on startup:
1. User synchronization from Microsoft Graph
2. Subscription creation for all users
3. Background scheduler activation

#### Error Handling Strategy
- Graceful degradation when external services are unavailable
- Automatic fallback configurations (SQLite when MySQL unavailable)
- Comprehensive logging with structured messages in multiple languages

#### Testing Strategy
- Unit tests focus on service logic
- E2E tests cover webhook endpoints and integration flows
- Test configuration uses in-memory database for isolation

#### Path Alias Configuration
Uses `@/*` path alias mapping to `src/*` for clean imports throughout the codebase.

### Microsoft Graph Integration
The application heavily integrates with Microsoft Graph API for:
- Teams user management and synchronization
- Meeting data retrieval
- Real-time webhook notifications
- Call record processing
- Subscription lifecycle management

This integration requires proper Azure AD application setup with appropriate Graph API permissions for Teams data access.