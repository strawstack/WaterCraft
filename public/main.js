import { waterCraft } from './waterCraft.js'
      
export async function main() {
    
    const debug_data = [];
    const network = {
        nodes: {}
    };
    const update = func => {
        func(network);
        debug_data.push(JSON.parse(JSON.stringify(
            network
        )));
    };

    async function wait(ms) {
        return new Promise((res, _) => {
            setTimeout(res, ms);
        });
    }

    // Record all peers
    const track = {};

    const last4 = id => id.slice(id.length - 2);

    const getHost = () => {
        if (Object.keys(track).length === 0) return null;
        const hid = Object.keys(track).sort((a, b) => a.localeCompare(b))[0];
        return track[hid];
    };

    function randomPick(lst) {
        return lst[Math.floor(Math.random() * lst.length)];
    }

    const getPeer = (nid) => {
        const lst = Object.keys(track)
            .sort((a, b) => a.localeCompare(b))
            .filter(id => id !== nid);
        return (lst.length === 0) ? null : track[randomPick(lst)];
    };

    async function createPeer() {
        const w = await waterCraft({ update });
        track[w.id] = w;

        if (Object.keys(track).length === 1) {
            console.log(`CREATE: Init PEER(${last4(w.id)})`);
            return;
        }

        const h = getHost();
        if (h.id === w.id) {
            console.log(`CREATE: NEW HOST(${last4(w.id)})`);
        } else {
            console.log(`CREATE: PEER(${last4(w.id)})`);
        }

        w.connect(getPeer(w.id).id);
    }

    function removePeer(shift) {
        if (shift) {
            const h = getHost();
            console.log(`REM: HOST(${last4(h.id)})`);
            h.close();
            delete track[h.id];

        } else {
            const p = getPeer();
            console.log(`REM: PEER(${last4(p.id)})`);
            p.close();
            delete track[p.id];

        }
    }
    
    // Display stats
    let index = 0;
    const rowElems = document.querySelectorAll(".viewport>.table>.row");
    const table = Array.from(rowElems).map(row => {
        return Array.from(row.querySelectorAll(".col"))
    });
    async function render(_data) {
        const data = _data[index];


    }
    // requestAnimationFrame(() => render(debug_data));

    window.addEventListener("keydown", async e => {
        const shift = e.shiftKey;
        if (e.key.toLowerCase() === "w") {
            await createPeer();

        } else if (e.key.toLowerCase() === "s") {
            removePeer(shift);

        } else if (e.key === "ArrowRight") {
            index += 1;
            requestAnimationFrame(() => render(debug_data));

        } else if (e.key === "ArrowLeft") {
            index -= 1;
            index = Math.max(index, 0);
            requestAnimationFrame(() => render(debug_data));
        }
    });
}