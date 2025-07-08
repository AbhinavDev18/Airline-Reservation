import http.server
import socketserver
import os
import re
from urllib.parse import urlparse

PORT = 5000

# Get Firebase configuration from environment variables
firebase_api_key = os.environ.get('FIREBASE_API_KEY', '')
firebase_project_id = os.environ.get('FIREBASE_PROJECT_ID', '')
firebase_app_id = os.environ.get('FIREBASE_APP_ID', '')

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Parse the path
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        # If path is '/' or empty, serve index.html
        if path == '/' or not path:
            path = '/index.html'
            
        # Get the file extension
        _, ext = os.path.splitext(path)
        
        # Process HTML files to inject environment variables
        if ext == '.html':
            try:
                # Open the file
                with open('.' + path, 'r') as f:
                    content = f.read()
                
                # Replace firebase-config.js script tag with inline script
                firebase_config_pattern = r'<script src="js/firebase-config.js"></script>'
                firebase_config_replacement = f'''
                <script>
                // Firebase configuration
                const firebaseConfig = {{
                    apiKey: "{firebase_api_key}",
                    authDomain: "{firebase_project_id}.firebaseapp.com",
                    projectId: "{firebase_project_id}",
                    storageBucket: "{firebase_project_id}.appspot.com",
                    appId: "{firebase_app_id}"
                }};

                // Initialize Firebase
                firebase.initializeApp(firebaseConfig);

                // Initialize Firestore
                const db = firebase.firestore();

                console.log("Firebase initialized");
                </script>
                '''
                content = re.sub(firebase_config_pattern, firebase_config_replacement, content)
                
                # Set the content type
                self.send_response(200)
                self.send_header('Content-type', 'text/html')
                self.end_headers()
                
                # Send the modified content
                self.wfile.write(content.encode())
                return
            except FileNotFoundError:
                # If file not found, use default handler which will return 404
                pass
        
        # For all other files, use the default handler
        return http.server.SimpleHTTPRequestHandler.do_GET(self)

Handler = CustomHTTPRequestHandler

# Allow reuse of the address
socketserver.TCPServer.allow_reuse_address = True

# Try to start the server
try:
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at http://0.0.0.0:{PORT}")
        print(f"Firebase configuration status: API Key: {'Present' if firebase_api_key else 'Missing'}, Project ID: {'Present' if firebase_project_id else 'Missing'}, App ID: {'Present' if firebase_app_id else 'Missing'}")
        httpd.serve_forever()
except OSError as e:
    if e.errno == 98:  # Address already in use
        print(f"Port {PORT} is already in use. This could be due to a previous server instance.")
        print("Try to terminate any running server instances and try again.")
        import sys
        sys.exit(1)
    else:
        raise