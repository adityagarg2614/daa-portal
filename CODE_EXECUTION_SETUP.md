# Code Execution Setup - Multiple Solutions

## ⚠️ Problem: Piston API Whitelist

The official Piston API (emkc.org) now requires whitelist approval as of February 15, 2026.

## ✅ Solution 1: Multi-Provider Fallback (IMPLEMENTED)

The code now automatically tries multiple Piston instances in sequence:

1. `https://emkc.org/api/v2/piston` (Official)
2. `https://piston.myvm.io/api/v2` (Community)
3. `https://piston-batch.vercel.app/api/v2` (Vercel)

**Status**: ✅ Implemented and ready to use

**How it works**:
- Code tries each Piston instance automatically
- If one fails (whitelist error), it tries the next
- No configuration needed!

**Limitations**:
- Public instances may be rate-limited
- Some may also require whitelist

---

## ✅ Solution 2: Add Judge0 API Key (RECOMMENDED for Reliability)

Get a FREE API key for unlimited usage (50 submissions/day free):

### Step 1: Get API Key
1. Go to: https://rapidapi.com/judge0-official/api/judge0-ce
2. Sign up (free)
3. Click "Subscribe to Test" → Select "Basic" plan (free)
4. Copy your API key from the "Headers" section

### Step 2: Add to `.env.local`
```env
JUDGE0_API_KEY=your_api_key_here
```

### Step 3: Restart Server
```bash
npm run dev
```

**Benefits**:
- ✅ 50 free submissions/day
- ✅ Reliable, professional service
- ✅ No credit card required
- ✅ Automatic fallback if Piston fails

---

## ✅ Solution 3: Self-Host Piston (BEST for Production)

Run your own Piston instance locally with Docker - completely free and unlimited!

### Prerequisites
- Docker Desktop for Mac: https://www.docker.com/products/docker-desktop/

### Step 1: Start Piston with Docker
```bash
docker run -d \
  --name piston \
  --privileged \
  -p 2000:2000 \
  --restart unless-stopped \
  ghcr.io/engineer-man/piston:latest
```

### Step 2: Verify It's Running
```bash
curl http://localhost:2000/api/v2/piston
```

You should see: `{"message":"Piston API","version":"2.0.0"}`

### Step 3: Update Code to Use Local Piston

Edit `src/lib/piston.ts`:
```typescript
const PISTON_INSTANCES = [
    "http://localhost:2000/api/v2/piston", // ← Add this FIRST
    "https://emkc.org/api/v2/piston",
    // ... rest
];
```

### Step 4: Install Language Runtimes (Optional)
```bash
# Access the container
docker exec -it piston bash

# Install additional languages if needed
# (most common languages are pre-installed)
```

**Benefits**:
- ✅ Completely free
- ✅ Unlimited submissions
- ✅ No rate limits
- ✅ Full control
- ✅ Works offline

---

## 🧪 Testing Code Execution

After setup, test with a simple problem:

1. Go to: `http://localhost:3000/assignment/[id]`
2. Write simple code:
   ```cpp
   #include <iostream>
   using namespace std;
   
   int main() {
       cout << "Hello World" << endl;
       return 0;
   }
   ```
3. Click "Save"
4. You should see test results!

---

## 🔍 Troubleshooting

### Error: "All Piston instances are unavailable"
- All public Piston instances require whitelist
- **Fix**: Add Judge0 API key (Solution 2) OR self-host (Solution 3)

### Error: "401 Unauthorized" from Judge0
- API key is missing or invalid
- **Fix**: Check `.env.local` has correct key

### Error: "Too Many Requests"
- You've hit rate limits
- **Fix**: Wait 24 hours OR self-host Piston

### Self-Hosted Piston Not Working
```bash
# Check if Docker is running
docker ps

# Check Piston container
docker logs piston

# Restart if needed
docker restart piston
```

---

## 📊 Comparison

| Solution | Cost | Setup | Rate Limit | Reliability |
|----------|------|-------|------------|-------------|
| Public Piston | Free | None | Unknown | ⭐⭐ |
| Judge0 API | Free (50/day) | Easy | 50/day | ⭐⭐⭐⭐ |
| Self-Hosted | Free | Medium | Unlimited | ⭐⭐⭐⭐⭐ |

---

## 🎯 Recommended Path

**For Development**:
- Try public Piston instances (already configured)
- If they fail, get free Judge0 API key (5 min setup)

**For Production**:
- Self-host Piston with Docker (one-time setup)
- Most reliable and unlimited

---

## 📞 Need Help?

If you're still having issues:
1. Check browser console for detailed errors
2. Check terminal for server logs
3. Try the test endpoint: `curl http://localhost:3000/api/compile`
