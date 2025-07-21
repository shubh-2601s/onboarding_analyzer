import requests
import random
import time
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os
import uuid

# Load environment variables
load_dotenv()

# PostHog Configuration
POSTHOG_API_KEY = os.getenv("POSTHOG_API_KEY", "phc_E8UCfzkw8WZBIGQ3OMFTmg043NItvfXvaHQyCDaGmzJ")
POSTHOG_PROJECT_ID = os.getenv("POSTHOG_PROJECT_ID", "197007")
POSTHOG_HOST = "https://app.posthog.com"

print(f"🚀 Starting PostHog data population...")
print(f"📊 Project ID: {POSTHOG_PROJECT_ID}")
print(f"🔑 API Key: {POSTHOG_API_KEY[:20]}...")

class PostHogDataPopulator:
    def __init__(self, api_key: str, project_id: str):
        self.api_key = api_key
        self.project_id = project_id
        self.base_url = f"{POSTHOG_HOST}/capture/"
        
    def send_event(self, event_name: str, user_id: str, properties: dict = None):
        """Send a single event to PostHog"""
        if properties is None:
            properties = {}
            
        # Add timestamp to properties
        properties["timestamp"] = datetime.now().isoformat()
        properties["project_id"] = self.project_id
        
        payload = {
            "api_key": self.api_key,
            "event": event_name,
            "properties": properties,
            "distinct_id": user_id,
            "timestamp": datetime.now().isoformat()
        }
        
        try:
            response = requests.post(
                self.base_url,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                print(f"✅ Event sent: {event_name} for user {user_id}")
                return True
            else:
                print(f"❌ Failed to send event {event_name}: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Error sending event {event_name}: {str(e)}")
            return False
    
    def create_realistic_funnel_data(self, num_users: int = 500):
        """Create realistic onboarding funnel data"""
        print(f"\n📈 Creating realistic funnel data for {num_users} users...")
        
        # Define funnel stages with realistic drop-off rates
        funnel_stages = [
            {"event": "user_signed_up", "retention_rate": 1.0},      # 100% - all users sign up
            {"event": "email_verified", "retention_rate": 0.85},     # 85% verify email
            {"event": "tutorial_started", "retention_rate": 0.75},   # 75% start tutorial
            {"event": "tutorial_completed", "retention_rate": 0.60}, # 60% complete tutorial  
            {"event": "first_action_taken", "retention_rate": 0.45}, # 45% take first action
            {"event": "second_session", "retention_rate": 0.30},     # 30% return for second session
        ]
        
        successful_events = 0
        total_events = 0
        
        for user_num in range(1, num_users + 1):
            user_id = f"user_{user_num:04d}"
            base_timestamp = datetime.now() - timedelta(days=random.randint(1, 30))
            
            # Progress through funnel with realistic drop-offs
            for i, stage in enumerate(funnel_stages):
                # Determine if user progresses to this stage
                if random.random() < stage["retention_rate"]:
                    # Add realistic time delays between events
                    if i == 0:  # Sign up
                        event_time = base_timestamp
                    elif i == 1:  # Email verification
                        event_time = base_timestamp + timedelta(minutes=random.randint(5, 60))
                    elif i == 2:  # Tutorial start
                        event_time = base_timestamp + timedelta(hours=random.randint(1, 24))
                    elif i == 3:  # Tutorial complete
                        event_time = base_timestamp + timedelta(hours=random.randint(1, 48))
                    elif i == 4:  # First action
                        event_time = base_timestamp + timedelta(days=random.randint(1, 7))
                    else:  # Second session
                        event_time = base_timestamp + timedelta(days=random.randint(2, 14))
                    
                    # Create event properties
                    properties = {
                        "user_type": random.choice(["free", "trial", "premium"]),
                        "signup_source": random.choice(["google", "facebook", "email", "organic"]),
                        "device_type": random.choice(["desktop", "mobile", "tablet"]),
                        "browser": random.choice(["chrome", "firefox", "safari", "edge"]),
                        "stage_number": i + 1,
                        "funnel_position": f"{i + 1}/{len(funnel_stages)}",
                        "timestamp": event_time.isoformat()
                    }
                    
                    # Add stage-specific properties
                    if stage["event"] == "tutorial_completed":
                        properties["tutorial_duration"] = random.randint(5, 30)  # minutes
                        properties["completion_rate"] = random.randint(80, 100)  # percentage
                    elif stage["event"] == "first_action_taken":
                        properties["action_type"] = random.choice(["create_project", "upload_file", "invite_user", "customize_settings"])
                        properties["time_to_action"] = random.randint(1, 60)  # minutes from tutorial completion
                    
                    # Send event to PostHog
                    success = self.send_event(stage["event"], user_id, properties)
                    total_events += 1
                    if success:
                        successful_events += 1
                    
                    # Add small delay to avoid rate limiting
                    time.sleep(0.1)
                else:
                    # User drops off at this stage
                    print(f"🔄 User {user_id} dropped off at stage: {stage['event']}")
                    break
            
            # Progress indicator
            if user_num % 50 == 0:
                print(f"📊 Progress: {user_num}/{num_users} users processed ({(user_num/num_users)*100:.1f}%)")
        
        print(f"\n✅ Data population completed!")
        print(f"📈 Total events sent: {successful_events}/{total_events}")
        print(f"🎯 Success rate: {(successful_events/total_events)*100:.1f}%")
        return successful_events, total_events
    
    def create_additional_events(self, num_additional: int = 200):
        """Create additional events for better analytics"""
        print(f"\n🔄 Creating {num_additional} additional events...")
        
        additional_events = [
            "dashboard_viewed",
            "feature_explored", 
            "settings_opened",
            "profile_updated",
            "help_accessed",
            "feedback_submitted",
            "subscription_viewed",
            "referral_sent"
        ]
        
        successful = 0
        for i in range(num_additional):
            user_id = f"user_{random.randint(1, 500):04d}"
            event = random.choice(additional_events)
            
            properties = {
                "session_id": str(uuid.uuid4()),
                "page_url": f"/app/{event.replace('_', '-')}",
                "user_agent": random.choice(["Chrome/91.0", "Firefox/89.0", "Safari/14.1"]),
                "timestamp": (datetime.now() - timedelta(hours=random.randint(1, 72))).isoformat()
            }
            
            if self.send_event(event, user_id, properties):
                successful += 1
            
            time.sleep(0.05)  # Small delay
            
            if (i + 1) % 50 == 0:
                print(f"📊 Additional events progress: {i + 1}/{num_additional}")
        
        print(f"✅ Additional events completed: {successful}/{num_additional}")
        return successful

def main():
    """Main function to populate PostHog with realistic data"""
    print("🎯 PostHog Data Population Started")
    print("=" * 50)
    
    # Initialize the populator
    populator = PostHogDataPopulator(POSTHOG_API_KEY, POSTHOG_PROJECT_ID)
    
    # Test connection with a simple event
    print("🔍 Testing PostHog connection...")
    test_success = populator.send_event(
        "data_population_started",
        "system_test_user",
        {"test": True, "population_date": datetime.now().isoformat()}
    )
    
    if not test_success:
        print("❌ Failed to connect to PostHog. Please check your API key and project ID.")
        return
    
    print("✅ PostHog connection successful!")
    
    # Create realistic funnel data
    funnel_success, funnel_total = populator.create_realistic_funnel_data(num_users=500)
    
    # Add some additional events for richer analytics
    additional_success = populator.create_additional_events(num_additional=200)
    
    # Send completion event
    populator.send_event(
        "data_population_completed",
        "system_test_user",
        {
            "total_funnel_events": funnel_success,
            "total_additional_events": additional_success,
            "completion_time": datetime.now().isoformat()
        }
    )
    
    print("\n🎉 Data Population Complete!")
    print("=" * 50)
    print(f"📊 Funnel Events: {funnel_success}/{funnel_total}")
    print(f"🔄 Additional Events: {additional_success}/200")
    print(f"🎯 Your PostHog project now has realistic onboarding data!")
    print("\n💡 You can now:")
    print("   1. Check your PostHog dashboard to see the events")
    print("   2. Restart your backend server to use real data")
    print("   3. View your analytics dashboard with real funnel data")

if __name__ == "__main__":
    main()
