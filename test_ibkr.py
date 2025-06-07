from ib_insync import IB, util
util.startLoop()  # Only needed for Jupyter/async environments

ib = IB()
try:
    ib.connect('127.0.0.1', 7497, clientId=1, timeout=15)
    if ib.isConnected():
        print("Connected successfully!")
    else:
        print("Connection failed (no error, but not connected).")
    ib.disconnect()
except Exception as e:
    print(f"Connection failed: {str(e)}") 