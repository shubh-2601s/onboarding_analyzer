import requests
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv('POSTHOG_API_KEY')
project_id = os.getenv('POSTHOG_PROJECT_ID')
host = 'https://app.posthog.com'

print(f'Testing PostHog API key: {api_key[:20]}...')
print(f'Project ID: {project_id}')

# Test connection
headers = {'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'}
response = requests.get(f'{host}/api/projects/{project_id}/', headers=headers, timeout=10)

print(f'Response status: {response.status_code}')
if response.status_code == 401:
    print('❌ API KEY HAS EXPIRED OR IS INVALID!')
    print('You need to get a new API key from PostHog.')
elif response.status_code == 200:
    print('✅ API key is working!')
else:
    print(f'Response text: {response.text[:500]}')
