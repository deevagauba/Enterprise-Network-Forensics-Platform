from scapy.all import sniff, IP, TCP, UDP, ICMP
from collections import defaultdict
from datetime import datetime
import threading, json, os, time

FORENSICS_LOG = os.path.join(os.path.dirname(__file__), '../data/forensics_logs.json')

# Detection thresholds
PORT_SCAN_THRESHOLD = 5       # unique ports within window
PORT_SCAN_WINDOW = 10         # seconds
BRUTE_FORCE_THRESHOLD = 3     # SSH attempts within window
BRUTE_FORCE_WINDOW = 30       # seconds
DOS_THRESHOLD = 20            # packets within window
DOS_WINDOW = 5                # seconds

# ACL rules
ACL_RULES = [
    {"acl": 110, "src": "192.168.20.", "dst": "192.168.10.", "action": "DENY"},
    {"acl": 120, "src": "192.168.50.", "dst": "192.168.40.", "action": "DENY"},
]

# State tracking
_port_tracker = defaultdict(lambda: {"ports": [], "times": []})
_ssh_tracker = defaultdict(lambda: {"times": []})
_dos_tracker = defaultdict(lambda: {"times": []})
_flagged_hosts = {}
_event_log = []
_lock = threading.Lock()
_acl_hits = {110: 0, 120: 0}

def _threat_level(rule_type):
    levels = {
        "PORT_SCAN": "HIGH",
        "SSH_BRUTE_FORCE": "HIGH",
        "ACL_VIOLATION": "MEDIUM",
        "DOS_ATTEMPT": "HIGH",
        "SUSPICIOUS_TRAFFIC": "LOW"
    }
    return levels.get(rule_type, "LOW")

def _log_event(src_ip, dst_ip, protocol, port, verdict, rule, reason):
    event = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "src_ip": src_ip,
        "dst_ip": dst_ip,
        "protocol": protocol,
        "port": port,
        "verdict": verdict,
        "acl": rule,
        "reason": reason,
        "threat_level": _threat_level(reason)
    }
    with _lock:
        _event_log.append(event)
        # persist to forensics_logs.json
        try:
            with open(FORENSICS_LOG, 'w') as f:
                json.dump(_event_log, f, indent=2)
        except Exception:
            pass
    return event

def _violation_type(reason):
    mapping = {
        "PORT_SCAN": "Port Scan",
        "SSH_BRUTE_FORCE": "SSH Brute Force",
        "ACL_VIOLATION": "ACL Violation",
        "DOS_ATTEMPT": "Denial of Service"
    }
    return mapping.get(reason, reason)

def _probability(reason, hit_count):
    base = {
        "ACL_VIOLATION": 0.65,
        "PORT_SCAN": 0.85,
        "SSH_BRUTE_FORCE": 0.90,
        "DOS_ATTEMPT": 0.88
    }.get(reason, 0.50)
    return min(base + (hit_count - 1) * 0.02, 0.99)

def _flag_host(ip, reason):
    with _lock:
        if ip not in _flagged_hosts:
            _flagged_hosts[ip] = {
                "ip": ip,
                "reason": reason,
                "flagged_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "threat_level": _threat_level(reason),
                "hit_count": 1,
                "violation_type": _violation_type(reason),
                "probability": _probability(reason, 1)
            }
        else:
            _flagged_hosts[ip]["hit_count"] += 1
            current_level = _flagged_hosts[ip]["threat_level"]
            new_level = _threat_level(reason)
            priority = {"LOW": 1, "MEDIUM": 2, "HIGH": 3}
            if priority.get(new_level, 0) >= priority.get(current_level, 0):
                _flagged_hosts[ip]["threat_level"] = new_level
                _flagged_hosts[ip]["reason"] = reason
            _flagged_hosts[ip]["violation_type"] = _violation_type(_flagged_hosts[ip]["reason"])
            _flagged_hosts[ip]["probability"] = _probability(_flagged_hosts[ip]["reason"], _flagged_hosts[ip]["hit_count"])

def _check_acl(src, dst):
    for rule in ACL_RULES:
        if src.startswith(rule["src"]) and dst.startswith(rule["dst"]):
            return rule["acl"], rule["action"]
    return None, "PERMIT"

def _now():
    return time.time()

def analyze_packet(pkt):
    if not pkt.haslayer(IP):
        return

    src = pkt[IP].src
    dst = pkt[IP].dst
    proto = "TCP" if pkt.haslayer(TCP) else "UDP" if pkt.haslayer(UDP) else "ICMP"
    port = pkt[TCP].dport if pkt.haslayer(TCP) else (pkt[UDP].dport if pkt.haslayer(UDP) else 0)
    now = _now()

    # Port Scan Detection
    if pkt.haslayer(TCP):
        tracker = _port_tracker[src]
        tracker["ports"].append(port)
        tracker["times"].append(now)
        # Clean old entries
        cutoff = now - PORT_SCAN_WINDOW
        tracker["ports"] = [p for p, t in zip(tracker["ports"], tracker["times"]) if t > cutoff]
        tracker["times"] = [t for t in tracker["times"] if t > cutoff]
        unique_ports = len(set(tracker["ports"]))
        if unique_ports >= PORT_SCAN_THRESHOLD:
            _flag_host(src, "PORT_SCAN")
            _log_event(src, dst, proto, port, "DENY", "DETECT-001",
                      f"PORT_SCAN ({unique_ports} ports in {PORT_SCAN_WINDOW}s)")
            tracker["ports"] = []
            tracker["times"] = []
            return

    # SSH Brute Force Detection
    if pkt.haslayer(TCP) and port == 22:
        tracker = _ssh_tracker[src]
        tracker["times"].append(now)
        cutoff = now - BRUTE_FORCE_WINDOW
        tracker["times"] = [t for t in tracker["times"] if t > cutoff]
        if len(tracker["times"]) >= BRUTE_FORCE_THRESHOLD:
            _flag_host(src, "SSH_BRUTE_FORCE")
            _log_event(src, dst, proto, 22, "DENY", "DETECT-002",
                      f"SSH_BRUTE_FORCE ({len(tracker['times'])} attempts in {BRUTE_FORCE_WINDOW}s)")
            tracker["times"] = []
            return

    # DoS Detection
    if pkt.haslayer(ICMP):
        tracker = _dos_tracker[src]
        tracker["times"].append(now)
        cutoff = now - DOS_WINDOW
        tracker["times"] = [t for t in tracker["times"] if t > cutoff]
        if len(tracker["times"]) >= DOS_THRESHOLD:
            _flag_host(src, "DOS_ATTEMPT")
            _log_event(src, dst, proto, 0, "DENY", "DETECT-003",
                      f"DOS_ATTEMPT ({len(tracker['times'])} packets in {DOS_WINDOW}s)")
            tracker["times"] = []
            return

    # ACL Check
    acl_num, verdict = _check_acl(src, dst)
    if verdict == "DENY":
        with _lock:
            _acl_hits[acl_num] = _acl_hits.get(acl_num, 0) + 1
        _flag_host(src, "ACL_VIOLATION")
        _log_event(src, dst, proto, port, "DENY", acl_num, "ACL_VIOLATION")
        return

    # Permit — log as normal traffic
    _log_event(src, dst, proto, port, "PERMIT", None, "NORMAL_TRAFFIC")

def start_sniffer():
    """Start background packet sniffer"""
    def _run():
        sniff(prn=analyze_packet, store=False, filter="ip")
    t = threading.Thread(target=_run, daemon=True)
    t.start()

def get_events():
    with _lock:
        return list(_event_log)

def get_flagged_hosts():
    with _lock:
        return list(_flagged_hosts.values())

def get_acl_hits():
    with _lock:
        return dict(_acl_hits)

def clear_logs():
    with _lock:
        _event_log.clear()
        _flagged_hosts.clear()
        _acl_hits[110] = 0
        _acl_hits[120] = 0
