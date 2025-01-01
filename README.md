# WaterCraft

Implementation of a consensus algorithim inspired by raft.github.io.

# What is this for?

If one wants to create a P2P network of several nodes, they may begin by having every node communicate with every other node. This puts a lot of traffic on the network and makes it hard to maintain a central source of truth. So, it can be good to have a single host which centralizes network state and reduces the amount of traffic required to keep all nodes informed. However, in a decentralized network, it may be possible the the host to leave at which point either the network can't operate or a new host must be chosen. The implementation in the repo intends to allow a collection of peer nodes to decide on a host, and, should that host leave, a new host will be chosen and the network will continue operation.    

# Todo

- [x] Consider that every peer should maintain an alive list for themselves because.
    - They have to track if the host is still there.
    - They need to know how to find a new host if the host leaves.
- [x] If you are pinged and are not the host, then respond with a list of all peers.
- [x] If you're the host and are removing peers notify others.
- [x] When a new peer contacts the host, the host should broadcast a list of all peers.


# Overview

1. Before a NodeA joins the network, they are given a NodeId.
2. NodeA uses a NodeId to contact say NodeB that is already in the network.
3. NodeB responds with a list of all other known Nodes in the network.
4. NodeA uses this information to determine which Node is the current host.
5. The current host is the Node that has been in the network for the longest time.
6. The Node that originates the network begins as the host.
7. Every node after the original Node joins the network.
8. Nodes that join the network may become the host after some amount of time.
9. A heartbeat signal is used to determine if nodes are still active.
10. If a NodeA is the host and cannot be reached then the calling Node say NodeB will decide on a new host.
11. NodeB will either successfully ontact a new host, or be told which node is the new host.
12. The host maintains a list of all nodes in the network.
13. On first contact with the host, the calling node is told the list of connected nodes.
14. If a host learns that a new node has joined, the host sends out an updated list.
15. When contacting the host, nodes report the number of nodes that they believe are in the network, and the host sends details if the number is incorrect.
