import os
from flask import Flask,request, jsonify, render_template
app = Flask(__name__)

@app.route('/')
def home():
    return render_template("index.html")

# @app.route('/')
# def hello():
#     return 'Hello from Flask on Google Cloud Run!'

if __name__ == '__main__':    
    port = int(os.getenv('PORT', 8080))
    print("Hello running from port ", port)
    app.run(host='0.0.0.0', port=port, debug=True)
