import { waterCraft } from './waterCraft.js'
      
export async function main() {
    
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
        const w = await waterCraft();
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
    
    window.addEventListener("keypress", async e => {
        const shift = e.shiftKey;
        if (e.key.toLowerCase() === "w") {
            await createPeer();

        } else if (e.key.toLowerCase() === "s") {
            removePeer(shift);

        }
    });

    // Display stats
    const vp = document.querySelector(".viewport");

    async function render() {
        const host = getHost();
        if (host !== null) {
            const hlf = last4(host.id);
            const true_count = Object.keys(track).length;
            const host_count = host._debug_info().peers.length + 1;
            
    
            const data = [
                `Host: ${hlf}`,
                `True Count: ${true_count}`,
                `Host Count: ${host_count}`,
                `` // Blank line
            ];
    
            for (let w of Object.values(track)) {
                data.push(
                    `${last4(w.id)}: ${w._debug_info().peers.join(", ")}`
                )
            }

            vp.innerHTML = data.join("\n");
        }

        await wait(250); 
        requestAnimationFrame(() => render());
    }
    requestAnimationFrame(() => render());
}