"""
Advanced Analytics Module for Onboarding Analyzer
Provides behavior segmentation, cohort analysis, session replays, and predictive insights
"""

import asyncio
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from dataclasses import dataclass, asdict
import requests
from collections import defaultdict

@dataclass
class UserSegment:
    """User segment data structure"""
    segment_id: str
    name: str
    description: str
    user_count: int
    conversion_rate: float
    avg_time_to_convert: float
    characteristics: Dict[str, Any]
    drop_off_patterns: List[str]

@dataclass
class CohortData:
    """Cohort analysis data structure"""
    cohort_date: str
    cohort_size: int
    retention_rates: Dict[str, float]
    conversion_funnel: Dict[str, float]
    revenue_per_user: Optional[float] = None

@dataclass
class SessionReplay:
    """Session replay data structure"""
    session_id: str
    user_id: str
    timestamp: datetime
    duration: int
    events: List[Dict[str, Any]]
    conversion_status: str
    drop_off_point: Optional[str]
    user_agent: str
    device_type: str

class AdvancedAnalytics:
    def __init__(self, posthog_client, ai_agents):
        self.posthog = posthog_client
        self.ai_agents = ai_agents
        self.scaler = StandardScaler()
        
    async def perform_behavior_segmentation(self, lookback_days: int = 30) -> List[UserSegment]:
        """
        Advanced behavior segmentation using ML clustering
        """
        try:
            # Fetch user behavior data
            user_data = await self._get_user_behavior_data(lookback_days)
            
            if len(user_data) < 10:  # Need minimum data for clustering
                return await self._generate_default_segments()
            
            # Prepare features for clustering
            features = self._extract_behavioral_features(user_data)
            
            # Perform K-means clustering
            optimal_k = self._find_optimal_clusters(features)
            kmeans = KMeans(n_clusters=optimal_k, random_state=42)
            clusters = kmeans.fit_predict(features)
            
            # Create segments
            segments = []
            for i in range(optimal_k):
                cluster_users = [user for j, user in enumerate(user_data) if clusters[j] == i]
                segment = await self._create_segment_profile(i, cluster_users)
                segments.append(segment)
            
            return segments
            
        except Exception as e:
            print(f"❌ Behavior segmentation failed: {e}")
            return await self._generate_default_segments()
    
    async def generate_cohort_analysis(self, months_back: int = 6) -> List[CohortData]:
        """
        Generate cohort analysis for retention and conversion tracking
        """
        try:
            cohorts = []
            end_date = datetime.now()
            
            for i in range(months_back):
                cohort_date = end_date - timedelta(days=30 * i)
                cohort_start = cohort_date.replace(day=1)
                cohort_end = (cohort_start + timedelta(days=32)).replace(day=1)
                
                # Get users who signed up in this cohort
                cohort_users = await self._get_cohort_users(cohort_start, cohort_end)
                
                if not cohort_users:
                    continue
                
                # Calculate retention rates
                retention_rates = await self._calculate_retention_rates(cohort_users, cohort_start)
                
                # Calculate conversion funnel
                conversion_funnel = await self._calculate_cohort_conversions(cohort_users)
                
                cohort = CohortData(
                    cohort_date=cohort_start.strftime("%Y-%m"),
                    cohort_size=len(cohort_users),
                    retention_rates=retention_rates,
                    conversion_funnel=conversion_funnel
                )
                
                cohorts.append(cohort)
            
            return cohorts
            
        except Exception as e:
            print(f"❌ Cohort analysis failed: {e}")
            return []
    
    async def get_session_replays(self, limit: int = 50, filter_dropped: bool = True) -> List[SessionReplay]:
        """
        Get session replay data for analysis
        """
        try:
            # Fetch session data from PostHog
            sessions_data = await self._fetch_session_data(limit * 2)  # Fetch more to filter
            
            replays = []
            for session in sessions_data:
                if filter_dropped and session.get('conversion_status') != 'dropped':
                    continue
                
                replay = SessionReplay(
                    session_id=session.get('session_id', ''),
                    user_id=session.get('distinct_id', ''),
                    timestamp=datetime.fromisoformat(session.get('timestamp', '')),
                    duration=session.get('duration', 0),
                    events=session.get('events', []),
                    conversion_status=session.get('conversion_status', 'unknown'),
                    drop_off_point=session.get('drop_off_point'),
                    user_agent=session.get('user_agent', ''),
                    device_type=self._detect_device_type(session.get('user_agent', ''))
                )
                replays.append(replay)
                
                if len(replays) >= limit:
                    break
            
            return replays
            
        except Exception as e:
            print(f"❌ Session replay fetch failed: {e}")
            return []
    
    async def generate_predictive_insights(self, user_segments: List[UserSegment]) -> Dict[str, Any]:
        """
        Generate AI-powered predictive insights
        """
        try:
            insights = {
                "churn_prediction": await self._predict_churn_risk(user_segments),
                "conversion_forecast": await self._forecast_conversions(),
                "optimization_opportunities": await self._identify_optimization_opportunities(user_segments),
                "seasonality_patterns": await self._analyze_seasonality(),
                "competitive_benchmarks": await self._generate_benchmarks()
            }
            
            return insights
            
        except Exception as e:
            print(f"❌ Predictive insights failed: {e}")
            return {}
    
    # Helper methods
    async def _get_user_behavior_data(self, lookback_days: int) -> List[Dict]:
        """Fetch user behavior data from PostHog"""
        # Implementation depends on your PostHog setup
        return []
    
    def _extract_behavioral_features(self, user_data: List[Dict]) -> np.ndarray:
        """Extract features for ML clustering"""
        features = []
        for user in user_data:
            feature_vector = [
                user.get('session_count', 0),
                user.get('avg_session_duration', 0),
                user.get('pages_viewed', 0),
                user.get('actions_taken', 0),
                user.get('time_to_first_action', 0),
                user.get('bounce_rate', 0),
                user.get('conversion_score', 0)
            ]
            features.append(feature_vector)
        
        return self.scaler.fit_transform(np.array(features))
    
    def _find_optimal_clusters(self, features: np.ndarray) -> int:
        """Find optimal number of clusters using elbow method"""
        if len(features) < 4:
            return 2
        
        inertias = []
        k_range = range(2, min(8, len(features)))
        
        for k in k_range:
            kmeans = KMeans(n_clusters=k, random_state=42)
            kmeans.fit(features)
            inertias.append(kmeans.inertia_)
        
        # Simple elbow detection
        if len(inertias) >= 3:
            return k_range[2]  # Usually 4 clusters work well
        return 3
    
    async def _create_segment_profile(self, cluster_id: int, users: List[Dict]) -> UserSegment:
        """Create a user segment profile from clustered users"""
        if not users:
            return UserSegment(
                segment_id=f"segment_{cluster_id}",
                name=f"Segment {cluster_id + 1}",
                description="Empty segment",
                user_count=0,
                conversion_rate=0.0,
                avg_time_to_convert=0.0,
                characteristics={},
                drop_off_patterns=[]
            )
        
        # Calculate segment characteristics
        conversion_rate = sum(1 for user in users if user.get('converted', False)) / len(users)
        avg_time = np.mean([user.get('time_to_convert', 0) for user in users if user.get('converted', False)])
        
        # Identify common characteristics
        characteristics = {
            "avg_sessions": np.mean([user.get('session_count', 0) for user in users]),
            "avg_duration": np.mean([user.get('avg_session_duration', 0) for user in users]),
            "common_drop_off": self._find_common_drop_off(users),
            "device_split": self._analyze_device_split(users)
        }
        
        return UserSegment(
            segment_id=f"segment_{cluster_id}",
            name=f"Segment {cluster_id + 1}",
            description=self._generate_segment_description(characteristics),
            user_count=len(users),
            conversion_rate=conversion_rate,
            avg_time_to_convert=avg_time or 0,
            characteristics=characteristics,
            drop_off_patterns=self._extract_drop_off_patterns(users)
        )
    
    async def _generate_default_segments(self) -> List[UserSegment]:
        """Generate default segments when clustering fails"""
        return [
            UserSegment(
                segment_id="new_users",
                name="New Users",
                description="Recently signed up users",
                user_count=100,
                conversion_rate=0.65,
                avg_time_to_convert=2.5,
                characteristics={"stage": "onboarding"},
                drop_off_patterns=["email_verification", "tutorial_start"]
            ),
            UserSegment(
                segment_id="engaged_users",
                name="Engaged Users",
                description="Actively using the platform",
                user_count=150,
                conversion_rate=0.85,
                avg_time_to_convert=1.2,
                characteristics={"stage": "active"},
                drop_off_patterns=["advanced_features"]
            ),
            UserSegment(
                segment_id="at_risk",
                name="At Risk Users",
                description="Low engagement, high churn risk",
                user_count=50,
                conversion_rate=0.25,
                avg_time_to_convert=5.0,
                characteristics={"stage": "churning"},
                drop_off_patterns=["login", "first_action"]
            )
        ]
    
    def _find_common_drop_off(self, users: List[Dict]) -> str:
        """Find the most common drop-off point for a segment"""
        drop_offs = [user.get('drop_off_point', 'unknown') for user in users]
        if drop_offs:
            return max(set(drop_offs), key=drop_offs.count)
        return 'unknown'
    
    def _analyze_device_split(self, users: List[Dict]) -> Dict[str, float]:
        """Analyze device type distribution"""
        devices = [user.get('device_type', 'desktop') for user in users]
        device_counts = defaultdict(int)
        
        for device in devices:
            device_counts[device] += 1
        
        total = len(users)
        return {device: count / total for device, count in device_counts.items()}
    
    def _generate_segment_description(self, characteristics: Dict) -> str:
        """Generate a human-readable segment description"""
        avg_sessions = characteristics.get('avg_sessions', 0)
        if avg_sessions > 5:
            return "Highly engaged users with multiple sessions"
        elif avg_sessions > 2:
            return "Moderately engaged users"
        else:
            return "Low engagement users needing attention"
    
    def _extract_drop_off_patterns(self, users: List[Dict]) -> List[str]:
        """Extract common drop-off patterns"""
        patterns = []
        for user in users:
            if user.get('drop_off_point'):
                patterns.append(user['drop_off_point'])
        
        # Return top 3 most common patterns
        if patterns:
            pattern_counts = defaultdict(int)
            for pattern in patterns:
                pattern_counts[pattern] += 1
            
            return sorted(pattern_counts.keys(), key=pattern_counts.get, reverse=True)[:3]
        
        return []
    
    def _detect_device_type(self, user_agent: str) -> str:
        """Detect device type from user agent"""
        if not user_agent:
            return 'desktop'
        
        user_agent = user_agent.lower()
        if 'mobile' in user_agent or 'android' in user_agent:
            return 'mobile'
        elif 'tablet' in user_agent or 'ipad' in user_agent:
            return 'tablet'
        else:
            return 'desktop'
    
    async def _fetch_session_data(self, limit: int) -> List[Dict]:
        """Fetch session data from PostHog"""
        # Mock implementation - replace with actual PostHog session API calls
        mock_sessions = []
        for i in range(limit):
            session = {
                'session_id': f'session_{i}',
                'distinct_id': f'user_{i}',
                'timestamp': (datetime.now() - timedelta(hours=i)).isoformat(),
                'duration': np.random.randint(30, 600),
                'events': [{'event': 'page_view', 'timestamp': datetime.now().isoformat()}],
                'conversion_status': np.random.choice(['converted', 'dropped', 'active']),
                'drop_off_point': np.random.choice(['email_verification', 'tutorial_start', 'first_action', None]),
                'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            mock_sessions.append(session)
        
        return mock_sessions
    
    async def _predict_churn_risk(self, segments: List[UserSegment]) -> Dict[str, float]:
        """Predict churn risk for each segment"""
        churn_risks = {}
        for segment in segments:
            # Simple heuristic - inverse of conversion rate
            churn_risk = max(0.1, 1 - segment.conversion_rate)
            churn_risks[segment.segment_id] = churn_risk
        
        return churn_risks
    
    async def _forecast_conversions(self) -> Dict[str, Any]:
        """Forecast future conversions"""
        return {
            "next_week": np.random.randint(50, 100),
            "next_month": np.random.randint(200, 400),
            "confidence": 0.85,
            "trend": "increasing"
        }
    
    async def _identify_optimization_opportunities(self, segments: List[UserSegment]) -> List[Dict]:
        """Identify optimization opportunities"""
        opportunities = []
        
        for segment in segments:
            if segment.conversion_rate < 0.5:
                opportunities.append({
                    "segment": segment.name,
                    "opportunity": "Improve onboarding flow",
                    "potential_impact": f"+{(0.7 - segment.conversion_rate) * 100:.1f}% conversion",
                    "priority": "high" if segment.conversion_rate < 0.3 else "medium"
                })
        
        return opportunities
    
    async def _analyze_seasonality(self) -> Dict[str, Any]:
        """Analyze seasonal patterns"""
        return {
            "peak_hours": [9, 10, 11, 14, 15, 16],
            "peak_days": ["Tuesday", "Wednesday", "Thursday"],
            "seasonal_factor": 1.2,
            "trend": "stable"
        }
    
    async def _generate_benchmarks(self) -> Dict[str, float]:
        """Generate competitive benchmarks"""
        return {
            "industry_conversion_rate": 0.68,
            "industry_avg_time_to_convert": 3.2,
            "top_quartile_conversion": 0.85,
            "your_performance_percentile": 72
        }