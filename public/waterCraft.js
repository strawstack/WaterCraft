import { Peer } from "./peerjs.min.js"

export async function waterCraft(fid) {

    const STEP = 1000; // Ping interval

    const peers = {};
    const conns = {};

    const peer = new Peer();

    const pid = await new Promise((res, _) => {
        peer.on('open', (pid) => res(pid));
    });

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

    const onConnection = conn => {
        const { peer: fid, connectionId: cid } = conn;
        if (fid in peers && peers[fid].cid in conns) return; // already connected
        peers[fid] = { cid, ping: new Date() };
        conns[cid] = { fid, isOpen: false, conn };

        if (isHost()) { // new peer joins; inform others
            broadcast({ 
                type: 'WC_PEERS',
                peers: Object.keys(peers)
            });
        }

        conn.on('open', () => {
            conns[cid].isOpen = true;
            conn.on('data', data => {
                try {
                    const content = JSON.parse(data);
                    if ('type' in content) {
                        if (content.type === "WC_PING") {
                            if (isHost()) {
                                if (fid in peers) {
                                    peers[fid].ping = new Date();
                                } else {
                                    onConnection(peer.connect(fid));
                                }
                            } else { // not host
                                if (fid === getHost()) {
                                    peers[fid].ping = new Date();
                                } else {
                                    conn.send({ 
                                        type: 'WC_PEERS',
                                        peers: Object.keys(peers)
                                    });
                                }
                            }
                            return;

                        } else if (content.type === "WC_PEERS") {
                            const { peers: new_peers } = content;
                            for (const npid of new_peers) {
                                if (!(npid in peers)) onConnection(peer.connect(npid));
                            }
                            return;
                        } else if (content.type === "WC_REMOVE") {
                            const { remove } = content;
                            for (const fid of remove) {
                                const { cid } = peers[fid];
                                delete peers[fid];
                                delete conns[cid];
                            }
                        }
                    }
                } catch (e) {}
                userOnMsg(data);
            });
        });
    };

    peer.on('connection', conn => onConnection(conn));

    const connect = fid => onConnection(peer.connect(fid));
    if (fid) connect(fid);

    const send = (content, fid) => {
        console.log(`sending...`);
        const json_content = JSON.stringify(content);
        if (fid) {
            console.log(`direct to fid...`);
            if (fid in peers && peers[fid].cid in conns) {
                const { isOpen, conn } = conns[peers[fid].cid];
                if (isOpen) conn.send(json_content);
            }
        } else if (isHost()) {
            console.log(`is host...`);
            console.log(`broadcast...`);
            broadcast(content);

        } else { // not host
            console.log(`not host...`);
            const hid = getHost();
            if (hid in peers && peers[hid].cid in conns) {
                const { isOpen, conn } = conns[peers[hid].cid];
                if (isOpen) conn.send(json_content);
            }
        }
    };

    setInterval(() => {
        if (isHost()) { // remove unresponsive peers
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
            broadcast({ // Inform others of unresponsive peers
                type: 'WC_REMOVE',
                remove
            });
            broadcast({ // Ping peers, so they know host is responsive
                type: 'WC_PING'
            });

        } else { // not host
            const hid = getHost();

            // ping host
            const { isOpen, conn } = conns[peers[hid].cid];
            if (isOpen) conn.send({ type: 'WC_PING' });

            const now = new Date(); // remove unresponsive host
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
        onMsg
    };
}