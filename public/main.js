import { waterCraft } from './waterCraft.js'
      
export async function main() {
    
    async function wait(ms) {
        return new Promise((res, _) => {
            setTimeout(res, ms);
        });
    }

    // Record all peers
    const track = {};

    const getHost = () => {
        if (Object.keys(track).length === 0) return null;
        const hid = Object.keys(track).sort((a, b) => a.localeCompare(b))[0];
        return track[hid];
    };

    const getPeer = () => {
        if (Object.keys(track).length < 2) return null;
        const r = Math.floor(Math.random() * Object.keys(track).length - 1) + 1;
        const pid = Object.keys(track).sort((a, b) => a.localeCompare(b))[r];
        return track[pid];
    };

    async function createPeer() {
        const old_host = getHost();

        const w = await waterCraft();
        track[w.id] = w;

        if (Object.keys(track).length === 1) {
            console.log("CREATE: Init PEER");
            return;
        };

        const h = getHost();
        if (h.id === w.id) {
            console.log("CREATE: NEW HOST");
        } else {
            console.log("CREATE: PEER");
        }

        w.connect((Math.random() < 0.2) ? old_host.id : getPeer().id);
    }

    function removePeer() {
        if (Math.random() < 0.4) {
            console.log("REM: HOST");
            const h = getHost();
            h.close();
            delete track[h.id];

        } else {
            console.log("REM: PEER");
            const p = getPeer();
            p.close();
            delete track[p.id];

        }
    }
    
    window.addEventListener("keypress", async e => {
        if (e.code === "Space") {
            if (Object.keys(track).length < 2) {
                await createPeer();
    
            } else if (Object.keys(track).length >= 2) {
                removePeer();
    
            } else if (Math.random() > 0.4) {
                await createPeer();
    
            } else {
                removePeer();
                
            }
        }
    });

    // Display stats
    const vp = document.querySelector(".viewport");
    const last4 = id => id.slice(id.length - 4);

    async function render() {
        const host = getHost();
        if (host !== null) {
            const hlf = last4(host.id);
            const true_count = Object.keys(track).length;
            const host_count = host._debug_info().peers.length + 1;
            
            let incorrect = 0;
            for (let w of Object.values(track)) {
                const count = w._debug_info().peers.length + 1;
                if (true_count !== count) {
                    incorrect += 1;
                }
            }
    
            const data = [
                `Host: ${hlf}`,
                `True Count: ${true_count}`,
                `Host Count: ${host_count}`,
                `Incorrect: ${incorrect}`,
                `Overall: ${(incorrect === 0) ? 'CORRECT' : 'OUT'}`
            ];
    
            vp.innerHTML = data.join("\n");
        }

        await wait(250); 
        requestAnimationFrame(() => render());
    }
    requestAnimationFrame(() => render());
}