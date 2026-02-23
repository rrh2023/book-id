# BookID

A full-stack app to discover new books with AI-powered recommendations based on any given description.

https://aws-book-finder-app.netlify.app/

---

## Stack

- React + Tailwind CSS (frontend)
- AWS Lambda (backend)
- Python
- Claude AI (Anthropic)
- Google Books API

---

## Run Locally

### Backend (AWS Lambda)

```bash
# Deploy to AWS Lambda
cd backend
zip function.zip lambda_function.py

aws lambda create-function \
  --function-name book-finder-api \
  --runtime python3.12 \
  --handler lambda_function.lambda_handler \
  --zip-file fileb://function.zip

# Set API key
aws lambda update-function-configuration \
  --function-name book-finder-api \
  --environment "Variables={ANTHROPIC_API_KEY=your-key-here}"
```

---

### Frontend

```bash
cd frontend
npm install

# Add Lambda URL to .env
echo "REACT_APP_LAMBDA_URL=your-lambda-url" > .env

npm run dev
```

---

## API

**POST /**

Search for books.

```json
{
  "description": "mystery novels",
  "mode": "search"
}
```

Response: Book list with titles, authors, covers, and descriptions.

---

## License


MIT
