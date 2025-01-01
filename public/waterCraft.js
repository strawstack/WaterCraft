import { Peer } from "./peerjs.min.js"

export async function waterCraft(fid) {

    const STEP = 1.2;

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

    const onConnection = conn => {
        const { peer: fid, connectionId: cid } = conn;
        if (fid in peers && peers[fid].cid in conns) return; // already connected
        peers[fid] = { cid };
        conns[cid] = { fid, isOpen: false, conn };
        conn.on('open', () => {
            conns[cid].isOpen = true;
            conn.on('data', data => {
                userOnMsg(data);
            });
        });
    };

    peer.on('connection', conn => onConnection(conn));

    const connect = fid => onConnection(peer.connect(fid));
    if (fid) connect(fid);

    const sendMsg = (content, fid) => {
        console.log(`sending...`);
        if (isHost()) {
            console.log(`is host...`);
            if (fid) {
                if (fid in peers && peers[fid].cid in conns) {
                    const { isOpen, conn } = conns[peers[fid].cid];
                    if (isOpen) conn.send(content);
                }

            } else { // broadcast
                console.log(`broadcast...`);
                for (const { isOpen, conn } of Object.values(conns) ) {
                    console.log(`isOpen: ${isOpen}`);
                    if (isOpen) conn.send(content);
                }
            }

        } else { // not host
            console.log(`not host...`);
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