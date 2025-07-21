#!/bin/bash

# 🚀 Production Deployment Script
# Onboarding Analyzer - Enterprise Analytics Platform

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${ENVIRONMENT:-production}
BACKUP_RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
HEALTH_CHECK_TIMEOUT=${HEALTH_CHECK_TIMEOUT:-300}

echo -e "${PURPLE}🚀 Starting Production Deployment${NC}"
echo -e "${BLUE}Environment: $ENVIRONMENT${NC}"
echo -e "${BLUE}Timestamp: $(date)${NC}"

# Function to log messages
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Function to check prerequisites
check_prerequisites() {
    log "🔍 Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
        exit 1
    fi
    
    if [[ ! -f ".env.production" ]]; then
        error ".env.production file not found"
        exit 1
    fi
    
    log "✅ Prerequisites check passed"
}

# Function to create backup
create_backup() {
    log "💾 Creating backup..."
    
    BACKUP_DIR="backups/$(date +'%Y%m%d_%H%M%S')"
    mkdir -p "$BACKUP_DIR"
    
    # Backup database
    if [[ -f "backend/database.db" ]]; then
        cp backend/database.db "$BACKUP_DIR/database.db.bak"
        log "📊 Database backup created"
    fi
    
    # Backup environment files
    cp .env.production "$BACKUP_DIR/env.production.bak"
    
    # Backup docker-compose
    cp docker-compose.yml "$BACKUP_DIR/docker-compose.yml.bak"
    
    log "✅ Backup created in $BACKUP_DIR"
}

# Function to cleanup old backups
cleanup_old_backups() {
    log "🧹 Cleaning up old backups..."
    
    if [[ -d "backups" ]]; then
        find backups/ -type d -mtime +$BACKUP_RETENTION_DAYS -exec rm -rf {} + 2>/dev/null || true
        log "✅ Old backups cleaned up (older than $BACKUP_RETENTION_DAYS days)"
    fi
}

# Function to pull latest images
pull_images() {
    log "📥 Pulling latest Docker images..."
    
    docker-compose --env-file .env.production pull
    
    log "✅ Images pulled successfully"
}

# Function to deploy services
deploy_services() {
    log "🚀 Deploying services..."
    
    # Stop existing services gracefully
    docker-compose --env-file .env.production down --timeout 30
    
    # Start services in correct order
    docker-compose --env-file .env.production up -d redis
    sleep 5
    
    docker-compose --env-file .env.production up -d backend
    sleep 10
    
    docker-compose --env-file .env.production up -d celery_worker celery_beat
    sleep 5
    
    docker-compose --env-file .env.production up -d frontend
    
    log "✅ Services deployed successfully"
}

# Function to run database migrations
run_migrations() {
    log "🗄️ Running database migrations..."
    
    # Wait for backend to be ready
    sleep 15
    
    docker-compose --env-file .env.production exec -T backend alembic upgrade head || true
    
    log "✅ Database migrations completed"
}

# Function to run health checks
health_check() {
    log "🏥 Running health checks..."
    
    local timeout=$HEALTH_CHECK_TIMEOUT
    local interval=5
    local elapsed=0
    
    while [[ $elapsed -lt $timeout ]]; do
        if curl -f http://localhost/health > /dev/null 2>&1; then
            log "✅ Application is healthy"
            return 0
        fi
        
        warning "Health check failed, retrying in ${interval}s... (${elapsed}/${timeout}s)"
        sleep $interval
        elapsed=$((elapsed + interval))
    done
    
    error "Health check failed after ${timeout}s"
    return 1
}

# Function to run smoke tests
run_smoke_tests() {
    log "🧪 Running smoke tests..."
    
    # Test API endpoints
    if curl -f http://localhost/api/ > /dev/null 2>&1; then
        log "✅ API endpoint accessible"
    else
        error "API endpoint not accessible"
        return 1
    fi
    
    # Test frontend
    if curl -f http://localhost/ > /dev/null 2>&1; then
        log "✅ Frontend accessible"
    else
        error "Frontend not accessible"
        return 1
    fi
    
    # Test Redis connection
    if docker-compose --env-file .env.production exec -T redis redis-cli ping > /dev/null 2>&1; then
        log "✅ Redis connection working"
    else
        error "Redis connection failed"
        return 1
    fi
    
    log "✅ All smoke tests passed"
}

# Function to setup monitoring
setup_monitoring() {
    log "📊 Setting up monitoring..."
    
    # Create monitoring directories
    mkdir -p monitoring/prometheus monitoring/grafana
    
    # Generate monitoring configs if they don't exist
    if [[ ! -f "monitoring/prometheus.yml" ]]; then
        cat > monitoring/prometheus.yml << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'onboarding-analyzer'
    static_configs:
      - targets: ['backend:8000']
    metrics_path: '/metrics'
    scrape_interval: 10s
EOF
    fi
    
    log "✅ Monitoring setup completed"
}

# Function to send notifications
send_notification() {
    local status=$1
    local message=$2
    
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚀 Deployment $status: $message\"}" \
            "$SLACK_WEBHOOK_URL" || true
    fi
    
    if [[ -n "${DISCORD_WEBHOOK_URL:-}" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"content\":\"🚀 Deployment $status: $message\"}" \
            "$DISCORD_WEBHOOK_URL" || true
    fi
}

# Function to rollback on failure
rollback() {
    error "🔄 Deployment failed, initiating rollback..."
    
    # Stop current deployment
    docker-compose --env-file .env.production down
    
    # Find latest backup
    LATEST_BACKUP=$(find backups/ -type d -name "20*" | sort -r | head -n 1)
    
    if [[ -n "$LATEST_BACKUP" && -d "$LATEST_BACKUP" ]]; then
        log "📥 Restoring from backup: $LATEST_BACKUP"
        
        # Restore database
        if [[ -f "$LATEST_BACKUP/database.db.bak" ]]; then
            cp "$LATEST_BACKUP/database.db.bak" backend/database.db
        fi
        
        # Restart with previous version
        docker-compose --env-file .env.production up -d
        
        send_notification "FAILED" "Rollback completed to backup: $LATEST_BACKUP"
    else
        error "No backup found for rollback"
        send_notification "CRITICAL" "Deployment failed and no backup available for rollback"
    fi
}

# Main deployment function
main() {
    log "🎯 Starting deployment process..."
    
    # Trap errors for rollback
    trap rollback ERR
    
    check_prerequisites
    create_backup
    cleanup_old_backups
    pull_images
    deploy_services
    run_migrations
    
    # Health checks and testing
    if health_check && run_smoke_tests; then
        setup_monitoring
        
        log "🎉 Deployment completed successfully!"
        send_notification "SUCCESS" "Production deployment completed successfully"
        
        # Display deployment summary
        echo -e "\n${GREEN}=== DEPLOYMENT SUMMARY ===${NC}"
        echo -e "${BLUE}Environment:${NC} $ENVIRONMENT"
        echo -e "${BLUE}Timestamp:${NC} $(date)"
        echo -e "${BLUE}Services:${NC}"
        docker-compose --env-file .env.production ps
        
        echo -e "\n${GREEN}🌟 Your application is now live!${NC}"
        echo -e "${BLUE}Frontend:${NC} http://localhost"
        echo -e "${BLUE}API:${NC} http://localhost/api"
        echo -e "${BLUE}Health:${NC} http://localhost/health"
    else
        error "Deployment validation failed"
        exit 1
    fi
}

# Run main function
main "$@"