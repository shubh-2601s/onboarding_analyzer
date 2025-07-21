import requests
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv('POSTHOG_API_KEY')
project_id = os.getenv('POSTHOG_PROJECT_ID')
host = 'https://app.posthog.com'

print(f'Testing PostHog API key: {api_key[:20]}...')
print(f'Project ID: {project_id}')
print(f'Full API key length: {len(api_key)}')
print(f'API key format valid: {api_key.startswith("phc_") and len(api_key) > 30}')

# Test different endpoints to see which one works
endpoints_to_test = [
    f'/api/projects/{project_id}/',
    f'/api/projects/',
    f'/api/projects/{project_id}/events/',
    '/api/user/'
]

headers = {'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'}

for endpoint in endpoints_to_test:
    try:
        url = f'{host}{endpoint}'
        print(f'\n🔍 Testing endpoint: {endpoint}')
        response = requests.get(url, headers=headers, timeout=10)
        
        print(f'   Status: {response.status_code}')
        if response.status_code == 200:
            print('   ✅ SUCCESS!')
        elif response.status_code == 401:
            print('   ❌ 401 - Authentication failed')
        elif response.status_code == 403:
            print('   ❌ 403 - Access forbidden (permissions issue)')
        elif response.status_code == 404:
            print('   ❌ 404 - Not found')
        else:
            print(f'   ⚠️ Unexpected status: {response.status_code}')
            
        # Show response details for debugging
        if response.status_code != 200:
            print(f'   Response: {response.text[:200]}...')
            
    except Exception as e:
        print(f'   ❌ Error: {str(e)}')

# Test if it's a Personal API Key vs Project API Key issue
print('\n🔍 Testing if this might be a Personal API Key...')
personal_headers = {'Authorization': f'Bearer {api_key}'}
try:
    response = requests.get(f'{host}/api/user/', headers=personal_headers, timeout=10)
    if response.status_code == 200:
        print('✅ This appears to be a Personal API Key, not a Project API Key!')
        print('You need to use a Project API Key instead.')
    else:
        print(f'Not a Personal API Key either (status: {response.status_code})')
except Exception as e:
    print(f'Personal API key test failed: {e}')

print('\n💡 Next steps:')
print('1. Go to PostHog → Project Settings → API Keys')
print('2. Look for "Project API Key" (not "Personal API Key")')
print('3. Make sure the key has read permissions for events and insights')
print('4. Copy the Project API Key and update your .env file')