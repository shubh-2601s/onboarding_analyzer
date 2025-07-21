from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import requests
from datetime import datetime
from typing import List, Dict, Optional
import asyncio
import logging

# Advanced Analytics imports
from advanced_analytics import AdvancedAnalytics
from dataclasses import asdict

# Load environment variables first
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="Onboarding Analyzer API with AI Agents", version="2.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# PostHog Configuration
POSTHOG_API_KEY = os.getenv("POSTHOG_API_KEY", "phc_E8UCfzkw8WZBIGQ3OMFTmg043NItvfXvaHQyCDaGmzJ")
POSTHOG_PROJECT_ID = os.getenv("POSTHOG_PROJECT_ID", "197007")
POSTHOG_API_HOST = os.getenv("POSTHOG_API_HOST", "https://app.posthog.com")
USE_MOCK_DATA = os.getenv("USE_MOCK_DATA", "false").lower() == "true"
DEBUG = os.getenv("DEBUG", "true").lower() == "true"

# AI Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Import AI agents
try:
    from ai_agents import agent_orchestrator
    AI_AGENTS_AVAILABLE = True
    print("🤖 AI Agents initialized and ready")
except ImportError as e:
    AI_AGENTS_AVAILABLE = False
    print(f"⚠️ AI Agents not available: {e}")

if DEBUG:
    print(f"🔧 PostHog Configuration:")
    print(f"   API Key: {POSTHOG_API_KEY[:20]}...")
    print(f"   Project ID: {POSTHOG_PROJECT_ID}")
    print(f"   Host: {POSTHOG_API_HOST}")
    print(f"   Using Mock Data: {USE_MOCK_DATA}")
    print(f"🤖 AI Agents Available: {AI_AGENTS_AVAILABLE}")

class PostHogAnalytics:
    def __init__(self, api_key: str, project_id: str, host: str):
        self.api_key = api_key
        self.project_id = project_id
        self.host = host.rstrip('/')
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        # Validate API key format
        if not api_key or api_key.startswith("phc_VnQ") or len(api_key) < 20:
            print("⚠️ Warning: PostHog API key appears to be invalid or placeholder")
    
    def test_connection(self) -> bool:
        """Test PostHog API connection with better error handling"""
        try:
            url = f"{self.host}/api/projects/{self.project_id}/"
            response = requests.get(url, headers=self.headers, timeout=10)
            
            if response.status_code == 200:
                if DEBUG:
                    print("✅ PostHog API connection successful")
                return True
            elif response.status_code == 401:
                print("❌ PostHog API authentication failed (401)")
                print("   Please check your API key and ensure it has the correct permissions")
                print("   To get your API key:")
                print("   1. Go to PostHog -> Settings -> Project API Keys")
                print("   2. Copy your 'Project API Key' (not Personal API Key)")
                return False
            elif response.status_code == 403:
                print("❌ PostHog API access forbidden (403)")
                print("   Your API key doesn't have permission to access this project")
                return False
            elif response.status_code == 404:
                print("❌ PostHog project not found (404)")
                print(f"   Please verify your PROJECT_ID: {self.project_id}")
                return False
            else:
                print(f"⚠️ PostHog API connection failed: {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                return False
        except requests.exceptions.Timeout:
            print("❌ PostHog API connection timeout")
            return False
        except Exception as e:
            print(f"❌ PostHog API connection error: {str(e)}")
            return False
    
    def get_events(self, event_name: str = None, limit: int = 100) -> List[Dict]:
        """Get events from PostHog with better error handling"""
        try:
            url = f"{self.host}/api/projects/{self.project_id}/events/"
            params = {"limit": limit}
            if event_name:
                params["event"] = event_name
            
            response = requests.get(url, headers=self.headers, params=params, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                return data.get("results", [])
            elif response.status_code == 401:
                print("❌ PostHog events API authentication failed (401)")
                print("   Your API key is invalid or expired")
                return []
            elif response.status_code == 403:
                print("❌ PostHog events API access forbidden (403)")
                print("   Your API key doesn't have permission to read events")
                return []
            else:
                print(f"⚠️ PostHog events API error: {response.status_code}")
                if DEBUG:
                    print(f"   Response: {response.text[:200]}")
                return []
        except Exception as e:
            print(f"❌ Error fetching events: {str(e)}")
            return []
    
    def get_event_count(self, event_name: str) -> int:
        """Get count of specific event"""
        try:
            events = self.get_events(event_name, limit=1000)
            return len(events)
        except Exception as e:
            if DEBUG:
                print(f"❌ Error counting events for {event_name}: {str(e)}")
            return 0
    
    def create_funnel_from_events(self, funnel_events: List[str]) -> List[Dict]:
        """Create funnel data from PostHog events"""
        try:
            funnel_data = []
            
            for event_name in funnel_events:
                count = self.get_event_count(event_name)
                funnel_data.append({
                    "name": event_name,
                    "count": count
                })
            
            # Sort by count descending to create natural funnel flow
            funnel_data.sort(key=lambda x: x["count"], reverse=True)
            
            return funnel_data
        except Exception as e:
            if DEBUG:
                print(f"❌ Error creating funnel: {str(e)}")
            return []

# Initialize PostHog client
posthog_client = None
if POSTHOG_API_KEY and POSTHOG_PROJECT_ID and not USE_MOCK_DATA:
    posthog_client = PostHogAnalytics(
        POSTHOG_API_KEY, 
        POSTHOG_PROJECT_ID, 
        POSTHOG_API_HOST
    )
    
    # Test connection on startup
    connection_ok = posthog_client.test_connection()
    if connection_ok:
        print("✅ PostHog client initialized and connected successfully")
    else:
        print("❌ PostHog client initialized but connection failed")
        print("   Check your API key and project ID in the .env file")
else:
    print("🔧 Using mock data for development")

# Initialize advanced analytics
advanced_analytics = None
if posthog_client and AI_AGENTS_AVAILABLE:
    try:
        advanced_analytics = AdvancedAnalytics(posthog_client, agent_orchestrator)
        print("🧠 Advanced Analytics initialized")
    except Exception as e:
        print(f"⚠️ Advanced Analytics initialization failed: {e}")

@app.get("/")
async def health_check():
    connection_status = False
    if posthog_client:
        connection_status = posthog_client.test_connection()
    
    return {
        "status": "ok",
        "message": "Onboarding Analyzer API is running",
        "posthog_configured": bool(posthog_client),
        "posthog_connection": connection_status,
        "data_source": "PostHog API" if posthog_client and not USE_MOCK_DATA else "Mock Data",
        "project_id": POSTHOG_PROJECT_ID
    }

@app.get("/posthog/events")
async def get_posthog_events():
    """Get recent events from PostHog to see what's available"""
    if not posthog_client:
        return {"error": "PostHog not configured", "events": []}
    
    try:
        events = posthog_client.get_events(limit=50)
        
        # Get unique event names
        unique_events = list(set([event.get("event", "unknown") for event in events]))
        
        return {
            "total_events": len(events),
            "unique_event_types": len(unique_events),
            "event_types": unique_events,
            "sample_events": events[:10]  # Show first 10 events
        }
    except Exception as e:
        return {"error": str(e), "events": []}

@app.get("/funnel/{funnel_id}")
async def get_funnel_data(funnel_id: str):
    try:
        # Define the actual onboarding funnel events we sent to PostHog
        onboarding_funnel_events = [
            "user_signed_up",
            "email_verified", 
            "tutorial_started",
            "tutorial_completed",
            "first_action_taken",
            "second_session"
        ]
        
        steps_data = []
        
        if posthog_client and not USE_MOCK_DATA:
            print(f"📊 Fetching real PostHog data for funnel: {funnel_id}")
            
            # Get counts for each funnel step
            for event_name in onboarding_funnel_events:
                count = posthog_client.get_event_count(event_name)
                if count > 0:  # Only include events that have data
                    steps_data.append({
                        "name": event_name,
                        "count": count
                    })
            
            if DEBUG:
                print(f"📊 PostHog funnel data: {steps_data}")
            
            # If no real data, fall back to mock
            if not steps_data:
                print("⚠️ No PostHog data found, using mock data")
                steps_data = get_mock_funnel_data()
        else:
            print(f"🔧 Using mock data for funnel: {funnel_id}")
            steps_data = get_mock_funnel_data()
        
        # Calculate drop-off rates and conversion rates
        analysis = []
        total_users = steps_data[0]["count"] if steps_data else 0
        
        for i in range(len(steps_data)):
            current_step = steps_data[i]
            
            # Calculate conversion rate from initial step
            conversion_rate = (current_step["count"] / total_users * 100) if total_users > 0 else 0
            
            # Calculate drop-off rate from previous step
            if i > 0:
                prev_step = steps_data[i - 1]
                drop_off_rate = ((prev_step["count"] - current_step["count"]) / prev_step["count"]) * 100 if prev_step["count"] > 0 else 0
            else:
                drop_off_rate = 0
            
            analysis.append({
                "step": current_step["name"].replace("_", " ").title(),
                "count": current_step["count"],
                "conversion_rate": round(conversion_rate, 2),
                "drop_off_rate": round(drop_off_rate, 2) if i > 0 else 0
            })
        
        return {
            "funnel_id": funnel_id,
            "analysis": analysis,
            "raw_steps": steps_data,
            "data_source": "PostHog API" if posthog_client and not USE_MOCK_DATA else "Mock Data",
            "total_steps": len(steps_data),
            "total_users": total_users,
            "final_conversion_rate": round((steps_data[-1]["count"] / total_users * 100), 2) if steps_data and total_users > 0 else 0,
            "posthog_configured": bool(posthog_client)
        }
        
    except Exception as e:
        if DEBUG:
            print(f"❌ Error in get_funnel_data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing funnel data: {str(e)}")

@app.get("/recommendations/{funnel_id}")
async def get_recommendations(funnel_id: str):
    """Get AI-powered recommendations based on funnel performance"""
    try:
        # Get funnel data first
        funnel_response = await get_funnel_data(funnel_id)
        analysis = funnel_response.get("analysis", [])
        
        recommendations = []
        
        # Analyze each step and provide recommendations
        for step in analysis:
            step_name = step["step"].lower()
            drop_off_rate = step["drop_off_rate"]
            
            if drop_off_rate > 50:  # High drop-off
                if "email" in step_name:
                    recommendations.append({
                        "step": step["step"],
                        "priority": "high",
                        "issue": f"High drop-off rate of {drop_off_rate}% at email verification",
                        "recommendation": "Implement email verification reminders, simplify the verification process, or consider social login options",
                        "expected_impact": "15-25% improvement"
                    })
                elif "tutorial" in step_name:
                    recommendations.append({
                        "step": step["step"],
                        "priority": "high", 
                        "issue": f"High drop-off rate of {drop_off_rate}% during tutorial",
                        "recommendation": "Shorten tutorial length, make it interactive, add progress indicators, or make it skippable",
                        "expected_impact": "20-30% improvement"
                    })
                elif "first action" in step_name:
                    recommendations.append({
                        "step": step["step"],
                        "priority": "high",
                        "issue": f"High drop-off rate of {drop_off_rate}% at first action",
                        "recommendation": "Provide clearer guidance, implement user onboarding tooltips, or simplify the first action",
                        "expected_impact": "10-20% improvement"
                    })
            elif drop_off_rate > 25:  # Medium drop-off
                recommendations.append({
                    "step": step["step"],
                    "priority": "medium",
                    "issue": f"Moderate drop-off rate of {drop_off_rate}%",
                    "recommendation": f"Optimize the {step_name} experience with A/B testing and user feedback collection",
                    "expected_impact": "5-15% improvement"
                })
        
        # Overall recommendations
        final_conversion = funnel_response.get("final_conversion_rate", 0)
        if final_conversion < 20:
            recommendations.append({
                "step": "Overall Funnel",
                "priority": "critical",
                "issue": f"Low overall conversion rate of {final_conversion}%",
                "recommendation": "Conduct comprehensive user research, implement exit-intent surveys, and consider redesigning the entire onboarding flow",
                "expected_impact": "25-50% improvement"
            })
        
        return {
            "funnel_id": funnel_id,
            "recommendations": recommendations,
            "funnel_health": "good" if final_conversion > 30 else "needs_improvement" if final_conversion > 15 else "critical",
            "total_recommendations": len(recommendations)
        }
        
    except Exception as e:
        if DEBUG:
            print(f"❌ Error in get_recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating recommendations: {str(e)}")

def get_mock_funnel_data() -> List[Dict]:
    """Return mock data for development and fallback"""
    return [
        {"name": "signup", "count": 1000},
        {"name": "email_verification", "count": 800},
        {"name": "tutorial_start", "count": 600},
        {"name": "tutorial_complete", "count": 400},
        {"name": "first_action", "count": 300}
    ]

@app.get("/funnel/{funnel_id}/debug")
async def debug_funnel_data(funnel_id: str):
    """Debug endpoint to see raw PostHog data"""
    if not posthog_client:
        return {"error": "PostHog not configured"}
    
    try:
        # Test connection
        connection_ok = posthog_client.test_connection()
        
        # Get recent events
        recent_events = posthog_client.get_events(limit=20)
        
        # Get unique event names
        unique_events = list(set([event.get("event", "unknown") for event in recent_events]))
        
        return {
            "connection_status": connection_ok,
            "total_recent_events": len(recent_events),
            "unique_event_types": unique_events,
            "sample_events": recent_events[:5],
            "api_config": {
                "project_id": POSTHOG_PROJECT_ID,
                "host": POSTHOG_API_HOST,
                "api_key_prefix": POSTHOG_API_KEY[:20] + "..."
            }
        }
    except Exception as e:
        return {"error": str(e)}

# ==========================================
# AGENTIC AI ENDPOINTS
# ==========================================

@app.get("/ai/agents/status")
async def get_agent_status():
    """Get the status of all AI agents"""
    if not AI_AGENTS_AVAILABLE:
        return {"error": "AI agents not available", "agents": {}}
    
    try:
        agent_states = {}
        for agent_id, agent in agent_orchestrator.agents.items():
            agent_states[agent_id] = {
                "agent_id": agent.agent_id,
                "name": agent.name,
                "status": agent.state.status,
                "last_action": agent.state.last_action.isoformat(),
                "confidence_level": agent.state.confidence_level,
                "memory_size": agent.state.memory_size,
                "decisions_made": agent.state.decisions_made,
                "insights_generated": len(agent.insights_generated)
            }
        
        return {
            "agents_available": True,
            "total_agents": len(agent_orchestrator.agents),
            "agent_states": agent_states,
            "system_health": "operational"
        }
    except Exception as e:
        return {"error": f"Failed to get agent status: {str(e)}"}

@app.post("/ai/analyze/{funnel_id}")
async def ai_analyze_funnel(funnel_id: str):
    """Trigger comprehensive AI analysis of funnel data"""
    if not AI_AGENTS_AVAILABLE:
        return {"error": "AI agents not available"}
    
    try:
        # Get current funnel data
        funnel_data = await get_funnel_data(funnel_id)
        
        # Run AI agent analysis
        ai_analysis = await agent_orchestrator.analyze_funnel_data(funnel_data)
        
        return {
            "funnel_id": funnel_id,
            "ai_analysis": ai_analysis,
            "analysis_timestamp": datetime.now().isoformat(),
            "data_source": funnel_data.get("data_source", "unknown")
        }
    except Exception as e:
        logger.error(f"AI Analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

@app.get("/ai/insights/{funnel_id}")
async def get_ai_insights(funnel_id: str, insight_type: Optional[str] = None, limit: int = 20):
    """Get AI-generated insights for a specific funnel"""
    if not AI_AGENTS_AVAILABLE:
        return {"error": "AI agents not available"}
    
    try:
        # Get funnel data
        funnel_data = await get_funnel_data(funnel_id)
        
        # Run AI analysis to get fresh insights
        ai_analysis = await agent_orchestrator.analyze_funnel_data(funnel_data)
        
        insights = ai_analysis.get("prioritized_insights", [])
        
        # Filter by insight type if specified
        if insight_type:
            insights = [i for i in insights if i["insight_type"] == insight_type]
        
        # Limit results
        insights = insights[:limit]
        
        return {
            "funnel_id": funnel_id,
            "total_insights": len(insights),
            "insights": insights,
            "insight_types_available": list(set([i["insight_type"] for i in ai_analysis.get("prioritized_insights", [])])),
            "generated_at": ai_analysis.get("generated_at"),
            "system_confidence": ai_analysis.get("meta_analysis", {}).get("system_confidence", 0.0)
        }
    except Exception as e:
        logger.error(f"AI Insights error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get AI insights: {str(e)}")

@app.get("/ai/predictions/{funnel_id}")
async def get_ai_predictions(funnel_id: str):
    """Get AI predictions for funnel performance"""
    if not AI_AGENTS_AVAILABLE:
        return {"error": "AI agents not available"}
    
    try:
        # Get funnel data
        funnel_data = await get_funnel_data(funnel_id)
        
        # Run prediction agent specifically
        predictor_agent = agent_orchestrator.agents["predictor"]
        predictions = await predictor_agent.process(funnel_data)
        
        # Format predictions
        formatted_predictions = []
        for prediction in predictions:
            formatted_predictions.append({
                "insight_type": prediction.insight_type,
                "confidence": prediction.confidence,
                "description": prediction.description,
                "impact_level": prediction.impact_level,
                "suggested_actions": prediction.suggested_actions,
                "data_points": prediction.data_points,
                "created_at": prediction.created_at.isoformat()
            })
        
        return {
            "funnel_id": funnel_id,
            "predictions": formatted_predictions,
            "predictor_confidence": predictor_agent.state.confidence_level,
            "prediction_accuracy": predictor_agent.state.accuracy_score,
            "generated_at": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"AI Predictions error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get AI predictions: {str(e)}")

@app.get("/ai/anomalies/{funnel_id}")
async def get_anomaly_detection(funnel_id: str):
    """Get anomaly detection results"""
    if not AI_AGENTS_AVAILABLE:
        return {"error": "AI agents not available"}
    
    try:
        # Get funnel data
        funnel_data = await get_funnel_data(funnel_id)
        
        # Run anomaly detection agent
        anomaly_agent = agent_orchestrator.agents["anomaly_detector"]
        anomalies = await anomaly_agent.process(funnel_data)
        
        # Format anomalies
        formatted_anomalies = []
        for anomaly in anomalies:
            formatted_anomalies.append({
                "insight_type": anomaly.insight_type,
                "confidence": anomaly.confidence,
                "description": anomaly.description,
                "impact_level": anomaly.impact_level,
                "suggested_actions": anomaly.suggested_actions,
                "data_points": anomaly.data_points,
                "created_at": anomaly.created_at.isoformat()
            })
        
        return {
            "funnel_id": funnel_id,
            "anomalies": formatted_anomalies,
            "anomaly_count": len(formatted_anomalies),
            "detector_status": anomaly_agent.state.status,
            "detector_trained": getattr(anomaly_agent, 'trained', False),
            "baseline_established": bool(getattr(anomaly_agent, 'baseline_metrics', {})),
            "generated_at": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Anomaly Detection error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to detect anomalies: {str(e)}")

@app.get("/ai/optimizations/{funnel_id}")
async def get_autonomous_optimizations(funnel_id: str):
    """Get autonomous optimization recommendations"""
    if not AI_AGENTS_AVAILABLE:
        return {"error": "AI agents not available"}
    
    try:
        # Get funnel data
        funnel_data = await get_funnel_data(funnel_id)
        
        # Run optimizer agent
        optimizer_agent = agent_orchestrator.agents["optimizer"]
        optimizations = await optimizer_agent.process(funnel_data)
        
        # Format optimizations
        formatted_optimizations = []
        for optimization in optimizations:
            formatted_optimizations.append({
                "insight_type": optimization.insight_type,
                "confidence": optimization.confidence,
                "description": optimization.description,
                "impact_level": optimization.impact_level,
                "suggested_actions": optimization.suggested_actions,
                "data_points": optimization.data_points,
                "created_at": optimization.created_at.isoformat()
            })
        
        return {
            "funnel_id": funnel_id,
            "optimizations": formatted_optimizations,
            "optimization_count": len(formatted_optimizations),
            "optimizer_confidence": optimizer_agent.state.confidence_level,
            "decisions_made": optimizer_agent.state.decisions_made,
            "generated_at": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Autonomous Optimization error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get optimizations: {str(e)}")

@app.get("/ai/patterns/{funnel_id}")
async def get_pattern_analysis(funnel_id: str):
    """Get pattern analysis results"""
    if not AI_AGENTS_AVAILABLE:
        return {"error": "AI agents not available"}
    
    try:
        # Get funnel data
        funnel_data = await get_funnel_data(funnel_id)
        
        # Run pattern analysis agent
        pattern_agent = agent_orchestrator.agents["pattern_analyzer"]
        patterns = await pattern_agent.process(funnel_data)
        
        # Format patterns
        formatted_patterns = []
        for pattern in patterns:
            formatted_patterns.append({
                "insight_type": pattern.insight_type,
                "confidence": pattern.confidence,
                "description": pattern.description,
                "impact_level": pattern.impact_level,
                "suggested_actions": pattern.suggested_actions,
                "data_points": pattern.data_points,
                "created_at": pattern.created_at.isoformat()
            })
        
        return {
            "funnel_id": funnel_id,
            "patterns": formatted_patterns,
            "pattern_count": len(formatted_patterns),
            "trend_history_size": len(getattr(pattern_agent, 'trend_history', [])),
            "analyzer_confidence": pattern_agent.state.confidence_level,
            "generated_at": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Pattern Analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze patterns: {str(e)}")

@app.get("/ai/collaboration-report/{funnel_id}")
async def get_collaboration_report(funnel_id: str):
    """Get a comprehensive report on AI agent collaboration and consensus"""
    if not AI_AGENTS_AVAILABLE:
        return {"error": "AI agents not available"}
    
    try:
        # Get funnel data
        funnel_data = await get_funnel_data(funnel_id)
        
        # Run full multi-agent analysis
        collaboration_analysis = await agent_orchestrator.analyze_funnel_data(funnel_data)
        
        # Generate collaboration metrics
        meta_analysis = collaboration_analysis.get("meta_analysis", {})
        agent_states = collaboration_analysis.get("agent_states", {})
        
        # Calculate additional metrics
        total_insights = collaboration_analysis.get("total_insights", 0)
        insights_by_agent = collaboration_analysis.get("insights_by_agent", {})
        
        collaboration_report = {
            "funnel_id": funnel_id,
            "collaboration_metrics": {
                "collaboration_score": meta_analysis.get("collaboration_score", 0.0),
                "consensus_level": meta_analysis.get("consensus_level", 0.0),
                "system_confidence": meta_analysis.get("system_confidence", 0.0),
                "total_insights_generated": total_insights,
                "agent_participation": {
                    agent_id: count for agent_id, count in insights_by_agent.items()
                }
            },
            "agent_performance": {
                agent_id: {
                    "confidence_level": state.get("confidence_level", 0.0),
                    "decisions_made": state.get("decisions_made", 0),
                    "status": state.get("status", "unknown"),
                    "insights_contributed": insights_by_agent.get(agent_id, 0)
                }
                for agent_id, state in agent_states.items()
            },
            "top_insights": collaboration_analysis.get("prioritized_insights", [])[:5],
            "system_health": {
                "all_agents_active": all(
                    state.get("status") in ["active", "analyzing"] 
                    for state in agent_states.values()
                ),
                "average_agent_confidence": sum(
                    state.get("confidence_level", 0.0) 
                    for state in agent_states.values()
                ) / len(agent_states) if agent_states else 0.0,
                "total_decisions_made": sum(
                    state.get("decisions_made", 0) 
                    for state in agent_states.values()
                )
            },
            "generated_at": collaboration_analysis.get("generated_at")
        }
        
        return collaboration_report
        
    except Exception as e:
        logger.error(f"Collaboration Report error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate collaboration report: {str(e)}")

# ==========================================
# ADVANCED ANALYTICS ENDPOINTS
# ==========================================

@app.get("/analytics/segments/{funnel_id}")
async def get_user_segments(funnel_id: str, lookback_days: int = 30):
    """Get behavior-based user segments"""
    if not advanced_analytics:
        return {"error": "Advanced analytics not available", "segments": []}
    
    try:
        segments = await advanced_analytics.perform_behavior_segmentation(lookback_days)
        
        return {
            "funnel_id": funnel_id,
            "segments": [asdict(segment) for segment in segments],
            "total_segments": len(segments),
            "lookback_days": lookback_days,
            "generated_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user segments: {str(e)}")

@app.get("/analytics/cohorts/{funnel_id}")
async def get_cohort_analysis(funnel_id: str, months_back: int = 6):
    """Get cohort analysis data"""
    if not advanced_analytics:
        return {"error": "Advanced analytics not available", "cohorts": []}
    
    try:
        cohorts = await advanced_analytics.generate_cohort_analysis(months_back)
        
        return {
            "funnel_id": funnel_id,
            "cohorts": [asdict(cohort) for cohort in cohorts],
            "total_cohorts": len(cohorts),
            "months_analyzed": months_back,
            "generated_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get cohort analysis: {str(e)}")

@app.get("/analytics/session-replays/{funnel_id}")
async def get_session_replays(funnel_id: str, limit: int = 50, filter_dropped: bool = True):
    """Get session replay data for dropped users"""
    if not advanced_analytics:
        return {"error": "Advanced analytics not available", "sessions": []}
    
    try:
        replays = await advanced_analytics.get_session_replays(limit, filter_dropped)
        
        return {
            "funnel_id": funnel_id,
            "sessions": [asdict(replay) for replay in replays],
            "total_sessions": len(replays),
            "filter_dropped": filter_dropped,
            "generated_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get session replays: {str(e)}")

@app.get("/analytics/predictive-insights/{funnel_id}")
async def get_predictive_insights(funnel_id: str):
    """Get AI-powered predictive insights"""
    if not advanced_analytics:
        return {"error": "Advanced analytics not available", "insights": {}}
    
    try:
        # Get user segments first
        segments = await advanced_analytics.perform_behavior_segmentation()
        
        # Generate predictive insights
        insights = await advanced_analytics.generate_predictive_insights(segments)
        
        return {
            "funnel_id": funnel_id,
            "predictive_insights": insights,
            "segments_analyzed": len(segments),
            "generated_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get predictive insights: {str(e)}")

@app.get("/analytics/comprehensive-report/{funnel_id}")
async def get_comprehensive_analytics_report(funnel_id: str):
    """Get a comprehensive analytics report combining all advanced features"""
    if not advanced_analytics:
        return {"error": "Advanced analytics not available"}
    
    try:
        # Run all analytics in parallel
        segments_task = advanced_analytics.perform_behavior_segmentation()
        cohorts_task = advanced_analytics.generate_cohort_analysis()
        replays_task = advanced_analytics.get_session_replays(limit=20)
        
        segments, cohorts, replays = await asyncio.gather(
            segments_task, cohorts_task, replays_task
        )
        
        # Generate predictive insights
        insights = await advanced_analytics.generate_predictive_insights(segments)
        
        return {
            "funnel_id": funnel_id,
            "comprehensive_report": {
                "user_segments": {
                    "segments": [asdict(segment) for segment in segments],
                    "total_segments": len(segments)
                },
                "cohort_analysis": {
                    "cohorts": [asdict(cohort) for cohort in cohorts],
                    "total_cohorts": len(cohorts)
                },
                "session_replays": {
                    "sessions": [asdict(replay) for replay in replays],
                    "total_sessions": len(replays)
                },
                "predictive_insights": insights,
                "summary": {
                    "total_users_analyzed": sum(segment.user_count for segment in segments),
                    "average_conversion_rate": sum(segment.conversion_rate for segment in segments) / len(segments) if segments else 0,
                    "high_risk_segments": len([s for s in segments if s.conversion_rate < 0.3]),
                    "optimization_opportunities": len(insights.get("optimization_opportunities", [])),
                    "churn_risk_score": max(insights.get("churn_prediction", {}).values()) if insights.get("churn_prediction") else 0
                }
            },
            "generated_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate comprehensive report: {str(e)}")

# ==========================================
# END ADVANCED ANALYTICS ENDPOINTS
# ==========================================

@app.get("/posthog/test-connection")
async def test_posthog_connection():
    """Test PostHog connection and provide setup instructions"""
    if not posthog_client:
        return {
            "connected": False,
            "error": "PostHog not configured",
            "setup_instructions": {
                "step_1": "Get your PostHog API key from https://app.posthog.com/settings/project-api-keys",
                "step_2": "Update your .env file with the correct POSTHOG_API_KEY",
                "step_3": "Ensure your PROJECT_ID matches your PostHog project",
                "step_4": "Restart the backend server"
            }
        }
    
    connection_ok = posthog_client.test_connection()
    
    response = {
        "connected": connection_ok,
        "api_key_format_valid": not posthog_client.api_key.startswith("phc_VnQ"),
        "project_id": POSTHOG_PROJECT_ID,
        "api_host": POSTHOG_API_HOST,
        "api_key_prefix": posthog_client.api_key[:10] + "...",
        "configuration_status": "valid" if connection_ok else "invalid"
    }
    
    if not connection_ok:
        response["troubleshooting"] = {
            "common_issues": [
                "API key is invalid or expired",
                "Project ID doesn't match your PostHog project",
                "API key doesn't have sufficient permissions",
                "Network connectivity issues"
            ],
            "how_to_fix": {
                "get_api_key": "Go to PostHog -> Settings -> Project API Keys -> Copy 'Project API Key'",
                "get_project_id": "Found in PostHog URL: app.posthog.com/project/{PROJECT_ID}/",
                "check_permissions": "Ensure API key has 'read' permissions for events and insights"
            }
        }
    
    return response

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Onboarding Analyzer API...")
    print(f"📊 Using {'PostHog API' if posthog_client and not USE_MOCK_DATA else 'Mock Data'}")
    print(f"🤖 AI Agents: {'Available' if AI_AGENTS_AVAILABLE else 'Not Available'}")
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)