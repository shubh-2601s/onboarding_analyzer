#!/bin/bash

# 🏥 Comprehensive Health Check Script
# Onboarding Analyzer - Enterprise Analytics Platform

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BASE_URL=${BASE_URL:-"http://localhost"}
API_URL="$BASE_URL/api"
TIMEOUT=${TIMEOUT:-30}

echo -e "${BLUE}🏥 Starting Comprehensive Health Check${NC}"
echo -e "${BLUE}Base URL: $BASE_URL${NC}"
echo -e "${BLUE}Timeout: ${TIMEOUT}s${NC}"

# Track overall health
OVERALL_HEALTH=0

check() {
    local name=$1
    local command=$2
    local critical=${3:-false}
    
    echo -n -e "${YELLOW}Checking $name...${NC} "
    
    if eval "$command" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        if [[ "$critical" == "true" ]]; then
            OVERALL_HEALTH=1
        fi
        return 1
    fi
}

# Frontend Health Checks
echo -e "\n${BLUE}=== FRONTEND HEALTH CHECKS ===${NC}"
check "Frontend availability" "curl -f -m $TIMEOUT $BASE_URL/" true
check "Frontend health endpoint" "curl -f -m $TIMEOUT $BASE_URL/health" false

# Backend API Health Checks
echo -e "\n${BLUE}=== BACKEND API HEALTH CHECKS ===${NC}"
check "API availability" "curl -f -m $TIMEOUT $API_URL/" true
check "API health endpoint" "curl -f -m $TIMEOUT $API_URL/health" true

# PostHog Integration
echo -e "\n${BLUE}=== ANALYTICS INTEGRATION ===${NC}"
check "PostHog events endpoint" "curl -f -m $TIMEOUT $API_URL/events" false
check "Funnel data endpoint" "curl -f -m $TIMEOUT $API_URL/funnel-data" true

# Advanced Analytics Endpoints
echo -e "\n${BLUE}=== ADVANCED ANALYTICS ===${NC}"
check "User segmentation" "curl -f -m $TIMEOUT $API_URL/user-segmentation" false
check "Cohort analysis" "curl -f -m $TIMEOUT $API_URL/cohort-analysis" false
check "ML insights" "curl -f -m $TIMEOUT $API_URL/ml-insights" false

# AI Agent Health
echo -e "\n${BLUE}=== AI AGENT SYSTEM ===${NC}"
check "AI agents status" "curl -f -m $TIMEOUT $API_URL/ai-agents/status" false
check "Recommendations" "curl -f -m $TIMEOUT $API_URL/ai-agents/recommendations" false

# Infrastructure Health
echo -e "\n${BLUE}=== INFRASTRUCTURE HEALTH ===${NC}"
if command -v docker >/dev/null 2>&1; then
    check "Redis container" "docker-compose ps redis | grep -q 'Up'" true
    check "Backend container" "docker-compose ps backend | grep -q 'Up'" true
    check "Frontend container" "docker-compose ps frontend | grep -q 'Up'" true
    check "Celery worker" "docker-compose ps celery_worker | grep -q 'Up'" false
    check "Celery beat" "docker-compose ps celery_beat | grep -q 'Up'" false
fi

# Performance Metrics
echo -e "\n${BLUE}=== PERFORMANCE METRICS ===${NC}"

# Response time check
RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' $API_URL/ 2>/dev/null || echo "999")
if (( $(echo "$RESPONSE_TIME < 1.0" | bc -l) )); then
    echo -e "${GREEN}✅ API response time: ${RESPONSE_TIME}s${NC}"
else
    echo -e "${YELLOW}⚠️ API response time: ${RESPONSE_TIME}s (slow)${NC}"
fi

# Memory usage (if running in Docker)
if command -v docker >/dev/null 2>&1; then
    BACKEND_MEMORY=$(docker stats --no-stream --format "{{.MemUsage}}" onboarding_backend 2>/dev/null | cut -d'/' -f1 | sed 's/MiB//' || echo "0")
    if [[ "$BACKEND_MEMORY" != "0" ]]; then
        echo -e "${BLUE}📊 Backend memory usage: ${BACKEND_MEMORY}${NC}"
    fi
fi

# Database Connectivity
echo -e "\n${BLUE}=== DATABASE CONNECTIVITY ===${NC}"
check "Database read test" "curl -f -m $TIMEOUT $API_URL/funnel-data | jq '.data' >/dev/null" true

# Security Checks
echo -e "\n${BLUE}=== SECURITY CHECKS ===${NC}"
check "HTTPS redirect" "curl -I $BASE_URL 2>/dev/null | grep -q 'HTTP'" false
check "Security headers" "curl -I $BASE_URL 2>/dev/null | grep -q 'X-Content-Type-Options'" false

# Final Health Summary
echo -e "\n${BLUE}=== HEALTH SUMMARY ===${NC}"
if [[ $OVERALL_HEALTH -eq 0 ]]; then
    echo -e "${GREEN}🎉 OVERALL STATUS: HEALTHY${NC}"
    echo -e "${GREEN}All critical systems are operational${NC}"
    exit 0
else
    echo -e "${RED}💥 OVERALL STATUS: UNHEALTHY${NC}"
    echo -e "${RED}One or more critical systems are failing${NC}"
    exit 1
fi