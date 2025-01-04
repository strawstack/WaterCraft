# WaterCraft

Implementation of a consensus algorithim inspired by raft.github.io.

# What is this for?

If one wants to create a P2P network of several nodes, they may begin by having every node communicate with every other node. This puts a lot of traffic on the network and makes it hard to maintain a central source of truth. So, it can be good to have a single host which centralizes network state and reduces the amount of traffic required to keep all nodes informed. However, in a decentralized network, it may be possible the the host to leave at which point either the network can't operate or a new host must be chosen. The implementation in the repo intends to allow a collection of peer nodes to decide on a host, and, should that host leave, a new host will be chosen and the network will continue operation.    

# Todo

- [ ] Create data frames that can be rendered as tables.
    - Table show time laps of network in order to highlight failure points.
    - Add back and forth scroll button to tables.
    - Each table could have text that explains what occured since the prev table.
 
# Overview

1. Every interval of duration `STEP`, the host checks for unresponsive peers. If peers are removed, a new peer list is broadcasted.
2. Every interval of duration `STEP`, the host broadcasts a `ping` to all peers. 
3. Every interval of duration `STEP`, non-hosts verify that the host is still responsive, and remove the host if necessary.
4. On receipt of `WC_PING`, the host updates last `ping` time for given peer, or connects with a formerly unknown peer.
5. On receipt of `WC_PING` if sender is the host, non-hosts updates last `ping` time, else respond with a list of `WC_PEERS`.
6. On receipt of `WC_PEERS`, non-hosts update their peers lists to contain all known peers.
7. On receipt of `WC_PEERS` if sender is the host, non-hosts remove local peers that the host doesn't acknoledge.
8. If a host becomes unresponsive, all non-host peers will remove the host, a new peer will take over as host and begin broadcasting.
9. New peer joins and becomes new host, old host learns of new host. Old host sends peer list on ping from peers.
10. New peer joins and becomes new host, new host broadcasts peer list on first contact with each peer.

Cases below relate to joining multiple networks behaviour will vary with host selection:

11. If a peer joins two existing networks and is not the host of either, peer would choose one host over the other and drop other network.
12. If non-host joins a second network and becomes new host, new host broadcasts peer list. 
13. If host joins a second network and is not host, ping from second network tells host they are a non-host. Pings from first network peers will get a peer list response.
14. If host joins a second network and becomes host, host broadcasts peer list. 
