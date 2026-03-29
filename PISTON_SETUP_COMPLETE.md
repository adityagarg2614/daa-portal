# ✅ Self-Hosted Piston - Setup Complete!

## 🎉 Your Code Execution is Ready!

Your self-hosted Piston instance is **running and tested successfully**!

---

## 📊 What's Running

| Service | URL | Status |
|---------|-----|--------|
| **Piston (Docker)** | `http://localhost:2000/api/v2` | ✅ Running |
| **Next.js App** | `http://localhost:3000` | ✅ Running |

---

## 🧪 Tested & Working

✅ **Python 3.10.0** - Tested successfully  
✅ **C++ (GCC 10.2.0)** - Tested successfully  
✅ **Java (OpenJDK 15.0.2)** - Tested successfully  
✅ **JavaScript (Node.js 18.15.0)** - Should work  

---

## 🚀 How to Use

### 1. Open Your App
```
http://localhost:3000/assignment/[id]
```

### 2. Write Code
Example C++:
```cpp
#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    cout << "You entered: " << n << endl;
    return 0;
}
```

### 3. Click "Save"
- Code will compile on your local Piston instance
- Test cases will run automatically
- Results will display instantly!

---

## 🔧 Managing Your Piston Container

### Check Status
```bash
docker ps | grep piston
```

### View Logs
```bash
docker logs piston
```

### Restart
```bash
docker restart piston
```

### Stop
```bash
docker stop piston
```

### Start Again
```bash
docker start piston
```

### Remove Completely
```bash
docker rm -f piston
```

---

## 📦 Available Languages

Your Piston instance supports many languages. To see what's installed:

```bash
# Check container for available runtimes
docker exec piston ls /var/piston/packages/
```

Common languages pre-installed:
- Python 3.x
- C++ (GCC)
- Java (OpenJDK)
- JavaScript (Node.js)
- And many more!

---

## ⚡ Performance

Since it's self-hosted locally:
- ✅ **No rate limits** - Unlimited submissions
- ✅ **No API keys** - Completely free
- ✅ **Fast execution** - Localhost = minimal latency
- ✅ **Always available** - No downtime (as long as Docker runs)
- ✅ **Private** - Your code never leaves your machine

---

## 🎯 Next Steps

1. **Test it now!** Go to `http://localhost:3000` and submit code
2. **Create problems** with test cases in the admin panel
3. **Try assignments** as a student

---

## 🐛 Troubleshooting

### If Piston Stops Working

```bash
# Check if Docker is running
docker ps

# Check Piston container
docker logs piston

# Restart if needed
docker restart piston

# Test the API
curl http://localhost:2000/api/v2/execute \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"language":"python","version":"3.10.0","files":[{"content":"print(\"test\")"}]}'
```

### If Next.js Can't Connect

Make sure the Piston URL in `src/lib/piston.ts` is correct:
```typescript
const PISTON_INSTANCES = [
    "http://localhost:2000/api/v2",  // ← This should be first
    // ...
];
```

---

## 📚 Docker Commands Reference

| Command | Description |
|---------|-------------|
| `docker ps` | List running containers |
| `docker logs piston` | View Piston logs |
| `docker restart piston` | Restart container |
| `docker stop piston` | Stop container |
| `docker start piston` | Start stopped container |
| `docker rm -f piston` | Remove container |

---

## 🎓 Production Deployment

For production, you have two options:

### Option 1: Continue Using Self-Hosted Piston
- Deploy Piston on your production server
- Update API URL in code to point to production server
- Scale with Docker Compose or Kubernetes

### Option 2: Use Judge0 API
- Get API key from RapidAPI
- Add to production environment variables
- Automatic fallback if Piston unavailable

---

**Happy Coding! 🚀**

Your development environment is now fully configured with unlimited code execution!
