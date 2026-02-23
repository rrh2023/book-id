import json
import urllib.request
import urllib.parse
import os

def lambda_handler(event, context):
    """
    AWS Lambda function to search for books using Google Books API
    with AI-powered query enhancement
    """
    
    method = event.get('httpMethod') or event.get('requestContext', {}).get('http', {}).get('method', '')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
            },
            'body': ''
        }
        
    try:
        # Parse the request body
        body = json.loads(event.get('body', '{}'))
        description = body.get('description', '')
        
        if not description:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',  # FIX: uncommented
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'error': 'Description is required'})
            }
        
        # Use AI to enhance the search query
        enhanced_query = enhance_query_with_ai(description)
        print(f"Original: {description}")
        print(f"Enhanced: {enhanced_query}")
        
        # Search Google Books API with enhanced query
        books = search_google_books(enhanced_query)
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',  # FIX: uncommented
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'books': books,
                'enhancedQuery': enhanced_query
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',  # FIX: uncommented
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'error': 'Internal server error'})
        }

def enhance_query_with_ai(description):
    """
    Use Claude AI to convert natural language description into optimized search query
    """
    api_key = os.environ.get('ANTHROPIC_API_KEY')
    
    if not api_key:
        print("Warning: ANTHROPIC_API_KEY not found, using original description")
        return description
    
    try:
        # Prepare the AI prompt
        prompt = f"""Based on this book description, generate an optimized search query for the Google Books API. 
The query should be concise (3-8 words) and include the most relevant keywords like genre, themes, setting, or style.

Description: {description}

Return ONLY the search query, nothing else."""

        # Call Claude API
        request_data = {
            "model": "claude-sonnet-4-5-20251022",  # FIX: corrected model string
            "max_tokens": 100,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        }
        
        req = urllib.request.Request(
            "https://api.anthropic.com/v1/messages",
            data=json.dumps(request_data).encode('utf-8'),
            headers={
                'Content-Type': 'application/json',
                'x-api-key': api_key,
                'anthropic-version': '2023-06-01'
            },
            method='POST'
        )
        
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            
        # Extract the query from Claude's response
        enhanced_query = result['content'][0]['text'].strip()
        return enhanced_query
        
    except Exception as e:
        print(f"AI enhancement failed: {str(e)}, using original description")
        return description

def search_google_books(query, max_results=10):
    """
    Search for books using Google Books API
    """
    # Encode the query
    encoded_query = urllib.parse.quote(query)
    
    # Build the API URL
    api_key = os.environ.get('GOOGLE_BOOKS_API_KEY', '')
    url = f"https://www.googleapis.com/books/v1/volumes?q={encoded_query}&maxResults={max_results}&key={api_key}"
    
    try:
        # Make the request
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode())
        
        # Parse the results
        books = []
        items = data.get('items', [])
        
        for item in items:
            volume_info = item.get('volumeInfo', {})
            
            # Extract book information
            book = {
                'title': volume_info.get('title', 'Unknown Title'),
                'authors': ', '.join(volume_info.get('authors', [])),
                'description': truncate_description(volume_info.get('description', '')),
                'thumbnail': get_thumbnail(volume_info),
                'publishedDate': volume_info.get('publishedDate', ''),
                'pageCount': volume_info.get('pageCount'),
                'categories': ', '.join(volume_info.get('categories', []))
            }
            
            books.append(book)
        
        return books
        
    except Exception as e:
        print(f"Error searching books: {str(e)}")
        return []

def get_thumbnail(volume_info):
    """
    Get the best available thumbnail image
    """
    image_links = volume_info.get('imageLinks', {})
    
    # Prefer larger images
    return (
        image_links.get('thumbnail') or 
        image_links.get('smallThumbnail') or 
        None
    )

def truncate_description(description, max_length=300):
    """
    Truncate description to a reasonable length
    """
    if not description:
        return ''
    
    if len(description) <= max_length:
        return description
    
    # Find the last space before max_length
    truncated = description[:max_length]
    last_space = truncated.rfind(' ')
    
    if last_space > 0:
        truncated = truncated[:last_space]
    
    return truncated + '...'