from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text
from flask_cors import CORS
import yfinance as yf
from flask_socketio import SocketIO, emit
import threading
import time
import warnings

app = Flask(__name__) #create the flask app
CORS(app) 
socketio = SocketIO(app, cors_allowed_origins="*")

tracked_symbols = []
# SQLite config

warnings.filterwarnings("ignore",message="Timestamp.utcnow is deprecated")

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///app.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# ---------- Models ----------

class TrackedStock(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    symbol = db.Column(db.String(10), nullable=False, unique=True)
    current_price = db.Column(db.Float)
    market_cap = db.Column(db.BigInteger)
    currency = db.Column(db.String(10))

# ---------- Helper ----------
def format_market_cap(value):
    if value is None:
        return None

    if value >= 1_000_000_000_000:
        return f"{value / 1_000_000_000_000:.2f}T"
    elif value >= 1_000_000_000:
        return f"{value / 1_000_000_000:.2f}B"
    elif value >= 1_000_000:
        return f"{value / 1_000_000:.2f}M"
    else:
        return str(value)
    
def fetch_stock_data(symbol):
    """Fetch current price, market cap, and currency from YFinance."""
    ticker = yf.Ticker(symbol)
    info = ticker.info
    return {
        "price": info.get("currentPrice"),
        "market_cap": info.get("marketCap"),
        "currency": info.get("currency")
    }

# ---------- Routes ----------


@app.route("/ping")
def ping():
    health_status = {
        "server": "online",
        "database": "disconnected",
       # "yfinance": "unreachable"
    }
    try:
        db.session.execute(text("SELECT 1"))
        health_status["database"] = "connected"
    except Exception as e:
        health_status["database"] = f"error: {str(e)}"

    overall_status = 200 if all(v in ["online", "connected"] for v in health_status.values()) else 503

    return jsonify(health_status),overall_status

@app.route("/refresh", methods=["POST"])
def refresh_all():
    stocks = TrackedStock.query.all()

    for s in stocks:
        try:
            new_data = fetch_stock_data(s.symbol)
            print(f"DEBUG: {s.symbol} fetched data: {new_data}")

            if new_data.get("price"):
                s.current_price = new_data.get("price")
                s.market_cap = new_data.get("market_cap")
        except Exception as e:
            print(f"Failed to update {s.symbol}: {e}")
            continue
    db.session.commit()
    return jsonify({"message": f"Updated {len(stocks)} stocks successfully"}), 200

@app.route("/stock")
def stock():
    symbol = request.args.get("symbol", "AAPL").upper()
    stock_data = fetch_stock_data(symbol)
    return jsonify({"symbol": symbol, **stock_data})

@app.route("/tracked/<int:id>", methods=["DELETE"])
def delete_stock(id):
    stock_to_delete = TrackedStock.query.get_or_404(id)

    try:
        db.session.delete(stock_to_delete)
        db.session.commit()
        return jsonify({"message": "Stock was deleted successfully"})
    except Exception as e:
        return jsonify({"error": "There was an error deleting that stock"}), 500
    
@app.route("/track", methods=["POST"])
def track():
    data = request.get_json(force=True)
    symbol = data.get("symbol")
    if not symbol:
        return {"error": "No symbol provided"}, 400
    
    symbol = symbol.upper()

    # --- Fetch live stock data from YFinance ---
    stock_data = fetch_stock_data(symbol)
  
   # shows what fields are missing
    
    missing_fields = [
        key for key, value in stock_data.items()
        if value is None
    ]

    if missing_fields:
        return {
            "error": "Incomplete data from Yahoo Finance",
            "symbol": symbol,
            "missing": missing_fields
        }, 400

    # --- Add or update DB ---
    tracked = TrackedStock.query.filter_by(symbol=symbol).first()
    if not tracked:
            tracked = TrackedStock(symbol=symbol)

    tracked.current_price = stock_data["price"]
    tracked.market_cap = stock_data["market_cap"]
    tracked.currency = stock_data["currency"]

    db.session.add(tracked)
    db.session.commit()
    return {"message": f"{symbol} tracked", "id": tracked.id, **stock_data}, 201



@app.route("/tracked")
def tracked():
    stocks = TrackedStock.query.all()
    return jsonify([
        {
            "id": s.id,
            "symbol": s.symbol,
            "price": s.current_price,
            "market_cap": format_market_cap(s.market_cap),
            "currency": s.currency
        }
        for s in stocks
    ])

def background_price_update():
    """Background thread that polls YFinance and emits to React."""
    print("Background Price Poller Started...")
    while True:
        with app.app_context():
            stocks = TrackedStock.query.all()
            for s in stocks:
                try:
                    # Get the absolute latest data
                    ticker = yf.Ticker(s.symbol)
                    fast_info = ticker.fast_info # faster than .info
                    
                    price = fast_info.last_price
                    change_pct = ((price - fast_info.previous_close) / fast_info.previous_close) * 100
                    
                    # Broadcast to ALL connected React clients
                    socketio.emit('price_update', {
                        "symbol": s.symbol,
                        "price": round(price, 2),
                        "change": round(price - fast_info.previous_close, 2),
                        "percent": round(change_pct, 2)
                    })
                except Exception as e:
                    print(f"Polling error for {s.symbol}: {e}")
        
        time.sleep(10) # Wait 10 seconds before next update to avoid Yahoo rate limits

@socketio.on('connect')
def handle_connect():
    print("Client connected")

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    
    # Start the background poller
    threading.Thread(target=background_price_update, daemon=True).start()
    
    # IMPORTANT: Use socketio.run instead of app.run
    socketio.run(app, debug=True, port=8000)
