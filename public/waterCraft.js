import { Peer } from "./peerjs.min.js"

export async function waterCraft({ fid, update }) {

    const STEP = 1000; // Ping interval

    const peers = {};
    const conns = {};

    let isNew = true;
    let newHost = true;
    const peer = new Peer();
    
    const pid = await new Promise((res, _) => {
        peer.on('open', (pid) => res(pid));
    });

    // Debug
    const D = true;
    const l4 = id => id.slice(id.length - 2);
    const log = msg => {
        const content = `${l4(pid)} ${msg}`;
        if (D) console.log(content);
        return content;
    };

    log("is open");
    update(network => {
        network.nodes[pid] = {
            peers
        };
        network.info = log("is open");
    });

    const _debug_info = () => {
        return {
            peers: Object.keys(peers).map(p => l4(p))
        };
    };

    const getHost = () => {
        const sorted_peers = [...Object.keys(peers), pid].sort((a, b) => a.localeCompare(b));
        return sorted_peers[0];
    };

    const isHost = () => {
        return getHost() === pid;
    };

    let userOnMsg = () => {};
    const onMsg = func => {
        userOnMsg = func;
    };

    const broadcast = msg => {
        const json = JSON.stringify(msg);
        for (const { isOpen, conn } of Object.values(conns) ) {
            if (isOpen) {
                conn.send(json);
            }
        }
    };

    async function open(conn) {
        return new Promise((res, _) => {
            conn.on('open', res);
        });
    }

    function listPeers(peerObj) {
        return [...Object.keys(peerObj), pid].map(p => l4(p)).join(", ");
    }

    const onConnection = async conn => {
        const { peer: fid, connectionId: cid } = conn;
        log(`conn with ${l4(fid)}`);
        
        if (fid in peers && peers[fid].cid in conns) return; // already connected
        peers[fid] = { cid, ping: new Date() };
        conns[cid] = { fid, isOpen: false, conn };

        update(network => {
            network.nodes[pid] = {
                peers
            };
            network.info = log(`conn with ${l4(fid)}`);
        });

        await open(conn);
        conns[cid].isOpen = true;

        log(`conn open with ${l4(fid)}`);
        update(network => {
            network.nodes[pid] = {
                peers
            };
            network.info = log(`conn open with ${l4(fid)}`);
        });

        if(isNew) {
            log(`send WC_NEW to ${l4(fid)}`);
            update(network => {
                network.nodes[pid] = {
                    peers
                };
                network.info = log(`send WC_NEW to ${l4(fid)}`);
            });
            conn.send(JSON.stringify({ type: 'WC_NEW' }));

        } else if (isHost()) { // new peer joins; inform others
            log(`isHost: broadcast peers: ${listPeers(peers)}`);
            update(network => {
                network.nodes[pid] = {
                    peers
                };
                network.info = log(`isHost: broadcast peers: ${listPeers(peers)}`);
            });
            broadcast({ type: 'WC_PEERS', peers: [...Object.keys(peers), pid] });

        } else { // not host; respond with peer list
            log(`send WC_PEERS to ${l4(fid)}: ${listPeers(peers)}`);
            update(network => {
                network.nodes[pid] = {
                    peers
                };
                network.info = log(`send WC_PEERS to ${l4(fid)}: ${listPeers(peers)}`);
            });
            conn.send(JSON.stringify({ 
                type: 'WC_PEERS',
                peers: [...Object.keys(peers), pid]
            }));

        }

        function connectWithPeers(new_peers) {
            log(`connect with new peers: ${new_peers.map(p => l4(p)).join(", ")}`);
            update(network => {
                network.nodes[pid] = {
                    peers
                };
                network.info = log(
                    `connect with new peers: ${new_peers.map(p => l4(p)).join(", ")}`
                );
            });            
            for (const npid of new_peers) {
                if (npid === pid) continue; // not self
                if (!(npid in peers)) onConnection(peer.connect(npid));
            }
        }

        conn.on('data', data => {
            const content = JSON.parse(data);
            if ('type' in content) {
                if (content.type === "WC_PING") {
                    log(`receive WC_PING from ${l4(fid)}`);
                    update(network => {
                        network.nodes[pid] = {
                            peers
                        };
                        network.info = log(`receive WC_PING from ${l4(fid)}`);
                    });
                    if (isHost()) {
                        if (fid in peers) { // Update sender's ping
                            log(`isHost: update ping for ${l4(fid)}`);
                            update(network => {
                                network.nodes[pid] = {
                                    peers
                                };
                                network.info = log(`isHost: update ping for ${l4(fid)}`);
                            });              
                            peers[fid].ping = new Date();

                        } else { // Or connect with new Peer
                            log(`isHost make new conn with ${l4(fid)}`);
                            onConnection(peer.connect(fid));

                        }
                    } else { // not host
                        if (fid === getHost()) { // If sender is host, update ping 
                            log(`update ping for host(${l4(fid)})`);
                            update(network => {
                                network.nodes[pid] = {
                                    peers
                                };
                                network.info = log(`update ping for host(${l4(fid)})`);
                            });
                            peers[fid].ping = new Date();
                            log(`send WC_PING`);
                            update(network => {
                                network.nodes[pid] = {
                                    peers
                                };
                                network.info = log(`send WC_PING`);
                            });
                            conn.send(JSON.stringify({ type: 'WC_PING' }));

                        } else { // Respond with peer list if sender is not host
                            log(`send WC_PEERS to ${l4(fid)}: ${listPeers(peers)}`);
                            update(network => {
                                network.nodes[pid] = {
                                    peers
                                };
                                network.info = log(
                                    `send WC_PEERS to ${l4(fid)}: ${listPeers(peers)}`
                                );
                            });
                            conn.send(
                                JSON.stringify({ 
                                    type: 'WC_PEERS',
                                    peers: [...Object.keys(peers), pid]
                                })
                            );
                        }
                    }

                } else if (content.type === "WC_PEERS") {
                    if (isHost()) {
                        log(`receive WC_PEERS update ping for ${l4(fid)}`);
                        peers[fid].ping = new Date();
                        update(network => {
                            network.nodes[pid] = {
                                peers
                            };
                            network.info = log(`receive WC_PEERS update ping for ${l4(fid)}`);
                        });

                    } else {
                        const { peers: new_peers } = content;
                        connectWithPeers(new_peers);
                    }

                } else if (content.type === "WC_NEW") {
                    log(`receive WC_NEW from ${l4(fid)}`);
                    log(`respond with WC_INTRO: ${listPeers(peers)}`)
                    update(network => {
                        network.nodes[pid] = {
                            peers
                        };
                        const a = log(`receive WC_NEW from ${l4(fid)}`);
                        const b = log(`respond with WC_INTRO: ${listPeers(peers)}`);
                        network.info = `${a} and ${b}`;
                    });                    
                    conn.send(
                        JSON.stringify({ 
                            type: 'WC_INTRO',
                            peers: [...Object.keys(peers), pid]
                        })
                    );

                } else if (content.type === "WC_INTRO") {
                    log(`receive WC_INTRO from ${l4(fid)}`);
                    update(network => {
                        network.nodes[pid] = {
                            peers
                        };
                        network.info = log(`receive WC_INTRO from ${l4(fid)}`);
                    });
                    const { peers: new_peers } = content;
                    connectWithPeers(new_peers);
                    isNew = false;

                } else { // msg contains 'type' but is not a reserved type
                    userOnMsg(content);
                }
            } else { // msg does not contain 'type'
                userOnMsg(content);
            }
        });
    };

    peer.on('connection', conn => onConnection(conn));

    const connect = fid => onConnection(peer.connect(fid));
    if (fid) connect(fid);

    const send = (content, fid) => {
        const json_content = JSON.stringify(content);
        if (fid) {
            if (fid in peers && peers[fid].cid in conns) {
                const { isOpen, conn } = conns[peers[fid].cid];
                if (isOpen) conn.send(json_content);
            }
        } else if (isHost()) {
            broadcast(content);

        } else { // not host
            const hid = getHost();
            if (hid in peers && peers[hid].cid in conns) {
                const { isOpen, conn } = conns[peers[hid].cid];
                if (isOpen) conn.send(json_content);
            }
        }
    };

    const clearId = setInterval(() => {
        if (isNew) return;
        
        if (isHost()) { // remove unresponsive peers
            if (newHost) {
                log(`is new Host reset ping for peers: ${listPeers(peers)}`);
                update(network => {
                    network.nodes[pid] = {
                        peers
                    };
                    network.info = log(`is new Host reset ping for peers: ${listPeers(peers)}`);
                });
                newHost = false;
                for (const fid in peers) {
                    peers[fid].ping = new Date();
                }

            } else {
                log(`isHost`);
                const remove = [];
                for (const fid in peers) {
                    const now = new Date();
                    const { ping } = peers[fid];
                    if (now - ping > 2.5 * STEP) remove.push(fid);
                }
                for (const fid of remove) {
                    const { cid } = peers[fid];
                    delete peers[fid];
                    delete conns[cid];
                }
                if (remove.length > 0) {
                    log(`remove unresponsive peers: ${remove.map(p => l4(p)).join(", ")} `);
                    log(`broadcast WC_PEERS`);
                    update(network => {
                        network.nodes[pid] = {
                            peers
                        };
                        network.info = log(
                            `remove unresponsive peers: ${remove.map(p => l4(p)).join(", ")} and broadcast WC_PEERS`
                        );
                    });
                    broadcast({ // Inform others of unresponsive peers
                        type: 'WC_PEERS',
                        peers: [...Object.keys(peers), pid]
                    });
                }
            }

            log(`broadcast WC_PING: ${listPeers(peers)}`);
            update(network => {
                network.nodes[pid] = {
                    peers
                };
                network.info = log(`broadcast WC_PING: ${listPeers(peers)}`);
            });
            broadcast({ // Ping peers, so they know host is responsive
                type: 'WC_PING'
            });

        } else { // not host
            newHost = true;

            // remove if unresponsive
            const hid = getHost();
            const now = new Date(); 
            const { ping } = peers[hid];
            if (now - ping > 2.5 * STEP) {
                log(`remove ${l4(hid)}`);  
                const { cid } = peers[hid];
                delete peers[hid];
                conns[cid].conn.close();
                delete conns[cid];

                update(network => {
                    network.nodes[pid] = {
                        peers
                    };
                    network.info = log(`remove ${l4(hid)}`);
                });

                // Assume new host is responsive
                // Note: this peer may nw be the host after above removal
                if (!isHost()) {
                    const new_hid = getHost();
                    log(`update ping for ${l4(new_hid)}`);
                    peers[new_hid].ping = new Date();
                    update(network => {
                        network.nodes[pid] = {
                            peers
                        };
                        network.info = log(`update ping for ${l4(new_hid)}`);
                    });
                }
            }
        }
    }, STEP);

    return {
        id: pid,
        connect,
        send,
        onMsg,
        _debug_info,
        close: () => {
            clearInterval(clearId);
            for (let cid in conns) {
                conns[cid].conn.close();
            }
            peer.destroy();
        }
    };
}