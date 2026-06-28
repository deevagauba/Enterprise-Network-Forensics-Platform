import os
import json
import time
import random
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from fpdf import FPDF
from datetime import datetime, timezone

from detection_engine import (get_events, get_flagged_hosts,
                               get_acl_hits, clear_logs)
from traffic_simulator import (simulate_port_scan, simulate_acl_violation,
                                simulate_ssh_brute_force, simulate_dos)

app = Flask(__name__)
CORS(app)

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
NETWORK_STATE_FILE = os.path.join(DATA_DIR, 'network_state.json')
FORENSICS_LOGS_FILE = os.path.join(DATA_DIR, 'forensics_logs.json')

def load_json(filepath):
    if not os.path.exists(filepath):
        return {}
    with open(filepath, 'r') as f:
        return json.load(f)

def save_json(filepath, data):
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)

@app.route('/api/topology', methods=['GET'])
def get_topology():
    state = load_json(NETWORK_STATE_FILE)
    switches = state.get('switches', [])
    devices = state.get('devices', [])
    nodes = [{"id": s["id"], "type": s.get("type", "switch")} for s in switches]
    nodes.extend([{"id": d["id"], "type": d.get("type", "pc"), "vlan": d.get("vlan")} for d in devices])
    
    links = []
    for s in switches:
        if s.get("uplink"):
            links.append({"source": s["id"], "target": s["uplink"]})
    for d in devices:
        if d.get("parent"):
            links.append({"source": d["id"], "target": d["parent"]})
            
    return jsonify({"nodes": nodes, "links": links})

@app.route('/api/leases', methods=['GET'])
def get_leases():
    state = load_json(NETWORK_STATE_FILE)
    return jsonify({
        "leases": state.get('leases', []),
        "dns": state.get('dns', []),
        "ssh_logs": state.get('ssh_logs', [])
    })

@app.route('/api/acl-hits')
def acl_hits():
    return jsonify(get_acl_hits())

@app.route('/api/simulate-attack', methods=['POST'])
def simulate_attack():
    attack_type = request.json.get('type', 'acl_violation')
    attacks = {
        'port_scan': simulate_port_scan,
        'acl_violation': simulate_acl_violation,
        'ssh_brute_force': simulate_ssh_brute_force,
        'dos': simulate_dos
    }
    fn = attacks.get(attack_type, simulate_acl_violation)
    fn()
    return jsonify({"status": "launched", "type": attack_type})

@app.route('/api/events')
def events():
    return jsonify(get_events())

@app.route('/api/flagged-hosts')
def flagged_hosts():
    return jsonify(get_flagged_hosts())

@app.route('/api/logs', methods=['DELETE'])
def delete_logs():
    clear_logs()
    return jsonify({"status": "cleared"})

@app.route('/api/export-report', methods=['GET'])
def export_report():
    format_type = request.args.get('format', 'json')
    logs = load_json(FORENSICS_LOGS_FILE)
    if not isinstance(logs, list):
        logs = []
    
    if format_type == 'json':
        return send_file(FORENSICS_LOGS_FILE, mimetype='application/json', as_attachment=True, download_name='forensics_report.json')
    
    elif format_type == 'pdf':
        pdf_path = os.path.join(DATA_DIR, 'forensics_report.pdf')
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("helvetica", size=12)
        pdf.cell(w=0, h=10, text="Network Forensics Report", new_x="LMARGIN", new_y="NEXT", align='C')
        pdf.cell(w=0, h=10, text=f"Generated: {datetime.now(timezone.utc).isoformat()}", new_x="LMARGIN", new_y="NEXT", align='C')
        pdf.ln(10)
        
        pdf.set_font("helvetica", size=10)
        for log in logs:
            line = f"[{log['timestamp']}] {log['source']} -> {log['target']}:{log['port']} | {log['verdict']} ({log['acl']})"
            pdf.cell(w=0, h=8, text=line, new_x="LMARGIN", new_y="NEXT")
            
        pdf.output(pdf_path)
        return send_file(pdf_path, mimetype='application/pdf', as_attachment=True, download_name='forensics_report.pdf')

if __name__ == '__main__':
    app.run(port=5005, debug=True)
