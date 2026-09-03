# WoodVerse Deployment

## Vercel frontend

Create a Vercel project from this repository and set its Root Directory to `woodverse/frontend`.

- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_URL=https://your-api.up.railway.app`

`frontend/vercel.json` keeps React routes working after a page refresh.

## Railway backend services

Deploy the Express API and FastAPI AI service as separate Railway services from this repository. Use `woodverse/backend/api` and `woodverse/backend/ai-service` as their root directories.

```env
WEB_ORIGIN=https://your-frontend.vercel.app
AI_SERVICE_URL=https://your-ai-service.up.railway.app
DATABASE_URL=your-postgresql-connection-string
DB_SSL=true
```

The API service uses `npm ci` and `npm start`. The AI service uses `pip install -r requirements.txt` and `uvicorn src.main:app --host 0.0.0.0 --port $PORT`. Set the same `AI_SERVICE_API_KEY` on both services.

## Supabase Storage

Create `product-images`, `room-images`, `vendor-documents`, and `supplier-documents` buckets. Keep product and room images public only when they are intended for marketplace display; keep registration documents private.
