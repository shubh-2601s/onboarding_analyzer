"""
Agentic AI System for Onboarding Analyzer
=========================================

This module contains intelligent agents that can autonomously:
1. Analyze user behavior patterns
2. Detect anomalies in real-time
3. Generate predictive insights
4. Make autonomous optimization decisions
5. Learn from user feedback and adapt
"""

import asyncio
import json
import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import openai
from langchain.llms import OpenAI
from langchain.agents import initialize_agent, Tool, AgentType
from langchain.memory import ConversationBufferMemory
from langchain.schema import BaseMessage
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# AI Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

@dataclass
class AgentState:
    """Represents the current state of an agent"""
    agent_id: str
    status: str  # active, idle, learning, analyzing
    last_action: datetime
    confidence_level: float
    memory_size: int
    decisions_made: int
    accuracy_score: float

@dataclass
class InsightData:
    """Structured insight data from AI analysis"""
    insight_type: str  # anomaly, pattern, prediction, recommendation
    confidence: float
    description: str
    impact_level: str  # low, medium, high, critical
    suggested_actions: List[str]
    data_points: Dict[str, Any]
    created_at: datetime

class BaseAgent:
    """Base class for all AI agents"""
    
    def __init__(self, agent_id: str, name: str):
        self.agent_id = agent_id
        self.name = name
        self.state = AgentState(
            agent_id=agent_id,
            status="idle",
            last_action=datetime.now(),
            confidence_level=0.5,
            memory_size=0,
            decisions_made=0,
            accuracy_score=0.0
        )
        self.memory = []
        self.insights_generated = []
        
    async def process(self, data: Dict[str, Any]) -> List[InsightData]:
        """Process data and generate insights"""
        raise NotImplementedError("Subclasses must implement process method")
    
    def update_state(self, **kwargs):
        """Update agent state"""
        for key, value in kwargs.items():
            if hasattr(self.state, key):
                setattr(self.state, key, value)
        self.state.last_action = datetime.now()
    
    def add_to_memory(self, item: Dict[str, Any]):
        """Add item to agent memory"""
        self.memory.append({
            "timestamp": datetime.now(),
            "data": item
        })
        if len(self.memory) > 1000:  # Keep only last 1000 items
            self.memory = self.memory[-1000:]
        self.state.memory_size = len(self.memory)

class AnomalyDetectionAgent(BaseAgent):
    """Agent specialized in detecting anomalies in user behavior"""
    
    def __init__(self):
        super().__init__("anomaly_detector", "Anomaly Detection Agent")
        self.isolation_forest = IsolationForest(contamination=0.1, random_state=42)
        self.trained = False
        self.baseline_metrics = {}
        
    async def process(self, data: Dict[str, Any]) -> List[InsightData]:
        """Detect anomalies in funnel data"""
        self.update_state(status="analyzing")
        insights = []
        
        try:
            # Extract numerical features for anomaly detection
            funnel_data = data.get("analysis", [])
            if not funnel_data:
                return insights
                
            # Create feature matrix
            features = []
            for step in funnel_data:
                features.append([
                    step.get("count", 0),
                    step.get("drop_off_rate", 0),
                    step.get("conversion_rate", 0)
                ])
            
            features = np.array(features)
            
            if len(features) < 2:
                return insights
            
            # Train or predict anomalies
            if not self.trained and len(features) >= 3:
                self.isolation_forest.fit(features)
                self.trained = True
                self._establish_baseline(funnel_data)
                logger.info("🤖 Anomaly detection model trained")
            
            if self.trained:
                anomaly_scores = self.isolation_forest.decision_function(features)
                anomalies = self.isolation_forest.predict(features)
                
                # Analyze each step for anomalies
                for i, (step, score, is_anomaly) in enumerate(zip(funnel_data, anomaly_scores, anomalies)):
                    if is_anomaly == -1:  # Anomaly detected
                        severity = "critical" if score < -0.5 else "high" if score < -0.2 else "medium"
                        
                        insight = InsightData(
                            insight_type="anomaly",
                            confidence=min(abs(score), 1.0),
                            description=f"Unusual behavior detected in {step['step']}: "
                                      f"Drop-off rate of {step['drop_off_rate']:.1f}% is significantly different from normal patterns",
                            impact_level=severity,
                            suggested_actions=self._get_anomaly_actions(step, score),
                            data_points={
                                "step": step["step"],
                                "anomaly_score": float(score),
                                "current_dropoff": step["drop_off_rate"],
                                "baseline_dropoff": self.baseline_metrics.get(step["step"], {}).get("avg_dropoff", 0)
                            },
                            created_at=datetime.now()
                        )
                        insights.append(insight)
            
            self.insights_generated.extend(insights)
            self.update_state(
                status="active",
                confidence_level=min(self.state.confidence_level + 0.1, 1.0),
                decisions_made=self.state.decisions_made + len(insights)
            )
            
        except Exception as e:
            logger.error(f"❌ Anomaly detection error: {e}")
            self.update_state(status="error")
        
        return insights
    
    def _establish_baseline(self, funnel_data: List[Dict]):
        """Establish baseline metrics for comparison"""
        for step in funnel_data:
            step_name = step["step"]
            self.baseline_metrics[step_name] = {
                "avg_dropoff": step["drop_off_rate"],
                "avg_count": step["count"],
                "established_at": datetime.now()
            }
    
    def _get_anomaly_actions(self, step: Dict, score: float) -> List[str]:
        """Get suggested actions for anomaly"""
        actions = []
        
        if "email" in step["step"].lower():
            actions.extend([
                "Check email delivery rates and spam filters",
                "Review email verification flow for technical issues",
                "Implement alternative verification methods"
            ])
        elif "tutorial" in step["step"].lower():
            actions.extend([
                "Analyze tutorial completion heatmaps",
                "Check for UI/UX issues in tutorial steps",
                "Review user feedback during tutorial"
            ])
        else:
            actions.extend([
                "Investigate recent system changes or deployments",
                "Check for external factors affecting user behavior",
                "Review user support tickets for related issues"
            ])
        
        return actions

class PatternAnalysisAgent(BaseAgent):
    """Agent that identifies patterns in user behavior and predicts trends"""
    
    def __init__(self):
        super().__init__("pattern_analyzer", "Pattern Analysis Agent")
        self.scaler = StandardScaler()
        self.kmeans = KMeans(n_clusters=3, random_state=42)
        self.user_segments = {}
        self.trend_history = []
        
    async def process(self, data: Dict[str, Any]) -> List[InsightData]:
        """Analyze patterns in user behavior"""
        self.update_state(status="analyzing")
        insights = []
        
        try:
            funnel_data = data.get("analysis", [])
            if not funnel_data:
                return insights
            
            # Time-series pattern analysis
            current_time = datetime.now()
            
            # Store current data point
            self.trend_history.append({
                "timestamp": current_time,
                "data": funnel_data
            })
            
            # Keep only last 100 data points
            if len(self.trend_history) > 100:
                self.trend_history = self.trend_history[-100:]
            
            if len(self.trend_history) >= 10:  # Need minimum data for pattern analysis
                patterns = self._analyze_trends()
                insights.extend(patterns)
            
            # User segmentation analysis
            segmentation_insights = await self._analyze_user_segments(funnel_data)
            insights.extend(segmentation_insights)
            
            self.insights_generated.extend(insights)
            self.update_state(
                status="active",
                confidence_level=min(self.state.confidence_level + 0.05, 1.0),
                decisions_made=self.state.decisions_made + len(insights)
            )
            
        except Exception as e:
            logger.error(f"❌ Pattern analysis error: {e}")
            self.update_state(status="error")
        
        return insights
    
    def _analyze_trends(self) -> List[InsightData]:
        """Analyze trends in the historical data"""
        insights = []
        
        try:
            # Extract time series for each step
            steps = {}
            for data_point in self.trend_history:
                for step_data in data_point["data"]:
                    step_name = step_data["step"]
                    if step_name not in steps:
                        steps[step_name] = {"timestamps": [], "dropoff_rates": [], "counts": []}
                    
                    steps[step_name]["timestamps"].append(data_point["timestamp"])
                    steps[step_name]["dropoff_rates"].append(step_data["drop_off_rate"])
                    steps[step_name]["counts"].append(step_data["count"])
            
            # Analyze each step for trends
            for step_name, step_data in steps.items():
                if len(step_data["dropoff_rates"]) >= 5:
                    # Simple trend detection using linear regression
                    x = np.arange(len(step_data["dropoff_rates"]))
                    y = np.array(step_data["dropoff_rates"])
                    
                    # Calculate trend
                    slope = np.polyfit(x, y, 1)[0]
                    
                    if abs(slope) > 0.5:  # Significant trend detected
                        trend_type = "increasing" if slope > 0 else "decreasing"
                        impact = "critical" if abs(slope) > 2 else "high" if abs(slope) > 1 else "medium"
                        
                        insight = InsightData(
                            insight_type="pattern",
                            confidence=min(abs(slope) / 5.0, 1.0),
                            description=f"Trend detected in {step_name}: {trend_type} drop-off rate "
                                      f"with slope of {slope:.2f} over recent observations",
                            impact_level=impact,
                            suggested_actions=self._get_trend_actions(step_name, trend_type),
                            data_points={
                                "step": step_name,
                                "trend_slope": float(slope),
                                "trend_direction": trend_type,
                                "recent_average": float(np.mean(y[-5:]))
                            },
                            created_at=datetime.now()
                        )
                        insights.append(insight)
        
        except Exception as e:
            logger.error(f"❌ Trend analysis error: {e}")
        
        return insights
    
    async def _analyze_user_segments(self, funnel_data: List[Dict]) -> List[InsightData]:
        """Analyze user segments and their behavior patterns"""
        insights = []
        
        # This would be enhanced with real user segmentation data
        # For now, we'll create insights based on funnel performance
        
        total_users = sum(step.get("count", 0) for step in funnel_data)
        if total_users > 0:
            # Calculate overall funnel health
            final_conversion = funnel_data[-1]["count"] / funnel_data[0]["count"] * 100
            
            if final_conversion < 20:
                insight = InsightData(
                    insight_type="pattern",
                    confidence=0.8,
                    description=f"Low overall conversion pattern detected: {final_conversion:.1f}%. "
                              "This suggests systematic issues in the onboarding flow.",
                    impact_level="critical",
                    suggested_actions=[
                        "Conduct comprehensive user journey mapping",
                        "Implement exit-intent surveys at each step",
                        "A/B test simplified onboarding flows",
                        "Analyze user feedback for common pain points"
                    ],
                    data_points={
                        "overall_conversion": float(final_conversion),
                        "total_users_analyzed": total_users,
                        "bottleneck_steps": [
                            step["step"] for step in funnel_data 
                            if step["drop_off_rate"] > 30
                        ]
                    },
                    created_at=datetime.now()
                )
                insights.append(insight)
        
        return insights
    
    def _get_trend_actions(self, step_name: str, trend_type: str) -> List[str]:
        """Get actions based on trend analysis"""
        actions = []
        
        if trend_type == "increasing":
            actions.extend([
                f"Investigate root cause of worsening performance in {step_name}",
                "Check for recent changes or external factors",
                "Implement immediate fixes if technical issues found"
            ])
        else:
            actions.extend([
                f"Analyze what's driving improvement in {step_name}",
                "Document successful changes for replication",
                "Consider applying similar optimizations to other steps"
            ])
        
        return actions

class PredictiveAgent(BaseAgent):
    """Agent that makes predictions about future user behavior"""
    
    def __init__(self):
        super().__init__("predictor", "Predictive Analysis Agent")
        self.prediction_models = {}
        self.historical_accuracy = {}
        
    async def process(self, data: Dict[str, Any]) -> List[InsightData]:
        """Generate predictions about future funnel performance"""
        self.update_state(status="analyzing")
        insights = []
        
        try:
            funnel_data = data.get("analysis", [])
            if not funnel_data:
                return insights
            
            # Generate predictions for each step
            for step in funnel_data:
                prediction_insight = await self._predict_step_performance(step)
                if prediction_insight:
                    insights.append(prediction_insight)
            
            # Overall funnel prediction
            overall_prediction = await self._predict_overall_funnel(funnel_data)
            if overall_prediction:
                insights.append(overall_prediction)
            
            self.insights_generated.extend(insights)
            self.update_state(
                status="active",
                confidence_level=min(self.state.confidence_level + 0.08, 1.0),
                decisions_made=self.state.decisions_made + len(insights)
            )
            
        except Exception as e:
            logger.error(f"❌ Prediction error: {e}")
            self.update_state(status="error")
        
        return insights
    
    async def _predict_step_performance(self, step: Dict) -> Optional[InsightData]:
        """Predict future performance for a specific step"""
        try:
            current_dropoff = step["drop_off_rate"]
            step_name = step["step"]
            
            # Simple prediction based on current performance and thresholds
            if current_dropoff > 40:
                predicted_impact = "If no action taken, expect 10-20% further degradation"
                confidence = 0.7
                impact_level = "critical"
                actions = [
                    f"Immediate intervention required for {step_name}",
                    "Implement emergency fixes within 48 hours",
                    "Monitor performance hourly until stabilized"
                ]
            elif current_dropoff > 25:
                predicted_impact = "Performance likely to worsen without optimization"
                confidence = 0.6
                impact_level = "high"
                actions = [
                    f"Schedule optimization work for {step_name} within next week",
                    "Prepare A/B tests for alternative approaches",
                    "Increase monitoring frequency"
                ]
            elif current_dropoff < 10:
                predicted_impact = "Performance likely to remain stable or improve"
                confidence = 0.5
                impact_level = "low"
                actions = [
                    f"Maintain current approach for {step_name}",
                    "Consider using this step as a template for others",
                    "Continue standard monitoring"
                ]
            else:
                return None
            
            return InsightData(
                insight_type="prediction",
                confidence=confidence,
                description=f"Prediction for {step_name}: {predicted_impact}",
                impact_level=impact_level,
                suggested_actions=actions,
                data_points={
                    "step": step_name,
                    "current_dropoff": current_dropoff,
                    "prediction_horizon": "7-14 days",
                    "confidence_score": confidence
                },
                created_at=datetime.now()
            )
            
        except Exception as e:
            logger.error(f"❌ Step prediction error: {e}")
            return None
    
    async def _predict_overall_funnel(self, funnel_data: List[Dict]) -> Optional[InsightData]:
        """Predict overall funnel performance"""
        try:
            if not funnel_data:
                return None
            
            total_users = funnel_data[0]["count"]
            final_users = funnel_data[-1]["count"]
            current_conversion = (final_users / total_users * 100) if total_users > 0 else 0
            
            # Calculate health score
            health_score = 100 - np.mean([step["drop_off_rate"] for step in funnel_data[1:]])
            
            if health_score < 40:
                prediction = "Funnel performance expected to decline significantly without intervention"
                impact_level = "critical"
                confidence = 0.8
            elif health_score < 60:
                prediction = "Funnel performance may decline without optimization efforts"
                impact_level = "high"
                confidence = 0.7
            elif health_score > 80:
                prediction = "Funnel performance expected to remain strong or improve"
                impact_level = "low"
                confidence = 0.6
            else:
                return None
            
            return InsightData(
                insight_type="prediction",
                confidence=confidence,
                description=f"Overall funnel prediction: {prediction}",
                impact_level=impact_level,
                suggested_actions=[
                    "Focus on steps with highest drop-off rates",
                    "Implement comprehensive monitoring dashboard",
                    "Plan quarterly funnel optimization reviews"
                ],
                data_points={
                    "current_conversion_rate": float(current_conversion),
                    "health_score": float(health_score),
                    "prediction_timeframe": "30 days",
                    "confidence": confidence
                },
                created_at=datetime.now()
            )
            
        except Exception as e:
            logger.error(f"❌ Overall prediction error: {e}")
            return None

class AutonomousOptimizerAgent(BaseAgent):
    """Agent that can make autonomous optimization decisions"""
    
    def __init__(self):
        super().__init__("optimizer", "Autonomous Optimizer Agent")
        self.optimization_rules = self._load_optimization_rules()
        self.decisions_made = []
        self.success_rate = 0.0
        
    async def process(self, data: Dict[str, Any]) -> List[InsightData]:
        """Generate autonomous optimization recommendations"""
        self.update_state(status="analyzing")
        insights = []
        
        try:
            funnel_data = data.get("analysis", [])
            if not funnel_data:
                return insights
            
            # Analyze each step for optimization opportunities
            for step in funnel_data:
                optimization_insights = await self._generate_optimizations(step)
                insights.extend(optimization_insights)
            
            # Generate strategic optimizations
            strategic_insights = await self._generate_strategic_optimizations(funnel_data)
            insights.extend(strategic_insights)
            
            self.insights_generated.extend(insights)
            self.update_state(
                status="active",
                confidence_level=min(self.state.confidence_level + 0.1, 1.0),
                decisions_made=self.state.decisions_made + len(insights)
            )
            
        except Exception as e:
            logger.error(f"❌ Optimization error: {e}")
            self.update_state(status="error")
        
        return insights
    
    def _load_optimization_rules(self) -> Dict[str, Any]:
        """Load optimization rules and decision trees"""
        return {
            "email_verification": {
                "high_dropoff_threshold": 30,
                "optimizations": [
                    "Implement one-click email verification",
                    "Add social login alternatives",
                    "Send verification reminders after 10 minutes"
                ]
            },
            "tutorial": {
                "high_dropoff_threshold": 25,
                "optimizations": [
                    "Make tutorial skippable with option to return",
                    "Add progress indicators and time estimates",
                    "Implement interactive elements and gamification"
                ]
            },
            "first_action": {
                "high_dropoff_threshold": 35,
                "optimizations": [
                    "Add contextual tooltips and guidance",
                    "Simplify the first action workflow",
                    "Provide templates or examples"
                ]
            }
        }
    
    async def _generate_optimizations(self, step: Dict) -> List[InsightData]:
        """Generate optimization recommendations for a step"""
        insights = []
        
        try:
            step_name = step["step"].lower()
            drop_off_rate = step["drop_off_rate"]
            
            # Find matching optimization rules
            for rule_key, rule_config in self.optimization_rules.items():
                if rule_key in step_name and drop_off_rate > rule_config["high_dropoff_threshold"]:
                    
                    # Calculate optimization priority
                    urgency = "critical" if drop_off_rate > 50 else "high" if drop_off_rate > 40 else "medium"
                    
                    insight = InsightData(
                        insight_type="recommendation",
                        confidence=0.8,
                        description=f"Autonomous optimization recommendation for {step['step']}: "
                                  f"Drop-off rate of {drop_off_rate:.1f}% exceeds threshold",
                        impact_level=urgency,
                        suggested_actions=rule_config["optimizations"],
                        data_points={
                            "step": step["step"],
                            "current_dropoff": drop_off_rate,
                            "threshold": rule_config["high_dropoff_threshold"],
                            "optimization_type": "rule_based",
                            "estimated_improvement": "15-30%"
                        },
                        created_at=datetime.now()
                    )
                    insights.append(insight)
        
        except Exception as e:
            logger.error(f"❌ Step optimization error: {e}")
        
        return insights
    
    async def _generate_strategic_optimizations(self, funnel_data: List[Dict]) -> List[InsightData]:
        """Generate strategic optimization recommendations"""
        insights = []
        
        try:
            # Calculate funnel efficiency metrics
            total_dropoff = sum(step["drop_off_rate"] for step in funnel_data[1:])
            avg_dropoff = total_dropoff / (len(funnel_data) - 1) if len(funnel_data) > 1 else 0
            
            # Identify bottlenecks
            bottlenecks = [step for step in funnel_data if step["drop_off_rate"] > avg_dropoff * 1.5]
            
            if len(bottlenecks) >= 2:
                insight = InsightData(
                    insight_type="recommendation",
                    confidence=0.9,
                    description=f"Strategic optimization needed: {len(bottlenecks)} major bottlenecks detected. "
                              f"Focus on sequential optimization starting with highest-impact step.",
                    impact_level="critical",
                    suggested_actions=[
                        "Prioritize optimization of bottleneck steps in order of impact",
                        "Implement A/B testing framework for optimization experiments",
                        "Set up real-time monitoring for optimization results",
                        "Create user feedback loops for each optimized step"
                    ],
                    data_points={
                        "bottleneck_count": len(bottlenecks),
                        "bottleneck_steps": [step["step"] for step in bottlenecks],
                        "average_dropoff": float(avg_dropoff),
                        "optimization_strategy": "sequential_bottleneck_resolution"
                    },
                    created_at=datetime.now()
                )
                insights.append(insight)
        
        except Exception as e:
            logger.error(f"❌ Strategic optimization error: {e}")
        
        return insights

class AgentOrchestrator:
    """Orchestrates multiple AI agents and manages their interactions"""
    
    def __init__(self):
        self.agents = {
            "anomaly_detector": AnomalyDetectionAgent(),
            "pattern_analyzer": PatternAnalysisAgent(),
            "predictor": PredictiveAgent(),
            "optimizer": AutonomousOptimizerAgent()
        }
        self.orchestrator_memory = []
        self.collaboration_insights = []
        
    async def analyze_funnel_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Orchestrate analysis across all agents"""
        logger.info("🤖 Starting multi-agent analysis...")
        
        all_insights = []
        agent_results = {}
        
        # Run all agents concurrently
        tasks = []
        for agent_id, agent in self.agents.items():
            task = asyncio.create_task(agent.process(data))
            tasks.append((agent_id, task))
        
        # Collect results
        for agent_id, task in tasks:
            try:
                insights = await task
                agent_results[agent_id] = insights
                all_insights.extend(insights)
                logger.info(f"✅ Agent {agent_id} generated {len(insights)} insights")
            except Exception as e:
                logger.error(f"❌ Agent {agent_id} failed: {e}")
                agent_results[agent_id] = []
        
        # Generate meta-insights from agent collaboration
        meta_insights = await self._generate_meta_insights(agent_results, data)
        all_insights.extend(meta_insights)
        
        # Prioritize and rank insights
        prioritized_insights = self._prioritize_insights(all_insights)
        
        return {
            "total_insights": len(all_insights),
            "insights_by_agent": {
                agent_id: len(results) for agent_id, results in agent_results.items()
            },
            "prioritized_insights": prioritized_insights[:10],  # Top 10 insights
            "agent_states": {
                agent_id: asdict(agent.state) for agent_id, agent in self.agents.items()
            },
            "meta_analysis": {
                "collaboration_score": self._calculate_collaboration_score(agent_results),
                "consensus_level": self._calculate_consensus(agent_results),
                "system_confidence": self._calculate_system_confidence()
            },
            "generated_at": datetime.now().isoformat()
        }
    
    async def _generate_meta_insights(self, agent_results: Dict[str, List[InsightData]], 
                                    original_data: Dict[str, Any]) -> List[InsightData]:
        """Generate insights from the collaboration between agents"""
        meta_insights = []
        
        try:
            # Check for consensus across agents
            critical_insights = []
            for agent_id, insights in agent_results.items():
                critical_insights.extend([i for i in insights if i.impact_level == "critical"])
            
            if len(critical_insights) >= 2:
                # Multiple agents agree on critical issues
                consensus_steps = {}
                for insight in critical_insights:
                    step = insight.data_points.get("step", "unknown")
                    if step not in consensus_steps:
                        consensus_steps[step] = []
                    consensus_steps[step].append(insight)
                
                for step, step_insights in consensus_steps.items():
                    if len(step_insights) >= 2:  # Multiple agents flag same step
                        meta_insight = InsightData(
                            insight_type="meta_analysis",
                            confidence=0.95,
                            description=f"Multi-agent consensus: Critical issues detected in {step}. "
                                      f"{len(step_insights)} agents independently flagged this step.",
                            impact_level="critical",
                            suggested_actions=[
                                f"Immediate attention required for {step}",
                                "Deploy emergency response team",
                                "Implement hourly monitoring",
                                "Prepare rollback procedures if needed"
                            ],
                            data_points={
                                "consensus_agents": len(step_insights),
                                "step": step,
                                "agent_agreement_score": len(step_insights) / len(self.agents),
                                "meta_analysis_type": "consensus_critical"
                            },
                            created_at=datetime.now()
                        )
                        meta_insights.append(meta_insight)
            
        except Exception as e:
            logger.error(f"❌ Meta-insight generation error: {e}")
        
        return meta_insights
    
    def _prioritize_insights(self, insights: List[InsightData]) -> List[Dict[str, Any]]:
        """Prioritize insights based on impact, confidence, and urgency"""
        
        def calculate_priority_score(insight: InsightData) -> float:
            impact_scores = {"critical": 4, "high": 3, "medium": 2, "low": 1}
            impact_score = impact_scores.get(insight.impact_level, 1)
            
            # Priority = impact * confidence * recency_factor
            recency_factor = 1.0  # Could be enhanced based on time
            return impact_score * insight.confidence * recency_factor
        
        # Sort by priority score
        prioritized = sorted(insights, key=calculate_priority_score, reverse=True)
        
        # Convert to serializable format
        return [
            {
                "insight_type": insight.insight_type,
                "confidence": insight.confidence,
                "description": insight.description,
                "impact_level": insight.impact_level,
                "suggested_actions": insight.suggested_actions,
                "data_points": insight.data_points,
                "created_at": insight.created_at.isoformat(),
                "priority_score": calculate_priority_score(insight)
            }
            for insight in prioritized
        ]
    
    def _calculate_collaboration_score(self, agent_results: Dict[str, List[InsightData]]) -> float:
        """Calculate how well agents are collaborating"""
        total_insights = sum(len(results) for results in agent_results.values())
        if total_insights == 0:
            return 0.0
        
        # Higher score when multiple agents contribute
        active_agents = sum(1 for results in agent_results.values() if len(results) > 0)
        return min(active_agents / len(self.agents), 1.0)
    
    def _calculate_consensus(self, agent_results: Dict[str, List[InsightData]]) -> float:
        """Calculate consensus level between agents"""
        # Simplified consensus calculation
        critical_counts = []
        for results in agent_results.values():
            critical_count = len([i for i in results if i.impact_level == "critical"])
            critical_counts.append(critical_count)
        
        if not critical_counts:
            return 0.5
        
        # Higher consensus when agents agree on number of critical issues
        avg_critical = np.mean(critical_counts)
        std_critical = np.std(critical_counts)
        
        if avg_critical == 0:
            return 1.0  # Perfect consensus on no issues
        
        consensus = 1.0 - min(std_critical / avg_critical, 1.0)
        return max(consensus, 0.0)
    
    def _calculate_system_confidence(self) -> float:
        """Calculate overall system confidence"""
        confidence_scores = [agent.state.confidence_level for agent in self.agents.values()]
        return np.mean(confidence_scores) if confidence_scores else 0.0

# Global agent orchestrator instance
agent_orchestrator = AgentOrchestrator()

# Export for use in main app
__all__ = ["agent_orchestrator", "AgentOrchestrator", "InsightData"]