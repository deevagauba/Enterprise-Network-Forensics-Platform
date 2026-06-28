from scapy.all import IP, TCP, UDP, ICMP
import threading, time, random
from detection_engine import analyze_packet

SERVER_IP = "192.168.40.10"
ROUTER_IP = "192.168.30.1"

def simulate_port_scan():
    """Hits 20 ports rapidly — triggers port scan detection"""
    def _run():
        ports = random.sample(range(20, 1024), 20)
        for port in ports:
            pkt = IP(src="192.168.50.101", dst=SERVER_IP)/TCP(dport=port, flags="S")
            analyze_packet(pkt)
            time.sleep(0.1)
    threading.Thread(target=_run, daemon=True).start()

def simulate_acl_violation():
    """Sends HTTP traffic from attacker to server — triggers ACL 120"""
    def _run():
        for _ in range(5):
            pkt = IP(src="192.168.50.102", dst=SERVER_IP)/TCP(dport=80, flags="S")
            analyze_packet(pkt)
            time.sleep(0.3)
    threading.Thread(target=_run, daemon=True).start()

def simulate_ssh_brute_force():
    """Rapid SSH attempts — triggers brute force detection"""
    def _run():
        for _ in range(10):
            pkt = IP(src="192.168.50.103", dst=ROUTER_IP)/TCP(dport=22, flags="S")
            analyze_packet(pkt)
            time.sleep(0.2)
    threading.Thread(target=_run, daemon=True).start()

def simulate_dos():
    """High packet rate to one destination — triggers DoS detection"""
    def _run():
        for _ in range(50):
            pkt = IP(src="192.168.50.104", dst=SERVER_IP)/ICMP()
            analyze_packet(pkt)
            time.sleep(0.05)
    threading.Thread(target=_run, daemon=True).start()
