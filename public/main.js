import { waterCraft } from './waterCraft.js'
      
export async function main() {
    
    const debug_data = [];
    const network = {
        nodes: {},
        info: ""
    };
    const update = func => {
        func(network);
        debug_data.push(JSON.parse(JSON.stringify(
            network
        )));
    };
    update(network => network);

    async function wait(ms) {
        return new Promise((res, _) => {
            setTimeout(res, ms);
        });
    }

    // Record all peers
    const track = {};

    const l2 = id => id.slice(id.length - 2);

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
            console.log(`CREATE: Init PEER(${l2(w.id)})`);
            return;
        }

        const h = getHost();
        if (h.id === w.id) {
            console.log(`CREATE: NEW HOST(${l2(w.id)})`);
        } else {
            console.log(`CREATE: PEER(${l2(w.id)})`);
        }

        w.connect(getPeer(w.id).id);
    }

    function removePeer(shift) {
        if (shift) {
            const h = getHost();
            console.log(`REM: HOST(${l2(h.id)})`);
            h.close();
            delete track[h.id];

        } else {
            const p = getPeer();
            console.log(`REM: PEER(${l2(p.id)})`);
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
    const infoElem = document.querySelector(".col.content");
    async function render(_data, _index) {

        function clear() {
            for (let row of table) {
                for (let col of row) {
                    if (col.classList.length > 1) continue; 
                    col.innerHTML = "";
                }
            }
        }

        if (_index >= _data.length) return;
        clear();
        const data = _data[_index];
        const order = Object.keys(data.nodes).sort((a, b) => a.localeCompare(b));
        for (let i = 0; i < order.length; i++) {
            table[i + 1][0].innerHTML = l2(order[i]);
        }
        for (let i = 0; i < order.length; i++) {
            table[0][i + 1].innerHTML = l2(order[i]);
        }

        for (let i = 0; i < order.length; i++) {
            for (let j = 0; j < order.length; j++) {
                if (i === j) continue;
                const { peers } = data.nodes[order[i]];
                if (order[j] in peers) {
                    table[i + 1][j + 1].innerHTML = "X";
                }
            }
        }

        infoElem.innerHTML = data.info;
    }
    requestAnimationFrame(() => render(debug_data, 0));

    const up = () => {
        index += 1;
        index = Math.min(index, Math.max(0, debug_data.length - 1));
        requestAnimationFrame(() => render(debug_data, index));
    };

    const down = () => {
        index -= 1;
        index = Math.max(index, 0);
        requestAnimationFrame(() => render(debug_data, index));
    };

    window.addEventListener("keydown", async e => {
        const shift = e.shiftKey;
        if (e.key.toLowerCase() === "w") {
            await createPeer();

        } else if (e.key.toLowerCase() === "s") {
            removePeer(shift);

        } else if (e.key === "ArrowRight") {
            up();

        } else if (e.key === "ArrowLeft") {
            down();

        }
    });
    
    document.querySelector(".btn.next").addEventListener("click", e => {
        up();
    });

    document.querySelector(".btn.prev").addEventListener("click", e => {
        down();
    });


}