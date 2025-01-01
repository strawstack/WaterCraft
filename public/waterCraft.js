import { Peer } from "./peerjs.min.js"

export async function waterCraft(fid) {

    const peers = {};
    const conns = {};

    const peer = new Peer();

    const pid = await new Promise((res, _) => {
        peer.on('open', (pid) => res(pid));
    });

    const getHost = () => {
        const peers = [...Object.keys(peers), pid].sort((a, b) => a.localeCompare(b));
        return peers[0];
    };

    const isHost = () => {
        return getHost() === pid;
    };

    let userOnMsg = () => {};
    const onMsg = func => {
        userOnMsg = func;
    };

    const onConnection = conn => {
        const { peer: fid, connectionId: cid } = conn;
        peers[fid] = { cid };
        conns[cid] = { fid, isOpen: false, conn };
        conn.on('open', () => {
            conns[cid].isOpen = true;
            conn.on('data', data => {
                userOnMsg(data);
            });
        });
    };

    // Receive connection from other
    peer.on('connection', conn => onConnection(conn));

    // Connect with other
    const connect = fid => onConnection(peer.connect(fid));
    if (fid) connect(fid);

    const sendMsg = (content, fid) => {
        if (isHost()) {
            if (fid) {
                if (fid in peers && peers[fid].cid in conns) {
                    const { isOpen, conn } = conns[peers[fid].cid];
                    if (isOpen) conn.send(content);
                }

            } else {
                for (const { isOpen, conn } of Object.values(conns) ) {
                    if (isOpen) conn.send(content);
                }
            }

        } else { // peer is not host
            const hid = getHost();
            if (hid in peers && peers[hid].cid in conns) {
                const { isOpen, conn } = conns[peers[hid].cid];
                if (isOpen) conn.send(content);
            }
        }
    };

    return {
        id: pid,
        connect,
        sendMsg,
        onMsg
    };
}