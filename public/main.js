import { waterCraft } from './waterCraft.js'
      
export async function main() {
    
    // async function wait() {
    //     return new Promise((res, _) => {
    //         setTimeout(res, Math.random() * 1200);
    //     });
    // }

    // Record all peers
    const track = {};

    const getHost = () => {
        const hid = Object.keys(track).sort((a, b) => a.localeCompare(b))[0];
        return track[hid];
    };

    const getPeer = () => {
        const r = Math.floor(Math.random() * Object.keys(track).length - 1) + 1;
        const pid = Object.keys(track).sort((a, b) => a.localeCompare(b))[r];
        return track[pid];
    };

    async function createPeer() {
        const old_host = getHost();

        const w = await waterCraft();
        track[w.id] = w;

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
            h.destroy();
            delete track[h.id];

        } else {
            console.log("REM: PEER");
            const p = getPeer();
            p.destroy();
            delete track[p.id];

        }
    }
    
    window.addEventListener("keypress", async e => {
        if (e.code === "Space") {
            if (Object.keys(track).length > 9) {
                await createPeer();
    
            } else if (Object.keys(track).length < 2) {
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
    setInterval(() => {
        
    }, 250);
}