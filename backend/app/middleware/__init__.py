from collections import defaultdict
import time


class RateLimitMiddleware:
    """Pure ASGI rate limiter - avoids BaseHTTPMiddleware CORS conflicts."""
    
    def __init__(self, app, max_requests: int = 100, window_seconds: int = 60):
        self.app = app
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = defaultdict(list)
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)
        
        client = scope.get("client")
        client_ip = client[0] if client else "unknown"
        current_time = time.time()
        
        self.requests[client_ip] = [
            req_time for req_time in self.requests[client_ip]
            if current_time - req_time < self.window_seconds
        ]
        
        if len(self.requests[client_ip]) >= self.max_requests:
            from starlette.responses import JSONResponse
            response = JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please try again later."},
            )
            return await response(scope, receive, send)
        
        self.requests[client_ip].append(current_time)
        return await self.app(scope, receive, send)
