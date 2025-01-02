import { waterCraft } from './waterCraft.js'
      
export async function main() {
    
    // Create Peers
    const peers = [];
    peers.push(await waterCraft());
    peers.push(await waterCraft());
    peers.push(await waterCraft());

    const hid = peers.map(w => w.id).sort((a, b) => a.localeCompare(b))[0];
    const nhid = peers.map(w => w.id).sort((a, b) => a.localeCompare(b))[1];

    for (let p of peers) {
        if (p.id !== hid) p.connect(hid);
    }

    // const host = peers.find(p => p.id === hid);

    console.log("BREAK");
    const other = await waterCraft(nhid);
    peers.push(other);

    const vp = document.querySelector(".viewport");
    window.addEventListener("keypress", e => {
        if (e.code === "Space") {
            const info = [];
            for (let p of peers) {
                info.push(
                    p._debug_info()
                );
            }
            vp.innerHTML = info.join("\n");
        }
    });

}