import { Peer } from "./peerjs.min.js"

export async function waterCraft(fid) {

    const STEP = 1000; // Ping interval

    const peers = {};
    const conns = {};

    let isNew = true;
    const peer = new Peer();
    
    const pid = await new Promise((res, _) => {
        peer.on('open', (pid) => res(pid));
    });

    // Debug
    const D = false;
    const last4 = id => id.slice(id.length - 4);
    const log = msg => {
        if (D) console.log(`${last4(pid)}: ${msg}`);
    };

    const _debug_info = () => {
        return {
            peers: Object.keys(peers).map(p => last4(p)) 
        };
    };

    log("created");

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
            if (isOpen) conn.send(json);
        }
    };

    async function open(conn) {
        return new Promise((res, _) => {
            conn.on('open', res);
        });
    }

    const onConnection = async conn => {
        const { peer: fid, connectionId: cid } = conn;
        log(`onConnection: fid: ${last4(fid)} cid: ${last4(cid)}`);

        if (fid in peers && peers[fid].cid in conns) return; // already connected
        peers[fid] = { cid, ping: new Date() };
        conns[cid] = { fid, isOpen: false, conn };

        await open(conn);
        conns[cid].isOpen = true;

        log(`conn open with fid: ${last4(fid)}`);

        if(isNew) {
            conn.send(JSON.stringify({ type: 'WC_NEW' }));

        } else if (isHost()) { // new peer joins; inform others
            log(`onConnection: isHost: broadcast peer list...`);
            log(`  peers: ${[...Object.keys(peers), pid].map(p => last4(p))}`);
            broadcast({ type: 'WC_PEERS', peers: [...Object.keys(peers), pid] });

        } else { // not host; respond with peer list
            conn.send(JSON.stringify({ 
                type: 'WC_PEERS',
                peers: [...Object.keys(peers), pid]
            }));

        }

        function connectWithPeers(new_peers) {
            for (const npid of new_peers) {
                if (npid === pid) continue; // not self
                if (!(npid in peers)) onConnection(peer.connect(npid));
            }
        }

        conn.on('data', data => {
            const content = JSON.parse(data);
            if ('type' in content) {
                if (content.type === "WC_PING") {
                    log(`receive WC_PING from fid: ${last4(fid)}`);
                    if (isHost()) {
                        log(`  isHost`);
                        if (fid in peers) { // Update sender's ping
                            log(`  update ping for fid: ${last4(fid)}`);
                            peers[fid].ping = new Date();

                        } else { // Or connect with new Peer
                            log(`  call onConn for fid: ${last4(fid)}`);
                            onConnection(peer.connect(fid));

                        }
                    } else { // not host
                        log(`  not host`);
                        if (fid === getHost()) { // If sender is host, update ping 
                            log(`  update host(${last4(fid)}) ping and WC_PING host`);
                            peers[fid].ping = new Date();
                            conn.send(JSON.stringify({ type: 'WC_PING' }));

                        } else { // Respond with peer list if sender is not host
                            log(`  send WC_PEERS to fid: ${last4(fid)}`);
                            conn.send(
                                JSON.stringify({ 
                                    type: 'WC_PEERS',
                                    peers: [...Object.keys(peers), pid]
                                })
                            );
                        }
                    }

                } else if (content.type === "WC_PEERS") {
                    log(`receive WC_PEERS from fid: ${last4(fid)}`);
                    if (!isHost()) {
                        log(`  not host update peers`);
                        const { peers: new_peers } = content;
                        connectWithPeers(new_peers);
                        log(`  peers: ${Object.keys(peers).map(p => last4(p))}`);
                    }

                } else if (content.type === "WC_NEW") {
                    log(`receive WC_NEW from fid: ${last4(fid)}`);
                    conn.send(
                        JSON.stringify({ 
                            type: 'WC_INTRO',
                            peers: [...Object.keys(peers), pid]
                        })
                    );

                } else if (content.type === "WC_INTRO") {
                    log(`receive WC_INTRO from fid: ${last4(fid)}`);
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
        log(`sending...`);
        const json_content = JSON.stringify(content);
        if (fid) {
            log(`  direct...`);
            if (fid in peers && peers[fid].cid in conns) {
                const { isOpen, conn } = conns[peers[fid].cid];
                if (isOpen) conn.send(json_content);
            }
        } else if (isHost()) {
            log(`  broadcasting...`);
            broadcast(content);

        } else { // not host
            log(`  sending to host...`);
            const hid = getHost();
            if (hid in peers && peers[hid].cid in conns) {
                const { isOpen, conn } = conns[peers[hid].cid];
                if (isOpen) conn.send(json_content);
            }
        }
    };

    setInterval(() => {
        log(`interval`);
        if (isNew) return;
        
        if (isHost()) { // remove unresponsive peers
            log(`  isHost`);
            const remove = [];
            for (const fid in peers) {
                const now = new Date();
                const { ping } = peers[fid];
                log(`  ping: ${now - ping}`);
                if (now - ping > 2.5 * STEP) remove.push(fid);
            }
            for (const fid of remove) {
                const { cid } = peers[fid];
                delete peers[fid];
                delete conns[cid];
            }
            if (remove.length > 0) {
                log(`  removing...`);
                log(`  remove: ${remove.map(p => last4(p))}`);
                broadcast({ // Inform others of unresponsive peers
                    type: 'WC_PEERS',
                    peers: [...Object.keys(peers), pid]
                });
            }
            broadcast({ // Ping peers, so they know host is responsive
                type: 'WC_PING'
            });

        } else { // not host
            // remove if unresponsive
            const hid = getHost();
            const now = new Date(); 
            const { ping } = peers[hid];
            if (now - ping > 2.5 * STEP) {
                const { cid } = peers[hid];
                delete peers[hid];
                delete conns[cid];
            }
        }
    }, STEP);

    return {
        id: pid,
        connect,
        send,
        onMsg,
        _debug_info,
        close: () => peer.destroy()
    };
}