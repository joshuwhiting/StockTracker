from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text
from flask_cors import CORS
import yfinance as yf

app = Flask(__name__) #create the flask app
CORS(app) 

tracked_symbols = []
# SQLite config
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
        return jsonify({"message": "Stock was deleted succesfully"})
    except:
        return jsonify({"error":"There was an error deleteing that stock"})
    
@app.route("/track", methods=["POST"])
def track():

    # data = request.get_json(force=True)
    # symbol = data.get("symbol", "").upper()
    # print(f"--- Attempting to track: {symbol} ---") # DEBUG PRINT

    # stock_data = fetch_stock_data(symbol)
    # print(f"--- Data fetched: {stock_data} ---")

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
    return {"message": f"{symbol} tracked", **stock_data}, 201



@app.route("/tracked")
def tracked():
    stocks = TrackedStock.query.all()
    return jsonify([
        {
            "symbol": s.symbol,
            "price": s.current_price,
            "market_cap": format_market_cap(s.market_cap),
            "currency": s.currency
        }
        for s in stocks
    ])


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=8000)
